import React from "react";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaTimesCircle,
  FaWallet,
} from "react-icons/fa";

import "./CourierProfileStats.css";

function CourierProfileStats({ stats }) {
  /*
    ==========================================================
    SAFETY
    ==========================================================
    */

  const safeStats = stats || {};

  /*
    ==========================================================
    VALUES
    ==========================================================
    */

  const totalOrders = Number(safeStats.totalOrders) || 0;

  const completedOrders = Number(safeStats.completedOrders) || 0;

  const cancelledOrders = Number(safeStats.cancelledOrders) || 0;

  const activeOrders = Number(safeStats.activeOrders) || 0;

  const totalOrderValue = Number(safeStats.totalOrderValue) || 0;

  const averageRating =
    safeStats.averageRating !== undefined && safeStats.averageRating !== null
      ? safeStats.averageRating
      : "0.0";

  const reviewCount = Number(safeStats.reviewCount) || 0;

  /*
    ==========================================================
    CURRENCY FORMAT
    ==========================================================
    */

  const formattedOrderValue = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(totalOrderValue);

  /*
    ==========================================================
    COMPLETION RATE
    ==========================================================
    */

  const completionRate =
    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  /*
    ==========================================================
    STAT CARDS
    ==========================================================
    */

  const statCards = [
    {
      key: "total-orders",
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
      description: "Orders assigned",
      icon: <FaBoxOpen />,
      className: "orders",
    },

    {
      key: "completed-orders",
      label: "Completed",
      value: completedOrders.toLocaleString(),
      description: `${completionRate}% completion`,
      icon: <FaCheckCircle />,
      className: "completed",
    },

    {
      key: "active-orders",
      label: "Active",
      value: activeOrders.toLocaleString(),
      description: "Currently active",
      icon: <FaClock />,
      className: "active",
    },

    {
      key: "cancelled-orders",
      label: "Cancelled",
      value: cancelledOrders.toLocaleString(),
      description: "Cancelled orders",
      icon: <FaTimesCircle />,
      className: "cancelled",
    },

    {
      key: "rating",
      label: "Rating",
      value: averageRating,
      description: `${reviewCount.toLocaleString()} ${
        reviewCount === 1 ? "review" : "reviews"
      }`,
      icon: <FaStar />,
      className: "rating",
    },

    {
      key: "order-value",
      label: "Order Value",
      value: formattedOrderValue,
      description: "Total order value",
      icon: <FaWallet />,
      className: "value",
    },
  ];

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierProfileStats">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierProfileStats-header">
        <div>
          <h2 className="courierProfileStats-title">Performance Overview</h2>

          <p className="courierProfileStats-description">
            A quick overview of this courier's activity and performance.
          </p>
        </div>
      </div>

      {/* ==================================================
                STAT GRID
            ================================================== */}

      <div className="courierProfileStats-grid">
        {statCards.map((stat) => (
          <div
            key={stat.key}
            className={`courierProfileStats-card courierProfileStats-card-${stat.className}`}
          >
            {/* ======================================
                            ICON
                        ====================================== */}

            <div className="courierProfileStats-icon">{stat.icon}</div>

            {/* ======================================
                            CONTENT
                        ====================================== */}

            <div className="courierProfileStats-content">
              <span className="courierProfileStats-label">{stat.label}</span>

              <strong className="courierProfileStats-value">
                {stat.value}
              </strong>

              <span className="courierProfileStats-description">
                {stat.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CourierProfileStats;
