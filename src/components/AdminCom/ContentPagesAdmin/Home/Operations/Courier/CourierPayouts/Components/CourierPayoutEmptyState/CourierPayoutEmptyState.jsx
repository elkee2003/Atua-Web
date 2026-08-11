import React from "react";

import { FaMoneyBillWave, FaSearch } from "react-icons/fa";

import "./CourierPayoutEmptyState.css";

function CourierPayoutEmptyState({
  title = "No Payouts Yet",
  message = "This courier does not have any payout transactions yet.",
  filtered = false,
  onClear,
}) {
  /*
    ==========================================================
    ICON
    ==========================================================
    */

  const Icon = filtered ? FaSearch : FaMoneyBillWave;

  /*
    ==========================================================
    DEFAULT CONTENT
    ==========================================================
    */

  const displayTitle = filtered ? "No Matching Payouts" : title;

  const displayMessage = filtered
    ? "No payout transactions match the current search or filter."
    : message;

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <div className="courierPayoutEmptyState">
      {/* ==================================================
                ICON
            ================================================== */}

      <div className="courierPayoutEmptyState-icon">
        <Icon />
      </div>

      {/* ==================================================
                CONTENT
            ================================================== */}

      <div className="courierPayoutEmptyState-content">
        <h3>{displayTitle}</h3>

        <p>{displayMessage}</p>
      </div>

      {/* ==================================================
                CLEAR FILTERS
            ================================================== */}

      {filtered && typeof onClear === "function" && (
        <button
          type="button"
          className="courierPayoutEmptyState-button"
          onClick={onClear}
        >
          <span>Clear Search & Filters</span>
        </button>
      )}
    </div>
  );
}

export default CourierPayoutEmptyState;
