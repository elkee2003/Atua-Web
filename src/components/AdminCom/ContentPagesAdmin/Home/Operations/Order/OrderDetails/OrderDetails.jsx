import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Order, User, Courier } from "../../../../../../../../src/models";
import "./OrderDetails.css";

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

const getStatusLabel = (status) => {
  if (!status) return "Unknown";

  return (
    STATUS_LABELS[status] ||
    String(status)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
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

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [courier, setCourier] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    loadOrderDetails();

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
  }, [id, loadOrderDetails]);

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
        description: "The order was marked as delivered.",
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

  const paymentStatus = order?.paymentStatus;
  const orderStatus = order?.status;

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

  const customerName = getDisplayName(customer);
  const courierName = getDisplayName(courier);

  const customerPhone =
    customer?.phoneNumber ||
    order.senderPhoneNumber ||
    order.senderPhone ||
    null;

  const customerEmail = customer?.email || null;

  const courierPhone = courier?.phoneNumber || courier?.phone || null;

  const paymentLabel = paymentStatus
    ? String(paymentStatus)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not recorded";

  const environment = order.orderEnvironment || "Not specified";

  return (
    <div className="order-details-page">
      {/* PAGE HEADER */}

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
            onClick={() => loadOrderDetails(true)}
            disabled={refreshing}
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
                if (navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(order.id).catch((err) => {
                    console.error("Unable to copy order ID:", err);
                  });
                }
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

          <div>
            <span>Transportation</span>
            <strong>{formatValue(order.transportationType)}</strong>
          </div>
        </div>
      </section>

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

          {/* CUSTOMER */}

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

          {/* COURIER */}

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
                    {formatValue(order.assignmentStatus, "Unspecified")}
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

                  <DetailField
                    label="Assignment attempts"
                    value={order.assignmentAttempts}
                  />
                </div>
              </>
            ) : (
              <div className="order-details-inline-empty">
                <div className="order-details-inline-empty-icon">
                  <i className="bi bi-person-plus" />
                </div>

                <div>
                  <h3>No courier information available</h3>
                  <p>
                    {order.assignedCourierId
                      ? "A courier ID exists, but the courier record could not be loaded."
                      : "No assigned courier is recorded for this order."}
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

                {orderStatus &&
                  orderStatus !== "DELIVERED" &&
                  orderStatus !== "CANCELLED" &&
                  orderStatus !== "DISPUTED" && (
                    <TimelineItem
                      title="Current order status"
                      timestamp={null}
                      description={getStatusLabel(orderStatus)}
                      state="current"
                      last
                    />
                  )}
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
              <span>Courier earnings</span>
              <strong>{formatCurrency(order.courierEarnings)}</strong>
            </div>

            <div className="order-details-divider" />

            <div className="order-details-payment-summary">
              <span>Payment status</span>

              <span
                className={`order-details-status-badge ${getStatusClass(
                  paymentStatus,
                )}`}
              >
                {paymentLabel}
              </span>
            </div>
          </SectionCard>

          {/* CANCELLATION / REFUND */}

          <SectionCard
            title="Cancellation and refunds"
            description="Review any recorded cancellation or refund information."
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

            {orderStatus === "CANCELLED" && (
              <div className="order-details-notice warning">
                <i className="bi bi-exclamation-triangle" />
                <p>
                  This order is cancelled. Review the recorded cancellation and
                  refund information before taking further action.
                </p>
              </div>
            )}

            {orderStatus === "DISPUTED" && (
              <div className="order-details-notice danger">
                <i className="bi bi-exclamation-circle" />
                <p>
                  This order is disputed and may require operational review.
                </p>
              </div>
            )}
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

              <DetailField label="Order classification" value={environment} />

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
