import React from "react";

import { FaFilter, FaTimes } from "react-icons/fa";

import "./CourierWalletFilters.css";

function CourierWalletFilters({
  typeFilter = "ALL",
  setTypeFilter,
  statusFilter = "ALL",
  setStatusFilter,
  periodFilter = "ALL",
  setPeriodFilter,
}) {
  /*
  ==========================================================
  RESET FILTERS
  ==========================================================
  */

  const handleReset = () => {
    setTypeFilter?.("ALL");
    setStatusFilter?.("ALL");
    setPeriodFilter?.("ALL");
  };

  /*
  ==========================================================
  ACTIVE FILTER CHECK
  ==========================================================
  */

  const hasActiveFilters =
    typeFilter !== "ALL" || statusFilter !== "ALL" || periodFilter !== "ALL";

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierWalletFilters">
      {/* ==================================================
          LEFT
      ================================================== */}

      <div className="courierWalletFilters-left">
        <div className="courierWalletFilters-title">
          <div className="courierWalletFilters-icon">
            <FaFilter />
          </div>

          <span>Filters</span>
        </div>

        {/* ==================================================
            TRANSACTION TYPE
        ================================================== */}

        <div className="courierWalletFilters-field">
          <label htmlFor="wallet-transaction-type">Type</label>

          <select
            id="wallet-transaction-type"
            value={typeFilter}
            onChange={(event) => setTypeFilter?.(event.target.value)}
          >
            <option value="ALL">All Types</option>

            <option value="CREDIT">Credits</option>

            <option value="DEBIT">Debits</option>
          </select>
        </div>

        {/* ==================================================
            STATUS
        ================================================== */}

        <div className="courierWalletFilters-field">
          <label htmlFor="wallet-transaction-status">Status</label>

          <select
            id="wallet-transaction-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter?.(event.target.value)}
          >
            <option value="ALL">All Statuses</option>

            <option value="PENDING">Pending</option>

            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* ==================================================
            PERIOD
        ================================================== */}

        <div className="courierWalletFilters-field">
          <label htmlFor="wallet-transaction-period">Period</label>

          <select
            id="wallet-transaction-period"
            value={periodFilter}
            onChange={(event) => setPeriodFilter?.(event.target.value)}
          >
            <option value="ALL">All Time</option>

            <option value="7D">Last 7 Days</option>

            <option value="30D">Last 30 Days</option>

            <option value="90D">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* ==================================================
          RIGHT
      ================================================== */}

      <div className="courierWalletFilters-right">
        {hasActiveFilters && (
          <button
            type="button"
            className="courierWalletFilters-reset"
            onClick={handleReset}
          >
            <FaTimes />

            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </section>
  );
}

export default CourierWalletFilters;
