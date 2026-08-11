import React, { useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBoxOpen,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaStar,
  FaTimesCircle,
} from "react-icons/fa";

import "./CourierPerformance.css";

const PERIODS = [
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
];

const ACTIVE_ORDER_STATUSES = [
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

const getDateStart = (days) => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  date.setDate(date.getDate() - (days - 1));

  return date;
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;

  return `₦${amount.toLocaleString("en-NG", {
    maximumFractionDigits: 0,
  })}`;
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString("en-NG");
};

const formatDate = (date) => {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
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

function CourierPerformance({
  courier = null,
  orders = [],
  period = "30D",
  onPeriodChange,
}) {
  const [localPeriod, setLocalPeriod] = useState(period);

  /*
    ==========================================================
    ACTIVE PERIOD
    ==========================================================
    */

  const selectedPeriod =
    PERIODS.find((item) => item.key === localPeriod) || PERIODS[1];

  /*
    ==========================================================
    PERIOD CHANGE
    ==========================================================
    */

  const handlePeriodChange = (value) => {
    setLocalPeriod(value);

    if (onPeriodChange) {
      onPeriodChange(value);
    }
  };

  /*
    ==========================================================
    FILTER ORDERS
    ==========================================================
    */

  const periodOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }

    const start = getDateStart(selectedPeriod.days);

    return orders.filter((order) => {
      const date = getOrderDate(order);

      if (!date) {
        return false;
      }

      return date >= start;
    });
  }, [orders, selectedPeriod.days]);

  /*
    ==========================================================
    PERFORMANCE DATA
    ==========================================================
    */

  const performance = useMemo(() => {
    const total = periodOrders.length;

    const delivered = periodOrders.filter(
      (order) => order?.status === "DELIVERED",
    ).length;

    const cancelled = periodOrders.filter(
      (order) => order?.status === "CANCELLED",
    ).length;

    const disputed = periodOrders.filter(
      (order) => order?.status === "DISPUTED",
    ).length;

    const active = periodOrders.filter((order) =>
      ACTIVE_ORDER_STATUSES.includes(order?.status),
    ).length;

    const earnings = periodOrders.reduce((totalAmount, order) => {
      if (order?.status !== "DELIVERED") {
        return totalAmount;
      }

      return totalAmount + (Number(order?.courierEarnings) || 0);
    }, 0);

    const completionRate = total > 0 ? (delivered / total) * 100 : 0;

    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

    const averageEarning = delivered > 0 ? earnings / delivered : 0;

    return {
      total,
      delivered,
      cancelled,
      disputed,
      active,
      earnings,
      completionRate,
      cancellationRate,
      averageEarning,
    };
  }, [periodOrders]);

  /*
    ==========================================================
    DAILY CHART DATA
    ==========================================================
    */

  const chartData = useMemo(() => {
    const days = selectedPeriod.days;

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

      const earnings = dayOrders.reduce((totalAmount, order) => {
        if (order?.status !== "DELIVERED") {
          return totalAmount;
        }

        return totalAmount + (Number(order?.courierEarnings) || 0);
      }, 0);

      data.push({
        date,
        label: formatDate(date),
        orders: dayOrders.length,
        delivered,
        earnings,
      });
    }

    return data;
  }, [periodOrders, selectedPeriod.days]);

  /*
    ==========================================================
    CHART MAXIMUM
    ==========================================================
    */

  const maxDelivered = Math.max(...chartData.map((item) => item.delivered), 1);

  /*
    ==========================================================
    CHART LABEL FREQUENCY
    ==========================================================
    */

  const labelStep =
    selectedPeriod.days <= 7 ? 1 : selectedPeriod.days <= 30 ? 5 : 15;

  /*
    ==========================================================
    RATING
    ==========================================================
    */

  const rating = Number(courier?.averageRating) || 0;

  const reviewCount = Number(courier?.reviewCount) || 0;

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierPerformance">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierPerformance-header">
        <div className="courierPerformance-heading">
          <div className="courierPerformance-titleIcon">
            <FaChartLine />
          </div>

          <div>
            <h2>Courier Performance</h2>

            <p>Delivery activity and earnings performance</p>
          </div>
        </div>

        {/* ==============================================
                    PERIOD SELECTOR
                ============================================== */}

        <div className="courierPerformance-periods">
          {PERIODS.map((item) => (
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
                TOP PERFORMANCE SUMMARY
            ================================================== */}

      <div className="courierPerformance-summary">
        {/* ==============================================
                    COMPLETION RATE
                ============================================== */}

        <div className="courierPerformance-summaryCard">
          <div className="courierPerformance-summaryIcon completion">
            <FaCheckCircle />
          </div>

          <div className="courierPerformance-summaryContent">
            <span>Completion Rate</span>

            <strong>{performance.completionRate.toFixed(1)}%</strong>

            <small>{formatNumber(performance.delivered)} delivered</small>
          </div>
        </div>

        {/* ==============================================
                    EARNINGS
                ============================================== */}

        <div className="courierPerformance-summaryCard">
          <div className="courierPerformance-summaryIcon earnings">
            <FaMoneyBillWave />
          </div>

          <div className="courierPerformance-summaryContent">
            <span>Earnings</span>

            <strong>{formatCurrency(performance.earnings)}</strong>

            <small>
              {formatCurrency(performance.averageEarning)} avg. per delivery
            </small>
          </div>
        </div>

        {/* ==============================================
                    ACTIVE ORDERS
                ============================================== */}

        <div className="courierPerformance-summaryCard">
          <div className="courierPerformance-summaryIcon active">
            <FaBoxOpen />
          </div>

          <div className="courierPerformance-summaryContent">
            <span>Active Orders</span>

            <strong>{formatNumber(performance.active)}</strong>

            <small>Currently in progress</small>
          </div>
        </div>

        {/* ==============================================
                    RATING
                ============================================== */}

        <div className="courierPerformance-summaryCard">
          <div className="courierPerformance-summaryIcon rating">
            <FaStar />
          </div>

          <div className="courierPerformance-summaryContent">
            <span>Courier Rating</span>

            <strong>{rating > 0 ? rating.toFixed(1) : "—"}</strong>

            <small>
              {reviewCount > 0
                ? `${formatNumber(reviewCount)} reviews`
                : "No reviews yet"}
            </small>
          </div>
        </div>
      </div>

      {/* ==================================================
                MAIN PERFORMANCE AREA
            ================================================== */}

      <div className="courierPerformance-main">
        {/* ==================================================
                    DELIVERY ACTIVITY CHART
                ================================================== */}

        <div className="courierPerformance-chartCard">
          <div className="courierPerformance-cardHeader">
            <div>
              <h3>Delivery Activity</h3>

              <p>Completed deliveries over time</p>
            </div>

            <div className="courierPerformance-chartLegend">
              <span>
                <i className="deliveredDot" />
                Delivered
              </span>
            </div>
          </div>

          {/* ==============================================
                        CHART
                    ============================================== */}

          <div className="courierPerformance-chart">
            <div className="courierPerformance-yAxis">
              <span>{maxDelivered}</span>

              <span>{Math.round(maxDelivered * 0.75)}</span>

              <span>{Math.round(maxDelivered * 0.5)}</span>

              <span>{Math.round(maxDelivered * 0.25)}</span>

              <span>0</span>
            </div>

            <div className="courierPerformance-bars">
              {chartData.map((item, index) => {
                const height = (item.delivered / maxDelivered) * 100;

                const showLabel = index % labelStep === 0;

                return (
                  <div
                    key={item.date.toISOString()}
                    className="courierPerformance-barGroup"
                  >
                    <div className="courierPerformance-barArea">
                      <div
                        className="courierPerformance-bar"
                        style={{
                          height: `${Math.max(
                            height,
                            item.delivered > 0 ? 5 : 0,
                          )}%`,
                        }}
                        title={`${item.delivered} delivered`}
                      />
                    </div>

                    <span className={showLabel ? "visible" : ""}>
                      {showLabel ? item.label : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================================================
                    ORDER OUTCOME
                ================================================== */}

        <div className="courierPerformance-outcomeCard">
          <div className="courierPerformance-cardHeader">
            <div>
              <h3>Order Outcome</h3>

              <p>Breakdown of courier orders</p>
            </div>
          </div>

          {/* ==============================================
                        OUTCOME ITEMS
                    ============================================== */}

          <div className="courierPerformance-outcomes">
            <div className="courierPerformance-outcome">
              <div className="courierPerformance-outcomeLabel">
                <span className="outcomeIcon delivered">
                  <FaCheckCircle />
                </span>

                <span>Delivered</span>
              </div>

              <strong>{formatNumber(performance.delivered)}</strong>
            </div>

            <div className="courierPerformance-progress">
              <span
                style={{
                  width: `${Math.min(performance.completionRate, 100)}%`,
                }}
              />
            </div>

            <div className="courierPerformance-outcome">
              <div className="courierPerformance-outcomeLabel">
                <span className="outcomeIcon cancelled">
                  <FaTimesCircle />
                </span>

                <span>Cancelled</span>
              </div>

              <strong>{formatNumber(performance.cancelled)}</strong>
            </div>

            <div className="courierPerformance-progress cancelled">
              <span
                style={{
                  width: `${Math.min(performance.cancellationRate, 100)}%`,
                }}
              />
            </div>

            <div className="courierPerformance-outcome">
              <div className="courierPerformance-outcomeLabel">
                <span className="outcomeIcon disputed">
                  <FaClock />
                </span>

                <span>Disputed</span>
              </div>

              <strong>{formatNumber(performance.disputed)}</strong>
            </div>

            <div className="courierPerformance-progress disputed">
              <span
                style={{
                  width:
                    performance.total > 0
                      ? `${Math.min(
                          (performance.disputed / performance.total) * 100,
                          100,
                        )}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          {/* ==============================================
                        TOTAL
                    ============================================== */}

          <div className="courierPerformance-totalOrders">
            <span>Total orders</span>

            <strong>{formatNumber(performance.total)}</strong>
          </div>
        </div>
      </div>

      {/* ==================================================
                EARNINGS TREND
            ================================================== */}

      <div className="courierPerformance-earningsCard">
        <div className="courierPerformance-cardHeader">
          <div>
            <h3>Earnings Activity</h3>

            <p>Courier earnings from completed deliveries</p>
          </div>

          <div className="courierPerformance-earningsTotal">
            <span>Period earnings</span>

            <strong>{formatCurrency(performance.earnings)}</strong>
          </div>
        </div>

        <div className="courierPerformance-earningsList">
          {chartData.length === 0 ? (
            <div className="courierPerformance-empty">
              No earnings data available for this period.
            </div>
          ) : (
            chartData.map((item) => (
              <div
                key={item.date.toISOString()}
                className="courierPerformance-earningsRow"
              >
                <span className="courierPerformance-earningsDate">
                  {item.label}
                </span>

                <div className="courierPerformance-earningsTrack">
                  <span
                    style={{
                      width:
                        performance.earnings > 0
                          ? `${Math.min(
                              (item.earnings /
                                Math.max(
                                  ...chartData.map(
                                    (chartItem) => chartItem.earnings,
                                  ),
                                  1,
                                )) *
                                100,
                              100,
                            )}%`
                          : "0%",
                    }}
                  />
                </div>

                <strong>{formatCurrency(item.earnings)}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ==================================================
                PERFORMANCE FOOTER
            ================================================== */}

      <div className="courierPerformance-footer">
        <div>
          <FaArrowUp />

          <span>
            {performance.completionRate >= 80
              ? "Strong delivery completion"
              : "Delivery completion needs attention"}
          </span>
        </div>

        <div>
          <FaArrowDown />

          <span>
            {performance.cancellationRate <= 5
              ? "Low cancellation activity"
              : "Cancellation activity is elevated"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default CourierPerformance;
