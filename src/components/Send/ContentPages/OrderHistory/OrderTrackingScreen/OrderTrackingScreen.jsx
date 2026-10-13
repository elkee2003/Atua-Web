import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  DirectionsService,
} from "@react-google-maps/api";
import { generateClient } from "aws-amplify/api";
import { DataStore } from "aws-amplify/datastore";
import { getUrl } from "aws-amplify/storage";

import {
  Courier,
  CourierLiveLocation,
  Offer,
  Order,
} from "../../../../../../src/models";

import { calculateMaxiFinancials } from "../../../../../../modules/freightPricingEngine";
import DefaultTrackingSheet from "./DefaultTrackingSheet/DefaultTrackingSheet";
import MaxiBiddingSheet from "./Maxi/MaxiBiddingSheet/MaxiBiddingSheet";
import RetryUploadBanner from "./Maxi/RetryUploadBanner/RetryUploadBanner";
import "./OrderTrackingScreen.css";

const client = generateClient();

const toCoordinate = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isValidCoordinate = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const removeUndefinedValues = (object) => {
  if (!object) return {};

  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  );
};

const mergeObjects = (current, incoming) => {
  if (!incoming) return current;
  if (!current) return incoming;

  return {
    ...current,
    ...removeUndefinedValues(incoming),
  };
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  clickableIcons: true,
  gestureHandling: "greedy",
};

const OrderTrackingScreen = ({ orderId: receivedOrderId }) => {
  const { orderId: routeOrderId, id: routeId } = useParams();

  const orderId = receivedOrderId || routeOrderId || routeId;

  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mountedRef = useRef(true);
  const refreshTimersRef = useRef([]);
  const courierMarkerRef = useRef(null);
  const courierAcceptanceHandledRef = useRef(false);

  const [order, setOrder] = useState(null);
  const [courier, setCourier] = useState(null);
  const [courierLiveLocation, setCourierLiveLocation] = useState(null);
  const [courierImageUrl, setCourierImageUrl] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [directions, setDirections] = useState(null);
  const [directionsRequested, setDirectionsRequested] = useState(false);

  const refreshOrder = useCallback(
    async ({ reason = "UNKNOWN", log = true } = {}) => {
      if (!orderId) return null;

      try {
        const latestOrder = await DataStore.query(Order, orderId);

        if (!latestOrder) {
          if (log) console.log("ORDER NOT FOUND:", orderId, reason);
          return null;
        }

        if (log) {
          console.log("ORDER REFRESHED:", {
            orderId: latestOrder.id,
            status: latestOrder.status,
            paymentStatus: latestOrder.paymentStatus,
            assignedCourierId: latestOrder.assignedCourierId,
          });
        }

        if (mountedRef.current) {
          setOrder((current) => mergeObjects(current, latestOrder));
        }

        return latestOrder;
      } catch (error) {
        console.error("REFRESH ORDER ERROR:", reason, error);
        return null;
      }
    },
    [orderId],
  );

  // Keep track of component lifetime.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      refreshTimersRef.current.forEach(clearTimeout);
      refreshTimersRef.current = [];
    };
  }, []);

  // Initial order fetch, DataStore observation, and short sync retries.
  useEffect(() => {
    if (!orderId) return undefined;

    let cancelled = false;

    const load = async () => {
      const latestOrder = await refreshOrder({
        reason: "INITIAL_LOAD",
      });

      if (cancelled || !latestOrder) return;

      [500, 1500, 3000, 5000, 8000].forEach((delay) => {
        const timer = setTimeout(() => {
          if (!cancelled && mountedRef.current) {
            refreshOrder({
              reason: `POST_LOAD_SYNC_${delay}MS`,
              log: false,
            });
          }
        }, delay);

        refreshTimersRef.current.push(timer);
      });
    };

    load();

    const subscription = DataStore.observe(Order, orderId).subscribe({
      next: async (message) => {
        if (cancelled || !message?.element) return;

        // Re-query rather than assuming the observation is a complete Order.
        await refreshOrder({
          reason: "DATASTORE_ORDER_EVENT",
        });
      },
      error: (error) => console.error("ORDER SUBSCRIPTION ERROR:", error),
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      refreshTimersRef.current.forEach(clearTimeout);
      refreshTimersRef.current = [];
    };
  }, [orderId, refreshOrder]);

  // Refresh when the browser tab becomes visible again.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshOrder({
          reason: "TAB_RETURNED_TO_FOREGROUND",
          log: false,
        });
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshOrder]);

  // Fetch latest offer per courier and attach courier details.
  useEffect(() => {
    if (!orderId) return undefined;

    let cancelled = false;

    const fetchOffers = async () => {
      try {
        const result = await DataStore.query(Offer, (offer) =>
          offer.orderID.eq(orderId),
        );

        const latestByCourier = {};

        result.forEach((offer) => {
          if (!offer.courierID) return;

          const existing = latestByCourier[offer.courierID];

          if (
            !existing ||
            new Date(offer.createdAt) > new Date(existing.createdAt)
          ) {
            latestByCourier[offer.courierID] = offer;
          }
        });

        const sorted = Object.values(latestByCourier).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        const enriched = await Promise.all(
          sorted.map(async (offer) => {
            const offerCourier = await DataStore.query(
              Courier,
              offer.courierID,
            );

            let imageUrl = null;

            if (offerCourier?.profilePic) {
              try {
                const imageResult = await getUrl({
                  path: offerCourier.profilePic,
                  options: { validateObjectExistence: true },
                });

                imageUrl = imageResult.url.toString();
              } catch (error) {
                console.error("OFFER COURIER IMAGE ERROR:", error);
              }
            }

            return {
              ...offer,
              offer,
              courier: { ...offerCourier, imageUrl },
            };
          }),
        );

        if (!cancelled && mountedRef.current) {
          setOffers(enriched);
        }
      } catch (error) {
        console.error("FETCH OFFERS ERROR:", error);
      }
    };

    fetchOffers();

    const subscription = DataStore.observe(Offer).subscribe((message) => {
      if (message?.element?.orderID === orderId) fetchOffers();
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [orderId]);

  // Fetch the assigned courier's profile.
  useEffect(() => {
    const courierId = order?.assignedCourierId;

    if (!courierId) {
      setCourier(null);
      setCourierImageUrl(null);
      setCourierLiveLocation(null);
      return undefined;
    }

    let cancelled = false;

    const fetchCourier = async () => {
      try {
        const result = await DataStore.query(Courier, courierId);

        if (!cancelled && mountedRef.current) {
          setCourier(result || null);
        }
      } catch (error) {
        console.error("FETCH COURIER ERROR:", error);
      }
    };

    fetchCourier();

    const subscription = DataStore.observe(Courier, courierId).subscribe(
      async (message) => {
        if (cancelled || !message?.element) return;

        try {
          const latest = await DataStore.query(Courier, courierId);

          if (!cancelled && latest && mountedRef.current) {
            setCourier((current) => mergeObjects(current, latest));
          }
        } catch (error) {
          console.error("REFRESH COURIER ERROR:", error);
        }
      },
    );

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [order?.assignedCourierId]);

  // Get the courier profile image from S3.
  useEffect(() => {
    let active = true;

    const loadImage = async () => {
      if (!courier?.profilePic) {
        if (active) setCourierImageUrl(null);
        return;
      }

      try {
        const result = await getUrl({
          path: courier.profilePic,
          options: { validateObjectExistence: true },
        });

        if (active) setCourierImageUrl(result.url.toString());
      } catch (error) {
        console.error("COURIER IMAGE ERROR:", error);
        if (active) setCourierImageUrl(null);
      }
    };

    loadImage();

    return () => {
      active = false;
    };
  }, [courier?.profilePic]);

  // Fetch and observe ONLY the assigned courier's live GPS location.
  useEffect(() => {
    const courierId = order?.assignedCourierId;

    if (!courierId) {
      setCourierLiveLocation(null);
      return undefined;
    }

    let cancelled = false;

    const fetchLocation = async () => {
      try {
        const locations = await DataStore.query(
          CourierLiveLocation,
          (location) => location.courierID.eq(courierId),
        );

        if (cancelled || !mountedRef.current) return;

        const latest =
          locations
            .filter((location) => location?.courierID === courierId)
            .sort(
              (a, b) =>
                new Date(b?.lastSeenAt || 0) - new Date(a?.lastSeenAt || 0),
            )[0] || null;

        setCourierLiveLocation(latest);
      } catch (error) {
        console.error("FETCH LIVE LOCATION ERROR:", error);
      }
    };

    fetchLocation();

    const subscription = DataStore.observe(CourierLiveLocation, (location) =>
      location.courierID.eq(courierId),
    ).subscribe({
      next: (message) => {
        if (cancelled || !message?.element) return;

        const location = message.element;
        if (location.courierID !== courierId) return;

        if (message.opType === "DELETE") {
          setCourierLiveLocation(null);
        } else {
          setCourierLiveLocation((current) => mergeObjects(current, location));
        }
      },
      error: (error) =>
        console.error("LIVE LOCATION SUBSCRIPTION ERROR:", error),
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [order?.assignedCourierId]);

  // Coordinates for the map.
  const origin = useMemo(() => {
    const lat = toCoordinate(order?.originLat);
    const lng = toCoordinate(order?.originLng);

    return isValidCoordinate(lat, lng) ? { lat, lng } : null;
  }, [order?.originLat, order?.originLng]);

  const destination = useMemo(() => {
    const lat = toCoordinate(order?.destinationLat);
    const lng = toCoordinate(order?.destinationLng);

    return isValidCoordinate(lat, lng) ? { lat, lng } : null;
  }, [order?.destinationLat, order?.destinationLng]);

  const courierPosition = useMemo(() => {
    const lat = toCoordinate(courierLiveLocation?.latitude);
    const lng = toCoordinate(courierLiveLocation?.longitude);

    return isValidCoordinate(lat, lng) ? { lat, lng } : null;
  }, [courierLiveLocation?.latitude, courierLiveLocation?.longitude]);

  // Fit the map to pickup, destination, and courier when possible.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google) return;

    const points = [origin, destination, courierPosition].filter(Boolean);
    if (!points.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));

    if (points.length === 1) {
      mapRef.current.panTo(points[0]);
      mapRef.current.setZoom(15);
    } else {
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [mapReady, origin, destination, courierPosition]);

  // Follow the courier once a delivery is underway.
  useEffect(() => {
    const followStatuses = [
      "ACCEPTED",
      "PICKED_UP",
      "IN_TRANSIT",
      "ARRIVING",
      "ARRIVED",
      "OUT_FOR_DELIVERY",
    ];

    if (
      !mapReady ||
      !mapRef.current ||
      !courierPosition ||
      !followStatuses.includes(order?.status)
    ) {
      return;
    }

    mapRef.current.panTo(courierPosition);
  }, [mapReady, courierPosition, order?.status]);

  // DirectionsService is requested again when the route endpoints change.
  useEffect(() => {
    setDirections(null);
    setDirectionsRequested(false);
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  const handleCancelOrder = async () => {
    if (!order?.id || loadingCancel) return;

    const isMaxi = order.transportationType === "MAXI";
    const isPaidMaxi =
      isMaxi && order.status === "ACCEPTED" && order.paymentStatus === "PAID";
    const isPaidMicroOrMoto =
      !isMaxi &&
      order.status === "READY_FOR_PICKUP" &&
      order.paymentStatus === "PAID";

    if (!isPaidMaxi && !isPaidMicroOrMoto) {
      window.alert("This order can no longer be cancelled.");
      return;
    }

    const amount = Number(order.totalPrice || 0).toLocaleString("en-NG");
    const confirmed = window.confirm(
      `Are you sure you want to cancel this order?\n\nYour payment of ₦${amount} will be refunded to your original payment method.`,
    );

    if (!confirmed) return;

    setLoadingCancel(true);

    try {
      const mutation = /* GraphQL */ `
        mutation CancelOrder(
          $orderID: ID!
          $reason: CancellationReason
          $reasonNote: String
        ) {
          cancelOrder(
            orderID: $orderID
            reason: $reason
            reasonNote: $reasonNote
          ) {
            id
            refundAmount
            errorMessage
          }
        }
      `;

      const result = await client.graphql({
        query: mutation,
        authMode: "userPool",
        variables: {
          orderID: order.id,
          reason: null,
          reasonNote: null,
        },
      });

      const cancellation = result?.data?.cancelOrder;

      if (!cancellation?.id) {
        throw new Error(
          cancellation?.errorMessage ||
            "The cancellation request did not return a valid record.",
        );
      }

      await refreshOrder({
        reason: "ORDER_CANCELLED",
        log: false,
      });

      const refundAmount = Number(
        cancellation.refundAmount || order.totalPrice || 0,
      );

      window.alert(
        refundAmount > 0
          ? `Your order has been cancelled. A refund of ₦${refundAmount.toLocaleString("en-NG")} has been initiated. The money may take time to return to your account.`
          : "Your order has been cancelled successfully.",
      );

      navigate(-1);
    } catch (error) {
      console.error("CANCEL ORDER ERROR:", error);

      window.alert(
        error?.errors?.[0]?.message ||
          error?.message ||
          "Something went wrong while cancelling your order.",
      );
    } finally {
      setLoadingCancel(false);
    }
  };

  const handleAcceptOffer = async (offer) => {
    if (order?.status === "ACCEPTED" || offer?.senderType !== "COURIER") {
      return;
    }

    try {
      const latestOrder = await DataStore.query(Order, order.id);
      if (!latestOrder) return;

      const financials = calculateMaxiFinancials({
        type: latestOrder.vehicleClass,
        agreedAmount: offer.amount,
      });

      if (!financials) {
        window.alert(
          "The pricing information for this vehicle is unavailable.",
        );
        return;
      }

      const updatedOrder = await DataStore.save(
        Order.copyOf(latestOrder, (updated) => {
          updated.status = "ACCEPTED";
          updated.operationalFare = financials.operationalFare;
          updated.commissionAmount = financials.commissionAmount;
          updated.platformFee = financials.platformFee;
          updated.platformServiceRevenue = financials.platformServiceRevenue;
          updated.vatAmount = financials.vatAmount;
          updated.platformNetRevenue = financials.platformNetRevenue;
          updated.courierEarnings = financials.courierEarnings;
          updated.totalPrice = financials.customerPrice;
          updated.acceptedOfferID = offer.id;
          updated.assignedCourierId = offer.courierID;
          updated.acceptedAt = new Date().toISOString();
          updated.hasNewOffer = false;
        }),
      );

      if (updatedOrder && mountedRef.current) {
        setOrder((current) => mergeObjects(current, updatedOrder));
      }

      const latestOffer = await DataStore.query(Offer, offer.id);

      if (latestOffer) {
        await DataStore.save(
          Offer.copyOf(latestOffer, (updated) => {
            updated.status = "ACCEPTED";
          }),
        );
      }

      navigate("/screens/payment", {
        replace: true,
        state: { orderId: updatedOrder.id },
      });
    } catch (error) {
      console.error("ACCEPT OFFER ERROR:", error);
      window.alert(error?.message || "Unable to accept this offer.");
    }
  };

  const handleCounterOffer = async (offer) => {
    try {
      await DataStore.save(
        new Offer({
          orderID: order.id,
          courierID: offer.courierID,
          senderType: "USER",
          amount: offer.amount,
          status: "ACTIVE",
        }),
      );

      const latestOrder = await DataStore.query(Order, order.id);
      if (!latestOrder) return;

      const updatedOrder = await DataStore.save(
        Order.copyOf(latestOrder, (updated) => {
          updated.hasNewOffer = true;
          updated.lastOfferAt = new Date().toISOString();
          updated.lastOfferSenderType = "USER";
        }),
      );

      if (updatedOrder && mountedRef.current) {
        setOrder((current) => mergeObjects(current, updatedOrder));
      }
    } catch (error) {
      console.error("COUNTER OFFER ERROR:", error);
      window.alert(error?.message || "Unable to send your counter-offer.");
    }
  };

  // Maxi courier acceptance: prompt the customer to continue to payment.
  useEffect(() => {
    if (
      order?.transportationType !== "MAXI" ||
      order?.status !== "ACCEPTED" ||
      order?.paymentStatus !== "PENDING" ||
      !order?.assignedCourierId ||
      !order?.acceptedOfferID ||
      courierAcceptanceHandledRef.current
    ) {
      return;
    }

    let cancelled = false;

    const checkAcceptedOffer = async () => {
      try {
        const acceptedOffer = await DataStore.query(
          Offer,
          order.acceptedOfferID,
        );

        if (!acceptedOffer || acceptedOffer.senderType !== "USER") return;

        const latestOrder = await DataStore.query(Order, order.id);

        if (
          cancelled ||
          !latestOrder ||
          latestOrder.status !== "ACCEPTED" ||
          latestOrder.paymentStatus !== "PENDING" ||
          latestOrder.acceptedOfferID !== order.acceptedOfferID
        ) {
          return;
        }

        courierAcceptanceHandledRef.current = true;

        const acceptedCourier =
          courier?.id === latestOrder.assignedCourierId
            ? courier
            : await DataStore.query(Courier, latestOrder.assignedCourierId);

        const price = Number(latestOrder.totalPrice || 0).toLocaleString(
          "en-NG",
        );

        const proceed = window.confirm(
          `${acceptedCourier?.firstName || "Your courier"} has accepted your Maxi delivery offer for ₦${price}. Continue to payment?`,
        );

        if (proceed) {
          navigate("/screens/payment", {
            replace: true,
            state: { orderId: latestOrder.id },
          });
        }
      } catch (error) {
        console.error("MAXI ACCEPTANCE CHECK ERROR:", error);
      }
    };

    checkAcceptedOffer();

    return () => {
      cancelled = true;
    };
  }, [
    order?.id,
    order?.transportationType,
    order?.status,
    order?.paymentStatus,
    order?.assignedCourierId,
    order?.acceptedOfferID,
    courier,
    navigate,
  ]);

  // Clear the new-offer badge after it has been displayed.
  useEffect(() => {
    if (
      !order?.id ||
      !order?.hasNewOffer ||
      order?.lastOfferSenderType !== "COURIER"
    ) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const latest = await DataStore.query(Order, order.id);
        if (!latest) return;

        await DataStore.save(
          Order.copyOf(latest, (updated) => {
            updated.hasNewOffer = false;
          }),
        );

        await refreshOrder({
          reason: "CLEAR_OFFER_BADGE",
          log: false,
        });
      } catch (error) {
        console.error("CLEAR OFFER BADGE ERROR:", error);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [order?.id, order?.hasNewOffer, order?.lastOfferSenderType, refreshOrder]);

  const routeOptions = useMemo(
    () => ({
      origin,
      destination,
      travelMode: window.google?.maps?.TravelMode?.DRIVING,
    }),
    [origin, destination],
  );

  if (!order) {
    return (
      <div className="tracking-loading">
        <span className="tracking-spinner" />
        <p>Loading order...</p>
      </div>
    );
  }

  const canStartBidding =
    order.transportationType === "MAXI" && order.status === "BIDDING";

  const canRenderMap = Boolean(origin && destination);

  return (
    <main className="order-tracking-page">
      <section className="tracking-map-panel">
        <button
          type="button"
          className="tracking-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <span aria-hidden="true">←</span>
        </button>

        {canRenderMap && window.google ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            options={mapOptions}
            center={origin}
            zoom={13}
            onLoad={(map) => {
              mapRef.current = map;
              setMapReady(true);
            }}
            onUnmount={() => {
              mapRef.current = null;
              setMapReady(false);
            }}
          >
            {!directionsRequested && (
              <DirectionsService
                options={routeOptions}
                callback={(result, status) => {
                  setDirectionsRequested(true);

                  if (status === "OK" && result) {
                    setDirections(result);
                  } else {
                    console.error("MAP DIRECTIONS ERROR:", status);
                  }
                }}
              />
            )}

            {directions && (
              <DirectionsRenderer
                options={{
                  directions,
                  polylineOptions: {
                    strokeColor: "#ff4545",
                    strokeWeight: 5,
                    strokeOpacity: 0.9,
                  },
                  suppressMarkers: true,
                }}
              />
            )}

            {origin && (
              <Marker
                position={origin}
                title="Pickup location"
                label={{
                  text: "P",
                  color: "#ffffff",
                  fontWeight: "700",
                }}
              />
            )}

            {destination && (
              <Marker
                position={destination}
                title="Delivery destination"
                label={{
                  text: "D",
                  color: "#ffffff",
                  fontWeight: "700",
                }}
              />
            )}

            {courierPosition && (
              <Marker
                position={courierPosition}
                title={courier?.firstName || "Assigned courier"}
                icon={{
                  url: courierImageUrl || "/AtuaMotoX.png",
                  scaledSize: window.google
                    ? new window.google.maps.Size(44, 44)
                    : undefined,
                  anchor: window.google
                    ? new window.google.maps.Point(22, 22)
                    : undefined,
                }}
                onLoad={(marker) => {
                  courierMarkerRef.current = marker;
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="tracking-map-placeholder">
            <span className="tracking-spinner" />
            <p>
              {canRenderMap
                ? "Loading map..."
                : "Waiting for valid pickup and destination coordinates..."}
            </p>
          </div>
        )}
      </section>

      <aside className="tracking-details-panel">
        <div className="tracking-panel-heading">
          <div>
            <p className="tracking-eyebrow">ORDER TRACKING</p>
            <h1>Delivery details</h1>
          </div>
          <span
            className={`tracking-status status-${String(order.status || "").toLowerCase()}`}
          >
            {(order.status || "PROCESSING").replaceAll("_", " ")}
          </span>
        </div>

        <div className="tracking-order-summary">
          <div className="tracking-summary-row">
            <span>Order ID</span>
            <strong>{order.id}</strong>
          </div>
          <div className="tracking-summary-row">
            <span>Delivery type</span>
            <strong>
              {[order.transportationType, order.vehicleClass]
                .filter(Boolean)
                .join(" · ") || "Standard delivery"}
            </strong>
          </div>
          <div className="tracking-summary-row">
            <span>Payment</span>
            <strong>{order.paymentStatus || "PENDING"}</strong>
          </div>
          <div className="tracking-summary-row">
            <span>Total</span>
            <strong>
              ₦{Number(order.totalPrice || 0).toLocaleString("en-NG")}
            </strong>
          </div>
        </div>

        {order.mediaUploadStatus === "FAILED" && (
          <RetryUploadBanner order={order} />
        )}

        {order.mediaUploadStatus === "UPLOADING" && (
          <div className="tracking-upload-message">
            <span className="tracking-spinner tracking-spinner-small" />
            <span>Uploading package images...</span>
          </div>
        )}

        {canStartBidding ? (
          <MaxiBiddingSheet
            order={order}
            offers={offers}
            expiresAt={order.offerExpiresAt}
            onAcceptOffer={handleAcceptOffer}
            onCounterOffer={handleCounterOffer}
            onCancel={handleCancelOrder}
          />
        ) : (
          <DefaultTrackingSheet
            order={order}
            courier={courier}
            courierImageUrl={courierImageUrl}
            onCancel={handleCancelOrder}
          />
        )}

        {loadingCancel && (
          <div className="tracking-cancel-progress">
            <span className="tracking-spinner tracking-spinner-small" />
            <span>Processing cancellation...</span>
          </div>
        )}

        <button
          type="button"
          className="tracking-history-button"
          onClick={() => navigate("/send/orders")}
        >
          View order history
        </button>
      </aside>
    </main>
  );
};

export default OrderTrackingScreen;
