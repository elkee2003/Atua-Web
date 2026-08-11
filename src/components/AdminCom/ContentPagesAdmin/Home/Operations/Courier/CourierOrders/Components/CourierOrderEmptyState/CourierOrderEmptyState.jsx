import React from "react";
import { FaBoxOpen, FaSearch, FaFilter, FaArrowLeft } from "react-icons/fa";

import "./CourierOrderEmptyState.css";

function CourierOrderEmptyState({
  type = "NO_ORDERS",
  title,
  description,
  actionLabel,
  onAction,
}) {
  /*
    ==========================================================
    EMPTY STATE CONFIGURATION
    ==========================================================
    */

  const emptyStates = {
    NO_ORDERS: {
      icon: FaBoxOpen,
      defaultTitle: "No orders yet",
      defaultDescription: "This courier has not been assigned any orders yet.",
      iconClass: "noOrders",
    },

    NO_SEARCH_RESULTS: {
      icon: FaSearch,
      defaultTitle: "No matching orders",
      defaultDescription: "We couldn't find any orders matching your search.",
      iconClass: "search",
    },

    NO_FILTER_RESULTS: {
      icon: FaFilter,
      defaultTitle: "No orders in this category",
      defaultDescription:
        "There are currently no orders matching the selected filter.",
      iconClass: "filter",
    },
  };

  /*
    ==========================================================
    GET CURRENT STATE
    ==========================================================
    */

  const currentState = emptyStates[type] || emptyStates.NO_ORDERS;

  const Icon = currentState.icon;

  /*
    ==========================================================
    ACTION
    ==========================================================
    */

  const handleAction = () => {
    if (typeof onAction === "function") {
      onAction();
    }
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section
      className={`courierOrderEmptyState courierOrderEmptyState-${currentState.iconClass}`}
    >
      {/* ==================================================
                ICON
            ================================================== */}

      <div className="courierOrderEmptyState-icon">
        <Icon />
      </div>

      {/* ==================================================
                CONTENT
            ================================================== */}

      <div className="courierOrderEmptyState-content">
        <h3>{title || currentState.defaultTitle}</h3>

        <p>{description || currentState.defaultDescription}</p>
      </div>

      {/* ==================================================
                ACTION
            ================================================== */}

      {actionLabel && typeof onAction === "function" && (
        <button
          type="button"
          className="courierOrderEmptyState-action"
          onClick={handleAction}
        >
          {type !== "NO_ORDERS" && <FaArrowLeft />}

          <span>{actionLabel}</span>
        </button>
      )}
    </section>
  );
}

export default CourierOrderEmptyState;
