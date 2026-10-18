import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataStore } from "aws-amplify/datastore";
import { useNavigate } from "react-router-dom";
import { Order, User, Courier } from "../../../../../../../../src/models";
import "./OrderDashboard.css";

const PAGE_SIZE = 10;

const ORDER_STATUSES = [
  "BIDDING",
  "AWAITING_PAYMENT",
  "READY_FOR_PICKUP",
  "ACCEPTED",
  "ARRIVED_PICKUP",
  "LOADING",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_DROPOFF",
  "UNLOADING",
  "DELIVERED",
  "HANDOVER_TO_LOGISTICS",
  "IN_LOGISTICS_TRANSIT",
  "CANCELLED",
  "DISPUTED",
];

const PAYMENT_STATUSES = ["PENDING", "PROCESSING", "PAID", "FAILED"];

const ASSIGNMENT_OPTIONS = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "UNASSIGNED", label: "Unassigned" },
];

const ACTIVE_STATUSES = [
  "ACCEPTED",
  "ARRIVED_PICKUP",
  "LOADING",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_DROPOFF",
  "UNLOADING",
  "HANDOVER_TO_LOGISTICS",
  "IN_LOGISTICS_TRANSIT",
];

const AWAITING_STATUSES = ["BIDDING", "AWAITING_PAYMENT", "READY_FOR_PICKUP"];

const formatLabel = (value) => {
  if (!value) return "Unknown";

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPersonName = (person) => {
  if (!person) return "";

  return [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
};

const getOrderStatusClass = (status) => {
  switch (status) {
    case "DELIVERED":
      return "success";

    case "ACCEPTED":
    case "PICKED_UP":
    case "IN_TRANSIT":
    case "ARRIVED_PICKUP":
    case "ARRIVED_DROPOFF":
    case "LOADING":
    case "UNLOADING":
    case "HANDOVER_TO_LOGISTICS":
    case "IN_LOGISTICS_TRANSIT":
      return "info";

    case "BIDDING":
    case "AWAITING_PAYMENT":
    case "READY_FOR_PICKUP":
      return "warning";

    case "CANCELLED":
    case "DISPUTED":
      return "danger";

    default:
      return "neutral";
  }
};

const getPaymentStatusClass = (status) => {
  switch (status) {
    case "PAID":
      return "success";

    case "FAILED":
      return "danger";

    case "PROCESSING":
      return "info";

    case "PENDING":
      return "warning";

    default:
      return "neutral";
  }
};

const getOrderReference = (id) => {
  if (!id) return "—";

  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
};

const isOrderNeedsAttention = (order) => {
  return (
    order.status === "DISPUTED" ||
    order.paymentStatus === "FAILED" ||
    order.refundStatus === "NEEDS_ATTENTION" ||
    order.refundStatus === "FAILED" ||
    order.cancellationStatus === "FAILED" ||
    order.fundsReleaseBlocked === true
  );
};

function StatCard({ icon, label, value, description, variant }) {
  return (
    <div className={`order-stat-card ${variant || ""}`}>
      <div className="order-stat-top">
        <div className="order-stat-icon">
          <i className={`bi ${icon}`} aria-hidden="true" />
        </div>
      </div>

      <div className="order-stat-value">{value}</div>
      <div className="order-stat-label">{label}</div>
      <div className="order-stat-description">{description}</div>
    </div>
  );
}

function StatusBadge({ status, type = "order" }) {
  if (!status) {
    return <span className="order-status-badge neutral">Not set</span>;
  }

  const statusClass =
    type === "payment"
      ? getPaymentStatusClass(status)
      : getOrderStatusClass(status);

  return (
    <span className={`order-status-badge ${statusClass}`}>
      <span className="order-status-dot" />
      {formatLabel(status)}
    </span>
  );
}

function EnvironmentBadge({ environment }) {
  if (!environment) {
    return <span className="order-environment-badge unknown">Not set</span>;
  }

  return (
    <span
      className={`order-environment-badge ${
        environment === "TEST" ? "test" : "production"
      }`}
    >
      {environment === "TEST" ? "Test" : "Production"}
    </span>
  );
}

function OrderRow({ order, user, courier, onView, onFullDetails }) {
  const senderName =
    order.senderName || getPersonName(user) || "Unknown sender";

  const recipientName = order.recipientName || "Unknown recipient";

  const courierName = courier
    ? getPersonName(courier) || "Assigned courier"
    : order.assignedCourierId
      ? "Courier ID available"
      : "Unassigned";

  const orderNeedsAttention = isOrderNeedsAttention(order);

  return (
    <tr>
      <td>
        <div className="order-reference-cell">
          <span className="order-reference">{getOrderReference(order.id)}</span>

          <span className="order-created-date">
            {formatDate(order.createdAt)}
          </span>
        </div>
      </td>

      <td>
        <div className="order-people-cell">
          <div className="order-person-line">
            <span className="order-person-marker sender-marker">S</span>

            <div className="order-person-info">
              <span className="order-person-name">{senderName}</span>

              <span className="order-person-phone">
                {order.senderNumber || user?.phoneNumber || "No phone"}
              </span>
            </div>
          </div>

          <div className="order-person-line">
            <span className="order-person-marker recipient-marker">R</span>

            <div className="order-person-info">
              <span className="order-person-name">{recipientName}</span>

              <span className="order-person-phone">
                {order.recipientNumber || "No phone"}
              </span>
            </div>
          </div>
        </div>
      </td>

      <td>
        <div className="order-route-cell">
          <div className="order-route-line">
            <span className="order-route-dot pickup-dot" />
            <span title={order.originAddress || ""}>
              {order.originAddress || "Pickup not specified"}
            </span>
          </div>

          <div className="order-route-connector" />

          <div className="order-route-line">
            <span className="order-route-dot dropoff-dot" />
            <span title={order.destinationAddress || ""}>
              {order.destinationAddress || "Drop-off not specified"}
            </span>
          </div>

          <span className="order-route-meta">
            {[order.transportationType, order.vehicleClass]
              .filter(Boolean)
              .map(formatLabel)
              .join(" · ") || "Vehicle not specified"}
          </span>
        </div>
      </td>

      <td>
        <div className="order-courier-cell">
          <div className="order-courier-avatar">
            <i className="bi bi-person" aria-hidden="true" />
          </div>

          <div className="order-courier-info">
            <span className="order-courier-name">{courierName}</span>

            <span className="order-courier-subtitle">
              {courier?.phoneNumber ||
                (order.assignedCourierId
                  ? "Assignment recorded"
                  : "Awaiting assignment")}
            </span>
          </div>
        </div>
      </td>

      <td>
        <div className="order-status-cell">
          <StatusBadge status={order.status} />

          {orderNeedsAttention && (
            <span className="order-attention-indicator">
              <i className="bi bi-exclamation-circle" />
              Attention
            </span>
          )}
        </div>
      </td>

      <td>
        <div className="order-payment-cell">
          <StatusBadge status={order.paymentStatus} type="payment" />

          <span className="order-payment-amount">
            {formatCurrency(order.totalPrice)}
          </span>
        </div>
      </td>

      <td>
        <EnvironmentBadge environment={order.orderEnvironment} />
      </td>

      <td>
        <div className="order-row-actions">
          <button
            type="button"
            className="order-view-button"
            onClick={() => onView(order)}
            aria-label={`View order ${order.id}`}
          >
            View
            <i className="bi bi-arrow-up-right" />
          </button>

          <button
            type="button"
            className="order-full-details-button"
            onClick={() => onFullDetails(order)}
            aria-label={`View full details for order ${order.id}`}
          >
            Full details
            <i className="bi bi-arrow-up-right" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function OrderDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [couriers, setCouriers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [environmentFilter, setEnvironmentFilter] = useState("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [transportFilter, setTransportFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [orderRecords, userRecords, courierRecords] = await Promise.all([
        DataStore.query(Order),
        DataStore.query(User),
        DataStore.query(Courier),
      ]);

      setOrders(
        [...orderRecords].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;

          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

          return dateB - dateA;
        }),
      );

      setUsers(userRecords);
      setCouriers(courierRecords);
    } catch (err) {
      console.error("Failed to load orders:", err);

      setError(
        "We couldn't load orders. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout;

    const initialLoad = async () => {
      if (!mounted) return;

      await loadData();

      if (!mounted) return;
    };

    initialLoad();

    const subscription = DataStore.observe(Order).subscribe({
      next: () => {
        if (!mounted) return;

        clearTimeout(refreshTimeout);

        refreshTimeout = setTimeout(() => {
          if (mounted) {
            loadData(true);
          }
        }, 400);
      },
      error: (err) => {
        console.error("Order subscription error:", err);
      },
    });

    return () => {
      mounted = false;
      clearTimeout(refreshTimeout);
      subscription.unsubscribe();
    };
  }, [loadData]);

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  const couriersById = useMemo(() => {
    return new Map(couriers.map((courier) => [courier.id, courier]));
  }, [couriers]);

  const transportOptions = useMemo(() => {
    return [
      ...new Set(
        orders.map((order) => order.transportationType).filter(Boolean),
      ),
    ].sort();
  }, [orders]);

  const statistics = useMemo(() => {
    return {
      total: orders.length,

      awaiting: orders.filter((order) =>
        AWAITING_STATUSES.includes(order.status),
      ).length,

      active: orders.filter((order) => ACTIVE_STATUSES.includes(order.status))
        .length,

      delivered: orders.filter((order) => order.status === "DELIVERED").length,

      attention: orders.filter(isOrderNeedsAttention).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const user = usersById.get(order.userID);
      const courier = couriersById.get(order.assignedCourierId);

      const searchableValues = [
        order.id,
        order.senderName,
        order.senderNumber,
        order.senderNumber2,
        order.recipientName,
        order.recipientNumber,
        order.recipientNumber2,
        order.originAddress,
        order.originState,
        order.destinationAddress,
        order.destinationState,
        order.orderDetails,
        order.paymentReference,
        order.refundReference,
        order.waybillNumber,
        order.logisticsTrackingCode,
        order.assignedCourierId,
        getPersonName(user),
        user?.email,
        user?.phoneNumber,
        getPersonName(courier),
        courier?.phoneNumber,
        courier?.plateNumber,
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search),
        );

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchesPayment =
        paymentFilter === "ALL" || order.paymentStatus === paymentFilter;

      const matchesEnvironment =
        environmentFilter === "ALL" ||
        order.orderEnvironment === environmentFilter;

      const matchesAssignment =
        assignmentFilter === "ALL" ||
        (assignmentFilter === "ASSIGNED" && Boolean(order.assignedCourierId)) ||
        (assignmentFilter === "UNASSIGNED" && !order.assignedCourierId);

      const matchesTransport =
        transportFilter === "ALL" ||
        order.transportationType === transportFilter;

      const createdDate = order.createdAt
        ? new Date(order.createdAt).getTime()
        : null;

      const filterStart = startDate
        ? new Date(`${startDate}T00:00:00`).getTime()
        : null;

      const filterEnd = endDate
        ? new Date(`${endDate}T23:59:59.999`).getTime()
        : null;

      const matchesStartDate =
        filterStart === null ||
        (createdDate !== null && createdDate >= filterStart);

      const matchesEndDate =
        filterEnd === null ||
        (createdDate !== null && createdDate <= filterEnd);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesEnvironment &&
        matchesAssignment &&
        matchesTransport &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    orders,
    usersById,
    couriersById,
    searchTerm,
    statusFilter,
    paymentFilter,
    environmentFilter,
    assignmentFilter,
    transportFilter,
    startDate,
    endDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    paymentFilter,
    environmentFilter,
    assignmentFilter,
    transportFilter,
    startDate,
    endDate,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setEnvironmentFilter("ALL");
    setAssignmentFilter("ALL");
    setTransportFilter("ALL");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    statusFilter !== "ALL" ||
    paymentFilter !== "ALL" ||
    environmentFilter !== "ALL" ||
    assignmentFilter !== "ALL" ||
    transportFilter !== "ALL" ||
    Boolean(startDate) ||
    Boolean(endDate);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleFullDetails = (order) => {
    if (!order?.id) return;

    navigate(`/admin/order_details/${order.id}`);
  };

  const closeOrderPreview = () => {
    setSelectedOrder(null);
  };

  const selectedUser = selectedOrder
    ? usersById.get(selectedOrder.userID)
    : null;

  const selectedCourier = selectedOrder
    ? couriersById.get(selectedOrder.assignedCourierId)
    : null;

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-header">
        <div className="admin-orders-heading">
          <div className="admin-orders-eyebrow">OPERATIONS</div>

          <h1>Orders</h1>

          <p>
            Monitor deliveries, assignments, payments and order activity across
            Atua.
          </p>
        </div>

        <div className="admin-orders-header-actions">
          <div className="admin-orders-live-indicator">
            <span className="admin-orders-live-dot" />
            Live updates
          </div>

          <button
            type="button"
            className="admin-orders-refresh-button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
          >
            <i
              className={`bi bi-arrow-clockwise ${
                refreshing ? "order-spin" : ""
              }`}
              aria-hidden="true"
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="admin-orders-stats">
        <StatCard
          icon="bi-box-seam"
          label="Total orders"
          value={statistics.total}
          description="All recorded orders"
          variant="orders-stat-total"
        />

        <StatCard
          icon="bi-hourglass-split"
          label="Awaiting action"
          value={statistics.awaiting}
          description="Bidding or awaiting payment"
          variant="orders-stat-pending"
        />

        <StatCard
          icon="bi-truck"
          label="In progress"
          value={statistics.active}
          description="Active delivery stages"
          variant="orders-stat-active"
        />

        <StatCard
          icon="bi-check2-circle"
          label="Delivered"
          value={statistics.delivered}
          description="Successfully delivered"
          variant="orders-stat-delivered"
        />

        <StatCard
          icon="bi-exclamation-triangle"
          label="Needs attention"
          value={statistics.attention}
          description="Disputes, failures or funds holds"
          variant="orders-stat-attention"
        />
      </div>

      <section className="admin-orders-panel">
        <div className="admin-orders-panel-heading">
          <div>
            <h2>All orders</h2>

            <p>Search and filter your order records.</p>
          </div>

          <div className="admin-orders-result-count">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "order" : "orders"}
          </div>
        </div>

        <div className="admin-orders-search-wrap">
          <i className="bi bi-search" aria-hidden="true" />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search order ID, sender, recipient, courier, phone or address..."
            aria-label="Search orders"
          />

          {searchTerm && (
            <button
              type="button"
              className="admin-orders-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>

        <div className="admin-orders-filters">
          <div className="admin-orders-filter-field">
            <label htmlFor="orders-status-filter">Order status</label>

            <select
              id="orders-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>

              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-orders-filter-field">
            <label htmlFor="orders-payment-filter">Payment</label>

            <select
              id="orders-payment-filter"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
            >
              <option value="ALL">All payment statuses</option>

              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-orders-filter-field">
            <label htmlFor="orders-environment-filter">
              Order classification
            </label>

            <select
              id="orders-environment-filter"
              value={environmentFilter}
              onChange={(event) => setEnvironmentFilter(event.target.value)}
            >
              <option value="ALL">Test & production</option>
              <option value="TEST">Test orders</option>
              <option value="PRODUCTION">Production orders</option>
            </select>
          </div>

          <div className="admin-orders-filter-field">
            <label htmlFor="orders-assignment-filter">Courier assignment</label>

            <select
              id="orders-assignment-filter"
              value={assignmentFilter}
              onChange={(event) => setAssignmentFilter(event.target.value)}
            >
              <option value="ALL">All orders</option>

              {ASSIGNMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-orders-filter-field">
            <label htmlFor="orders-transport-filter">Transportation</label>

            <select
              id="orders-transport-filter"
              value={transportFilter}
              onChange={(event) => setTransportFilter(event.target.value)}
            >
              <option value="ALL">All transportation types</option>

              {transportOptions.map((transport) => (
                <option key={transport} value={transport}>
                  {formatLabel(transport)}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-orders-filter-field">
            <label htmlFor="orders-start-date">From date</label>

            <input
              id="orders-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="admin-orders-filter-field">
            <label htmlFor="orders-end-date">To date</label>

            <input
              id="orders-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          <div className="admin-orders-filter-actions">
            <button
              type="button"
              className="admin-orders-clear-filters"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <i className="bi bi-arrow-counterclockwise" />
              Clear filters
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-orders-error">
            <div className="admin-orders-message-icon">
              <i className="bi bi-exclamation-circle" />
            </div>

            <div>
              <strong>Unable to load orders</strong>
              <p>{error}</p>

              <button type="button" onClick={() => loadData()}>
                Try again
              </button>
            </div>
          </div>
        )}

        {!error && loading ? (
          <div className="admin-orders-loading">
            <div className="admin-orders-loader" />

            <span>Loading orders...</span>
          </div>
        ) : !error && filteredOrders.length === 0 ? (
          <div className="admin-orders-empty">
            <div className="admin-orders-empty-icon">
              <i
                className={hasActiveFilters ? "bi bi-search" : "bi bi-box-seam"}
              />
            </div>

            <h3>{hasActiveFilters ? "No matching orders" : "No orders yet"}</h3>

            <p>
              {hasActiveFilters
                ? "Try changing your search or clearing some filters."
                : "Orders will appear here when they are available in Atua."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="admin-orders-empty-button"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : !error ? (
          <>
            <div className="admin-orders-table-wrap">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Sender / Recipient</th>
                    <th>Delivery route</th>
                    <th>Courier</th>
                    <th>Status</th>
                    <th>Payment / Total</th>
                    <th>Type</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      user={usersById.get(order.userID)}
                      courier={couriersById.get(order.assignedCourierId)}
                      onView={handleViewOrder}
                      onFullDetails={handleFullDetails}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-orders-mobile-list">
              {paginatedOrders.map((order) => {
                const user = usersById.get(order.userID);
                const courier = couriersById.get(order.assignedCourierId);

                return (
                  <article className="admin-orders-mobile-card" key={order.id}>
                    <div className="order-mobile-card-header">
                      <div>
                        <span className="order-mobile-card-id">
                          {getOrderReference(order.id)}
                        </span>

                        <span className="order-mobile-card-date">
                          {formatDateTime(order.createdAt)}
                        </span>
                      </div>

                      <EnvironmentBadge environment={order.orderEnvironment} />
                    </div>

                    <div className="order-mobile-card-statuses">
                      <StatusBadge status={order.status} />

                      <StatusBadge
                        status={order.paymentStatus}
                        type="payment"
                      />
                    </div>

                    <div className="order-mobile-route">
                      <div className="order-route-line">
                        <span className="order-route-dot pickup-dot" />

                        <span>
                          {order.originAddress || "Pickup not specified"}
                        </span>
                      </div>

                      <div className="order-route-connector" />

                      <div className="order-route-line">
                        <span className="order-route-dot dropoff-dot" />

                        <span>
                          {order.destinationAddress || "Drop-off not specified"}
                        </span>
                      </div>
                    </div>

                    <div className="order-mobile-card-bottom">
                      <div>
                        <span className="order-mobile-meta-label">
                          Total price
                        </span>

                        <strong>{formatCurrency(order.totalPrice)}</strong>
                      </div>

                      <div>
                        <span className="order-mobile-meta-label">Courier</span>

                        <strong>
                          {courier
                            ? getPersonName(courier) || "Assigned courier"
                            : order.assignedCourierId
                              ? "Assigned"
                              : "Unassigned"}
                        </strong>
                      </div>
                    </div>

                    <div className="order-mobile-card-footer">
                      <span>
                        {order.senderName ||
                          getPersonName(user) ||
                          "Unknown sender"}
                      </span>

                      <button
                        type="button"
                        className="order-view-button"
                        onClick={() => handleViewOrder(order)}
                      >
                        View
                        <i className="bi bi-arrow-up-right" />
                      </button>

                      {/* Opens the dedicated order details page */}
                      <button
                        className="order-full-details-button"
                        type="button"
                        onClick={() => handleFullDetails(order)}
                      >
                        Full details
                        <i className="bi bi-arrow-up-right" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="admin-orders-pagination">
              <span className="admin-orders-pagination-info">
                Showing{" "}
                {filteredOrders.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
                {"–"}
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredOrders.length,
                )} of {filteredOrders.length} orders
              </span>

              <div className="admin-orders-pagination-controls">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <i className="bi bi-chevron-left" />
                </button>

                <span className="admin-orders-page-number">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {selectedOrder && (
        <div
          className="admin-order-preview-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeOrderPreview();
            }
          }}
        >
          <section
            className="admin-order-preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-order-preview-title"
          >
            <div className="admin-order-preview-header">
              <div>
                <span className="admin-order-preview-eyebrow">
                  ORDER OVERVIEW
                </span>

                <h2 id="admin-order-preview-title">
                  {getOrderReference(selectedOrder.id)}
                </h2>

                <span className="admin-order-preview-date">
                  Created {formatDateTime(selectedOrder.createdAt)}
                </span>
              </div>

              <button
                type="button"
                className="admin-order-preview-close"
                onClick={closeOrderPreview}
                aria-label="Close order preview"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="admin-order-preview-body">
              <div className="admin-order-preview-badges">
                <StatusBadge status={selectedOrder.status} />

                <StatusBadge
                  status={selectedOrder.paymentStatus}
                  type="payment"
                />

                <EnvironmentBadge
                  environment={selectedOrder.orderEnvironment}
                />
              </div>

              <div className="admin-order-preview-section">
                <h3>
                  <i className="bi bi-people" />
                  Sender and recipient
                </h3>

                <div className="admin-order-preview-grid">
                  <div>
                    <span>Sender</span>
                    <strong>
                      {selectedOrder.senderName ||
                        getPersonName(selectedUser) ||
                        "Not available"}
                    </strong>
                    <small>
                      {selectedOrder.senderNumber ||
                        selectedUser?.phoneNumber ||
                        "No phone"}
                    </small>
                  </div>

                  <div>
                    <span>Recipient</span>
                    <strong>
                      {selectedOrder.recipientName || "Not available"}
                    </strong>
                    <small>{selectedOrder.recipientNumber || "No phone"}</small>
                  </div>
                </div>
              </div>

              <div className="admin-order-preview-section">
                <h3>
                  <i className="bi bi-geo-alt" />
                  Delivery route
                </h3>

                <div className="admin-order-preview-route">
                  <div className="order-route-line">
                    <span className="order-route-dot pickup-dot" />
                    <span>
                      {selectedOrder.originAddress || "Pickup not specified"}
                    </span>
                  </div>

                  <div className="order-route-connector" />

                  <div className="order-route-line">
                    <span className="order-route-dot dropoff-dot" />
                    <span>
                      {selectedOrder.destinationAddress ||
                        "Drop-off not specified"}
                    </span>
                  </div>
                </div>

                <div className="admin-order-preview-grid">
                  <div>
                    <span>Transportation</span>
                    <strong>
                      {formatLabel(selectedOrder.transportationType)}
                    </strong>
                  </div>

                  <div>
                    <span>Vehicle class</span>
                    <strong>{formatLabel(selectedOrder.vehicleClass)}</strong>
                  </div>

                  <div>
                    <span>Distance</span>
                    <strong>{selectedOrder.distance || "Not available"}</strong>
                  </div>

                  <div>
                    <span>Trip type</span>
                    <strong>{formatLabel(selectedOrder.tripType)}</strong>
                  </div>
                </div>

                {selectedOrder.orderDetails && (
                  <div className="admin-order-preview-description">
                    <span>Order details</span>
                    <p>{selectedOrder.orderDetails}</p>
                  </div>
                )}
              </div>

              <div className="admin-order-preview-section">
                <h3>
                  <i className="bi bi-truck" />
                  Courier assignment
                </h3>

                <div className="admin-order-preview-grid">
                  <div>
                    <span>Assigned courier</span>
                    <strong>
                      {selectedCourier
                        ? getPersonName(selectedCourier) || "Assigned courier"
                        : selectedOrder.assignedCourierId
                          ? "Courier record not found"
                          : "Unassigned"}
                    </strong>
                    <small>
                      {selectedCourier?.phoneNumber ||
                        selectedOrder.assignedCourierId ||
                        "No courier assigned"}
                    </small>
                  </div>

                  <div>
                    <span>Assignment status</span>
                    <strong>
                      {formatLabel(selectedOrder.assignmentStatus)}
                    </strong>
                  </div>

                  <div>
                    <span>Assignment attempts</span>
                    <strong>{selectedOrder.assignmentAttempts ?? "—"}</strong>
                  </div>

                  <div>
                    <span>Assignment expiry</span>
                    <strong>
                      {formatDateTime(selectedOrder.assignmentExpiresAt)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="admin-order-preview-section">
                <h3>
                  <i className="bi bi-wallet2" />
                  Pricing and payment
                </h3>

                <div className="admin-order-preview-price">
                  <span>Agreed total price</span>
                  <strong>{formatCurrency(selectedOrder.totalPrice)}</strong>
                </div>

                <div className="admin-order-preview-grid">
                  <div>
                    <span>Operational fare</span>
                    <strong>
                      {formatCurrency(selectedOrder.operationalFare)}
                    </strong>
                  </div>

                  <div>
                    <span>Courier earnings</span>
                    <strong>
                      {formatCurrency(selectedOrder.courierEarnings)}
                    </strong>
                  </div>

                  <div>
                    <span>Commission</span>
                    <strong>
                      {formatCurrency(selectedOrder.commissionAmount)}
                    </strong>
                  </div>

                  <div>
                    <span>Platform fee</span>
                    <strong>{formatCurrency(selectedOrder.platformFee)}</strong>
                  </div>

                  <div>
                    <span>VAT</span>
                    <strong>{formatCurrency(selectedOrder.vatAmount)}</strong>
                  </div>

                  <div>
                    <span>Platform net revenue</span>
                    <strong>
                      {formatCurrency(selectedOrder.platformNetRevenue)}
                    </strong>
                  </div>

                  <div>
                    <span>Payout status</span>
                    <strong>{formatLabel(selectedOrder.payoutStatus)}</strong>
                  </div>

                  <div>
                    <span>Funds status</span>
                    <strong>{formatLabel(selectedOrder.fundsStatus)}</strong>
                  </div>

                  <div>
                    <span>Earnings allocation</span>
                    <strong>
                      {formatLabel(selectedOrder.earningsAllocationStatus)}
                    </strong>
                  </div>

                  <div>
                    <span>Payment reference</span>
                    <strong className="order-preview-reference">
                      {selectedOrder.paymentReference || "—"}
                    </strong>
                  </div>
                </div>

                {selectedOrder.fundsReleaseBlocked && (
                  <div className="admin-order-funds-warning">
                    <i className="bi bi-shield-exclamation" />

                    <div>
                      <strong>Funds release is blocked</strong>
                      <p>
                        {selectedOrder.fundsHoldReason ||
                          "A funds hold is active for this order."}
                      </p>

                      {selectedOrder.fundsHeldAt && (
                        <small>
                          Held on {formatDateTime(selectedOrder.fundsHeldAt)}
                        </small>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(selectedOrder.cancellationStatus ||
                selectedOrder.refundStatus ||
                selectedOrder.cancellationReason) && (
                <div className="admin-order-preview-section">
                  <h3>
                    <i className="bi bi-arrow-counterclockwise" />
                    Cancellation and refund
                  </h3>

                  <div className="admin-order-preview-grid">
                    <div>
                      <span>Cancellation status</span>
                      <strong>
                        {formatLabel(selectedOrder.cancellationStatus)}
                      </strong>
                    </div>

                    <div>
                      <span>Refund status</span>
                      <strong>{formatLabel(selectedOrder.refundStatus)}</strong>
                    </div>

                    <div>
                      <span>Cancellation reason</span>
                      <strong>
                        {formatLabel(selectedOrder.cancellationReason)}
                      </strong>
                    </div>

                    <div>
                      <span>Cancellation stage</span>
                      <strong>
                        {formatLabel(selectedOrder.cancellationStage)}
                      </strong>
                    </div>

                    <div>
                      <span>Cancellation fee</span>
                      <strong>
                        {formatCurrency(selectedOrder.cancellationFee)}
                      </strong>
                    </div>

                    <div>
                      <span>Refund amount</span>
                      <strong>
                        {formatCurrency(selectedOrder.refundAmount)}
                      </strong>
                    </div>

                    <div>
                      <span>Refund reference</span>
                      <strong className="order-preview-reference">
                        {selectedOrder.refundReference || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Refunded at</span>
                      <strong>
                        {formatDateTime(selectedOrder.refundedAt)}
                      </strong>
                    </div>
                  </div>

                  {selectedOrder.cancellationReasonNote && (
                    <div className="admin-order-preview-description">
                      <span>Additional cancellation details</span>
                      <p>{selectedOrder.cancellationReasonNote}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="admin-order-preview-section">
                <h3>
                  <i className="bi bi-clock-history" />
                  Delivery milestones
                </h3>

                <div className="admin-order-milestones">
                  {[
                    ["Order accepted", selectedOrder.acceptedAt],
                    ["Arrived at pickup", selectedOrder.arrivedPickupAt],
                    ["Loading started", selectedOrder.loadingStartedAt],
                    ["Trip started", selectedOrder.tripStartedAt],
                    ["Arrived at drop-off", selectedOrder.arrivedDropoffAt],
                    ["Unloading completed", selectedOrder.unloadingCompletedAt],
                  ]
                    .filter(([, date]) => Boolean(date))
                    .map(([label, date]) => (
                      <div className="admin-order-milestone" key={label}>
                        <span className="admin-order-milestone-dot" />

                        <div>
                          <strong>{label}</strong>
                          <small>{formatDateTime(date)}</small>
                        </div>
                      </div>
                    ))}

                  {![
                    selectedOrder.acceptedAt,
                    selectedOrder.arrivedPickupAt,
                    selectedOrder.loadingStartedAt,
                    selectedOrder.tripStartedAt,
                    selectedOrder.arrivedDropoffAt,
                    selectedOrder.unloadingCompletedAt,
                  ].some(Boolean) && (
                    <p className="admin-order-no-milestones">
                      No delivery milestone timestamps are recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-order-preview-footer">
              <button
                type="button"
                className="admin-order-preview-live-button"
                onClick={() => {
                  if (!selectedOrder?.id) return;

                  navigate(`/admin/order_livetracing/${selectedOrder.id}`);
                  closeOrderPreview();
                }}
              >
                <i className="bi bi-geo-alt" aria-hidden="true" />
                <span>Live</span>
              </button>

              <button
                type="button"
                className="admin-order-preview-done"
                onClick={closeOrderPreview}
              >
                Close overview
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
