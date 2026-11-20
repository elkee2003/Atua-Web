import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";

import {
  Order,
  User,
  Courier,
  Offer,
} from "../../../../../../../../src/models";

import { calculateMaxiFinancials } from "../../../../../../../../modules/freightPricingEngine";

import "./OrderDetails.css";

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_ACTIVE_BATCH_ORDERS = 10;

const STATUS_LABELS = {
  BIDDING: "Bidding",
  AWAITING_PAYMENT: "Awaiting payment",
  READY_FOR_PICKUP: "Ready for pickup",
  ACCEPTED: "Accepted",
  ARRIVED_PICKUP: "Arrived at pickup",
  LOADING: "Loading",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  ARRIVED_DROPOFF: "Arrived at drop-off",
  UNLOADING: "Unloading",
  DELIVERED: "Delivered",
  HANDOVER_TO_LOGISTICS: "Handed over to logistics",
  IN_LOGISTICS_TRANSIT: "In logistics transit",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

// ============================================================
// GENERAL HELPERS
// ============================================================

const formatValue = (value, fallback = "Not available") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
};

const formatDate = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatLabel = (value) => {
  if (!value) return "Not available";

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getStatusLabel = (status) => {
  if (!status) return "Unknown";

  return STATUS_LABELS[status] || formatLabel(status);
};

const getPaymentArrangement = (order) => {
  if (!order) return "Not specified";

  const responsibility = String(
    order.paymentResponsibility || "",
  ).toUpperCase();

  const timing = String(order.paymentTiming || "").toUpperCase();

  // Receiver pays when the delivery arrives.
  if (responsibility === "RECEIVER" && timing === "ON_DELIVERY") {
    return "Receiver pays on delivery";
  }

  // Sender pays when the courier arrives for pickup.
  if (responsibility === "SENDER" && timing === "AT_PICKUP") {
    return "Sender pays at pickup";
  }

  // Sender pays before the courier picks up the order.
  if (
    responsibility === "SENDER" &&
    ["BEFORE_PICKUP", "BEFORE_PICK_UP"].includes(timing)
  ) {
    return "Sender pays before pickup";
  }

  return (
    `${formatLabel(responsibility)} · ${formatLabel(timing)}`.replace(
      /^ · | · $/g,
      "",
    ) || "Not specified"
  );
};

const getStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "DELIVERED") return "success";

  if (normalized === "CANCELLED" || normalized === "DISPUTED") {
    return "danger";
  }

  if (normalized === "BIDDING" || normalized === "AWAITING_PAYMENT") {
    return "warning";
  }

  if (
    normalized === "IN_TRANSIT" ||
    normalized === "PICKED_UP" ||
    normalized === "ARRIVED_PICKUP" ||
    normalized === "ARRIVED_DROPOFF" ||
    normalized === "LOADING" ||
    normalized === "UNLOADING" ||
    normalized === "HANDOVER_TO_LOGISTICS" ||
    normalized === "IN_LOGISTICS_TRANSIT"
  ) {
    return "info";
  }

  return "neutral";
};

const getDisplayName = (record) => {
  if (!record) return "Not assigned";

  const firstName = record.firstName || "";
  const lastName = record.lastName || "";

  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || record.name || "Name unavailable";
};

const getInitials = (record) => {
  if (!record) return "CO";

  const first = record.firstName?.charAt(0) || "";
  const last = record.lastName?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "CO";
};

const getTransportationCategory = (transportationType) => {
  if (!transportationType) return null;

  if (transportationType.startsWith("MICRO")) return "MICRO";
  if (transportationType.startsWith("MOTO")) return "MOTO";
  if (transportationType === "MAXI") return "MAXI";

  return null;
};

// ============================================================
// PAYMENT AND ORDER ELIGIBILITY
// ============================================================

const isAwaitingPaymentEligible = (order) => {
  if (order?.status !== "AWAITING_PAYMENT") {
    return false;
  }

  const receiverPayOnDelivery =
    order.paymentResponsibility === "RECEIVER" &&
    order.paymentTiming === "ON_DELIVERY";

  const senderPayAtPickup =
    order.paymentResponsibility === "SENDER" &&
    order.paymentTiming === "AT_PICKUP";

  return receiverPayOnDelivery || senderPayAtPickup;
};

const isOrderEligibleForAssignment = (order) => {
  if (!order) return false;

  if (order.assignedCourierId) return false;

  if (order.orderEnvironment !== "PRODUCTION") {
    return false;
  }

  const transportationType = order.transportationType;

  const isMicroOrMoto = [
    "MICRO_EXPRESS",
    "MICRO_BATCH",
    "MOTO_EXPRESS",
    "MOTO_BATCH",
  ].includes(transportationType);

  const isMaxi = transportationType === "MAXI";

  if (!isMicroOrMoto && !isMaxi) {
    return false;
  }

  if (isMaxi) {
    return order.status === "BIDDING" || isAwaitingPaymentEligible(order);
  }

  // READY_FOR_PICKUP is eligible regardless of payment status.
  if (order.status === "READY_FOR_PICKUP") {
    return true;
  }

  return isAwaitingPaymentEligible(order);
};

// ============================================================
// COURIER ELIGIBILITY
// ============================================================

const getCourierIneligibilityReason = (courier, order) => {
  if (!courier || !order) {
    return "Courier information unavailable";
  }

  if (courier.isOnline !== true) {
    return "Courier is offline";
  }

  if (courier.isApproved !== true) {
    return "Courier is not approved";
  }

  if (courier.isBlocked === true) {
    return "Courier is blocked";
  }

  if (courier.debtRestrictionActive === true) {
    return "Courier has an active debt restriction";
  }

  const orderType = order.transportationType;
  const courierType = courier.transportationType;

  // MAXI
  if (orderType === "MAXI") {
    if (courierType !== "MAXI") {
      return "Wrong courier category";
    }

    if (!order.vehicleClass || courier.vehicleClass !== order.vehicleClass) {
      return "Vehicle class does not match";
    }

    if (Number(courier.currentMaxiCount || 0) > 0) {
      return "Courier already has an active Maxi delivery";
    }

    return null;
  }

  // MICRO / MOTO
  const orderCategory = getTransportationCategory(orderType);

  if (courierType !== orderCategory) {
    return "Wrong courier category";
  }

  const expressCount = Number(courier.currentExpressCount || 0);

  const batchCount = Number(courier.currentBatchCount || 0);

  const isExpress =
    orderType === "MICRO_EXPRESS" || orderType === "MOTO_EXPRESS";

  const isBatch = orderType === "MICRO_BATCH" || orderType === "MOTO_BATCH";

  if (isExpress && (expressCount > 0 || batchCount > 0)) {
    return "Courier has active deliveries";
  }

  if (isBatch && expressCount > 0) {
    return "Courier has an active Express delivery";
  }

  if (isBatch && batchCount >= MAX_ACTIVE_BATCH_ORDERS) {
    return "Courier has reached the Batch limit";
  }

  return null;
};

// ============================================================
// COUNT HELPERS
// ============================================================

const getCountField = (transportationType) => {
  if (
    transportationType === "MICRO_EXPRESS" ||
    transportationType === "MOTO_EXPRESS"
  ) {
    return "currentExpressCount";
  }

  if (
    transportationType === "MICRO_BATCH" ||
    transportationType === "MOTO_BATCH"
  ) {
    return "currentBatchCount";
  }

  if (transportationType === "MAXI") {
    return "currentMaxiCount";
  }

  return null;
};

const updateCourierCount = async ({
  courierId,
  transportationType,
  direction,
}) => {
  const countField = getCountField(transportationType);

  if (!countField) {
    throw new Error(
      "Unable to identify the courier count for this order type.",
    );
  }

  const latestCourier = await DataStore.query(Courier, courierId);

  if (!latestCourier) {
    throw new Error("The courier record could not be found.");
  }

  const currentCount = Number(latestCourier[countField] || 0);

  const nextCount =
    direction === "increase" ? currentCount + 1 : Math.max(0, currentCount - 1);

  const now = new Date().toISOString();

  return DataStore.save(
    Courier.copyOf(latestCourier, (updated) => {
      updated[countField] = nextCount;

      if (
        transportationType === "MICRO_BATCH" ||
        transportationType === "MOTO_BATCH"
      ) {
        // Keep the most recent Batch assignment timestamp.
        // Do not erase it when unassigning one Batch order.
        if (direction === "increase") {
          updated.lastBatchAssignedAt = now;
        }
      }
    }),
  );
};

// ============================================================
// RESTORE STATUS
// ============================================================

const getStatusToRestore = (order) => {
  // New assignments store the exact status before assignment.
  if (order.statusBeforeAssignment) {
    return order.statusBeforeAssignment;
  }

  // Fallback for older assignments created before this field
  // was added to the Order model.
  if (order.transportationType === "MAXI") {
    return "BIDDING";
  }

  if (order.status === "ACCEPTED") {
    if (order.paymentStatus === "PAID") {
      return "READY_FOR_PICKUP";
    }

    return "AWAITING_PAYMENT";
  }

  return order.status;
};

// ============================================================
// SMALL REUSABLE COMPONENTS
// ============================================================

const DetailField = ({ label, value, className = "" }) => (
  <div className={`order-detail-field ${className}`}>
    <span className="order-detail-field-label">{label}</span>

    <span className="order-detail-field-value">
      {value === null || value === undefined || value === ""
        ? "Not available"
        : value}
    </span>
  </div>
);

const SectionCard = ({
  title,
  description,
  action,
  children,
  className = "",
}) => (
  <section className={`order-details-card ${className}`}>
    <div className="order-details-card-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {action && <div className="order-details-card-action">{action}</div>}
    </div>

    <div className="order-details-card-body">{children}</div>
  </section>
);

const TimelineItem = ({
  title,
  timestamp,
  description,
  state = "recorded",
  last = false,
}) => (
  <div
    className={`order-timeline-item ${last ? "order-timeline-item-last" : ""}`}
  >
    <div className="order-timeline-marker-column">
      <span className={`order-timeline-marker ${state}`}>
        {state === "recorded" ? "✓" : ""}
      </span>

      {!last && <span className="order-timeline-line" />}
    </div>

    <div className="order-timeline-content">
      <div className="order-timeline-title-row">
        <h3>{title}</h3>

        <span className="order-timeline-date">{formatDate(timestamp)}</span>
      </div>

      {description && <p>{description}</p>}
    </div>
  </div>
);

// ============================================================
// MAIN PAGE
// ============================================================

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [courier, setCourier] = useState(null);

  const [couriers, setCouriers] = useState([]);
  const [offers, setOffers] = useState([]);

  const [courierSearch, setCourierSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCouriers, setLoadingCouriers] = useState(false);

  const [assigningCourierId, setAssigningCourierId] = useState("");

  const [unassigning, setUnassigning] = useState(false);

  const [assignmentError, setAssignmentError] = useState("");

  const [assignmentSuccess, setAssignmentSuccess] = useState("");

  const [error, setError] = useState("");

  const [showUnavailableCouriers, setShowUnavailableCouriers] = useState(false);

  // ==========================================================
  // LOAD ORDER DETAILS
  // ==========================================================

  const loadOrderDetails = useCallback(
    async (isRefresh = false) => {
      if (!id) {
        setError("No order ID was provided.");
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const foundOrder = await DataStore.query(Order, id);

        if (!foundOrder) {
          setOrder(null);
          setCustomer(null);
          setCourier(null);

          setError("This order could not be found.");
          return;
        }

        setOrder(foundOrder);

        const customerRequest = foundOrder.userID
          ? DataStore.query(User, foundOrder.userID).catch(() => null)
          : Promise.resolve(null);

        const courierId =
          foundOrder.assignedCourierId || foundOrder.courierID || null;

        const courierRequest = courierId
          ? DataStore.query(Courier, courierId).catch(() => null)
          : Promise.resolve(null);

        const [foundCustomer, foundCourier] = await Promise.all([
          customerRequest,
          courierRequest,
        ]);

        setCustomer(foundCustomer);
        setCourier(foundCourier);
      } catch (err) {
        console.error("Failed to load order details:", err);

        setError("Unable to load this order. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  // ==========================================================
  // LOAD COURIERS
  // ==========================================================

  const loadCouriers = useCallback(async () => {
    try {
      setLoadingCouriers(true);

      const result = await DataStore.query(Courier);

      setCouriers(result || []);
    } catch (err) {
      console.error("Failed to load couriers:", err);

      setAssignmentError(
        "Unable to load couriers. Please refresh and try again.",
      );
    } finally {
      setLoadingCouriers(false);
    }
  }, []);

  // ==========================================================
  // LOAD OFFERS
  // ==========================================================

  const loadOffers = useCallback(async () => {
    if (!id) return;

    try {
      const result = await DataStore.query(Offer, (item) =>
        item.orderID.eq(id),
      );

      setOffers(result || []);
    } catch (err) {
      console.error("Failed to load order offers:", err);
      setOffers([]);
    }
  }, [id]);

  // ==========================================================
  // INITIAL LOAD AND REAL-TIME ORDER UPDATE
  // ==========================================================

  useEffect(() => {
    loadOrderDetails();
    loadCouriers();
    loadOffers();

    let subscription;

    if (id) {
      subscription = DataStore.observe(Order, id).subscribe({
        next: () => {
          loadOrderDetails(true);
        },

        error: (err) => {
          console.error("Order subscription error:", err);
        },
      });
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [id, loadOrderDetails, loadCouriers, loadOffers]);

  // ==========================================================
  // DERIVED ORDER INFORMATION
  // ==========================================================

  const latestOffer = useMemo(() => {
    return [...offers].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    )[0];
  }, [offers]);

  const latestUserOffer = useMemo(() => {
    return [...offers]
      .filter((item) => item.senderType === "USER")
      .sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      )[0];
  }, [offers]);

  const orderCanBeAssigned = isOrderEligibleForAssignment(order);

  const maxiOfferReady =
    order?.transportationType !== "MAXI" ||
    (latestOffer &&
      latestOffer.senderType === "USER" &&
      Number(latestOffer.amount) > 0);

  // ==========================================================
  // COURIER LIST
  // ==========================================================

  const courierOptions = useMemo(() => {
    if (!order) return [];

    const search = courierSearch.trim().toLowerCase();

    return couriers
      .map((item) => {
        const reason = getCourierIneligibilityReason(item, order);

        return {
          ...item,
          eligible: !reason,
          ineligibilityReason: reason,
        };
      })
      .filter((item) => {
        if (!showUnavailableCouriers && !item.eligible) {
          return false;
        }

        if (!search) return true;

        const name = getDisplayName(item).toLowerCase();

        const phone = String(item.phoneNumber || "").toLowerCase();

        const courierId = String(item.id || "").toLowerCase();

        return (
          name.includes(search) ||
          phone.includes(search) ||
          courierId.includes(search)
        );
      })
      .sort((a, b) => {
        if (a.eligible !== b.eligible) {
          return a.eligible ? -1 : 1;
        }

        return getDisplayName(a).localeCompare(getDisplayName(b));
      });
  }, [couriers, order, courierSearch, showUnavailableCouriers]);

  const eligibleCourierCount = useMemo(() => {
    if (!order) return 0;

    return couriers.filter(
      (item) => !getCourierIneligibilityReason(item, order),
    ).length;
  }, [couriers, order]);

  // ==========================================================
  // TIMELINE
  // ==========================================================

  const timeline = useMemo(() => {
    if (!order) return [];

    const milestones = [
      {
        title: "Order created",
        timestamp: order.createdAt,
        description: "The order was created in Atua.",
      },
      {
        title: "Courier assigned",
        timestamp: order.courierAssignedAt,
        description: courier
          ? `Assigned to ${getDisplayName(courier)}.`
          : "A courier assignment was recorded.",
      },
      {
        title: "Accepted",
        timestamp: order.acceptedAt,
        description: "The order was accepted.",
      },
      {
        title: "Arrived at pickup",
        timestamp: order.arrivedPickupAt,
        description: "The pickup location was reached.",
      },
      {
        title: "Picked up",
        timestamp: order.pickedUpAt,
        description: "The delivery was picked up.",
      },
      {
        title: "In transit",
        timestamp: order.inTransitAt,
        description: "The delivery was marked in transit.",
      },
      {
        title: "Arrived at destination",
        timestamp: order.arrivedDropoffAt,
        description: "The destination was reached.",
      },
      {
        title: "Delivered",
        timestamp: order.deliveredAt,
        description: "The order was delivered.",
      },
      {
        title: "Cancelled",
        timestamp: order.cancelledAt,
        description: order.cancellationReason
          ? `Reason: ${order.cancellationReason}`
          : "The order was cancelled.",
      },
    ];

    return milestones
      .filter((item) => Boolean(item.timestamp))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
  }, [order, courier]);

  // ==========================================================
  // ASSIGN COURIER
  // ==========================================================

  const handleAssignCourier = async (selectedCourier) => {
    if (!order?.id || !selectedCourier?.id) return;

    if (assigningCourierId || unassigning) return;

    setAssignmentError("");
    setAssignmentSuccess("");
    setAssigningCourierId(selectedCourier.id);

    let courierCountUpdated = false;
    let assignedOrderSaved = false;

    const transportationType = order.transportationType;

    try {
      // Re-fetch order before making changes.
      const latestOrder = await DataStore.query(Order, order.id);

      if (!latestOrder) {
        throw new Error("This order no longer exists.");
      }

      if (latestOrder.assignedCourierId) {
        throw new Error("This order has already been assigned to a courier.");
      }

      if (!isOrderEligibleForAssignment(latestOrder)) {
        throw new Error("This order is no longer eligible for assignment.");
      }

      // Re-fetch selected courier.
      const freshCourier = await DataStore.query(Courier, selectedCourier.id);

      if (!freshCourier) {
        throw new Error("The selected courier could not be found.");
      }

      const ineligibilityReason = getCourierIneligibilityReason(
        freshCourier,
        latestOrder,
      );

      if (ineligibilityReason) {
        throw new Error(ineligibilityReason);
      }

      // MAXI: get the latest offer from the customer.
      let acceptedOffer = null;
      let maxiFinancials = null;

      if (latestOrder.transportationType === "MAXI") {
        const freshOffers = await DataStore.query(Offer, (item) =>
          item.orderID.eq(latestOrder.id),
        );

        const latest = [...freshOffers].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        )[0];

        if (!latest || latest.senderType !== "USER") {
          throw new Error(
            "The latest Maxi offer must be from the customer before assignment.",
          );
        }

        if (!Number(latest.amount) || Number(latest.amount) <= 0) {
          throw new Error("The customer's latest offer is invalid.");
        }

        acceptedOffer = latest;

        // Actual helper signature:
        // calculateMaxiFinancials(vehicleClass, agreedAmount)
        maxiFinancials = calculateMaxiFinancials(
          latestOrder.vehicleClass,
          latest.amount,
        );

        if (!maxiFinancials) {
          throw new Error("Unable to calculate the Maxi financial breakdown.");
        }
      }

      const now = new Date().toISOString();

      // Increase courier count first.
      await updateCourierCount({
        courierId: freshCourier.id,
        transportationType,
        direction: "increase",
      });

      courierCountUpdated = true;

      // Save original status so unassignment can restore it.
      await DataStore.save(
        Order.copyOf(latestOrder, (updated) => {
          updated.statusBeforeAssignment = latestOrder.status;

          updated.status = "ACCEPTED";
          updated.acceptedAt = now;

          updated.assignedCourierId = freshCourier.id;
          updated.courierAssignedAt = now;

          updated.assignmentStatus = "ACCEPTED";
          updated.hasNewOffer = false;

          if (transportationType === "MAXI" && maxiFinancials) {
            updated.operationalFare = maxiFinancials.operationalFare;

            updated.commissionAmount = maxiFinancials.commissionAmount;

            updated.platformFee = maxiFinancials.platformFee;

            updated.platformServiceRevenue =
              maxiFinancials.platformServiceRevenue;

            updated.vatAmount = maxiFinancials.vatAmount;

            updated.platformNetRevenue = maxiFinancials.platformNetRevenue;

            updated.courierEarnings = maxiFinancials.courierEarnings;

            updated.totalPrice = maxiFinancials.customerPrice;

            updated.acceptedOfferID = acceptedOffer.id;
          }
        }),
      );

      assignedOrderSaved = true;

      // Keep the Maxi offer acceptance behaviour.
      if (acceptedOffer) {
        await DataStore.save(
          Offer.copyOf(acceptedOffer, (updated) => {
            updated.status = "ACCEPTED";
          }),
        );
      }

      setAssignmentSuccess(
        `${getDisplayName(freshCourier)} has been assigned successfully.`,
      );

      await Promise.all([loadOrderDetails(true), loadCouriers(), loadOffers()]);
    } catch (err) {
      console.error("Courier assignment failed:", err);

      // If the courier count increased but the order did not
      // save, reverse the count update.
      if (courierCountUpdated && !assignedOrderSaved) {
        try {
          await updateCourierCount({
            courierId: selectedCourier.id,
            transportationType,
            direction: "decrease",
          });
        } catch (rollbackError) {
          console.error("Assignment count rollback failed:", rollbackError);
        }
      }

      setAssignmentError(
        err?.message || "Unable to assign this courier. Please try again.",
      );

      await Promise.all([loadOrderDetails(true), loadCouriers()]);
    } finally {
      setAssigningCourierId("");
    }
  };

  // ==========================================================
  // UNASSIGN COURIER
  // ==========================================================

  const handleUnassignCourier = async () => {
    if (!order?.id || !order.assignedCourierId) return;

    if (unassigning || assigningCourierId) return;

    setAssignmentError("");
    setAssignmentSuccess("");

    // This page only unassigns orders that have been accepted
    // but have not progressed to pickup or delivery.
    if (order.status !== "ACCEPTED") {
      setAssignmentError(
        "This order has already progressed beyond the accepted stage. It cannot be unassigned from this page.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to unassign this courier? The courier's active delivery count will be reduced and the order will return to its previous status.",
    );

    if (!confirmed) return;

    setUnassigning(true);

    const assignedCourierId = order.assignedCourierId;
    const transportationType = order.transportationType;

    let courierCountDecreased = false;
    let orderUnassigned = false;

    try {
      // Re-fetch latest order.
      const latestOrder = await DataStore.query(Order, order.id);

      if (!latestOrder) {
        throw new Error("This order no longer exists.");
      }

      if (
        !latestOrder.assignedCourierId ||
        latestOrder.assignedCourierId !== assignedCourierId
      ) {
        throw new Error(
          "The order's courier assignment has changed. Refresh and try again.",
        );
      }

      if (latestOrder.status !== "ACCEPTED") {
        throw new Error(
          "This order has progressed beyond the accepted stage and can no longer be unassigned here.",
        );
      }

      const statusToRestore = getStatusToRestore(latestOrder);

      // Confirm the courier record exists before changing
      // the order or its assignment.
      const latestCourier = await DataStore.query(Courier, assignedCourierId);

      if (!latestCourier) {
        throw new Error(
          "The assigned courier record could not be found. The order was not changed.",
        );
      }

      // Decrease the relevant courier count.
      await updateCourierCount({
        courierId: assignedCourierId,
        transportationType,
        direction: "decrease",
      });

      courierCountDecreased = true;

      // Restore order status and clear courier assignment.
      await DataStore.save(
        Order.copyOf(latestOrder, (updated) => {
          updated.status = statusToRestore;

          updated.assignedCourierId = null;
          updated.courierAssignedAt = null;

          updated.assignmentStatus = null;
          updated.acceptedAt = null;

          updated.statusBeforeAssignment = null;

          // Clear the accepted Maxi offer reference.
          // The offer itself and all financial records remain
          // untouched.
          if (transportationType === "MAXI") {
            updated.acceptedOfferID = null;
          }
        }),
      );

      orderUnassigned = true;

      setAssignmentSuccess(
        `${getDisplayName(latestCourier)} has been unassigned. The order has returned to ${getStatusLabel(statusToRestore)}.`,
      );

      await Promise.all([loadOrderDetails(true), loadCouriers(), loadOffers()]);
    } catch (err) {
      console.error("Courier unassignment failed:", err);

      // If the count was decreased but the order update failed,
      // restore the courier count.
      if (courierCountDecreased && !orderUnassigned) {
        try {
          await updateCourierCount({
            courierId: assignedCourierId,
            transportationType,
            direction: "increase",
          });
        } catch (rollbackError) {
          console.error("Unassignment count rollback failed:", rollbackError);
        }
      }

      setAssignmentError(
        err?.message || "Unable to unassign this courier. Please try again.",
      );

      await Promise.all([loadOrderDetails(true), loadCouriers()]);
    } finally {
      setUnassigning(false);
    }
  };

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-loading">
          <span className="order-details-spinner" />

          <h2>Loading order details</h2>

          <p>Please wait while we retrieve this order.</p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-back-row">
          <button
            type="button"
            className="order-details-back-button"
            onClick={() => navigate("/admin/orders")}
          >
            <i className="bi bi-arrow-left" />
            <span>Back to orders</span>
          </button>
        </div>

        <div className="order-details-state-card">
          <div className="order-details-state-icon error">
            <i className="bi bi-exclamation-circle" />
          </div>

          <h2>Unable to display order</h2>

          <p>{error || "This order could not be found."}</p>

          <div className="order-details-state-actions">
            <button
              type="button"
              className="order-details-primary-button"
              onClick={() => loadOrderDetails()}
            >
              Try again
            </button>

            <button
              type="button"
              className="order-details-secondary-button"
              onClick={() => navigate("/admin/orders")}
            >
              Back to orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // DISPLAY DATA
  // ==========================================================

  const customerName = getDisplayName(customer);
  const courierName = getDisplayName(courier);

  const customerPhone =
    customer?.phoneNumber ||
    order.senderPhoneNumber ||
    order.senderPhone ||
    null;

  const customerEmail = customer?.email || null;

  const courierPhone = courier?.phoneNumber || courier?.phone || null;

  const paymentStatus = order.paymentStatus;
  const orderStatus = order.status;

  const paymentLabel = paymentStatus
    ? formatLabel(paymentStatus)
    : "Not recorded";

  const environment = order.orderEnvironment || "Not specified";

  const hasAssignedCourier = Boolean(order.assignedCourierId);

  const showAssignmentPanel = !hasAssignedCourier && orderCanBeAssigned;

  const canUnassign = hasAssignedCourier && order.status === "ACCEPTED";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="order-details-page">
      {/* TOP ACTIONS */}

      <div className="order-details-back-row">
        <button
          type="button"
          className="order-details-back-button"
          onClick={() => navigate("/admin/orders")}
        >
          <i className="bi bi-arrow-left" />
          <span>Back to orders</span>
        </button>

        <div className="order-details-header-actions">
          <button
            type="button"
            className="order-details-track-button"
            onClick={() => navigate(`/admin/order_livetracing/${order.id}`)}
          >
            <i className="bi bi-geo-alt" />
            <span>Live Track</span>
          </button>

          <button
            type="button"
            className="order-details-refresh-button"
            onClick={() => {
              loadOrderDetails(true);
              loadCouriers();
              loadOffers();
            }}
            disabled={refreshing || unassigning}
          >
            <i
              className={`bi ${
                refreshing ? "bi-arrow-repeat" : "bi-arrow-clockwise"
              }`}
            />

            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* PAGE HEADER */}

      <header className="order-details-header">
        <div className="order-details-heading">
          <span className="order-details-eyebrow">OPERATIONS</span>

          <h1>Order details</h1>

          <p>
            Review order information, delivery progress, and payment details.
          </p>
        </div>

        <div className="order-details-header-badges">
          <span
            className={`order-details-status-badge ${getStatusClass(
              orderStatus,
            )}`}
          >
            {getStatusLabel(orderStatus)}
          </span>

          <span
            className={`order-details-environment-badge ${
              String(environment).toUpperCase() === "TEST"
                ? "test"
                : String(environment).toUpperCase() === "PRODUCTION"
                  ? "production"
                  : "unknown"
            }`}
          >
            {environment}
          </span>
        </div>
      </header>

      {/* ORDER SUMMARY */}

      <section className="order-details-summary">
        <div className="order-details-summary-main">
          <span className="order-details-summary-label">ORDER REFERENCE</span>

          <div className="order-details-reference-row">
            <h2>{order.id}</h2>

            <button
              type="button"
              className="order-details-copy-button"
              title="Copy order ID"
              onClick={() => {
                navigator.clipboard?.writeText(order.id);
              }}
            >
              <i className="bi bi-copy" />
            </button>
          </div>

          <p>Created {formatDate(order.createdAt)}</p>
        </div>

        <div className="order-details-summary-metrics">
          <div>
            <span>Order value</span>

            <strong>{formatCurrency(order.totalPrice)}</strong>
          </div>

          <div>
            <span>Payment status</span>

            <strong
              className={`order-details-payment-text ${getStatusClass(
                paymentStatus,
              )}`}
            >
              {paymentLabel}
            </strong>
          </div>

          <div className="order-details-financial-row">
            <span>Payment arrangement</span>
            <strong>{getPaymentArrangement(order)}</strong>
          </div>

          <div>
            <span>Transportation</span>

            <strong>{formatValue(order.transportationType)}</strong>
          </div>
        </div>
      </section>

      {/* NOTIFICATIONS */}

      {assignmentSuccess && (
        <div className="order-details-notice success">
          <i className="bi bi-check-circle" />
          <p>{assignmentSuccess}</p>
        </div>
      )}

      {assignmentError && (
        <div className="order-details-notice danger">
          <i className="bi bi-exclamation-circle" />
          <p>{assignmentError}</p>
        </div>
      )}

      {/* MAIN CONTENT */}

      <div className="order-details-layout">
        <div className="order-details-main-column">
          {/* DELIVERY INFORMATION */}

          <SectionCard
            title="Delivery information"
            description="Pickup and destination details for this order."
          >
            <div className="order-details-route">
              <div className="order-details-route-point">
                <span className="order-details-route-marker pickup">
                  <i className="bi bi-circle-fill" />
                </span>

                <div className="order-details-route-content">
                  <span className="order-details-route-label">
                    PICKUP LOCATION
                  </span>

                  <h3>
                    {formatValue(order.originAddress, "Pickup unavailable")}
                  </h3>

                  <p>
                    {formatValue(order.senderName, "Sender name unavailable")}
                  </p>

                  <p>
                    {formatValue(
                      order.senderPhoneNumber || order.senderPhone,
                      "Sender phone unavailable",
                    )}
                  </p>
                </div>
              </div>

              <div className="order-details-route-connector" />

              <div className="order-details-route-point">
                <span className="order-details-route-marker destination">
                  <i className="bi bi-geo-alt-fill" />
                </span>

                <div className="order-details-route-content">
                  <span className="order-details-route-label">
                    DELIVERY DESTINATION
                  </span>

                  <h3>
                    {formatValue(
                      order.destinationAddress,
                      "Destination unavailable",
                    )}
                  </h3>

                  <p>
                    {formatValue(
                      order.recipientName,
                      "Recipient name unavailable",
                    )}
                  </p>

                  <p>
                    {formatValue(
                      order.recipientPhoneNumber || order.recipientPhone,
                      "Recipient phone unavailable",
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="order-details-divider" />

            <div className="order-details-fields-grid">
              <DetailField
                label="Transportation type"
                value={order.transportationType}
              />

              <DetailField label="Vehicle class" value={order.vehicleClass} />

              <DetailField
                label="Assignment status"
                value={order.assignmentStatus}
              />

              <DetailField
                label="Assignment attempts"
                value={order.assignmentAttempts}
              />

              <DetailField
                label="Assignment expires"
                value={formatDate(order.assignmentExpiresAt)}
              />
            </div>
          </SectionCard>

          {/* ASSIGNMENT PANEL */}

          {showAssignmentPanel && (
            <SectionCard
              title="Assign a courier"
              description="Select an eligible courier for this delivery."
              className="order-details-assignment-card"
            >
              <div className="order-assignment-intro">
                <div className="order-assignment-intro-icon">
                  <i className="bi bi-truck" />
                </div>

                <div>
                  <strong>
                    {eligibleCourierCount} eligible{" "}
                    {eligibleCourierCount === 1 ? "courier" : "couriers"}
                  </strong>

                  <p>
                    {formatLabel(order.transportationType)}
                    {order.vehicleClass
                      ? ` · ${formatLabel(order.vehicleClass)}`
                      : ""}
                  </p>
                </div>
              </div>

              {order.transportationType === "MAXI" && (
                <div
                  className={`order-maxi-offer-summary ${
                    maxiOfferReady
                      ? "order-maxi-offer-ready"
                      : "order-maxi-offer-warning"
                  }`}
                >
                  <i
                    className={`bi ${
                      maxiOfferReady
                        ? "bi-check-circle"
                        : "bi-exclamation-triangle"
                    }`}
                  />

                  <div>
                    <strong>
                      {maxiOfferReady
                        ? "Customer offer available"
                        : "Customer offer required"}
                    </strong>

                    <p>
                      {maxiOfferReady
                        ? `Latest customer offer: ${formatCurrency(
                            latestOffer.amount,
                          )}`
                        : "The latest offer must be from the customer before a Maxi courier can be assigned."}
                    </p>
                  </div>
                </div>
              )}

              <div className="order-courier-search">
                <i className="bi bi-search" />

                <input
                  type="text"
                  value={courierSearch}
                  onChange={(event) => setCourierSearch(event.target.value)}
                  placeholder="Search couriers by name, ID or phone"
                />
              </div>

              <div className="order-courier-list-header">
                <span>
                  {showUnavailableCouriers
                    ? "All couriers"
                    : "Available couriers"}
                </span>

                <button
                  type="button"
                  className="order-details-card-action"
                  onClick={() =>
                    setShowUnavailableCouriers((previous) => !previous)
                  }
                >
                  {showUnavailableCouriers
                    ? "Show eligible only"
                    : "Show unavailable"}
                </button>
              </div>

              {loadingCouriers ? (
                <div className="order-details-inline-empty">
                  <div className="order-details-inline-empty-icon">
                    <i className="bi bi-arrow-repeat" />
                  </div>

                  <div>
                    <h3>Loading couriers</h3>
                    <p>Please wait while couriers are retrieved.</p>
                  </div>
                </div>
              ) : courierOptions.length === 0 ? (
                <div className="order-details-inline-empty">
                  <div className="order-details-inline-empty-icon">
                    <i className="bi bi-people" />
                  </div>

                  <div>
                    <h3>No couriers found</h3>

                    <p>
                      {courierSearch
                        ? "Try another search term."
                        : "There are currently no couriers matching this order."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="order-courier-list">
                  {courierOptions.map((item) => {
                    const isAssigning = assigningCourierId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`order-courier-option ${
                          !item.eligible ? "unavailable" : ""
                        }`}
                      >
                        <div className="order-courier-option-main">
                          <div className="order-courier-avatar">
                            {getInitials(item)}
                          </div>

                          <div className="order-courier-option-info">
                            <strong>{getDisplayName(item)}</strong>

                            <span className="order-courier-option-id">
                              {item.phoneNumber || item.id}
                            </span>

                            <div className="order-courier-eligibility">
                              <span
                                className={
                                  item.eligible ? "available" : "unavailable"
                                }
                              >
                                {item.eligible
                                  ? "Available"
                                  : item.ineligibilityReason}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="order-courier-option-actions">
                          {item.eligible ? (
                            <button
                              type="button"
                              className="order-details-primary-button"
                              disabled={
                                Boolean(assigningCourierId) ||
                                unassigning ||
                                (order.transportationType === "MAXI" &&
                                  !maxiOfferReady)
                              }
                              onClick={() => handleAssignCourier(item)}
                            >
                              {isAssigning ? "Assigning..." : "Assign"}
                            </button>
                          ) : (
                            <span className="order-courier-capacity">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

          {/* CUSTOMER INFORMATION */}

          <SectionCard
            title="Customer information"
            description="Account and contact details associated with the order."
          >
            <div className="order-details-person">
              <div className="order-details-avatar customer">
                <i className="bi bi-person-fill" />
              </div>

              <div className="order-details-person-main">
                <h3>{customerName}</h3>
                <p>Customer</p>
              </div>
            </div>

            <div className="order-details-divider" />

            <div className="order-details-fields-grid">
              <DetailField
                label="Account ID"
                value={customer?.id || order.userID}
              />

              <DetailField label="Phone number" value={customerPhone} />

              <DetailField label="Email address" value={customerEmail} />

              <DetailField label="Sender name" value={order.senderName} />

              <DetailField label="Recipient name" value={order.recipientName} />
            </div>
          </SectionCard>

          {/* COURIER INFORMATION */}

          <SectionCard
            title="Courier assignment"
            description="Courier responsible for handling the delivery."
          >
            {courier ? (
              <>
                <div className="order-details-person">
                  <div className="order-details-avatar courier">
                    <i className="bi bi-bicycle" />
                  </div>

                  <div className="order-details-person-main">
                    <h3>{courierName}</h3>
                    <p>Assigned courier</p>
                  </div>

                  <span
                    className={`order-details-status-badge ${getStatusClass(
                      order.assignmentStatus,
                    )}`}
                  >
                    {formatValue(order.assignmentStatus, "Assigned")}
                  </span>
                </div>

                <div className="order-details-divider" />

                <div className="order-details-fields-grid">
                  <DetailField label="Courier ID" value={courier.id} />

                  <DetailField label="Phone number" value={courierPhone} />

                  <DetailField label="Email address" value={courier.email} />

                  <DetailField
                    label="Assigned at"
                    value={formatDate(order.courierAssignedAt)}
                  />
                </div>

                {canUnassign && (
                  <div className="order-details-unassign">
                    <div>
                      <strong>Remove this courier?</strong>

                      <p>
                        The courier's active delivery count will decrease and
                        the order will return to its previous status.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="order-details-danger-button"
                      onClick={handleUnassignCourier}
                      disabled={unassigning || Boolean(assigningCourierId)}
                    >
                      {unassigning ? "Unassigning..." : "Unassign courier"}
                    </button>
                  </div>
                )}

                {!canUnassign && (
                  <div className="order-details-notice warning">
                    <i className="bi bi-lock" />

                    <p>
                      This order has progressed beyond the accepted stage.
                      Unassignment is disabled to prevent releasing a courier
                      who may already have the delivery.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="order-details-inline-empty">
                <div className="order-details-inline-empty-icon">
                  <i className="bi bi-person-plus" />
                </div>

                <div>
                  <h3>
                    {hasAssignedCourier
                      ? "Courier record unavailable"
                      : "No courier assigned"}
                  </h3>

                  <p>
                    {hasAssignedCourier
                      ? "A courier ID exists, but the courier record could not be loaded."
                      : orderCanBeAssigned
                        ? "Use the assignment section above to select a courier."
                        : "This order is not currently eligible for courier assignment."}
                  </p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ORDER TIMELINE */}

          <SectionCard
            title="Order timeline"
            description="Recorded delivery milestones in chronological order."
          >
            {timeline.length > 0 ? (
              <div className="order-details-timeline">
                {timeline.map((item, index) => (
                  <TimelineItem
                    key={`${item.title}-${item.timestamp}`}
                    title={item.title}
                    timestamp={item.timestamp}
                    description={item.description}
                    state="recorded"
                    last={index === timeline.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="order-details-empty-content">
                <i className="bi bi-clock-history" />

                <h3>No milestone timestamps</h3>

                <p>
                  Timeline entries will appear here when milestone timestamps
                  are recorded.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* RIGHT COLUMN */}

        <aside className="order-details-side-column">
          {/* FINANCIAL BREAKDOWN */}

          <SectionCard
            title="Financial breakdown"
            description="Recorded order charges and allocations."
          >
            <div className="order-details-financial-row total">
              <span>Total order price</span>

              <strong>{formatCurrency(order.totalPrice)}</strong>
            </div>

            <div className="order-details-financial-row">
              <span>Operational fare</span>

              <strong>{formatCurrency(order.operationalFare)}</strong>
            </div>

            <div className="order-details-financial-row">
              <span>Platform fee</span>

              <strong>{formatCurrency(order.platformFee)}</strong>
            </div>

            <div className="order-details-financial-row">
              <span>Commission</span>

              <strong>{formatCurrency(order.commissionAmount)}</strong>
            </div>

            <div className="order-details-financial-row">
              <span>VAT</span>

              <strong>{formatCurrency(order.vatAmount)}</strong>
            </div>

            <div className="order-details-financial-row">
              <span>Platform service revenue</span>

              <strong>{formatCurrency(order.platformServiceRevenue)}</strong>
            </div>

            <div className="order-details-financial-row">
              <span>Courier earnings</span>

              <strong>{formatCurrency(order.courierEarnings)}</strong>
            </div>

            <div className="order-details-divider" />

            <div className="order-details-financial-row payment-arrangement">
              <span>Payment arrangement</span>
              <strong>{getPaymentArrangement(order)}</strong>
            </div>
          </SectionCard>

          {/* CANCELLATION AND REFUNDS */}

          <SectionCard
            title="Cancellation and refunds"
            description="Recorded cancellation and refund information."
          >
            <div className="order-details-fields-stack">
              <DetailField
                label="Cancellation reason"
                value={order.cancellationReason}
              />

              <DetailField
                label="Cancelled at"
                value={formatDate(order.cancelledAt)}
              />

              <DetailField label="Refund status" value={order.refundStatus} />

              <DetailField
                label="Refund amount"
                value={formatCurrency(order.refundAmount)}
              />
            </div>
          </SectionCard>

          {/* RECORD INFORMATION */}

          <SectionCard
            title="Record information"
            description="Order identifiers and audit timestamps."
          >
            <div className="order-details-fields-stack">
              <DetailField label="Order ID" value={order.id} />

              <DetailField label="Customer ID" value={order.userID} />

              <DetailField
                label="Assigned courier ID"
                value={order.assignedCourierId}
              />

              <DetailField
                label="Original status before assignment"
                value={order.statusBeforeAssignment}
              />

              <DetailField label="Order environment" value={environment} />

              <DetailField
                label="Created at"
                value={formatDate(order.createdAt)}
              />

              <DetailField
                label="Last updated"
                value={formatDate(order.updatedAt)}
              />
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetails;
