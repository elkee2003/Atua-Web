import React from "react";

import { FaChevronDown, FaFilter, FaTimes } from "react-icons/fa";

import "./CourierPayoutFilters.css";

function CourierPayoutFilters({ statusFilter = "ALL", setStatusFilter }) {
  /*
    ==========================================================
    STATUS OPTIONS
    ==========================================================
    */

  const statusOptions = [
    {
      value: "ALL",
      label: "All Statuses",
    },
    {
      value: "PENDING",
      label: "Pending",
    },
    {
      value: "PROCESSING",
      label: "Processing",
    },
    {
      value: "PAID",
      label: "Paid",
    },
    {
      value: "FAILED",
      label: "Failed",
    },
  ];

  /*
    ==========================================================
    STATUS CHANGE
    ==========================================================
    */

  const handleStatusChange = (event) => {
    if (!setStatusFilter) {
      return;
    }

    setStatusFilter(event.target.value);
  };

  /*
    ==========================================================
    CLEAR FILTER
    ==========================================================
    */

  const handleClear = () => {
    if (!setStatusFilter) {
      return;
    }

    setStatusFilter("ALL");
  };

  /*
    ==========================================================
    ACTIVE FILTER
    ==========================================================
    */

  const hasActiveFilter = statusFilter !== "ALL";

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierPayoutFilters">
      {/* ==================================================
                FILTER HEADER
            ================================================== */}

      <div className="courierPayoutFilters-header">
        <div className="courierPayoutFilters-title">
          <div className="courierPayoutFilters-titleIcon">
            <FaFilter />
          </div>

          <div className="courierPayoutFilters-titleText">
            <span>Filters</span>

            <small>Filter payout transactions by status.</small>
          </div>
        </div>

        {/* ==================================================
                    CLEAR
                ================================================== */}

        {hasActiveFilter && (
          <button
            type="button"
            className="courierPayoutFilters-clearButton"
            onClick={handleClear}
          >
            <FaTimes />

            <span>Clear</span>
          </button>
        )}
      </div>

      {/* ==================================================
                STATUS FILTER
            ================================================== */}

      <div className="courierPayoutFilters-controls">
        <div className="courierPayoutFilters-control">
          <label
            htmlFor="courier-payout-status"
            className="courierPayoutFilters-label"
          >
            Payout Status
          </label>

          <div className="courierPayoutFilters-selectWrapper">
            <select
              id="courier-payout-status"
              value={statusFilter}
              onChange={handleStatusChange}
              className="courierPayoutFilters-select"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <FaChevronDown className="courierPayoutFilters-selectIcon" />
          </div>
        </div>
      </div>

      {/* ==================================================
                ACTIVE FILTER
            ================================================== */}

      {hasActiveFilter && (
        <div className="courierPayoutFilters-active">
          <span>Status:</span>

          <strong>
            {statusOptions.find((option) => option.value === statusFilter)
              ?.label || statusFilter}
          </strong>
        </div>
      )}
    </section>
  );
}

export default CourierPayoutFilters;
