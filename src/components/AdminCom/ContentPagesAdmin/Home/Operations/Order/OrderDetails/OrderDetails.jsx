import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  FaArrowLeft,
  FaBox,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaFlag,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaMoneyBillWave,
  FaPaperclip,
  FaPhone,
  FaRedo,
  FaRoute,
  FaShieldAlt,
  FaTruck,
  FaUser,
  FaVideo,
  FaWallet,
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

import { Courier, Order, Payment, User } from "../../../../../../../models";

import { getSignedUrl } from "../../../../../../../utils/s3";

import "./OrderDetails.css";

function OrderDetails() {
  /*
    ==========================================================
    ROUTER
    ==========================================================
  */

  const navigate = useNavigate();

  const { id: orderId } = useParams();

  /*
    ==========================================================
    STATE
    ==========================================================
  */

  const [order, setOrder] = useState(null);

  const [courier, setCourier] = useState(null);

  const [user, setUser] = useState(null);

  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  /*
    ==========================================================
    MEDIA STATE
    ==========================================================
  */

  const [mediaUrls, setMediaUrls] = useState({});

  /*
    ==========================================================
    IMAGE / VIDEO URL RESOLVER
    ==========================================================
  */

  const resolveMediaUrl = useCallback(async (mediaPath) => {
    if (!mediaPath) {
      return null;
    }

    try {
      const pathValue =
        typeof mediaPath === "string" ? mediaPath.trim() : mediaPath;

      if (!pathValue) {
        return null;
      }

      /*
        ------------------------------------------------------
        ALREADY A URL
        ------------------------------------------------------
      */

      if (
        typeof pathValue === "string" &&
        (pathValue.startsWith("http://") ||
          pathValue.startsWith("https://") ||
          pathValue.startsWith("blob:"))
      ) {
        return pathValue;
      }

      /*
        ------------------------------------------------------
        AMPLIFY STORAGE
        ------------------------------------------------------
      */

      try {
        const result = await getUrl({
          path: pathValue,

          options: {
            validateObjectExistence: true,
          },
        });

        if (result?.url) {
          return result.url.toString();
        }
      } catch (storageError) {
        console.warn(
          "Amplify Storage getUrl failed. Trying S3 helper:",
          storageError,
        );
      }

      /*
        ------------------------------------------------------
        CUSTOM S3 FALLBACK
        ------------------------------------------------------
      */

      try {
        const signedUrl = await getSignedUrl(pathValue);

        if (signedUrl) {
          return signedUrl.toString();
        }
      } catch (signedUrlError) {
        console.error("S3 signed URL resolution failed:", signedUrlError);
      }

      return null;
    } catch (error) {
      console.error("Failed to resolve media URL:", error);

      return null;
    }
  }, []);

  /*
    ==========================================================
    LOAD MEDIA
    ==========================================================
  */

  const resolveOrderMedia = useCallback(
    async (orderData) => {
      if (!orderData) {
        setMediaUrls({});
        return;
      }

      const mediaPaths = [];

      /*
        ------------------------------------------------------
        SENDER PRE-TRANSFER
        ------------------------------------------------------
      */

      if (Array.isArray(orderData.senderPreTransferPhotos)) {
        mediaPaths.push(...orderData.senderPreTransferPhotos);
      }

      if (orderData.senderPreTransferVideo) {
        mediaPaths.push(orderData.senderPreTransferVideo);
      }

      if (Array.isArray(orderData.senderPreTransferLocalPhotos)) {
        mediaPaths.push(...orderData.senderPreTransferLocalPhotos);
      }

      if (orderData.senderPreTransferLocalVideo) {
        mediaPaths.push(orderData.senderPreTransferLocalVideo);
      }

      /*
        ------------------------------------------------------
        COURIER PRE-TRANSFER
        ------------------------------------------------------
      */

      if (Array.isArray(orderData.courierPreTransferPhotos)) {
        mediaPaths.push(...orderData.courierPreTransferPhotos);
      }

      if (orderData.courierPreTransferVideo) {
        mediaPaths.push(orderData.courierPreTransferVideo);
      }

      if (Array.isArray(orderData.courierPreTransferLocalPhotos)) {
        mediaPaths.push(...orderData.courierPreTransferLocalPhotos);
      }

      if (orderData.courierPreTransferLocalVideo) {
        mediaPaths.push(orderData.courierPreTransferLocalVideo);
      }

      /*
        ------------------------------------------------------
        POST LOADING
        ------------------------------------------------------
      */

      if (Array.isArray(orderData.courierPostLoadingPhotos)) {
        mediaPaths.push(...orderData.courierPostLoadingPhotos);
      }

      if (orderData.courierPostLoadingVideo) {
        mediaPaths.push(orderData.courierPostLoadingVideo);
      }

      if (Array.isArray(orderData.courierPostLoadingLocalPhotos)) {
        mediaPaths.push(...orderData.courierPostLoadingLocalPhotos);
      }

      if (orderData.courierPostLoadingLocalVideo) {
        mediaPaths.push(orderData.courierPostLoadingLocalVideo);
      }

      /*
        ------------------------------------------------------
        DROPOFF
        ------------------------------------------------------
      */

      if (Array.isArray(orderData.dropoffArrivalPhotos)) {
        mediaPaths.push(...orderData.dropoffArrivalPhotos);
      }

      if (orderData.dropoffArrivalVideo) {
        mediaPaths.push(orderData.dropoffArrivalVideo);
      }

      if (Array.isArray(orderData.dropoffArrivalLocalPhotos)) {
        mediaPaths.push(...orderData.dropoffArrivalLocalPhotos);
      }

      if (orderData.dropoffArrivalLocalVideo) {
        mediaPaths.push(orderData.dropoffArrivalLocalVideo);
      }

      /*
        ------------------------------------------------------
        POST DELIVERY
        ------------------------------------------------------
      */

      if (Array.isArray(orderData.postDeliveryPhotos)) {
        mediaPaths.push(...orderData.postDeliveryPhotos);
      }

      if (orderData.postDeliveryVideo) {
        mediaPaths.push(orderData.postDeliveryVideo);
      }

      const uniquePaths = [...new Set(mediaPaths.filter(Boolean))];

      if (uniquePaths.length === 0) {
        setMediaUrls({});
        return;
      }

      const resolved = {};

      await Promise.all(
        uniquePaths.map(async (path) => {
          const url = await resolveMediaUrl(path);

          if (url) {
            resolved[path] = url;
          }
        }),
      );

      setMediaUrls(resolved);
    },
    [resolveMediaUrl],
  );

  /*
    ==========================================================
    FETCH ORDER
    ==========================================================
  */

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      throw new Error("Order ID is missing.");
    }

    const orderData = await DataStore.query(Order, orderId);

    if (!orderData) {
      throw new Error("Order not found.");
    }

    setOrder(orderData);

    return orderData;
  }, [orderId]);

  /*
    ==========================================================
    FETCH COURIER
    ==========================================================
  */

  const fetchCourier = useCallback(async (orderData) => {
    if (!orderData?.assignedCourierId) {
      setCourier(null);
      return null;
    }

    try {
      const courierData = await DataStore.query(
        Courier,
        orderData.assignedCourierId,
      );

      setCourier(courierData || null);

      return courierData || null;
    } catch (error) {
      console.error("Failed to fetch assigned courier:", error);

      setCourier(null);

      return null;
    }
  }, []);

  /*
    ==========================================================
    FETCH USER
    ==========================================================
  */

  const fetchUser = useCallback(async (orderData) => {
    if (!orderData?.userID) {
      setUser(null);
      return null;
    }

    try {
      const userData = await DataStore.query(User, orderData.userID);

      setUser(userData || null);

      return userData || null;
    } catch (error) {
      console.error("Failed to fetch order user:", error);

      setUser(null);

      return null;
    }
  }, []);

  /*
    ==========================================================
    FETCH PAYMENTS
    ==========================================================
  */

  const fetchPayments = useCallback(async (orderData) => {
    if (!orderData?.id) {
      setPayments([]);
      return [];
    }

    try {
      const paymentData = await DataStore.query(Payment, (payment) =>
        payment.orderID.eq(orderData.id),
      );

      const sortedPayments = [...paymentData].sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
      );

      setPayments(sortedPayments);

      return sortedPayments;
    } catch (error) {
      console.error("Failed to fetch payments:", error);

      setPayments([]);

      return [];
    }
  }, []);

  /*
    ==========================================================
    FETCH EVERYTHING
    ==========================================================
  */

  const fetchEverything = useCallback(
    async ({ showLoading = true, showRefreshing = false } = {}) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        if (showRefreshing) {
          setRefreshing(true);
        }

        setError(null);

        const orderData = await fetchOrder();

        await Promise.all([
          fetchCourier(orderData),
          fetchUser(orderData),
          fetchPayments(orderData),
          resolveOrderMedia(orderData),
        ]);
      } catch (error) {
        console.error("Failed to load order details:", error);

        setError(
          error?.message === "Order not found."
            ? "The requested order could not be found."
            : error?.message === "Order ID is missing."
              ? "No order was specified."
              : "Unable to load order details.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchOrder, fetchCourier, fetchUser, fetchPayments, resolveOrderMedia],
  );

  /*
    ==========================================================
    INITIAL LOAD
    ==========================================================
  */

  useEffect(() => {
    fetchEverything({
      showLoading: true,
      showRefreshing: false,
    });
  }, [fetchEverything]);

  /*
    ==========================================================
    REAL-TIME ORDER OBSERVATION
    ==========================================================
  */

  useEffect(() => {
    if (!orderId) {
      return undefined;
    }

    const subscription = DataStore.observe(Order, orderId).subscribe(
      ({ element }) => {
        if (!element) {
          return;
        }

        setOrder(element);

        resolveOrderMedia(element);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId, resolveOrderMedia]);

  /*
    ==========================================================
    REFRESH
    ==========================================================
  */

  const handleRefresh = async () => {
    if (refreshing || loading) {
      return;
    }

    await fetchEverything({
      showLoading: false,
      showRefreshing: true,
    });
  };

  /*
    ==========================================================
    FORMATTERS
    ==========================================================
  */

  const formatStatus = useCallback((status) => {
    if (!status) {
      return "Unknown";
    }

    return String(status)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, []);

  const normalizeStatus = useCallback((status) => {
    if (!status) {
      return "";
    }

    return String(status).trim().toUpperCase().replace(/\s+/g, "_");
  }, []);

  const formatCurrency = useCallback((value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "₦0";
    }

    return `₦${numericValue.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  const formatDate = useCallback((value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const formatDateTime = useCallback((value) => {
    if (!value) {
      return "Not recorded";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not recorded";
    }

    return date.toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  const formatDistance = useCallback((value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    return String(value);
  }, []);

  /*
    ==========================================================
    DERIVED DATA
    ==========================================================
  */

  const orderIdShort = useMemo(() => {
    if (!order?.id) {
      return "N/A";
    }

    return order.id.slice(0, 8).toUpperCase();
  }, [order?.id]);

  const currentStatus = useMemo(
    () => normalizeStatus(order?.status),
    [order?.status, normalizeStatus],
  );

  const formattedCurrentStatus = useMemo(
    () => formatStatus(order?.status),
    [order?.status, formatStatus],
  );

  const transportation = useMemo(
    () => order?.transportationType || order?.vehicleClass || "Courier",
    [order],
  );

  const customerName = useMemo(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");

      if (fullName) {
        return fullName;
      }
    }

    return "Customer";
  }, [user]);

  const courierName = useMemo(() => {
    if (!courier) {
      return "No courier assigned";
    }

    return (
      [courier.firstName, courier.lastName].filter(Boolean).join(" ") ||
      "Courier"
    );
  }, [courier]);

  /*
    ==========================================================
    TIMELINE
    ==========================================================
  */

  const timeline = useMemo(() => {
    const statusOrder = [
      "BIDDING",
      "READY_FOR_PICKUP",
      "ACCEPTED",
      "ARRIVED_PICKUP",
      "LOADING",
      "PICKED_UP",
      "IN_TRANSIT",
      "ARRIVED_DROPOFF",
      "UNLOADING",
      "DELIVERED",
    ];

    const timestamps = {
      ACCEPTED: order?.acceptedAt,
      ARRIVED_PICKUP: order?.arrivedPickupAt,
      LOADING: order?.loadingStartedAt,
      PICKED_UP: order?.tripStartedAt,
      IN_TRANSIT: order?.tripStartedAt,
      ARRIVED_DROPOFF: order?.arrivedDropoffAt,
      UNLOADING: order?.unloadingCompletedAt,
      DELIVERED: order?.unloadingCompletedAt,
    };

    const currentIndex = statusOrder.indexOf(currentStatus);

    return statusOrder.map((status, index) => {
      const timestamp = timestamps[status];

      let state = "upcoming";

      if (currentStatus === "CANCELLED" || currentStatus === "DISPUTED") {
        if (timestamp) {
          state = "completed";
        }
      } else if (currentIndex >= 0 && index < currentIndex) {
        state = "completed";
      } else if (currentIndex >= 0 && index === currentIndex) {
        state = "current";
      }

      return {
        key: status,
        label: formatStatus(status),
        timestamp,
        state,
      };
    });
  }, [order, currentStatus, formatStatus]);

  /*
    ==========================================================
    PRICING
    ==========================================================
  */

  const pricingRows = [
    {
      label: "Total Order Price",
      value: formatCurrency(order?.totalPrice),
      highlight: true,
    },
    {
      label: "Operational Fare",
      value: formatCurrency(order?.operationalFare),
    },
    {
      label: "Courier Earnings",
      value: formatCurrency(order?.courierEarnings),
    },
    {
      label: "Commission",
      value: formatCurrency(order?.commissionAmount),
    },
    {
      label: "Platform Fee",
      value: formatCurrency(order?.platformFee),
    },
    {
      label: "VAT",
      value: formatCurrency(order?.vatAmount),
    },
    {
      label: "Platform Service Revenue",
      value: formatCurrency(order?.platformServiceRevenue),
    },
    {
      label: "Platform Net Revenue",
      value: formatCurrency(order?.platformNetRevenue),
    },
  ];

  /*
    ==========================================================
    PAYMENT
    ==========================================================
  */

  const latestPayment = payments[0] || null;

  /*
    ==========================================================
    PAYMENT STATUS CLASS
    ==========================================================
  */

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);

    switch (normalized) {
      case "PAID":
      case "SUCCESS":
      case "RELEASED":
      case "ALLOCATED":
        return "success";

      case "PROCESSING":
      case "PARTIALLY_RELEASED":
        return "processing";

      case "FAILED":
      case "BLOCKED":
        return "danger";

      default:
        return "neutral";
    }
  };

  /*
    ==========================================================
    EVIDENCE GROUPS
    ==========================================================
  */

  const evidenceGroups = [
    {
      key: "sender",
      title: "Sender Pre-Transfer",
      description:
        "Evidence uploaded by the sender before the package was transferred.",
      photos: order?.senderPreTransferPhotos || [],
      video: order?.senderPreTransferVideo,
      recordedAt: order?.senderPreTransferRecordedAt,
      uploadStatus: order?.mediaUploadStatus,
    },

    {
      key: "courierPre",
      title: "Courier Pre-Transfer",
      description: "Evidence captured by the courier before taking custody.",
      photos: order?.courierPreTransferPhotos || [],
      video: order?.courierPreTransferVideo,
      recordedAt: order?.courierPreTransferRecordedAt,
      uploadStatus: order?.courierPreTransferUploadStatus,
    },

    {
      key: "loading",
      title: "Post-Loading",
      description: "Evidence captured after the order was loaded.",
      photos: order?.courierPostLoadingPhotos || [],
      video: order?.courierPostLoadingVideo,
      recordedAt: null,
      uploadStatus: order?.courierPostLoadingUploadStatus,
    },

    {
      key: "dropoff",
      title: "Dropoff Arrival",
      description:
        "Evidence captured when the courier arrived at the destination.",
      photos: order?.dropoffArrivalPhotos || [],
      video: order?.dropoffArrivalVideo,
      recordedAt: null,
      uploadStatus: order?.dropoffUploadStatus,
    },

    {
      key: "delivery",
      title: "Post-Delivery",
      description: "Final evidence associated with delivery completion.",
      photos: order?.postDeliveryPhotos || [],
      video: order?.postDeliveryVideo,
      recordedAt: null,
      uploadStatus: null,
    },
  ];

  /*
    ==========================================================
    OPEN MEDIA
    ==========================================================
  */

  const handleOpenMedia = (path) => {
    const url = mediaUrls[path];

    if (!url) {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /*
    ==========================================================
    BACK
    ==========================================================
  */

  const handleBack = () => {
    if (order?.assignedCourierId) {
      navigate(`/admin/courier_orders/${order.assignedCourierId}`);

      return;
    }

    navigate(-1);
  };

  /*
    ==========================================================
    LOADING STATE
    ==========================================================
  */

  if (loading) {
    return (
      <div className="orderDetails">
        <div className="orderDetails-loading">
          <div className="orderDetails-loadingSpinner" />

          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  /*
    ==========================================================
    ERROR STATE
    ==========================================================
  */

  if (error || !order) {
    return (
      <div className="orderDetails">
        <div className="orderDetails-errorPage">
          <div className="orderDetails-errorIcon">
            <FaExclamationTriangle />
          </div>

          <strong>Unable to Load Order</strong>

          <span>{error || "The requested order could not be found."}</span>

          <div className="orderDetails-errorActions">
            <button
              type="button"
              onClick={handleBack}
              className="orderDetails-secondaryButton"
            >
              <FaArrowLeft />

              <span>Go Back</span>
            </button>

            <button
              type="button"
              onClick={() =>
                fetchEverything({
                  showLoading: true,
                  showRefreshing: false,
                })
              }
              className="orderDetails-primaryButton"
            >
              <FaRedo />

              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
    ==========================================================
    RENDER
    ==========================================================
  */

  return (
    <div className="orderDetails">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="orderDetails-pageHeader">
        <button
          type="button"
          className="orderDetails-backButton"
          onClick={handleBack}
        >
          <FaArrowLeft />

          <span>Back to Courier Orders</span>
        </button>

        <button
          type="button"
          className="orderDetails-refreshButton"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaRedo
            className={
              refreshing
                ? "orderDetails-refreshIcon spinning"
                : "orderDetails-refreshIcon"
            }
          />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ==================================================
          ORDER HERO
      ================================================== */}

      <section className="orderDetails-hero">
        <div className="orderDetails-heroLeft">
          <div className="orderDetails-orderIcon">
            <FaBox />
          </div>

          <div className="orderDetails-heroIdentity">
            <span className="orderDetails-eyebrow">Order</span>

            <h1>#{orderIdShort}</h1>

            <div className="orderDetails-heroMeta">
              <span>
                <FaCalendarAlt />

                {formatDate(order.createdAt)}
              </span>

              <span>
                <FaMotorcycle />

                {transportation}
              </span>

              {order.tripType && (
                <span>
                  <FaRoute />

                  {formatStatus(order.tripType)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`orderDetails-status orderDetails-status-${currentStatus.toLowerCase()}`}
        >
          <span className="orderDetails-statusDot" />

          {formattedCurrentStatus}
        </div>
      </section>

      {/* ==================================================
          CANCELLED / DISPUTED NOTICE
      ================================================== */}

      {(currentStatus === "CANCELLED" || currentStatus === "DISPUTED") && (
        <section className="orderDetails-alert">
          <div className="orderDetails-alertIcon">
            <FaExclamationTriangle />
          </div>

          <div>
            <strong>
              {currentStatus === "DISPUTED"
                ? "Order Disputed"
                : "Order Cancelled"}
            </strong>

            <span>
              {currentStatus === "DISPUTED"
                ? "This order is currently marked as disputed and requires administrative attention."
                : "This order has been cancelled."}
            </span>
          </div>
        </section>
      )}

      {/* ==================================================
          ROUTE
      ================================================== */}

      <section className="orderDetails-card orderDetails-routeCard">
        <div className="orderDetails-sectionHeader">
          <div>
            <span className="orderDetails-sectionEyebrow">Delivery Route</span>

            <h2>Pickup to Destination</h2>
          </div>

          {order.distance && (
            <div className="orderDetails-distance">
              <FaRoute />

              <span>{formatDistance(order.distance)}</span>
            </div>
          )}
        </div>

        <div className="orderDetails-route">
          {/* PICKUP */}

          <div className="orderDetails-routePoint">
            <div className="orderDetails-routeIcon orderDetails-pickupIcon">
              <FaMapMarkerAlt />
            </div>

            <div className="orderDetails-routeContent">
              <span>Pickup</span>

              <strong>
                {order.originAddress || "Pickup address unavailable"}
              </strong>

              {order.originState && <small>{order.originState}</small>}
            </div>
          </div>

          <div className="orderDetails-routeLine">
            <span />
          </div>

          {/* DESTINATION */}

          <div className="orderDetails-routePoint">
            <div className="orderDetails-routeIcon orderDetails-destinationIcon">
              <FaMapMarkerAlt />
            </div>

            <div className="orderDetails-routeContent">
              <span>Destination</span>

              <strong>
                {order.destinationAddress || "Destination address unavailable"}
              </strong>

              {order.destinationState && (
                <small>{order.destinationState}</small>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          MAIN GRID
      ================================================== */}

      <div className="orderDetails-mainGrid">
        {/* ==================================================
            ORDER INFORMATION
        ================================================== */}

        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Order</span>

              <h2>Order Information</h2>
            </div>
          </div>

          <div className="orderDetails-infoGrid">
            <div className="orderDetails-infoItem">
              <span>Transportation</span>
              <strong>{order.transportationType || "—"}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Vehicle Class</span>
              <strong>{order.vehicleClass || "—"}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Trip Type</span>
              <strong>
                {order.tripType ? formatStatus(order.tripType) : "—"}
              </strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Distance</span>
              <strong>{formatDistance(order.distance)}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Weight Bracket</span>
              <strong>{order.declaredWeightBracket || "—"}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Inter-State</span>
              <strong>{order.isInterState ? "Yes" : "No"}</strong>
            </div>

            <div className="orderDetails-infoItem orderDetails-infoItem-full">
              <span>Order Details</span>

              <strong className="orderDetails-infoDescription">
                {order.orderDetails || "No additional order details provided."}
              </strong>
            </div>
          </div>
        </section>

        {/* ==================================================
            RECIPIENT
        ================================================== */}

        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Recipient</span>

              <h2>Recipient Information</h2>
            </div>
          </div>

          <div className="orderDetails-person">
            <div className="orderDetails-personIcon">
              <FaUser />
            </div>

            <div className="orderDetails-personMain">
              <strong>{order.recipientName || "Recipient not provided"}</strong>

              <span>
                {order.recipientNumber || "Primary number unavailable"}
              </span>

              {order.recipientNumber2 && <span>{order.recipientNumber2}</span>}
            </div>
          </div>
        </section>

        {/* ==================================================
            CUSTOMER
        ================================================== */}

        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Customer</span>

              <h2>Customer Information</h2>
            </div>
          </div>

          <div className="orderDetails-person">
            <div className="orderDetails-personIcon">
              <FaUser />
            </div>

            <div className="orderDetails-personMain">
              <strong>{customerName}</strong>

              {user?.phoneNumber && (
                <span>
                  <FaPhone />

                  {user.phoneNumber}
                </span>
              )}

              {user?.email && <span>{user.email}</span>}
            </div>
          </div>
        </section>

        {/* ==================================================
            COURIER
        ================================================== */}

        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Assignment</span>

              <h2>Assigned Courier</h2>
            </div>
          </div>

          {courier ? (
            <div className="orderDetails-person">
              <div className="orderDetails-personIcon">
                <FaMotorcycle />
              </div>

              <div className="orderDetails-personMain">
                <strong>{courierName}</strong>

                <span>
                  {courier.transportationType || "Courier"}
                  {courier.vehicleClass ? ` · ${courier.vehicleClass}` : ""}
                </span>

                {courier.phoneNumber && (
                  <span>
                    <FaPhone />

                    {courier.phoneNumber}
                  </span>
                )}

                {courier.plateNumber && (
                  <span>Plate: {courier.plateNumber}</span>
                )}
              </div>

              <button
                type="button"
                className="orderDetails-smallAction"
                onClick={() =>
                  navigate(`/admin/courier_full_profile/${courier.id}`)
                }
              >
                View
                <FaChevronRight />
              </button>
            </div>
          ) : (
            <div className="orderDetails-notAvailable">
              <span>No courier is currently assigned.</span>
            </div>
          )}
        </section>
      </div>

      {/* ==================================================
          PRICING + PAYMENT
      ================================================== */}

      <div className="orderDetails-twoColumnGrid">
        {/* ==================================================
            PRICING
        ================================================== */}

        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Financials</span>

              <h2>Pricing Breakdown</h2>
            </div>

            <FaMoneyBillWave />
          </div>

          <div className="orderDetails-pricingList">
            {pricingRows.map((row) => (
              <div
                key={row.label}
                className={`orderDetails-pricingRow ${
                  row.highlight ? "highlight" : ""
                }`}
              >
                <span>{row.label}</span>

                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* ==================================================
            PAYMENT / FUNDS
        ================================================== */}

        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Payment</span>

              <h2>Payment & Funds</h2>
            </div>

            <FaWallet />
          </div>

          <div className="orderDetails-statusList">
            <div className="orderDetails-statusRow">
              <span>Payment Status</span>

              <strong
                className={`orderDetails-inlineStatus ${getStatusClass(
                  order.paymentStatus,
                )}`}
              >
                {formatStatus(order.paymentStatus)}
              </strong>
            </div>

            <div className="orderDetails-statusRow">
              <span>Funds Status</span>

              <strong
                className={`orderDetails-inlineStatus ${getStatusClass(
                  order.fundsStatus,
                )}`}
              >
                {formatStatus(order.fundsStatus)}
              </strong>
            </div>

            <div className="orderDetails-statusRow">
              <span>Payout Status</span>

              <strong
                className={`orderDetails-inlineStatus ${getStatusClass(
                  order.payoutStatus,
                )}`}
              >
                {formatStatus(order.payoutStatus)}
              </strong>
            </div>

            <div className="orderDetails-statusRow">
              <span>Earnings Allocation</span>

              <strong
                className={`orderDetails-inlineStatus ${getStatusClass(
                  order.earningsAllocationStatus,
                )}`}
              >
                {formatStatus(order.earningsAllocationStatus)}
              </strong>
            </div>

            <div className="orderDetails-statusRow">
              <span>Release Blocked</span>

              <strong
                className={`orderDetails-inlineStatus ${
                  order.fundsReleaseBlocked ? "danger" : "success"
                }`}
              >
                {order.fundsReleaseBlocked ? "Yes" : "No"}
              </strong>
            </div>

            {order.fundsHoldReason && (
              <div className="orderDetails-statusRow orderDetails-statusRow-column">
                <span>Hold Reason</span>

                <strong>{order.fundsHoldReason}</strong>
              </div>
            )}

            {order.paymentReference && (
              <div className="orderDetails-reference">
                <span>Payment Reference</span>

                <strong>{order.paymentReference}</strong>
              </div>
            )}
          </div>

          {latestPayment && (
            <div className="orderDetails-paymentRecord">
              <div>
                <span>Latest Payment</span>

                <strong>{formatCurrency(latestPayment.amount)}</strong>
              </div>

              <div>
                <span>Method</span>

                <strong>{latestPayment.paymentMethod || "—"}</strong>
              </div>

              <div>
                <span>Provider</span>

                <strong>{latestPayment.provider || "—"}</strong>
              </div>

              <div>
                <span>Reference</span>

                <strong>{latestPayment.reference || "—"}</strong>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ==================================================
          TIMELINE
      ================================================== */}

      <section className="orderDetails-card">
        <div className="orderDetails-sectionHeader">
          <div>
            <span className="orderDetails-sectionEyebrow">Order Lifecycle</span>

            <h2>Delivery Timeline</h2>
          </div>

          <FaClock />
        </div>

        <div className="orderDetails-timeline">
          {timeline.map((item, index) => (
            <div
              key={item.key}
              className={`orderDetails-timelineItem ${item.state}`}
            >
              <div className="orderDetails-timelineMarker">
                {item.state === "completed" ? (
                  <FaCheckCircle />
                ) : item.state === "current" ? (
                  <span />
                ) : (
                  <span />
                )}
              </div>

              <div className="orderDetails-timelineContent">
                <strong>{item.label}</strong>

                <span>
                  {item.timestamp
                    ? formatDateTime(item.timestamp)
                    : item.state === "current"
                      ? "Current status"
                      : "Not reached"}
                </span>
              </div>

              {index < timeline.length - 1 && (
                <div className="orderDetails-timelineConnector" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================
          OPERATIONAL TIMESTAMPS
      ================================================== */}

      <section className="orderDetails-card">
        <div className="orderDetails-sectionHeader">
          <div>
            <span className="orderDetails-sectionEyebrow">Operations</span>

            <h2>Recorded Events</h2>
          </div>
        </div>

        <div className="orderDetails-eventsGrid">
          <div className="orderDetails-eventItem">
            <span>Accepted</span>
            <strong>{formatDateTime(order.acceptedAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Arrived Pickup</span>
            <strong>{formatDateTime(order.arrivedPickupAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Loading Started</span>
            <strong>{formatDateTime(order.loadingStartedAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Trip Started</span>
            <strong>{formatDateTime(order.tripStartedAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Arrived Dropoff</span>
            <strong>{formatDateTime(order.arrivedDropoffAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Unloading Completed</span>
            <strong>{formatDateTime(order.unloadingCompletedAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Pickup Funds Released</span>
            <strong>{formatDateTime(order.pickupFundsReleasedAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Funds Released</span>
            <strong>{formatDateTime(order.fundsReleasedAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Earnings Allocated</span>
            <strong>{formatDateTime(order.earningsAllocatedAt)}</strong>
          </div>

          <div className="orderDetails-eventItem">
            <span>Funds Held At</span>
            <strong>{formatDateTime(order.fundsHeldAt)}</strong>
          </div>
        </div>
      </section>

      {/* ==================================================
          LOADING / UNLOADING
      ================================================== */}

      <div className="orderDetails-twoColumnGrid">
        {/* PICKUP */}

        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Pickup</span>

              <h2>Loading Details</h2>
            </div>

            <FaBox />
          </div>

          <div className="orderDetails-detailList">
            <div>
              <span>Responsibility</span>

              <strong>{order.pickupLoadingResponsibility || "—"}</strong>
            </div>

            <div>
              <span>Floor Level</span>

              <strong>{order.pickupFloorLevel || "—"}</strong>
            </div>

            <div>
              <span>Floor Level Fee</span>

              <strong>{formatCurrency(order.pickupFloorLevelPrice)}</strong>
            </div>

            <div>
              <span>Elevator</span>

              <strong>
                {order.pickupHasElevator ? "Available" : "Not available"}
              </strong>
            </div>

            <div>
              <span>Loading Fee</span>

              <strong>{formatCurrency(order.loadingFee)}</strong>
            </div>
          </div>
        </section>

        {/* DROPOFF */}

        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Dropoff</span>

              <h2>Unloading Details</h2>
            </div>

            <FaTruck />
          </div>

          <div className="orderDetails-detailList">
            <div>
              <span>Responsibility</span>

              <strong>{order.dropoffUnloadingResponsibility || "—"}</strong>
            </div>

            <div>
              <span>Floor Level</span>

              <strong>{order.dropoffFloorLevel || "—"}</strong>
            </div>

            <div>
              <span>Floor Level Fee</span>

              <strong>{formatCurrency(order.dropoffFloorLevelPrice)}</strong>
            </div>

            <div>
              <span>Elevator</span>

              <strong>
                {order.dropoffHasElevator ? "Available" : "Not available"}
              </strong>
            </div>

            <div>
              <span>Unloading Fee</span>

              <strong>{formatCurrency(order.unloadingFee)}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* ==================================================
          CUSTODY EVIDENCE
      ================================================== */}

      <section className="orderDetails-card">
        <div className="orderDetails-sectionHeader">
          <div>
            <span className="orderDetails-sectionEyebrow">Custody</span>

            <h2>Evidence & Media</h2>
          </div>

          <FaShieldAlt />
        </div>

        <div className="orderDetails-evidenceGrid">
          {evidenceGroups.map((group) => {
            const photos = Array.isArray(group.photos) ? group.photos : [];

            const hasVideo = Boolean(group.video);

            const hasMedia = photos.length > 0 || hasVideo;

            return (
              <div key={group.key} className="orderDetails-evidenceGroup">
                <div className="orderDetails-evidenceHeader">
                  <div>
                    <strong>{group.title}</strong>

                    <span>{group.description}</span>
                  </div>

                  {group.uploadStatus && (
                    <span
                      className={`orderDetails-uploadStatus ${getStatusClass(
                        group.uploadStatus,
                      )}`}
                    >
                      {formatStatus(group.uploadStatus)}
                    </span>
                  )}
                </div>

                {group.recordedAt && (
                  <div className="orderDetails-recordedAt">
                    <FaClock />

                    <span>Recorded {formatDateTime(group.recordedAt)}</span>
                  </div>
                )}

                {!hasMedia ? (
                  <div className="orderDetails-noEvidence">
                    <FaPaperclip />

                    <span>No evidence uploaded.</span>
                  </div>
                ) : (
                  <div className="orderDetails-mediaGrid">
                    {photos.map((path, index) => {
                      const url = mediaUrls[path];

                      return (
                        <button
                          type="button"
                          key={`${path}-${index}`}
                          className="orderDetails-mediaItem"
                          onClick={() => handleOpenMedia(path)}
                          disabled={!url}
                        >
                          {url ? (
                            <img
                              src={url}
                              alt={`${group.title} ${index + 1}`}
                            />
                          ) : (
                            <div className="orderDetails-mediaLoading">
                              <FaClock />
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {hasVideo && (
                      <button
                        type="button"
                        className="orderDetails-videoItem"
                        onClick={() => handleOpenMedia(group.video)}
                        disabled={!mediaUrls[group.video]}
                      >
                        <FaVideo />

                        <span>View Video</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================================================
          INTERSTATE LOGISTICS
      ================================================== */}

      {(order.isInterState ||
        order.logisticsCompanyId ||
        order.waybillNumber ||
        order.logisticsTrackingCode) && (
        <section className="orderDetails-card">
          <div className="orderDetails-sectionHeader">
            <div>
              <span className="orderDetails-sectionEyebrow">Interstate</span>

              <h2>Logistics Handover</h2>
            </div>

            <FaTruck />
          </div>

          <div className="orderDetails-infoGrid">
            <div className="orderDetails-infoItem">
              <span>Logistics Company ID</span>

              <strong>{order.logisticsCompanyId || "—"}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Waybill Number</span>

              <strong>{order.waybillNumber || "—"}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Tracking Code</span>

              <strong>{order.logisticsTrackingCode || "—"}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Tracking Status</span>

              <strong>{order.logisticsTrackingStatus || "—"}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Handed Over</span>

              <strong>{formatDateTime(order.handedOverToLogisticsAt)}</strong>
            </div>

            <div className="orderDetails-infoItem">
              <span>Intake Confirmed</span>

              <strong>
                {formatDateTime(order.logisticsIntakeConfirmedAt)}
              </strong>
            </div>
          </div>

          {order.waybillPhoto && (
            <div className="orderDetails-waybill">
              <div className="orderDetails-waybillIcon">
                <FaFileAlt />
              </div>

              <div>
                <strong>Waybill Document</strong>

                <span>Waybill photo is attached to this order.</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenMedia(order.waybillPhoto)}
                disabled={!mediaUrls[order.waybillPhoto]}
                className="orderDetails-smallAction"
              >
                View
                <FaChevronRight />
              </button>
            </div>
          )}
        </section>
      )}

      {/* ==================================================
          VERIFICATION
      ================================================== */}

      <section className="orderDetails-card">
        <div className="orderDetails-sectionHeader">
          <div>
            <span className="orderDetails-sectionEyebrow">Verification</span>

            <h2>Delivery Verification</h2>
          </div>

          <FaShieldAlt />
        </div>

        <div className="orderDetails-verification">
          <div className="orderDetails-verificationIcon">
            <FaFlag />
          </div>

          <div className="orderDetails-verificationContent">
            <span>Delivery Verification Code</span>

            <strong>{order.deliveryVerificationCode || "Not generated"}</strong>
          </div>
        </div>

        <div className="orderDetails-verificationMeta">
          <div>
            <span>Accepted Offer</span>

            <strong>{order.acceptedOfferID || "No offer recorded"}</strong>
          </div>

          <div>
            <span>Assignment Attempts</span>

            <strong>{order.assignmentAttempts ?? 0}</strong>
          </div>

          <div>
            <span>Assignment Expires</span>

            <strong>{formatDateTime(order.assignmentExpiresAt)}</strong>
          </div>
        </div>
      </section>

      {/* ==================================================
          INTERNAL FUND RELEASE
      ================================================== */}

      <section className="orderDetails-card">
        <div className="orderDetails-sectionHeader">
          <div>
            <span className="orderDetails-sectionEyebrow">Funds</span>

            <h2>Funds Release Information</h2>
          </div>

          <FaMoneyBillWave />
        </div>

        <div className="orderDetails-fundsGrid">
          <div className="orderDetails-fundHighlight">
            <span>Released Amount</span>

            <strong>{formatCurrency(order.fundsReleasedAmount)}</strong>
          </div>

          <div className="orderDetails-infoItem">
            <span>Release Type</span>

            <strong>{order.fundsReleaseType || "—"}</strong>
          </div>

          <div className="orderDetails-infoItem">
            <span>Funds Held By</span>

            <strong>{order.fundsHeldBy || "—"}</strong>
          </div>

          <div className="orderDetails-infoItem">
            <span>Funds Held At</span>

            <strong>{formatDateTime(order.fundsHeldAt)}</strong>
          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <div className="orderDetails-footer">
        <button
          type="button"
          className="orderDetails-secondaryButton"
          onClick={handleBack}
        >
          <FaArrowLeft />

          <span>Back to Courier Orders</span>
        </button>

        {order.assignedCourierId && (
          <button
            type="button"
            className="orderDetails-primaryButton"
            onClick={() =>
              navigate(
                `/admin/courier_live_tracking/${order.assignedCourierId}`,
              )
            }
          >
            <FaRoute />

            <span>Track Courier</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderDetails;
