// CourierOrderAnalytics answers "What happened to the courier's orders?"

import React, { useMemo, useState } from "react";
import {
  FaBox,
  FaCheckCircle,
  FaTimesCircle,
  FaRoute,
  FaClock,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaArrowRight,
} from "react-icons/fa";

import "./CourierOrderAnalytics.css";

/*
==========================================================
ORDER STATUS GROUPS
==========================================================
*/

const ACTIVE_STATUSES = [
  "READY_FOR_PICKUP",
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

const SUCCESS_STATUSES = ["DELIVERED"];

const CANCELLED_STATUSES = ["CANCELLED"];

const DISPUTED_STATUSES = ["DISPUTED"];

/*
==========================================================
PERIOD OPTIONS
==========================================================
*/

const PERIOD_OPTIONS = [
  {
    key: "7D",
    label: "7 Days",
    days: 7,
  },
  {
    key: "30D",
    label: "30 Days",
    days: 30,
  },
  {
    key: "90D",
    label: "90 Days",
    days: 90,
  },
  {
    key: "ALL",
    label: "All Time",
    days: null,
  },
];

/*
==========================================================
DATE HELPERS
==========================================================
*/

const getPeriodStart = (days) => {
  if (!days) {
    return null;
  }

  const date = new Date();

  date.setHours(0, 0, 0, 0);

  date.setDate(date.getDate() - (days - 1));

  return date;
};

const getOrderDate = (order) => {
  if (!order?.createdAt) {
    return null;
  }

  const date = new Date(order.createdAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/*
==========================================================
FORMATTING
==========================================================
*/

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString("en-NG");
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;

  return `₦${amount.toLocaleString("en-NG", {
    maximumFractionDigits: 0,
  })}`;
};

/*
==========================================================
STATUS LABEL
==========================================================
*/

const formatStatus = (status) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/*
==========================================================
COMPONENT
==========================================================
*/

function CourierOrderAnalytics({
  orders = [],
  period = "30D",
  onPeriodChange,
}) {
  const [localPeriod, setLocalPeriod] = useState(period);

  /*
    ========================================================
    PERIOD
    ========================================================
    */

  const selectedPeriod =
    PERIOD_OPTIONS.find((item) => item.key === localPeriod) ||
    PERIOD_OPTIONS[1];

  /*
    ========================================================
    PERIOD CHANGE
    ========================================================
    */

  const handlePeriodChange = (value) => {
    setLocalPeriod(value);

    if (onPeriodChange) {
      onPeriodChange(value);
    }
  };

  /*
    ========================================================
    FILTER ORDERS
    ========================================================
    */

  const periodOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }

    const periodStart = getPeriodStart(selectedPeriod.days);

    if (!periodStart) {
      return orders;
    }

    return orders.filter((order) => {
      const date = getOrderDate(order);

      if (!date) {
        return false;
      }

      return date >= periodStart;
    });
  }, [orders, selectedPeriod.days]);

  /*
    ========================================================
    ORDER SUMMARY
    ========================================================
    */

  const summary = useMemo(() => {
    const total = periodOrders.length;

    const delivered = periodOrders.filter((order) =>
      SUCCESS_STATUSES.includes(order?.status),
    ).length;

    const active = periodOrders.filter((order) =>
      ACTIVE_STATUSES.includes(order?.status),
    ).length;

    const cancelled = periodOrders.filter((order) =>
      CANCELLED_STATUSES.includes(order?.status),
    ).length;

    const disputed = periodOrders.filter((order) =>
      DISPUTED_STATUSES.includes(order?.status),
    ).length;

    const completionRate = total > 0 ? (delivered / total) * 100 : 0;

    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

    const totalOrderValue = periodOrders.reduce(
      (sum, order) => sum + (Number(order?.totalPrice) || 0),
      0,
    );

    const courierEarnings = periodOrders.reduce(
      (sum, order) => sum + (Number(order?.courierEarnings) || 0),
      0,
    );

    return {
      total,
      delivered,
      active,
      cancelled,
      disputed,
      completionRate,
      cancellationRate,
      totalOrderValue,
      courierEarnings,
    };
  }, [periodOrders]);

  /*
    ========================================================
    STATUS BREAKDOWN
    ========================================================
    */

  const statusBreakdown = useMemo(() => {
    const statusMap = {};

    periodOrders.forEach((order) => {
      const status = order?.status || "UNKNOWN";

      if (!statusMap[status]) {
        statusMap[status] = 0;
      }

      statusMap[status] += 1;
    });

    return Object.entries(statusMap)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([status, count]) => ({
        status,

        count,

        percentage: summary.total > 0 ? (count / summary.total) * 100 : 0,
      }));
  }, [periodOrders, summary.total]);

  /*
    ========================================================
    DAILY ORDER ACTIVITY
    ========================================================
    */

  const dailyActivity = useMemo(() => {
    const days = selectedPeriod.days || 30;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const data = [];

    for (let index = days - 1; index >= 0; index--) {
      const date = new Date(today);

      date.setDate(today.getDate() - index);

      const dayOrders = periodOrders.filter((order) => {
        const orderDate = getOrderDate(order);

        if (!orderDate) {
          return false;
        }

        return (
          orderDate.getFullYear() === date.getFullYear() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getDate() === date.getDate()
        );
      });

      const delivered = dayOrders.filter(
        (order) => order?.status === "DELIVERED",
      ).length;

      const cancelled = dayOrders.filter(
        (order) => order?.status === "CANCELLED",
      ).length;

      const active = dayOrders.filter((order) =>
        ACTIVE_STATUSES.includes(order?.status),
      ).length;

      data.push({
        date,
        orders: dayOrders.length,
        delivered,
        cancelled,
        active,
      });
    }

    return data;
  }, [periodOrders, selectedPeriod.days]);

  /*
    ========================================================
    MAX DAILY ORDERS
    ========================================================
    */

  const maxDailyOrders = Math.max(
    ...dailyActivity.map((item) => item.orders),
    1,
  );

  /*
    ========================================================
    PAYMENT / FUNDS BREAKDOWN
    ========================================================
    */

  const fundsBreakdown = useMemo(() => {
    const released = periodOrders.filter(
      (order) => order?.fundsStatus === "RELEASED",
    ).length;

    const pending = periodOrders.filter(
      (order) => order?.fundsStatus === "PENDING",
    ).length;

    const held = periodOrders.filter(
      (order) => order?.fundsStatus === "HELD",
    ).length;

    const payoutCompleted = periodOrders.filter(
      (order) => order?.payoutStatus === "PAID",
    ).length;

    return {
      released,
      pending,
      held,
      payoutCompleted,
    };
  }, [periodOrders]);

  /*
    ========================================================
    RENDER
    ========================================================
    */

  return (
    <section className="courierOrderAnalytics">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierOrderAnalytics-header">
        <div className="courierOrderAnalytics-heading">
          <div className="courierOrderAnalytics-titleIcon">
            <FaBox />
          </div>

          <div>
            <h2>Order Analytics</h2>

            <p>Detailed breakdown of this courier's order activity</p>
          </div>
        </div>

        {/* ==============================================
                    PERIOD
                ============================================== */}

        <div className="courierOrderAnalytics-periods">
          {PERIOD_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={localPeriod === item.key ? "active" : ""}
              onClick={() => handlePeriodChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

      <div className="courierOrderAnalytics-summary">
        <div className="courierOrderAnalytics-summaryCard">
          <div className="courierOrderAnalytics-summaryIcon total">
            <FaBox />
          </div>

          <div>
            <span>Total Orders</span>

            <strong>{formatNumber(summary.total)}</strong>
          </div>
        </div>

        <div className="courierOrderAnalytics-summaryCard">
          <div className="courierOrderAnalytics-summaryIcon delivered">
            <FaCheckCircle />
          </div>

          <div>
            <span>Delivered</span>

            <strong>{formatNumber(summary.delivered)}</strong>
          </div>
        </div>

        <div className="courierOrderAnalytics-summaryCard">
          <div className="courierOrderAnalytics-summaryIcon active">
            <FaRoute />
          </div>

          <div>
            <span>Active</span>

            <strong>{formatNumber(summary.active)}</strong>
          </div>
        </div>

        <div className="courierOrderAnalytics-summaryCard">
          <div className="courierOrderAnalytics-summaryIcon cancelled">
            <FaTimesCircle />
          </div>

          <div>
            <span>Cancelled</span>

            <strong>{formatNumber(summary.cancelled)}</strong>
          </div>
        </div>
      </div>

      {/* ==================================================
                MAIN GRID
            ================================================== */}

      <div className="courierOrderAnalytics-main">
        {/* ==================================================
                    DELIVERY ACTIVITY
                ================================================== */}

        <div className="courierOrderAnalytics-card courierOrderAnalytics-activityCard">
          <div className="courierOrderAnalytics-cardHeader">
            <div>
              <h3>Order Activity</h3>

              <p>Daily order volume</p>
            </div>

            <span>{selectedPeriod.label}</span>
          </div>

          <div className="courierOrderAnalytics-chart">
            <div className="courierOrderAnalytics-yAxis">
              <span>{maxDailyOrders}</span>

              <span>{Math.round(maxDailyOrders * 0.75)}</span>

              <span>{Math.round(maxDailyOrders * 0.5)}</span>

              <span>{Math.round(maxDailyOrders * 0.25)}</span>

              <span>0</span>
            </div>

            <div className="courierOrderAnalytics-bars">
              {dailyActivity.map((item, index) => {
                const height = (item.orders / maxDailyOrders) * 100;

                const showLabel =
                  selectedPeriod.days <= 7
                    ? true
                    : selectedPeriod.days <= 30
                      ? index % 5 === 0
                      : index % 15 === 0;

                return (
                  <div
                    key={item.date.toISOString()}
                    className="courierOrderAnalytics-barGroup"
                  >
                    <div className="courierOrderAnalytics-barArea">
                      <div
                        className="courierOrderAnalytics-bar"
                        style={{
                          height: `${
                            item.orders > 0 ? Math.max(height, 5) : 0
                          }%`,
                        }}
                        title={`${item.orders} orders`}
                      />
                    </div>

                    <span>
                      {showLabel
                        ? item.date.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })
                        : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="courierOrderAnalytics-chartLegend">
            <span>
              <i className="orders" />
              Orders
            </span>

            <span>
              <i className="delivered" />
              Delivered
            </span>
          </div>
        </div>

        {/* ==================================================
                    PERFORMANCE BREAKDOWN
                ================================================== */}

        <div className="courierOrderAnalytics-card">
          <div className="courierOrderAnalytics-cardHeader">
            <div>
              <h3>Order Outcomes</h3>

              <p>Current period breakdown</p>
            </div>
          </div>

          <div className="courierOrderAnalytics-outcomes">
            <div className="courierOrderAnalytics-outcomeRow">
              <div className="courierOrderAnalytics-outcomeLabel">
                <span className="delivered">
                  <FaCheckCircle />
                </span>

                <span>Completion Rate</span>
              </div>

              <strong>{summary.completionRate.toFixed(1)}%</strong>
            </div>

            <div className="courierOrderAnalytics-progress">
              <span
                className="delivered"
                style={{
                  width: `${Math.min(summary.completionRate, 100)}%`,
                }}
              />
            </div>

            <div className="courierOrderAnalytics-outcomeRow">
              <div className="courierOrderAnalytics-outcomeLabel">
                <span className="cancelled">
                  <FaTimesCircle />
                </span>

                <span>Cancellation Rate</span>
              </div>

              <strong>{summary.cancellationRate.toFixed(1)}%</strong>
            </div>

            <div className="courierOrderAnalytics-progress">
              <span
                className="cancelled"
                style={{
                  width: `${Math.min(summary.cancellationRate, 100)}%`,
                }}
              />
            </div>

            <div className="courierOrderAnalytics-outcomeRow">
              <div className="courierOrderAnalytics-outcomeLabel">
                <span className="disputed">
                  <FaExclamationTriangle />
                </span>

                <span>Disputed Orders</span>
              </div>

              <strong>{formatNumber(summary.disputed)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
                STATUS BREAKDOWN
            ================================================== */}

      <div className="courierOrderAnalytics-card">
        <div className="courierOrderAnalytics-cardHeader">
          <div>
            <h3>Order Status Breakdown</h3>

            <p>Distribution of orders by current status</p>
          </div>
        </div>

        {statusBreakdown.length === 0 ? (
          <div className="courierOrderAnalytics-empty">
            No order data available for this period.
          </div>
        ) : (
          <div className="courierOrderAnalytics-statusGrid">
            {statusBreakdown.map((item) => (
              <div
                key={item.status}
                className="courierOrderAnalytics-statusItem"
              >
                <div className="courierOrderAnalytics-statusTop">
                  <span>{formatStatus(item.status)}</span>

                  <strong>{formatNumber(item.count)}</strong>
                </div>

                <div className="courierOrderAnalytics-statusTrack">
                  <span
                    style={{
                      width: `${Math.min(item.percentage, 100)}%`,
                    }}
                  />
                </div>

                <small>{item.percentage.toFixed(1)}%</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
                FINANCIAL ORDER ANALYTICS
            ================================================== */}

      <div className="courierOrderAnalytics-financialGrid">
        <div className="courierOrderAnalytics-financialCard">
          <div className="courierOrderAnalytics-financialIcon orderValue">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>Total Order Value</span>

            <strong>{formatCurrency(summary.totalOrderValue)}</strong>

            <small>Total value of orders in this period</small>
          </div>
        </div>

        <div className="courierOrderAnalytics-financialCard">
          <div className="courierOrderAnalytics-financialIcon earnings">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>Courier Earnings</span>

            <strong>{formatCurrency(summary.courierEarnings)}</strong>

            <small>Earnings attached to these orders</small>
          </div>
        </div>
      </div>

      {/* ==================================================
                FUNDS / PAYOUT STATUS
            ================================================== */}

      <div className="courierOrderAnalytics-card">
        <div className="courierOrderAnalytics-cardHeader">
          <div>
            <h3>Funds & Payout Status</h3>

            <p>Financial state of courier orders</p>
          </div>
        </div>

        <div className="courierOrderAnalytics-fundsGrid">
          <div>
            <span>Released</span>

            <strong>{formatNumber(fundsBreakdown.released)}</strong>
          </div>

          <div>
            <span>Pending</span>

            <strong>{formatNumber(fundsBreakdown.pending)}</strong>
          </div>

          <div>
            <span>Held</span>

            <strong>{formatNumber(fundsBreakdown.held)}</strong>
          </div>

          <div>
            <span>Payout Completed</span>

            <strong>{formatNumber(fundsBreakdown.payoutCompleted)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourierOrderAnalytics;
