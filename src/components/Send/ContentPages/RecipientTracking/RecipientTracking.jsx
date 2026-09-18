// RecipientTracking.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";

import { DataStore } from "aws-amplify/datastore";

import { Order, Courier } from "../../../../models";

import "./RecipientTracking.css";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_MAP_CENTER = {
  lat: 6.5244,
  lng: 3.3792,
};

const MAP_OPTIONS = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
};

/* =========================================================
   COURIER MARKER IMAGE
========================================================= */

const getCourierImage = (transportationType) => {
  switch (transportationType) {
    case "Micro X":
      return "/Bicycle.png";

    case "Moto X":
      return "/Bike.jpg";

    case "Maxi Batch":
      return "/top-UberXL.png";

    case "Maxi":
      return "/Deliverybicycle.png";

    default:
      return "/Walk.png";
  }
};

/* =========================================================
   SAFE COORDINATE HELPERS
========================================================= */

const toCoordinate = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90) {
    return null;
  }

  if (longitude < -180 || longitude > 180) {
    return null;
  }

  return {
    lat: latitude,
    lng: longitude,
  };
};

const hasValidCoordinates = (coordinate) => {
  return Boolean(
    coordinate &&
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng),
  );
};

/* =========================================================
   STATUS HELPERS
========================================================= */

const getStatusLabel = (status) => {
  switch (status) {
    case "BIDDING":
      return "Finding a courier";

    case "READY_FOR_PICKUP":
      return "Ready for pickup";

    case "ACCEPTED":
      return "Courier assigned";

    case "ARRIVED_PICKUP":
      return "Courier has arrived at pickup";

    case "LOADING":
      return "Package is being loaded";

    case "PICKED_UP":
      return "Package picked up";

    case "IN_TRANSIT":
      return "Your package is on the way";

    case "ARRIVED_DROPOFF":
      return "Courier has arrived";

    case "UNLOADING":
      return "Package is being prepared for handover";

    case "DELIVERED":
      return "Package delivered";

    case "HANDOVER_TO_LOGISTICS":
      return "Handed over to logistics";

    case "IN_LOGISTICS_TRANSIT":
      return "Moving through logistics";

    case "CANCELLED":
      return "Delivery cancelled";

    case "DISPUTED":
      return "Delivery under review";

    default:
      return "Preparing your delivery";
  }
};

const getStatusDescription = (status) => {
  switch (status) {
    case "BIDDING":
      return "We are looking for an available courier for your delivery.";

    case "READY_FOR_PICKUP":
      return "Your order is ready and waiting for courier assignment.";

    case "ACCEPTED":
      return "A courier has accepted your delivery request.";

    case "ARRIVED_PICKUP":
      return "Your courier has arrived at the pickup location.";

    case "LOADING":
      return "Your package is currently being loaded.";

    case "PICKED_UP":
      return "Your package has been picked up by the courier.";

    case "IN_TRANSIT":
      return "Your package is currently on its way to the destination.";

    case "ARRIVED_DROPOFF":
      return "Your courier has arrived at the delivery destination. Please provide the verification code when requested.";

    case "UNLOADING":
      return "Your package is being unloaded and prepared for handover. Give the verification code to your courier.";

    case "DELIVERED":
      return "Your package has been successfully delivered.";

    case "HANDOVER_TO_LOGISTICS":
      return "Your package has been handed over to the logistics team.";

    case "IN_LOGISTICS_TRANSIT":
      return "Your package is currently moving through logistics.";

    case "CANCELLED":
      return "This delivery has been cancelled.";

    case "DISPUTED":
      return "This delivery is currently under review.";

    default:
      return "Your delivery information is being prepared.";
  }
};

const isCompletedStatus = (status) => {
  return ["DELIVERED", "CANCELLED", "DISPUTED"].includes(status);
};

const isTrackingStatus = (status) => {
  return [
    "ACCEPTED",
    "ARRIVED_PICKUP",
    "LOADING",
    "PICKED_UP",
    "IN_TRANSIT",
    "ARRIVED_DROPOFF",
    "UNLOADING",
    "HANDOVER_TO_LOGISTICS",
    "IN_LOGISTICS_TRANSIT",
  ].includes(status);
};

/* =========================================================
   DELIVERY VERIFICATION HELPERS
========================================================= */

/*
 * The verification code should only be displayed when the
 * courier has arrived at the recipient's destination.
 *
 * It is intentionally NOT shown during:
 *
 * - BIDDING
 * - ACCEPTED
 * - PICKUP
 * - LOADING
 * - PICKED_UP
 * - IN_TRANSIT
 * - DELIVERED
 *
 * The courier-side delivery function must still validate
 * the code before changing the order to DELIVERED.
 */
const canShowVerificationCode = (status) => {
  return ["ARRIVED_DROPOFF", "UNLOADING"].includes(status);
};

/* =========================================================
   TRACKING PROGRESS
========================================================= */

const getProgressSteps = () => {
  /*
   * DELIVERED is intentionally not included here as a normal
   * progress step.
   *
   * Delivery becomes completed only after the courier verifies
   * the recipient's delivery verification code.
   */
  return [
    {
      key: "ACCEPTED",
      label: "Courier assigned",
    },
    {
      key: "PICKED_UP",
      label: "Package picked up",
    },
    {
      key: "IN_TRANSIT",
      label: "In transit",
    },
    {
      key: "ARRIVED_DROPOFF",
      label: "At destination",
    },
    {
      key: "UNLOADING",
      label: "Verify delivery",
    },
  ];
};

const getStepState = (orderStatus, stepKey) => {
  const statusOrder = {
    BIDDING: 0,
    READY_FOR_PICKUP: 0,

    ACCEPTED: 1,
    ARRIVED_PICKUP: 1,
    LOADING: 1,

    PICKED_UP: 2,

    IN_TRANSIT: 3,

    ARRIVED_DROPOFF: 4,
    UNLOADING: 5,

    DELIVERED: 6,
  };

  const currentProgress = statusOrder[orderStatus] ?? 0;
  const stepProgress = statusOrder[stepKey] ?? 0;

  /*
   * Once the courier has successfully verified the code and
   * the order becomes DELIVERED, every tracking step is complete.
   */
  if (orderStatus === "DELIVERED") {
    return "completed";
  }

  /*
   * The current step is displayed as active rather than
   * completed while the courier is still performing it.
   */
  if (stepKey === "ACCEPTED") {
    if (["BIDDING", "READY_FOR_PICKUP"].includes(orderStatus)) {
      return "current";
    }

    if (currentProgress >= stepProgress) {
      return "completed";
    }
  }

  if (stepKey === "PICKED_UP") {
    if (["ARRIVED_PICKUP", "LOADING"].includes(orderStatus)) {
      return "current";
    }

    if (currentProgress >= stepProgress) {
      return "completed";
    }
  }

  if (stepKey === "IN_TRANSIT") {
    if (["PICKED_UP", "IN_TRANSIT"].includes(orderStatus)) {
      return "current";
    }

    if (currentProgress > stepProgress) {
      return "completed";
    }
  }

  if (stepKey === "ARRIVED_DROPOFF") {
    if (orderStatus === "ARRIVED_DROPOFF") {
      return "current";
    }

    if (["UNLOADING", "DELIVERED"].includes(orderStatus)) {
      return "completed";
    }
  }

  if (stepKey === "UNLOADING") {
    if (orderStatus === "UNLOADING") {
      return "current";
    }

    if (orderStatus === "DELIVERED") {
      return "completed";
    }
  }

  if (currentProgress > stepProgress) {
    return "completed";
  }

  return "pending";
};

/* =========================================================
   DATE FORMATTER
========================================================= */

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

function RecipientTracking() {
  const navigate = useNavigate();

  const { trackingToken } = useParams();

  const mapRef = useRef(null);

  const [order, setOrder] = useState(null);

  const [courier, setCourier] = useState(null);

  const [directions, setDirections] = useState(null);

  const [loading, setLoading] = useState(true);

  const [courierLoading, setCourierLoading] = useState(false);

  const [errorType, setErrorType] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  /*
   * The verification code is hidden by default.
   *
   * The recipient must deliberately tap the button to reveal it.
   */
  const [showVerificationCode, setShowVerificationCode] = useState(false);

  /* =========================================================
   FETCH ORDER BY TRACKING TOKEN
========================================================= */

  /*
   * DataStore may not immediately contain the order when a public
   * recipient opens the tracking link for the first time.
   *
   * Therefore, an empty result is treated as a temporary condition
   * first. We retry several times before displaying "tracking link
   * not found".
   */

  const fetchOrder = useCallback(async () => {
    if (!trackingToken) {
      setErrorType("invalid");
      setErrorMessage("This tracking link is missing a valid tracking token.");
      setLoading(false);
      return;
    }

    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY = 1500;

    let lastError = null;

    try {
      setLoading(true);
      setErrorType(null);
      setErrorMessage("");

      console.log("=================================");
      console.log("RECIPIENT TRACKING STARTED");
      console.log("Tracking token:", trackingToken);
      console.log("=================================");

      /*
       * Retry the DataStore query because the public tracking page
       * may open before DataStore has synchronized the order.
       */
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
          console.log(`Tracking query attempt ${attempt}/${MAX_ATTEMPTS}`);

          /*
           * Start DataStore synchronization before querying.
           *
           * This is useful when the browser has just opened the page
           * and the local DataStore has not finished syncing.
           */
          try {
            await DataStore.start();
          } catch (syncError) {
            /*
             * DataStore.start() may already be running or may not
             * be available in every Amplify version. We do not fail
             * the whole tracking request because of this.
             */
            console.warn("DataStore.start() warning:", syncError);
          }

          const matchingOrders = await DataStore.query(Order, (o) =>
            o.recipientTrackingToken.eq(trackingToken),
          );

          console.log(
            `Tracking query result on attempt ${attempt}:`,
            matchingOrders,
          );

          const foundOrder = matchingOrders?.[0];

          /*
           * If the order has not synchronized yet, wait and try again.
           */
          if (!foundOrder) {
            if (attempt < MAX_ATTEMPTS) {
              console.warn(
                `No order found yet. Retrying in ${RETRY_DELAY}ms...`,
              );

              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

              continue;
            }

            /*
             * Only display "not found" after all attempts fail.
             */
            setOrder(null);
            setCourier(null);
            setErrorType("invalid");
            setErrorMessage(
              "We could not find a delivery connected to this tracking link. Please confirm that the link is correct and try again.",
            );

            return;
          }

          console.log("Found order:", foundOrder);
          console.log("Order ID:", foundOrder.id);
          console.log("Order status:", foundOrder.status);
          console.log("Tracking enabled:", foundOrder.recipientTrackingEnabled);
          console.log(
            "Tracking revoked at:",
            foundOrder.recipientTrackingRevokedAt,
          );

          /*
           * The tracking token exists, but tracking may have been
           * disabled by the sender or backend.
           */
          if (foundOrder.recipientTrackingEnabled !== true) {
            setOrder(null);
            setCourier(null);
            setErrorType("disabled");
            setErrorMessage(
              "Tracking for this delivery is not currently available.",
            );

            return;
          }

          /*
           * Do not allow a revoked tracking link to remain active.
           */
          if (foundOrder.recipientTrackingRevokedAt) {
            setOrder(null);
            setCourier(null);
            setErrorType("revoked");
            setErrorMessage("This tracking link is no longer active.");

            return;
          }

          /*
           * Delivered orders can still be viewed, but courier
           * tracking and verification code must not be shown.
           */
          if (foundOrder.status === "DELIVERED") {
            setOrder(foundOrder);
            setCourier(null);
            setErrorType("delivered");
            setErrorMessage("This delivery has already been completed.");
            setLastUpdated(new Date());
            setShowVerificationCode(false);

            return;
          }

          /*
           * Cancelled and disputed orders can still display their
           * final status without live courier information.
           */
          if (
            foundOrder.status === "CANCELLED" ||
            foundOrder.status === "DISPUTED"
          ) {
            setOrder(foundOrder);
            setCourier(null);
            setErrorType("completed");
            setErrorMessage(getStatusDescription(foundOrder.status));
            setLastUpdated(new Date());
            setShowVerificationCode(false);

            return;
          }

          /*
           * Normal active tracking order.
           */
          setOrder(foundOrder);
          setErrorType(null);
          setErrorMessage("");
          setLastUpdated(new Date());

          /*
           * Hide the verification code whenever the order is not
           * currently at the recipient's destination.
           */
          if (!canShowVerificationCode(foundOrder.status)) {
            setShowVerificationCode(false);
          }

          return;
        } catch (error) {
          lastError = error;

          console.error(`Tracking query attempt ${attempt} failed:`, error);

          /*
           * A temporary DataStore/network error should also be
           * retried instead of immediately showing an error page.
           */
          if (attempt < MAX_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

            continue;
          }
        }
      }

      /*
       * Only show the server error after every attempt fails.
       */
      console.error("RECIPIENT TRACKING FAILED AFTER ALL RETRIES:", lastError);

      setOrder(null);
      setCourier(null);
      setErrorType("server");
      setErrorMessage(
        "We could not load this delivery right now. Please try again.",
      );
    } finally {
      console.log("RECIPIENT TRACKING FINISHED — SETTING LOADING FALSE");

      setLoading(false);
    }
  }, [trackingToken]);

  /* =========================================================
     FETCH ASSIGNED COURIER
  ========================================================= */

  const fetchCourier = useCallback(async () => {
    if (!order?.assignedCourierId) {
      setCourier(null);

      return;
    }

    try {
      setCourierLoading(true);

      const foundCourier = await DataStore.query(
        Courier,
        order.assignedCourierId,
      );

      setCourier(foundCourier || null);
    } catch (error) {
      console.error("RECIPIENT TRACKING COURIER ERROR:", error);

      setCourier(null);
    } finally {
      setCourierLoading(false);
    }
  }, [order?.assignedCourierId]);

  /* =========================================================
     INITIAL ORDER FETCH
  ========================================================= */

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /* =========================================================
     FETCH COURIER WHEN ORDER CHANGES
  ========================================================= */

  useEffect(() => {
    fetchCourier();
  }, [fetchCourier]);

  /* =========================================================
     HIDE VERIFICATION CODE WHEN STATUS CHANGES
  ========================================================= */

  useEffect(() => {
    /*
     * This ensures that if the status changes from UNLOADING
     * to DELIVERED, the code is immediately hidden.
     */
    setShowVerificationCode(false);
  }, [order?.id, order?.status]);

  /* =========================================================
   LIVE ORDER SUBSCRIPTION
========================================================= */

  useEffect(() => {
    if (!trackingToken) {
      return undefined;
    }

    let subscription;
    let isMounted = true;

    const subscribeToOrderChanges = async () => {
      try {
        /*
         * Give DataStore a chance to start synchronization before
         * creating the observer.
         */
        try {
          await DataStore.start();
        } catch (syncError) {
          console.warn(
            "DataStore.start() warning during subscription:",
            syncError,
          );
        }

        if (!isMounted) {
          return;
        }

        subscription = DataStore.observe(Order).subscribe(
          ({ opType, element }) => {
            if (!element) {
              return;
            }

            /*
             * Only react to changes belonging to this tracking link.
             */
            if (element.recipientTrackingToken !== trackingToken) {
              return;
            }

            if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
              console.log(
                "Recipient tracking order change detected:",
                opType,
                element,
              );

              /*
               * Re-fetch the complete order so that all related
               * fields are refreshed consistently.
               */
              fetchOrder();
            }
          },
        );
      } catch (error) {
        console.error("ORDER TRACKING SUBSCRIPTION ERROR:", error);
      }
    };

    subscribeToOrderChanges();

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, [trackingToken, fetchOrder]);

  /* =========================================================
     LIVE COURIER SUBSCRIPTION
  ========================================================= */

  useEffect(() => {
    if (!order?.assignedCourierId) {
      return undefined;
    }

    let subscription;

    try {
      subscription = DataStore.observe(Courier).subscribe(
        ({ opType, element }) => {
          if (!element) {
            return;
          }

          if (element.id !== order.assignedCourierId) {
            return;
          }

          if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
            fetchCourier();
          }
        },
      );
    } catch (error) {
      console.error("COURIER TRACKING SUBSCRIPTION ERROR:", error);
    }

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [order?.assignedCourierId, fetchCourier]);

  /* =========================================================
     MAP COORDINATES
  ========================================================= */

  const origin = useMemo(() => {
    return toCoordinate(order?.originLat, order?.originLng);
  }, [order?.originLat, order?.originLng]);

  const destination = useMemo(() => {
    return toCoordinate(order?.destinationLat, order?.destinationLng);
  }, [order?.destinationLat, order?.destinationLng]);

  const courierLocation = useMemo(() => {
    return toCoordinate(courier?.lat, courier?.lng);
  }, [courier?.lat, courier?.lng]);

  const mapCenter = useMemo(() => {
    return courierLocation || origin || destination || DEFAULT_MAP_CENTER;
  }, [courierLocation, origin, destination]);

  /* =========================================================
     MAP BOUNDS
  ========================================================= */

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    let hasBounds = false;

    if (origin) {
      bounds.extend(origin);

      hasBounds = true;
    }

    if (destination) {
      bounds.extend(destination);

      hasBounds = true;
    }

    if (courierLocation) {
      bounds.extend(courierLocation);

      hasBounds = true;
    }

    if (hasBounds) {
      mapRef.current.fitBounds(bounds);
    }
  }, [origin, destination, courierLocation]);

  /* =========================================================
     DIRECTIONS DESTINATION
  ========================================================= */

  const directionsDestination = useMemo(() => {
    /*
     * Before pickup, the courier should be heading toward
     * the pickup location.
     *
     * After pickup, the courier should be heading toward
     * the delivery destination.
     */

    if (
      order?.status === "ACCEPTED" ||
      order?.status === "ARRIVED_PICKUP" ||
      order?.status === "LOADING"
    ) {
      return origin;
    }

    return destination;
  }, [order?.status, origin, destination]);

  /* =========================================================
     FETCH DIRECTIONS
  ========================================================= */

  useEffect(() => {
    if (
      !window.google?.maps ||
      !courierLocation ||
      !directionsDestination ||
      !isTrackingStatus(order?.status)
    ) {
      setDirections(null);

      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: courierLocation,

        destination: directionsDestination,

        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        } else {
          console.error("RECIPIENT DIRECTIONS ERROR:", status);

          setDirections(null);
        }
      },
    );
  }, [courierLocation, directionsDestination, order?.status]);

  /* =========================================================
     MAP LOAD
  ========================================================= */

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  /* =========================================================
     RENDER LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="recipientTrackingPage">
        <div className="recipientTrackingHeader">
          <button
            className="recipientTrackingBackButton"
            onClick={() => navigate("/send/home")}
            aria-label="Return home"
          >
            ←
          </button>

          <div>
            <h1 className="recipientTrackingTitle">Track Delivery</h1>

            <p className="recipientTrackingSubtitle">
              Loading your delivery information...
            </p>
          </div>
        </div>

        <div className="recipientTrackingStateCard">
          <div className="recipientTrackingSpinner" />

          <h2>Loading tracking information</h2>

          <p>Please wait while we retrieve your delivery details.</p>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER ERROR STATES
  ========================================================= */

  if (
    errorType === "invalid" ||
    errorType === "disabled" ||
    errorType === "revoked" ||
    errorType === "server"
  ) {
    return (
      <div className="recipientTrackingPage">
        <div className="recipientTrackingHeader">
          <button
            className="recipientTrackingBackButton"
            onClick={() => navigate("/send/home")}
            aria-label="Return home"
          >
            ←
          </button>

          <div>
            <h1 className="recipientTrackingTitle">Track Delivery</h1>

            <p className="recipientTrackingSubtitle">Atua delivery tracking</p>
          </div>
        </div>

        <div className="recipientTrackingStateCard">
          <div className="recipientTrackingStateIcon">!</div>

          <h2>
            {errorType === "revoked"
              ? "Tracking link inactive"
              : errorType === "disabled"
                ? "Tracking unavailable"
                : errorType === "server"
                  ? "Something went wrong"
                  : "Tracking link not found"}
          </h2>

          <p>{errorMessage}</p>

          <button
            className="recipientTrackingPrimaryButton"
            onClick={fetchOrder}
          >
            Try Again
          </button>

          <button
            className="recipientTrackingSecondaryButton"
            onClick={() => navigate("/send/home")}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="recipientTrackingPage">
        <div className="recipientTrackingStateCard">
          <h2>Delivery unavailable</h2>

          <p>We could not load the delivery information.</p>

          <button
            className="recipientTrackingPrimaryButton"
            onClick={fetchOrder}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     DERIVED RENDER VALUES
  ========================================================= */

  const progressSteps = getProgressSteps();

  const isDelivered = order.status === "DELIVERED" || errorType === "delivered";

  const isCancelled = order.status === "CANCELLED";

  const isDisputed = order.status === "DISPUTED";

  const showVerificationSection = canShowVerificationCode(order.status);

  /*
   * This assumes the field exists in your Order model:
   *
   * deliveryVerificationCode: String
   *
   * We will later stop retrieving this field through the
   * public DataStore query and return it through a protected
   * Lambda/API only during ARRIVED_DROPOFF or UNLOADING.
   */
  const verificationCode = order.deliveryVerificationCode;

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="recipientTrackingPage">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="recipientTrackingHeader">
        <button
          className="recipientTrackingBackButton"
          onClick={() => navigate("/send/home")}
          aria-label="Return home"
        >
          ←
        </button>

        <div>
          <h1 className="recipientTrackingTitle">Track Delivery</h1>

          <p className="recipientTrackingSubtitle">
            Follow your package from pickup to destination.
          </p>
        </div>
      </div>

      {/* =====================================================
          STATUS CARD
      ===================================================== */}

      <div className="recipientTrackingCard recipientTrackingStatusCard">
        <div className="recipientTrackingStatusTop">
          <div>
            <p className="recipientTrackingEyebrow">DELIVERY STATUS</p>

            <h2 className="recipientTrackingStatusTitle">
              {getStatusLabel(order.status)}
            </h2>

            <p className="recipientTrackingStatusDescription">
              {getStatusDescription(order.status)}
            </p>
          </div>

          <span
            className={`recipientTrackingStatusBadge ${(
              order.status || "PENDING"
            ).toLowerCase()}`}
          >
            {order.status || "PENDING"}
          </span>
        </div>

        {lastUpdated && (
          <p className="recipientTrackingLastUpdated">
            Last updated: {formatDateTime(lastUpdated)}
          </p>
        )}

        {/* =================================================
            PROGRESS STEPS
        ================================================= */}

        {!isCancelled && !isDisputed && (
          <div className="recipientTrackingProgress">
            {progressSteps.map((step, index) => {
              const stepState = getStepState(order.status, step.key);

              return (
                <React.Fragment key={step.key}>
                  <div className={`recipientTrackingProgressStep ${stepState}`}>
                    <div className="recipientTrackingProgressCircle">
                      {stepState === "completed" ? "✓" : index + 1}
                    </div>

                    <span>{step.label}</span>
                  </div>

                  {index < progressSteps.length - 1 && (
                    <div
                      className={`recipientTrackingProgressLine ${
                        stepState === "completed" ? "completed" : ""
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================
          DELIVERY VERIFICATION CODE
      ===================================================== */}

      {showVerificationSection && (
        <div className="recipientTrackingCard recipientTrackingVerificationCard">
          <div className="recipientTrackingSectionHeader">
            <div>
              <p className="recipientTrackingEyebrow">DELIVERY VERIFICATION</p>

              <h2 className="recipientTrackingSectionTitle">
                Give this code to your courier
              </h2>
            </div>

            <span className="recipientTrackingVerificationBadge">Required</span>
          </div>

          <p className="recipientTrackingVerificationDescription">
            Your courier must verify this code before the delivery can be marked
            as completed. Keep the code private until your package is ready to
            be handed over.
          </p>

          {verificationCode ? (
            <div className="recipientTrackingVerificationCodeWrapper">
              <div
                className={`recipientTrackingVerificationCode ${
                  showVerificationCode ? "visible" : "hidden"
                }`}
                aria-live="polite"
              >
                {showVerificationCode ? verificationCode : "••••••"}
              </div>

              <button
                type="button"
                className="recipientTrackingPrimaryButton recipientTrackingVerificationButton"
                onClick={() =>
                  setShowVerificationCode((currentValue) => !currentValue)
                }
              >
                {showVerificationCode
                  ? "Hide verification code"
                  : "Show verification code"}
              </button>
            </div>
          ) : (
            <div className="recipientTrackingVerificationUnavailable">
              The verification code is not available yet. Please contact the
              sender or Atua support if this continues.
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          DELIVERED / CANCELLED / DISPUTED NOTICE
      ===================================================== */}

      {(isDelivered || isCancelled || isDisputed) && (
        <div
          className={`recipientTrackingCard recipientTrackingNoticeCard ${
            isDelivered ? "success" : "warning"
          }`}
        >
          <div className="recipientTrackingNoticeIcon">
            {isDelivered ? "✓" : "!"}
          </div>

          <div>
            <h2>
              {isDelivered
                ? "Delivery completed"
                : isCancelled
                  ? "Delivery cancelled"
                  : "Delivery under review"}
            </h2>

            <p>
              {isDelivered
                ? "This delivery has been completed after the delivery verification code was confirmed. Live courier tracking is no longer available."
                : getStatusDescription(order.status)}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          MAP
      ===================================================== */}

      {!isDelivered && !isCancelled && !isDisputed && (
        <div className="recipientTrackingCard recipientTrackingMapCard">
          <div className="recipientTrackingSectionHeader">
            <div>
              <p className="recipientTrackingEyebrow">LIVE LOCATION</p>

              <h2 className="recipientTrackingSectionTitle">Delivery map</h2>
            </div>

            {courierLocation && (
              <span className="recipientTrackingLiveBadge">
                <span className="recipientTrackingLiveDot" />
                Live
              </span>
            )}
          </div>

          {origin || destination || courierLocation ? (
            <div className="recipientTrackingMapWrapper">
              <GoogleMap
                mapContainerClassName="recipientTrackingMap"
                center={mapCenter}
                zoom={12}
                onLoad={handleMapLoad}
                onUnmount={handleMapUnmount}
                options={MAP_OPTIONS}
              >
                {/* Pickup marker */}

                {origin && (
                  <Marker
                    position={origin}
                    label={{
                      text: "P",
                      color: "#ffffff",
                      fontWeight: "700",
                    }}
                    title="Pickup location"
                  />
                )}

                {/* Destination marker */}

                {destination && (
                  <Marker
                    position={destination}
                    label={{
                      text: "D",
                      color: "#ffffff",
                      fontWeight: "700",
                    }}
                    title="Delivery destination"
                  />
                )}

                {/* Courier marker */}

                {courierLocation && (
                  <Marker
                    position={courierLocation}
                    title={
                      courier?.firstName
                        ? `Courier: ${courier.firstName}`
                        : "Assigned courier"
                    }
                    icon={{
                      url: getCourierImage(
                        courier?.transportationType || order.transportationType,
                      ),
                      scaledSize: window.google?.maps
                        ? new window.google.maps.Size(50, 60)
                        : undefined,
                    }}
                  />
                )}

                {/* Courier route */}

                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: "#111827",
                        strokeOpacity: 0.85,
                        strokeWeight: 5,
                      },
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          ) : (
            <div className="recipientTrackingMapUnavailable">
              <p>Location information is not available yet.</p>
            </div>
          )}

          {!courierLocation && (
            <p className="recipientTrackingMapHint">
              Courier location will appear here once live tracking becomes
              available.
            </p>
          )}
        </div>
      )}

      {/* =====================================================
          ROUTE CARD
      ===================================================== */}

      <div className="recipientTrackingCard">
        <div className="recipientTrackingSectionHeader">
          <div>
            <p className="recipientTrackingEyebrow">DELIVERY ROUTE</p>

            <h2 className="recipientTrackingSectionTitle">
              Pickup and destination
            </h2>
          </div>
        </div>

        <div className="recipientTrackingRoute">
          <div className="recipientTrackingRouteItem">
            <div className="recipientTrackingRouteMarker pickup">P</div>

            <div className="recipientTrackingRouteContent">
              <span className="recipientTrackingRouteLabel">
                Pickup location
              </span>

              <p className="recipientTrackingRouteAddress">
                {order.originAddress || "Pickup location unavailable"}
              </p>
            </div>
          </div>

          <div className="recipientTrackingRouteConnector" />

          <div className="recipientTrackingRouteItem">
            <div className="recipientTrackingRouteMarker destination">D</div>

            <div className="recipientTrackingRouteContent">
              <span className="recipientTrackingRouteLabel">
                Delivery destination
              </span>

              <p className="recipientTrackingRouteAddress">
                {order.destinationAddress || "Destination unavailable"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          COURIER CARD
      ===================================================== */}

      {!isDelivered && !isCancelled && !isDisputed && (
        <div className="recipientTrackingCard">
          <div className="recipientTrackingSectionHeader">
            <div>
              <p className="recipientTrackingEyebrow">COURIER</p>

              <h2 className="recipientTrackingSectionTitle">
                Your delivery courier
              </h2>
            </div>
          </div>

          {courierLoading ? (
            <div className="recipientTrackingCourierLoading">
              Loading courier information...
            </div>
          ) : courier ? (
            <div className="recipientTrackingCourier">
              {courier.profilePic ? (
                <img
                  src={courier.profilePic}
                  alt={courier.firstName || "Assigned courier"}
                  className="recipientTrackingCourierImage"
                />
              ) : (
                <div className="recipientTrackingCourierPlaceholder">
                  {(courier.firstName || "C").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="recipientTrackingCourierDetails">
                <h3>{courier.firstName || "Assigned courier"}</h3>

                {courier.lastName && <p>{courier.lastName}</p>}

                <span>
                  {courier.transportationType ||
                    order.transportationType ||
                    "Delivery courier"}
                </span>

                {courier.vehicleClass && <small>{courier.vehicleClass}</small>}
              </div>

              {courierLocation && (
                <span className="recipientTrackingCourierOnline">
                  <span className="recipientTrackingLiveDot" />
                  Online
                </span>
              )}
            </div>
          ) : (
            <div className="recipientTrackingCourierUnavailable">
              <h3>Courier not assigned yet</h3>

              <p>
                We will show your courier details once a courier has been
                assigned to this delivery.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          DELIVERY DETAILS
      ===================================================== */}

      <div className="recipientTrackingCard">
        <p className="recipientTrackingEyebrow">DELIVERY DETAILS</p>

        <h2 className="recipientTrackingSectionTitle">Order information</h2>

        <div className="recipientTrackingDetails">
          <div className="recipientTrackingDetailRow">
            <span>Transportation</span>

            <strong>{order.transportationType || "Not available"}</strong>
          </div>

          {order.tripType && (
            <div className="recipientTrackingDetailRow">
              <span>Trip type</span>

              <strong>{order.tripType}</strong>
            </div>
          )}

          {order.distance && (
            <div className="recipientTrackingDetailRow">
              <span>Distance</span>

              <strong>{order.distance}</strong>
            </div>
          )}

          {order.acceptedAt && (
            <div className="recipientTrackingDetailRow">
              <span>Accepted at</span>

              <strong>{formatDateTime(order.acceptedAt)}</strong>
            </div>
          )}

          {order.trackingStartedAt && (
            <div className="recipientTrackingDetailRow">
              <span>Tracking started</span>

              <strong>{formatDateTime(order.trackingStartedAt)}</strong>
            </div>
          )}

          {order.trackingEndedAt && (
            <div className="recipientTrackingDetailRow">
              <span>Tracking ended</span>

              <strong>{formatDateTime(order.trackingEndedAt)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          FOOTER NOTE
      ===================================================== */}

      <div className="recipientTrackingFooterNote">
        <p>
          Atua keeps you informed throughout your delivery. Please contact the
          sender or Atua support if you need assistance with this order.
        </p>
      </div>
    </div>
  );
}

export default RecipientTracking;
