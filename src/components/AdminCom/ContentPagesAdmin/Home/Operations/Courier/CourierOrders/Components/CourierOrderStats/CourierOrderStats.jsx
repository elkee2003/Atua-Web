import React from "react";
import {
  FaBox,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaTimesCircle,
} from "react-icons/fa";

import "./CourierOrderStats.css";

function CourierOrderStats({
  stats = {},
  statusFilter = "ALL",
  setStatusFilter,
}) {
  /*
    ==========================================================
    STATS
    ==========================================================
    */

  const total = stats.total ?? 0;
  const pending = stats.pending ?? 0;
  const inTransit = stats.inTransit ?? 0;
  const delivered = stats.delivered ?? 0;
  const cancelled = stats.cancelled ?? 0;

  /*
    ==========================================================
    HANDLE FILTER
    ==========================================================
    */

  const handleFilter = (filter) => {
    if (typeof setStatusFilter !== "function") {
      return;
    }

    /*
        Clicking the currently active card returns to ALL.
        */

    if (statusFilter === filter) {
      setStatusFilter("ALL");
      return;
    }

    setStatusFilter(filter);
  };

  /*
    ==========================================================
    STAT CARD
    ==========================================================
    */

  const statCards = [
    {
      key: "ALL",
      label: "Total Orders",
      value: total,
      icon: FaBox,
      className: "total",
    },
    {
      key: "PENDING",
      label: "Pending",
      value: pending,
      icon: FaClock,
      className: "pending",
    },
    {
      key: "IN_TRANSIT",
      label: "In Transit",
      value: inTransit,
      icon: FaTruck,
      className: "inTransit",
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      value: delivered,
      icon: FaCheckCircle,
      className: "delivered",
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      value: cancelled,
      icon: FaTimesCircle,
      className: "cancelled",
    },
  ];

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierOrderStats">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierOrderStats-header">
        <div>
          <h2>Order Overview</h2>

          <p>Performance summary for this courier's orders.</p>
        </div>
      </div>

      {/* ==================================================
                STAT GRID
            ================================================== */}

      <div className="courierOrderStats-grid">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          const isActive = statusFilter === stat.key;

          return (
            <button
              key={stat.key}
              type="button"
              className={`
                                courierOrderStats-card
                                ${stat.className}
                                ${isActive ? "active" : ""}
                            `}
              onClick={() => handleFilter(stat.key)}
              aria-pressed={isActive}
            >
              {/* ==================================
                                ICON
                            ================================== */}

              <div className="courierOrderStats-icon">
                <Icon />
              </div>

              {/* ==================================
                                INFORMATION
                            ================================== */}

              <div className="courierOrderStats-content">
                <span className="courierOrderStats-label">{stat.label}</span>

                <strong className="courierOrderStats-value">
                  {stat.value}
                </strong>
              </div>

              {/* ==================================
                                ACTIVE INDICATOR
                            ================================== */}

              {isActive && (
                <span className="courierOrderStats-activeIndicator" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default CourierOrderStats;
