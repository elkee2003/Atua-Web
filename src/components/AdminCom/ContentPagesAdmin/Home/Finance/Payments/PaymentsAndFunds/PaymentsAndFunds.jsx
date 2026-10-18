import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataStore } from "aws-amplify/datastore";
import {
  Order,
  Payment,
  Transaction,
  Wallet,
  Courier,
  User,
} from "../../../../../../../../src/models";
import "./PaymentsAndFunds.css";

const PAGE_SIZE = 10;

const PAYMENT_FILTERS = ["ALL", "PENDING", "PROCESSING", "PAID", "FAILED"];

const FUNDS_FILTERS = [
  "ALL",
  "PENDING",
  "PARTIALLY_RELEASED",
  "RELEASED",
  "HELD",
];

const PAYOUT_FILTERS = ["ALL", "PENDING", "PROCESSING", "PAID", "FAILED"];

const formatCurrency = (amount) => {
  const value = Number(amount ?? 0);

  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatLabel = (value) => {
  if (!value) return "Unknown";

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClass = (status) => {
  const value = String(status || "").toUpperCase();

  if (
    ["PAID", "SUCCESS", "COMPLETED", "RELEASED", "ALLOCATED"].includes(value)
  ) {
    return "success";
  }

  if (["FAILED", "CANCELLED", "REVERSED", "BLOCKED", "HELD"].includes(value)) {
    return "danger";
  }

  if (
    ["PENDING", "PROCESSING", "PARTIALLY_RELEASED", "INITIATED"].includes(value)
  ) {
    return "warning";
  }

  return "neutral";
};

const getOrderReference = (order) => {
  if (!order) return "—";

  return order.paymentReference || order.paymentID || order.id || "—";
};

const getPaymentAmount = (payment) => {
  if (!payment) return 0;

  return Number(
    payment.amount ?? payment.totalAmount ?? payment.paymentAmount ?? 0,
  );
};

const getFundsStatus = (order) => {
  if (!order) return "UNKNOWN";

  if (order.fundsReleaseBlocked) return "HELD";

  return order.fundsStatus || "PENDING";
};

const getPayoutStatus = (order) => {
  return order?.payoutStatus || "PENDING";
};

function PaymentsAndFunds() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [fundsFilter, setFundsFilter] = useState("ALL");
  const [payoutFilter, setPayoutFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [
        orderRecords,
        paymentRecords,
        transactionRecords,
        walletRecords,
        courierRecords,
        userRecords,
      ] = await Promise.all([
        DataStore.query(Order),
        DataStore.query(Payment),
        DataStore.query(Transaction),
        DataStore.query(Wallet),
        DataStore.query(Courier),
        DataStore.query(User),
      ]);

      setOrders(orderRecords || []);
      setPayments(paymentRecords || []);
      setTransactions(transactionRecords || []);
      setWallets(walletRecords || []);
      setCouriers(courierRecords || []);
      setUsers(userRecords || []);
    } catch (loadError) {
      console.error("Failed to load payments and funds:", loadError);

      setError(
        loadError?.message ||
          "Unable to load payment and funds records. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const couriersById = useMemo(
    () => new Map(couriers.map((courier) => [courier.id, courier])),
    [couriers],
  );

  const paymentsById = useMemo(
    () => new Map(payments.map((payment) => [payment.id, payment])),
    [payments],
  );

  const transactionsByOrderId = useMemo(() => {
    const result = new Map();

    transactions.forEach((transaction) => {
      if (!transaction.orderID) return;

      const existing = result.get(transaction.orderID) || [];
      existing.push(transaction);
      result.set(transaction.orderID, existing);
    });

    return result;
  }, [transactions]);

  const statistics = useMemo(() => {
    const paidOrders = orders.filter(
      (order) => String(order.paymentStatus || "").toUpperCase() === "PAID",
    );

    const pendingPayments = orders.filter((order) =>
      ["PENDING", "PROCESSING"].includes(
        String(order.paymentStatus || "").toUpperCase(),
      ),
    );

    const failedPayments = orders.filter(
      (order) => String(order.paymentStatus || "").toUpperCase() === "FAILED",
    );

    const heldOrders = orders.filter((order) => order.fundsReleaseBlocked);

    const releasedOrders = orders.filter(
      (order) => String(order.fundsStatus || "").toUpperCase() === "RELEASED",
    );

    const pendingAllocationOrders = orders.filter((order) =>
      ["PENDING", "PROCESSING"].includes(
        String(order.earningsAllocationStatus || "").toUpperCase(),
      ),
    );

    const paidPaymentAmount = paidOrders.reduce((total, order) => {
      const payment = paymentsById.get(order.paymentID);

      return (
        total +
        Number(
          payment?.amount ??
            payment?.totalAmount ??
            payment?.paymentAmount ??
            0,
        )
      );
    }, 0);

    const heldAmount = heldOrders.reduce(
      (total, order) => total + Number(order.courierEarnings || 0),
      0,
    );

    const releasedAmount = releasedOrders.reduce(
      (total, order) =>
        total + Number(order.fundsReleasedAmount ?? order.courierEarnings ?? 0),
      0,
    );

    const walletAvailable = wallets.reduce(
      (total, wallet) => total + Number(wallet.availableBalance || 0),
      0,
    );

    const walletPending = wallets.reduce(
      (total, wallet) => total + Number(wallet.pendingBalance || 0),
      0,
    );

    return {
      totalOrders: orders.length,
      paidPayments: paidOrders.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      paidPaymentAmount,
      heldOrders: heldOrders.length,
      heldAmount,
      releasedOrders: releasedOrders.length,
      releasedAmount,
      pendingAllocationOrders: pendingAllocationOrders.length,
      walletAvailable,
      walletPending,
      transactionCount: transactions.length,
    };
  }, [orders, paymentsById, wallets, transactions]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const paymentStatus = String(
        order.paymentStatus || "PENDING",
      ).toUpperCase();

      const fundsStatus = String(getFundsStatus(order)).toUpperCase();

      const payoutStatus = String(getPayoutStatus(order)).toUpperCase();

      const payment = paymentsById.get(order.paymentID);
      const user = usersById.get(order.userID);
      const courier = couriersById.get(order.assignedCourierId);

      const searchable = [
        order.id,
        order.paymentID,
        order.paymentReference,
        payment?.id,
        payment?.reference,
        payment?.paymentReference,
        user?.firstName,
        user?.lastName,
        user?.email,
        courier?.firstName,
        courier?.lastName,
        order.assignedCourierId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchable.includes(query)) return false;

      if (paymentFilter !== "ALL" && paymentStatus !== paymentFilter) {
        return false;
      }

      if (fundsFilter !== "ALL") {
        if (fundsFilter === "HELD") {
          if (!order.fundsReleaseBlocked) return false;
        } else if (fundsStatus !== fundsFilter) {
          return false;
        }
      }

      if (payoutFilter !== "ALL" && payoutStatus !== payoutFilter) {
        return false;
      }

      const createdAt = order.createdAt ? new Date(order.createdAt) : null;

      if (startDate) {
        if (!createdAt || createdAt < new Date(`${startDate}T00:00:00`)) {
          return false;
        }
      }

      if (endDate) {
        if (!createdAt || createdAt > new Date(`${endDate}T23:59:59.999`)) {
          return false;
        }
      }

      return true;
    });
  }, [
    orders,
    paymentsById,
    usersById,
    searchTerm,
    paymentFilter,
    fundsFilter,
    payoutFilter,
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
    paymentFilter,
    fundsFilter,
    payoutFilter,
    startDate,
    endDate,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setPaymentFilter("ALL");
    setFundsFilter("ALL");
    setPayoutFilter("ALL");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    paymentFilter !== "ALL" ||
    fundsFilter !== "ALL" ||
    payoutFilter !== "ALL" ||
    Boolean(startDate) ||
    Boolean(endDate);

  const selectedPayment = selectedOrder
    ? paymentsById.get(selectedOrder.paymentID)
    : null;

  const selectedUser = selectedOrder
    ? usersById.get(selectedOrder.userID)
    : null;

  const selectedCourier = selectedOrder
    ? couriersById.get(selectedOrder.assignedCourierId)
    : null;

  const selectedTransactions = selectedOrder
    ? transactionsByOrderId.get(selectedOrder.id) || []
    : [];

  const getPaymentRecord = (order) => {
    if (!order) return null;

    return (
      paymentsById.get(order.paymentID) ||
      payments.find(
        (payment) =>
          payment.orderID === order.id ||
          payment.reference === order.paymentReference ||
          payment.paymentReference === order.paymentReference,
      ) ||
      null
    );
  };

  const getCustomerName = (order) => {
    const user = usersById.get(order.userID);

    if (!user) return order.userID || "Unknown customer";

    return (
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email ||
      order.userID
    );
  };

  const getCourierName = (order) => {
    const courier = couriersById.get(order.assignedCourierId);

    if (!courier) return order.assignedCourierId || "Unassigned";

    return (
      [courier.firstName, courier.lastName].filter(Boolean).join(" ") ||
      order.assignedCourierId
    );
  };

  return (
    <div className="admin-payments-page">
      <div className="admin-payments-header">
        <div className="admin-payments-heading">
          <div className="admin-payments-eyebrow">FINANCE</div>

          <h1>Payments and Funds</h1>

          <p>
            Monitor customer payments, courier earnings allocation, held funds,
            released earnings and payout progress across Atua.
          </p>
        </div>

        <div className="admin-payments-header-actions">
          <div className="admin-payments-live-indicator">
            <span className="admin-payments-live-dot" />
            Financial records
          </div>

          <button
            type="button"
            className="admin-payments-refresh-button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
          >
            <i
              className={`bi bi-arrow-clockwise ${
                refreshing ? "admin-payments-spin" : ""
              }`}
              aria-hidden="true"
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-payments-error" role="alert">
          <div className="admin-payments-message-icon">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          </div>

          <div>
            <strong>Unable to load financial records</strong>
            <p>{error}</p>

            <button type="button" onClick={() => loadData(true)}>
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="admin-payments-stats">
        <StatCard
          icon="bi-receipt"
          label="Total orders"
          value={statistics.totalOrders}
          description="Orders with payment records"
          variant="payments-stat-total"
        />

        <StatCard
          icon="bi-check-circle"
          label="Paid payments"
          value={statistics.paidPayments}
          description={formatCurrency(statistics.paidPaymentAmount)}
          variant="payments-stat-paid"
        />

        <StatCard
          icon="bi-hourglass-split"
          label="Awaiting payment"
          value={statistics.pendingPayments}
          description="Pending or processing"
          variant="payments-stat-pending"
        />

        <StatCard
          icon="bi-exclamation-circle"
          label="Failed payments"
          value={statistics.failedPayments}
          description="Require investigation"
          variant="payments-stat-failed"
        />

        <StatCard
          icon="bi-shield-lock"
          label="Held funds"
          value={formatCurrency(statistics.heldAmount)}
          description={`${statistics.heldOrders} held orders`}
          variant="payments-stat-held"
        />

        <StatCard
          icon="bi-wallet2"
          label="Available wallet funds"
          value={formatCurrency(statistics.walletAvailable)}
          description={`${formatCurrency(statistics.walletPending)} pending`}
          variant="payments-stat-wallet"
        />
      </div>

      <div className="admin-payments-fund-overview">
        <div className="admin-payments-overview-heading">
          <div>
            <span className="admin-payments-section-eyebrow">
              FUNDS OVERVIEW
            </span>
            <h2>Courier earnings</h2>
            <p>
              Balances and release information from recorded financial data.
            </p>
          </div>
        </div>

        <div className="admin-payments-fund-grid">
          <div className="admin-payments-fund-item">
            <span className="admin-payments-fund-icon pending">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
            </span>

            <div>
              <span>Pending wallet balance</span>
              <strong>{formatCurrency(statistics.walletPending)}</strong>
            </div>
          </div>

          <div className="admin-payments-fund-item">
            <span className="admin-payments-fund-icon released">
              <i className="bi bi-check2-circle" aria-hidden="true" />
            </span>

            <div>
              <span>Released earnings recorded</span>
              <strong>{formatCurrency(statistics.releasedAmount)}</strong>
              <small>{statistics.releasedOrders} released orders</small>
            </div>
          </div>

          <div className="admin-payments-fund-item">
            <span className="admin-payments-fund-icon held">
              <i className="bi bi-shield-lock" aria-hidden="true" />
            </span>

            <div>
              <span>Funds on hold</span>
              <strong>{formatCurrency(statistics.heldAmount)}</strong>
              <small>{statistics.heldOrders} orders on hold</small>
            </div>
          </div>

          <div className="admin-payments-fund-item">
            <span className="admin-payments-fund-icon allocation">
              <i className="bi bi-diagram-3" aria-hidden="true" />
            </span>

            <div>
              <span>Awaiting earnings allocation</span>
              <strong>{statistics.pendingAllocationOrders}</strong>
              <small>Orders pending or processing allocation</small>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-payments-records-card">
        <div className="admin-payments-records-header">
          <div>
            <span className="admin-payments-section-eyebrow">
              FINANCIAL ACTIVITY
            </span>
            <h2>Payment and funds records</h2>
            <p>
              Search orders and review their payment, funds and payout status.
            </p>
          </div>

          <span className="admin-payments-record-count">
            {filteredOrders.length.toLocaleString()} records
          </span>
        </div>

        <div className="admin-payments-filters">
          <label className="admin-payments-search">
            <i className="bi bi-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search order, reference, customer or courier..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <label className="admin-payments-filter-field">
            <span>Payment</span>
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
            >
              {PAYMENT_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All payments" : formatLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-payments-filter-field">
            <span>Funds</span>
            <select
              value={fundsFilter}
              onChange={(event) => setFundsFilter(event.target.value)}
            >
              {FUNDS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All funds" : formatLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-payments-filter-field">
            <span>Payout</span>
            <select
              value={payoutFilter}
              onChange={(event) => setPayoutFilter(event.target.value)}
            >
              {PAYOUT_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All payouts" : formatLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-payments-filter-field">
            <span>From</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="admin-payments-filter-field">
            <span>To</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="admin-payments-clear-filters"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            <i className="bi bi-x-circle" aria-hidden="true" />
            Clear filters
          </button>
        </div>

        {loading ? (
          <div className="admin-payments-loading">
            <span className="admin-payments-spinner" />
            <strong>Loading financial records...</strong>
            <p>Retrieving orders, payments, wallets and transactions.</p>
          </div>
        ) : (
          <>
            <div className="admin-payments-table-wrap">
              <table className="admin-payments-table">
                <thead>
                  <tr>
                    <th>ORDER / REFERENCE</th>
                    <th>CUSTOMER</th>
                    <th>COURIER</th>
                    <th>PAYMENT</th>
                    <th>COURIER EARNINGS</th>
                    <th>FUNDS</th>
                    <th>PAYOUT</th>
                    <th>DATE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => {
                    const payment = getPaymentRecord(order);
                    const paymentStatus = order.paymentStatus || "PENDING";
                    const fundsStatus = getFundsStatus(order);
                    const payoutStatus = getPayoutStatus(order);

                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="admin-payments-order-cell">
                            <strong title={order.id}>
                              {order.id.slice(0, 12)}
                            </strong>

                            <span title={getOrderReference(order)}>
                              {getOrderReference(order)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="admin-payments-person-cell">
                            <strong>{getCustomerName(order)}</strong>
                            <span>{order.userID || "—"}</span>
                          </div>
                        </td>

                        <td>
                          <div className="admin-payments-person-cell">
                            <strong>{getCourierName(order)}</strong>
                            <span>
                              {order.assignedCourierId
                                ? "Assigned courier"
                                : "Not assigned"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="admin-payments-status-cell">
                            <span
                              className={`admin-payments-status ${getStatusClass(
                                paymentStatus,
                              )}`}
                            >
                              {formatLabel(paymentStatus)}
                            </span>

                            <strong>
                              {formatCurrency(getPaymentAmount(payment))}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <strong className="admin-payments-amount">
                            {formatCurrency(order.courierEarnings)}
                          </strong>
                          <span className="admin-payments-subtext">
                            {formatLabel(
                              order.earningsAllocationStatus || "PENDING",
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-payments-status ${getStatusClass(
                              fundsStatus,
                            )}`}
                          >
                            {formatLabel(fundsStatus)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-payments-status ${getStatusClass(
                              payoutStatus,
                            )}`}
                          >
                            {formatLabel(payoutStatus)}
                          </span>
                        </td>

                        <td>
                          <span className="admin-payments-date">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-payments-view-button"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <i className="bi bi-eye" aria-hidden="true" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedOrders.length === 0 && (
                    <tr>
                      <td colSpan={9}>
                        <div className="admin-payments-empty">
                          <span>
                            <i className="bi bi-receipt" aria-hidden="true" />
                          </span>
                          <strong>No financial records found</strong>
                          <p>
                            Try changing your search or clearing the filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-payments-mobile-list">
              {paginatedOrders.map((order) => {
                const payment = getPaymentRecord(order);
                const fundsStatus = getFundsStatus(order);
                const payoutStatus = getPayoutStatus(order);

                return (
                  <article
                    className="admin-payments-mobile-card"
                    key={order.id}
                  >
                    <div className="admin-payments-mobile-top">
                      <div>
                        <span>ORDER REFERENCE</span>
                        <strong>{order.id.slice(0, 12)}</strong>
                        <small>{getOrderReference(order)}</small>
                      </div>

                      <span
                        className={`admin-payments-status ${getStatusClass(
                          order.paymentStatus,
                        )}`}
                      >
                        {formatLabel(order.paymentStatus || "PENDING")}
                      </span>
                    </div>

                    <div className="admin-payments-mobile-amount">
                      <span>Payment amount</span>
                      <strong>
                        {formatCurrency(getPaymentAmount(payment))}
                      </strong>
                    </div>

                    <div className="admin-payments-mobile-grid">
                      <div>
                        <span>Customer</span>
                        <strong>{getCustomerName(order)}</strong>
                      </div>

                      <div>
                        <span>Courier earnings</span>
                        <strong>{formatCurrency(order.courierEarnings)}</strong>
                      </div>

                      <div>
                        <span>Funds</span>
                        <span
                          className={`admin-payments-status ${getStatusClass(
                            fundsStatus,
                          )}`}
                        >
                          {formatLabel(fundsStatus)}
                        </span>
                      </div>

                      <div>
                        <span>Payout</span>
                        <span
                          className={`admin-payments-status ${getStatusClass(
                            payoutStatus,
                          )}`}
                        >
                          {formatLabel(payoutStatus)}
                        </span>
                      </div>
                    </div>

                    <div className="admin-payments-mobile-footer">
                      <span>{formatDateTime(order.createdAt)}</span>

                      <button
                        type="button"
                        className="admin-payments-view-button"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <i className="bi bi-eye" aria-hidden="true" />
                        View details
                      </button>
                    </div>
                  </article>
                );
              })}

              {paginatedOrders.length === 0 && (
                <div className="admin-payments-empty">
                  <span>
                    <i className="bi bi-receipt" aria-hidden="true" />
                  </span>
                  <strong>No financial records found</strong>
                  <p>Try changing your search or clearing the filters.</p>
                </div>
              )}
            </div>

            <div className="admin-payments-pagination">
              <span>
                Showing{" "}
                {filteredOrders.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
                {"–"}
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredOrders.length,
                )} of {filteredOrders.length} records
              </span>

              <div className="admin-payments-pagination-controls">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  <i className="bi bi-chevron-left" aria-hidden="true" />
                </button>

                <span>
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
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedOrder && (
        <div
          className="admin-payments-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <section
            className="admin-payments-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-payments-modal-title"
          >
            <div className="admin-payments-modal-header">
              <div>
                <span className="admin-payments-section-eyebrow">
                  FINANCIAL RECORD
                </span>
                <h2 id="admin-payments-modal-title">Order payment details</h2>
                <p>{selectedOrder.id}</p>
              </div>

              <button
                type="button"
                className="admin-payments-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close details"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <div className="admin-payments-modal-body">
              <div className="admin-payments-detail-highlight">
                <span>Recorded payment amount</span>
                <strong>
                  {formatCurrency(getPaymentAmount(selectedPayment))}
                </strong>
                <span
                  className={`admin-payments-status ${getStatusClass(
                    selectedOrder.paymentStatus,
                  )}`}
                >
                  {formatLabel(selectedOrder.paymentStatus || "PENDING")}
                </span>
              </div>

              <div className="admin-payments-detail-section">
                <h3>Payment information</h3>

                <DetailRow
                  label="Payment ID"
                  value={selectedOrder.paymentID || selectedPayment?.id}
                />

                <DetailRow
                  label="Payment reference"
                  value={
                    selectedOrder.paymentReference ||
                    selectedPayment?.reference ||
                    selectedPayment?.paymentReference
                  }
                />

                <DetailRow
                  label="Payment status"
                  value={formatLabel(selectedOrder.paymentStatus || "PENDING")}
                />

                <DetailRow
                  label="Order created"
                  value={formatDateTime(selectedOrder.createdAt)}
                />
              </div>

              <div className="admin-payments-detail-section">
                <h3>Customer and courier</h3>

                <DetailRow
                  label="Customer"
                  value={
                    selectedUser
                      ? [selectedUser.firstName, selectedUser.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        selectedUser.email ||
                        selectedOrder.userID
                      : selectedOrder.userID
                  }
                />

                <DetailRow
                  label="Courier"
                  value={
                    selectedCourier
                      ? [selectedCourier.firstName, selectedCourier.lastName]
                          .filter(Boolean)
                          .join(" ") || selectedOrder.assignedCourierId
                      : selectedOrder.assignedCourierId || "Unassigned"
                  }
                />
              </div>

              <div className="admin-payments-detail-section">
                <h3>Funds and payout</h3>

                <DetailRow
                  label="Courier earnings"
                  value={formatCurrency(selectedOrder.courierEarnings)}
                />

                <DetailRow
                  label="Earnings allocation"
                  value={formatLabel(
                    selectedOrder.earningsAllocationStatus || "PENDING",
                  )}
                />

                <DetailRow
                  label="Funds status"
                  value={formatLabel(getFundsStatus(selectedOrder))}
                />

                <DetailRow
                  label="Funds released"
                  value={formatCurrency(selectedOrder.fundsReleasedAmount)}
                />

                <DetailRow
                  label="Payout status"
                  value={formatLabel(getPayoutStatus(selectedOrder))}
                />

                <DetailRow
                  label="Funds release blocked"
                  value={selectedOrder.fundsReleaseBlocked ? "Yes" : "No"}
                />

                {selectedOrder.fundsHoldReason && (
                  <DetailRow
                    label="Hold reason"
                    value={selectedOrder.fundsHoldReason}
                  />
                )}

                <DetailRow
                  label="Funds held at"
                  value={formatDateTime(selectedOrder.fundsHeldAt)}
                />

                <DetailRow
                  label="Funds released at"
                  value={formatDateTime(selectedOrder.fundsReleasedAt)}
                />
              </div>

              <div className="admin-payments-detail-section">
                <h3>Related wallet transactions</h3>

                {selectedTransactions.length > 0 ? (
                  <div className="admin-payments-transactions">
                    {selectedTransactions.map((transaction) => (
                      <div
                        className="admin-payments-transaction"
                        key={transaction.id}
                      >
                        <div>
                          <strong>
                            {formatLabel(transaction.type || "Transaction")}
                          </strong>
                          <span>
                            {transaction.reference ||
                              transaction.description ||
                              transaction.id}
                          </span>
                          <small>{formatDateTime(transaction.createdAt)}</small>
                        </div>

                        <div>
                          <strong>{formatCurrency(transaction.amount)}</strong>
                          <span
                            className={`admin-payments-status ${getStatusClass(
                              transaction.status,
                            )}`}
                          >
                            {formatLabel(transaction.status || "PENDING")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-payments-no-transactions">
                    No wallet transactions are linked to this order.
                  </p>
                )}
              </div>
            </div>

            <div className="admin-payments-modal-footer">
              <button
                type="button"
                className="admin-payments-modal-done"
                onClick={() => setSelectedOrder(null)}
              >
                Close details
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, description, variant }) {
  return (
    <div className={`admin-payments-stat-card ${variant || ""}`}>
      <div className="admin-payments-stat-top">
        <span className="admin-payments-stat-icon">
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>

        <span className="admin-payments-stat-label">{label}</span>
      </div>

      <strong className="admin-payments-stat-value">{value}</strong>

      <span className="admin-payments-stat-description">{description}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="admin-payments-detail-row">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export default PaymentsAndFunds;
