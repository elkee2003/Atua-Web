import React, { useMemo, useState } from "react";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaClock,
  FaExchangeAlt,
} from "react-icons/fa";

import "./CourierEarningsAnalytics.css";

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
HELPERS
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

const getDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

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

/*
==========================================================
COMPONENT
==========================================================
*/

function CourierEarningsAnalytics({
  orders = [],
  wallet = null,
  payouts = [],
  period = "30D",
  onPeriodChange,
}) {
  const [localPeriod, setLocalPeriod] = useState(period);

  /*
    ==========================================================
    SELECTED PERIOD
    ==========================================================
    */

  const selectedPeriod =
    PERIOD_OPTIONS.find((item) => item.key === localPeriod) ||
    PERIOD_OPTIONS[1];

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

    const periodStart = getPeriodStart(selectedPeriod.days);

    if (!periodStart) {
      return orders;
    }

    return orders.filter((order) => {
      const date = getDate(order?.createdAt);

      if (!date) {
        return false;
      }

      return date >= periodStart;
    });
  }, [orders, selectedPeriod.days]);

  /*
    ==========================================================
    DELIVERED ORDERS
    ==========================================================
    */

  const deliveredOrders = useMemo(() => {
    return periodOrders.filter((order) => order?.status === "DELIVERED");
  }, [periodOrders]);

  /*
    ==========================================================
    EARNINGS SUMMARY
    ==========================================================
    */

  const earningsSummary = useMemo(() => {
    const courierEarnings = deliveredOrders.reduce(
      (total, order) => total + (Number(order?.courierEarnings) || 0),
      0,
    );

    const orderValue = periodOrders.reduce(
      (total, order) => total + (Number(order?.totalPrice) || 0),
      0,
    );

    const averagePerDelivery =
      deliveredOrders.length > 0 ? courierEarnings / deliveredOrders.length : 0;

    const totalOrders = periodOrders.length;

    const deliveredCount = deliveredOrders.length;

    const earningsRate =
      orderValue > 0 ? (courierEarnings / orderValue) * 100 : 0;

    return {
      courierEarnings,
      orderValue,
      averagePerDelivery,
      totalOrders,
      deliveredCount,
      earningsRate,
    };
  }, [periodOrders, deliveredOrders]);

  /*
    ==========================================================
    DAILY EARNINGS
    ==========================================================
    */

  const dailyEarnings = useMemo(() => {
    /*
        All-time is still displayed using the latest
        30 days for the visual trend.

        The headline values remain all-time.
        */

    const days = selectedPeriod.days || 30;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const data = [];

    for (let index = days - 1; index >= 0; index--) {
      const date = new Date(today);

      date.setDate(today.getDate() - index);

      const dayOrders = periodOrders.filter((order) => {
        const orderDate = getDate(order?.createdAt);

        if (!orderDate) {
          return false;
        }

        return (
          orderDate.getFullYear() === date.getFullYear() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getDate() === date.getDate()
        );
      });

      const earnings = dayOrders.reduce((total, order) => {
        if (order?.status !== "DELIVERED") {
          return total;
        }

        return total + (Number(order?.courierEarnings) || 0);
      }, 0);

      const delivered = dayOrders.filter(
        (order) => order?.status === "DELIVERED",
      ).length;

      data.push({
        date,
        label: formatDate(date),
        earnings,
        delivered,
      });
    }

    return data;
  }, [periodOrders, selectedPeriod.days]);

  /*
    ==========================================================
    MAX DAILY EARNINGS
    ==========================================================
    */

  const maxDailyEarnings = Math.max(
    ...dailyEarnings.map((item) => item.earnings),
    1,
  );

  /*
    ==========================================================
    WALLET VALUES
    ==========================================================
    */

  const pendingBalance = Number(wallet?.pendingBalance) || 0;

  const walletBalance = Number(wallet?.balance) || 0;

  const lifetimeEarnings = Number(wallet?.totalEarnings) || 0;

  /*
    ==========================================================
    PAYOUT ANALYTICS
    ==========================================================
    */

  const payoutSummary = useMemo(() => {
    if (!Array.isArray(payouts)) {
      return {
        paid: 0,
        processing: 0,
        pending: 0,
        failed: 0,
        paidCount: 0,
      };
    }

    let paid = 0;

    let processing = 0;

    let pending = 0;

    let failed = 0;

    let paidCount = 0;

    payouts.forEach((payout) => {
      const amount = Number(payout?.amount) || 0;

      switch (payout?.status) {
        case "PAID":
          paid += amount;

          paidCount += 1;

          break;

        case "PROCESSING":
          processing += amount;

          break;

        case "PENDING":
          pending += amount;

          break;

        case "FAILED":
          failed += amount;

          break;

        default:
          break;
      }
    });

    return {
      paid,
      processing,
      pending,
      failed,
      paidCount,
    };
  }, [payouts]);

  /*
    ==========================================================
    EARNINGS TREND
    ==========================================================
    */

  const earningsTrend = useMemo(() => {
    /*
        Compare first half against second half.

        This is deliberately a simple trend indicator;
        it does not pretend to be a financial forecast.
        */

    if (dailyEarnings.length < 2) {
      return {
        direction: "neutral",
        percentage: 0,
      };
    }

    const midpoint = Math.floor(dailyEarnings.length / 2);

    const firstHalf = dailyEarnings
      .slice(0, midpoint)
      .reduce((sum, item) => sum + item.earnings, 0);

    const secondHalf = dailyEarnings
      .slice(midpoint)
      .reduce((sum, item) => sum + item.earnings, 0);

    if (firstHalf === 0 && secondHalf === 0) {
      return {
        direction: "neutral",
        percentage: 0,
      };
    }

    if (firstHalf === 0) {
      return {
        direction: "up",
        percentage: 100,
      };
    }

    const percentage = ((secondHalf - firstHalf) / firstHalf) * 100;

    return {
      direction: percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral",

      percentage: Math.abs(percentage),
    };
  }, [dailyEarnings]);

  /*
    ==========================================================
    PERIOD LABEL
    ==========================================================
    */

  const periodLabel = selectedPeriod.label;

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierEarningsAnalytics">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierEarningsAnalytics-header">
        <div className="courierEarningsAnalytics-heading">
          <div className="courierEarningsAnalytics-titleIcon">
            <FaMoneyBillWave />
          </div>

          <div>
            <h2>Earnings Analytics</h2>

            <p>Courier earnings, wallet and payout performance</p>
          </div>
        </div>

        {/* ==============================================
                    PERIOD
                ============================================== */}

        <div className="courierEarningsAnalytics-periods">
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
                EARNINGS SUMMARY
            ================================================== */}

      <div className="courierEarningsAnalytics-summary">
        {/* ==============================================
                    PERIOD EARNINGS
                ============================================== */}

        <div className="courierEarningsAnalytics-summaryCard">
          <div className="courierEarningsAnalytics-summaryIcon earnings">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>Courier Earnings</span>

            <strong>{formatCurrency(earningsSummary.courierEarnings)}</strong>

            <small>{periodLabel}</small>
          </div>
        </div>

        {/* ==============================================
                    AVERAGE
                ============================================== */}

        <div className="courierEarningsAnalytics-summaryCard">
          <div className="courierEarningsAnalytics-summaryIcon average">
            <FaChartLine />
          </div>

          <div>
            <span>Avg. Per Delivery</span>

            <strong>
              {formatCurrency(earningsSummary.averagePerDelivery)}
            </strong>

            <small>
              {formatNumber(earningsSummary.deliveredCount)} completed
            </small>
          </div>
        </div>

        {/* ==============================================
                    PENDING
                ============================================== */}

        <div className="courierEarningsAnalytics-summaryCard">
          <div className="courierEarningsAnalytics-summaryIcon pending">
            <FaClock />
          </div>

          <div>
            <span>Pending Balance</span>

            <strong>{formatCurrency(pendingBalance)}</strong>

            <small>Awaiting release</small>
          </div>
        </div>

        {/* ==============================================
                    PAID OUT
                ============================================== */}

        <div className="courierEarningsAnalytics-summaryCard">
          <div className="courierEarningsAnalytics-summaryIcon paid">
            <FaCheckCircle />
          </div>

          <div>
            <span>Paid Out</span>

            <strong>{formatCurrency(payoutSummary.paid)}</strong>

            <small>{formatNumber(payoutSummary.paidCount)} paid payouts</small>
          </div>
        </div>
      </div>

      {/* ==================================================
                MAIN GRID
            ================================================== */}

      <div className="courierEarningsAnalytics-main">
        {/* ==================================================
                    EARNINGS CHART
                ================================================== */}

        <div className="courierEarningsAnalytics-card">
          <div className="courierEarningsAnalytics-cardHeader">
            <div>
              <h3>Earnings Trend</h3>

              <p>Earnings from completed deliveries</p>
            </div>

            <div
              className={`
                                courierEarningsAnalytics-trend
                                ${earningsTrend.direction}
                            `}
            >
              {earningsTrend.direction === "up" ? (
                <FaArrowUp />
              ) : earningsTrend.direction === "down" ? (
                <FaArrowDown />
              ) : (
                <FaExchangeAlt />
              )}

              <span>{earningsTrend.percentage.toFixed(1)}%</span>
            </div>
          </div>

          {/* ==============================================
                        CHART
                    ============================================== */}

          <div className="courierEarningsAnalytics-chart">
            <div className="courierEarningsAnalytics-yAxis">
              <span>{formatCurrency(maxDailyEarnings)}</span>

              <span>{formatCurrency(maxDailyEarnings * 0.75)}</span>

              <span>{formatCurrency(maxDailyEarnings * 0.5)}</span>

              <span>{formatCurrency(maxDailyEarnings * 0.25)}</span>

              <span>₦0</span>
            </div>

            <div className="courierEarningsAnalytics-bars">
              {dailyEarnings.map((item, index) => {
                const height = (item.earnings / maxDailyEarnings) * 100;

                const showLabel =
                  selectedPeriod.days <= 7
                    ? true
                    : selectedPeriod.days <= 30
                      ? index % 5 === 0
                      : index % 15 === 0;

                return (
                  <div
                    key={item.date.toISOString()}
                    className="courierEarningsAnalytics-barGroup"
                  >
                    <div className="courierEarningsAnalytics-barArea">
                      <div
                        className="courierEarningsAnalytics-bar"
                        style={{
                          height:
                            item.earnings > 0
                              ? `${Math.max(height, 5)}%`
                              : "0%",
                        }}
                        title={`${formatCurrency(item.earnings)} earned`}
                      />
                    </div>

                    <span>{showLabel ? item.label : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================================================
                    WALLET OVERVIEW
                ================================================== */}

        <div className="courierEarningsAnalytics-card">
          <div className="courierEarningsAnalytics-cardHeader">
            <div>
              <h3>Wallet Overview</h3>

              <p>Current courier wallet position</p>
            </div>

            <FaWallet className="courierEarningsAnalytics-headerIcon" />
          </div>

          <div className="courierEarningsAnalytics-wallet">
            <div className="courierEarningsAnalytics-walletRow">
              <div>
                <span>Available Balance</span>

                <small>Current wallet balance</small>
              </div>

              <strong>{formatCurrency(walletBalance)}</strong>
            </div>

            <div className="courierEarningsAnalytics-walletRow">
              <div>
                <span>Pending Balance</span>

                <small>Awaiting release</small>
              </div>

              <strong className="pending">
                {formatCurrency(pendingBalance)}
              </strong>
            </div>

            <div className="courierEarningsAnalytics-walletRow">
              <div>
                <span>Lifetime Earnings</span>

                <small>Recorded in wallet</small>
              </div>

              <strong>{formatCurrency(lifetimeEarnings)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
                FINANCIAL BREAKDOWN
            ================================================== */}

      <div className="courierEarningsAnalytics-card">
        <div className="courierEarningsAnalytics-cardHeader">
          <div>
            <h3>Financial Breakdown</h3>

            <p>Order value versus courier earnings</p>
          </div>
        </div>

        <div className="courierEarningsAnalytics-financialGrid">
          {/* ==========================================
                        ORDER VALUE
                    ========================================== */}

          <div className="courierEarningsAnalytics-financialItem">
            <div className="courierEarningsAnalytics-financialLabel">
              <span className="orderValue">Order Value</span>

              <strong>{formatCurrency(earningsSummary.orderValue)}</strong>
            </div>

            <div className="courierEarningsAnalytics-financialTrack">
              <span
                className="orderValue"
                style={{
                  width: earningsSummary.orderValue > 0 ? "100%" : "0%",
                }}
              />
            </div>
          </div>

          {/* ==========================================
                        COURIER EARNINGS
                    ========================================== */}

          <div className="courierEarningsAnalytics-financialItem">
            <div className="courierEarningsAnalytics-financialLabel">
              <span className="courierEarning">Courier Earnings</span>

              <strong>{formatCurrency(earningsSummary.courierEarnings)}</strong>
            </div>

            <div className="courierEarningsAnalytics-financialTrack">
              <span
                className="courierEarning"
                style={{
                  width: `${Math.min(earningsSummary.earningsRate, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="courierEarningsAnalytics-earningsRatio">
          <span>Courier earnings represent</span>

          <strong>{earningsSummary.earningsRate.toFixed(1)}%</strong>

          <span>of recorded order value in this period.</span>
        </div>
      </div>

      {/* ==================================================
                PAYOUT STATUS
            ================================================== */}

      <div className="courierEarningsAnalytics-card">
        <div className="courierEarningsAnalytics-cardHeader">
          <div>
            <h3>Payout Status</h3>

            <p>Current payout distribution</p>
          </div>
        </div>

        <div className="courierEarningsAnalytics-payoutGrid">
          <div>
            <span>Paid</span>

            <strong className="paid">
              {formatCurrency(payoutSummary.paid)}
            </strong>
          </div>

          <div>
            <span>Processing</span>

            <strong className="processing">
              {formatCurrency(payoutSummary.processing)}
            </strong>
          </div>

          <div>
            <span>Pending</span>

            <strong className="pending">
              {formatCurrency(payoutSummary.pending)}
            </strong>
          </div>

          <div>
            <span>Failed</span>

            <strong className="failed">
              {formatCurrency(payoutSummary.failed)}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourierEarningsAnalytics;
