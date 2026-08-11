import React, { useMemo } from "react";
import {
  FaBox,
  FaCheckCircle,
  FaChartLine,
  FaMoneyBillWave,
  FaWallet,
  FaStar,
} from "react-icons/fa";

import "./CourierAnalyticsStats.css";

function CourierAnalyticsStats({
  courier = null,
  orders = [],
  wallet = null,
  payouts = [],
  period = "ALL",
}) {
  /*
    ==========================================================
    PERIOD HELPERS
    ==========================================================
    */

  const getPeriodStart = () => {
    const now = new Date();

    switch (period) {
      case "TODAY": {
        const start = new Date(now);

        start.setHours(0, 0, 0, 0);

        return start;
      }

      case "7D": {
        const start = new Date(now);

        start.setDate(start.getDate() - 7);

        return start;
      }

      case "30D": {
        const start = new Date(now);

        start.setDate(start.getDate() - 30);

        return start;
      }

      case "90D": {
        const start = new Date(now);

        start.setDate(start.getDate() - 90);

        return start;
      }

      case "ALL":
      default:
        return null;
    }
  };

  /*
    ==========================================================
    FILTER ORDERS BY PERIOD
    ==========================================================
    */

  const periodOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }

    const periodStart = getPeriodStart();

    if (!periodStart) {
      return orders;
    }

    return orders.filter((order) => {
      if (!order?.createdAt) {
        return false;
      }

      const createdAt = new Date(order.createdAt);

      return createdAt >= periodStart;
    });
  }, [orders, period]);

  /*
    ==========================================================
    ORDER STATISTICS
    ==========================================================
    */

  const orderStats = useMemo(() => {
    const total = periodOrders.length;

    const delivered = periodOrders.filter(
      (order) => order.status === "DELIVERED",
    ).length;

    const cancelled = periodOrders.filter(
      (order) => order.status === "CANCELLED",
    ).length;

    const disputed = periodOrders.filter(
      (order) => order.status === "DISPUTED",
    ).length;

    const active = periodOrders.filter((order) =>
      [
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
      ].includes(order.status),
    ).length;

    const completionRate = total > 0 ? (delivered / total) * 100 : 0;

    return {
      total,
      delivered,
      cancelled,
      disputed,
      active,
      completionRate,
    };
  }, [periodOrders]);

  /*
    ==========================================================
    COURIER EARNINGS
    ==========================================================
    
    We calculate period earnings from the actual
    Order.courierEarnings field.

    Earnings are counted for DELIVERED orders only.
    ==========================================================
    */

  const periodEarnings = useMemo(() => {
    return periodOrders.reduce((total, order) => {
      if (order?.status !== "DELIVERED") {
        return total;
      }

      return total + (Number(order?.courierEarnings) || 0);
    }, 0);
  }, [periodOrders]);

  /*
    ==========================================================
    PAID OUT
    ==========================================================
    
    Payout model:
        courierID
        amount
        status

    We count PAID payouts.
    ==========================================================
    */

  const paidOut = useMemo(() => {
    if (!Array.isArray(payouts)) {
      return 0;
    }

    return payouts.reduce((total, payout) => {
      if (payout?.status !== "PAID") {
        return total;
      }

      return total + (Number(payout?.amount) || 0);
    }, 0);
  }, [payouts]);

  /*
    ==========================================================
    WALLET DATA
    ==========================================================
    */

  const pendingBalance = Number(wallet?.pendingBalance) || 0;

  const walletTotalEarnings = Number(wallet?.totalEarnings) || 0;

  const walletBalance = Number(wallet?.balance) || 0;

  /*
    ==========================================================
    RATING
    ==========================================================
    
    Courier.averageRating is already maintained on the
    Courier model, so we use it directly rather than
    calculating it from reviews here.
    ==========================================================
    */

  const rating = Number(courier?.averageRating) || 0;

  const reviewCount = Number(courier?.reviewCount) || 0;

  /*
    ==========================================================
    FORMAT CURRENCY
    ==========================================================
    */

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;

    return `₦${amount.toLocaleString("en-NG", {
      maximumFractionDigits: 2,
    })}`;
  };

  /*
    ==========================================================
    FORMAT NUMBER
    ==========================================================
    */

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-NG");
  };

  /*
    ==========================================================
    PERIOD LABEL
    ==========================================================
    */

  const periodLabels = {
    TODAY: "Today",

    "7D": "Last 7 days",

    "30D": "Last 30 days",

    "90D": "Last 90 days",

    ALL: "All time",
  };

  const periodLabel = periodLabels[period] || "All time";

  /*
    ==========================================================
    STAT CARDS
    ==========================================================
    */

  const stats = [
    {
      key: "orders",

      label: "Total Orders",

      value: formatNumber(orderStats.total),

      description: `Orders assigned during ${periodLabel.toLowerCase()}`,

      icon: FaBox,

      className: "orders",
    },

    {
      key: "delivered",

      label: "Delivered",

      value: formatNumber(orderStats.delivered),

      description: "Successfully completed orders",

      icon: FaCheckCircle,

      className: "delivered",
    },

    {
      key: "completion",

      label: "Completion Rate",

      value: `${orderStats.completionRate.toFixed(1)}%`,

      description: "Delivered orders versus assigned orders",

      icon: FaChartLine,

      className: "completion",
    },

    {
      key: "earnings",

      label: "Courier Earnings",

      value: formatCurrency(periodEarnings),

      description: `Delivered-order earnings for ${periodLabel.toLowerCase()}`,

      icon: FaMoneyBillWave,

      className: "earnings",
    },

    {
      key: "pending",

      label: "Pending Balance",

      value: formatCurrency(pendingBalance),

      description: "Current wallet funds awaiting release",

      icon: FaWallet,

      className: "pending",
    },

    {
      key: "rating",

      label: "Average Rating",

      value: rating > 0 ? rating.toFixed(1) : "—",

      description:
        reviewCount > 0
          ? `${formatNumber(reviewCount)} review${reviewCount === 1 ? "" : "s"}`
          : "No reviews yet",

      icon: FaStar,

      className: "rating",
    },
  ];

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierAnalyticsStats">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierAnalyticsStats-header">
        <div>
          <h2>Performance Overview</h2>

          <p>Key courier metrics for {periodLabel.toLowerCase()}</p>
        </div>

        {/* ==============================================
                    SMALL SECONDARY INFORMATION
                ============================================== */}

        <div className="courierAnalyticsStats-period">{periodLabel}</div>
      </div>

      {/* ==================================================
                STATS GRID
            ================================================== */}

      <div className="courierAnalyticsStats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.key}
              className={`
                                courierAnalyticsStats-card
                                courierAnalyticsStats-card-${stat.className}
                            `}
            >
              {/* ======================================
                                ICON
                            ====================================== */}

              <div className="courierAnalyticsStats-icon">
                <Icon />
              </div>

              {/* ======================================
                                CONTENT
                            ====================================== */}

              <div className="courierAnalyticsStats-content">
                <span className="courierAnalyticsStats-label">
                  {stat.label}
                </span>

                <strong className="courierAnalyticsStats-value">
                  {stat.value}
                </strong>

                <span className="courierAnalyticsStats-description">
                  {stat.description}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* ==================================================
                SECONDARY METRICS
            ================================================== */}

      <div className="courierAnalyticsStats-secondary">
        <div className="courierAnalyticsStats-secondaryItem">
          <span>Active Orders</span>

          <strong>{formatNumber(orderStats.active)}</strong>
        </div>

        <div className="courierAnalyticsStats-secondaryItem">
          <span>Cancelled</span>

          <strong>{formatNumber(orderStats.cancelled)}</strong>
        </div>

        <div className="courierAnalyticsStats-secondaryItem">
          <span>Disputed</span>

          <strong>{formatNumber(orderStats.disputed)}</strong>
        </div>

        <div className="courierAnalyticsStats-secondaryItem">
          <span>Wallet Balance</span>

          <strong>{formatCurrency(walletBalance)}</strong>
        </div>

        <div className="courierAnalyticsStats-secondaryItem">
          <span>Lifetime Earnings</span>

          <strong>{formatCurrency(walletTotalEarnings)}</strong>
        </div>

        <div className="courierAnalyticsStats-secondaryItem">
          <span>Paid Out</span>

          <strong>{formatCurrency(paidOut)}</strong>
        </div>
      </div>
    </section>
  );
}

export default CourierAnalyticsStats;
