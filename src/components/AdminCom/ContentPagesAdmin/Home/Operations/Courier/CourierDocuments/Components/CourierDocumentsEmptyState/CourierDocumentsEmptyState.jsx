import React from "react";

import { FaFileAlt, FaExclamationCircle, FaRedo } from "react-icons/fa";

import "./CourierDocumentsEmptyState.css";

function CourierDocumentsEmptyState({
  title = "No Documents Available",
  message = "There are currently no courier documents available to display.",
  type = "empty",
  onRetry,
  retryLabel = "Try Again",
}) {
  /*
  ==========================================================
  STATE ICON
  ==========================================================
  */

  const getIcon = () => {
    if (type === "error") {
      return <FaExclamationCircle />;
    }

    return <FaFileAlt />;
  };

  /*
  ==========================================================
  STATE CLASS
  ==========================================================
  */

  const stateClass = type === "error" ? "error" : "empty";

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className={`courierDocumentsEmptyState ${stateClass}`}>
      {/* ==================================================
          ICON
      ================================================== */}

      <div className="courierDocumentsEmptyState-icon">{getIcon()}</div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="courierDocumentsEmptyState-content">
        <h2>{title}</h2>

        <p>{message}</p>

        {/* ==================================================
            RETRY
        ================================================== */}

        {onRetry && (
          <button
            type="button"
            className="courierDocumentsEmptyState-retry"
            onClick={onRetry}
          >
            <FaRedo />

            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    </section>
  );
}

export default CourierDocumentsEmptyState;
