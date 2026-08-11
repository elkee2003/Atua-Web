import React from "react";

import { FaChartBar, FaFilter, FaRedo } from "react-icons/fa";

import "./CourierAnalyticsEmptyState.css";

function CourierAnalyticsEmptyState({
  title = "No analytics data available",
  description = "There is not enough data to display analytics for the selected period and filters.",
  actionLabel = "Reset Filters",
  onAction,
  icon = "chart",
  compact = false,
}) {
  /*
    ==========================================================
    ICON
    ==========================================================
    */

  const renderIcon = () => {
    switch (icon) {
      case "filter":
        return <FaFilter />;

      case "refresh":
        return <FaRedo />;

      case "chart":

      default:
        return <FaChartBar />;
    }
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <div
      className={`
                courierAnalyticsEmptyState
                ${compact ? "compact" : ""}
            `}
    >
      {/* ==================================================
                ICON
            ================================================== */}

      <div className="courierAnalyticsEmptyState-icon">{renderIcon()}</div>

      {/* ==================================================
                CONTENT
            ================================================== */}

      <div className="courierAnalyticsEmptyState-content">
        <h3>{title}</h3>

        <p>{description}</p>

        {/* ==================================================
                    ACTION
                ================================================== */}

        {onAction && actionLabel && (
          <button
            type="button"
            className="courierAnalyticsEmptyState-button"
            onClick={onAction}
          >
            <FaRedo />

            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default CourierAnalyticsEmptyState;
