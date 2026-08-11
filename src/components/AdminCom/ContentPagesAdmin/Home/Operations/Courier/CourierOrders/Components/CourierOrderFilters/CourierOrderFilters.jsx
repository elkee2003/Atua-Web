import React from "react";
import {
  FaBox,
  FaClock,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

import "./CourierOrderFilters.css";

function CourierOrderFilters({ statusFilter = "ALL", setStatusFilter }) {
  /*
    ==========================================================
    FILTER OPTIONS
    ==========================================================
    */

  const filters = [
    {
      key: "ALL",
      label: "All Orders",
      icon: FaBox,
    },
    {
      key: "PENDING",
      label: "Pending",
      icon: FaClock,
    },
    {
      key: "IN_TRANSIT",
      label: "In Transit",
      icon: FaTruck,
    },
    {
      key: "DELIVERED",
      label: "Delivered",
      icon: FaCheckCircle,
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      icon: FaTimesCircle,
    },
  ];

  /*
    ==========================================================
    CHANGE FILTER
    ==========================================================
    */

  const handleFilterChange = (filter) => {
    if (typeof setStatusFilter !== "function") {
      return;
    }

    setStatusFilter(filter);
  };

  /*
    ==========================================================
    CLEAR FILTER
    ==========================================================
    */

  const handleClearFilter = () => {
    if (typeof setStatusFilter !== "function") {
      return;
    }

    setStatusFilter("ALL");
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierOrderFilters">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierOrderFilters-header">
        <div className="courierOrderFilters-title">
          <FaFilter />

          <span>Filter Orders</span>
        </div>

        {/* ==============================================
                    CLEAR FILTER
                ============================================== */}

        {statusFilter !== "ALL" && (
          <button
            type="button"
            className="courierOrderFilters-clear"
            onClick={handleClearFilter}
          >
            <FaTimes />

            <span>Clear</span>
          </button>
        )}
      </div>

      {/* ==================================================
                FILTER OPTIONS
            ================================================== */}

      <div
        className="courierOrderFilters-list"
        role="group"
        aria-label="Order status filters"
      >
        {filters.map((filter) => {
          const Icon = filter.icon;

          const isActive = statusFilter === filter.key;

          return (
            <button
              key={filter.key}
              type="button"
              className={`
                                courierOrderFilters-option
                                courierOrderFilters-${filter.key.toLowerCase()}
                                ${isActive ? "active" : ""}
                            `}
              onClick={() => handleFilterChange(filter.key)}
              aria-pressed={isActive}
            >
              <span className="courierOrderFilters-icon">
                <Icon />
              </span>

              <span className="courierOrderFilters-label">{filter.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default CourierOrderFilters;
