import React from "react";
import { FaSearch, FaUsers } from "react-icons/fa";

import "./EmptyState.css";

function EmptyState({
  title = "No results found",
  description = "There are no records to display.",
  icon,
  actionLabel,
  onAction,
}) {
  const displayIcon = icon || <FaUsers />;

  return (
    <div className="emptyState">
      {/* ==================================================
                ICON
            ================================================== */}

      <div className="emptyState-icon">{displayIcon}</div>

      {/* ==================================================
                CONTENT
            ================================================== */}

      <div className="emptyState-content">
        <h3 className="emptyState-title">{title}</h3>

        <p className="emptyState-description">{description}</p>
      </div>

      {/* ==================================================
                OPTIONAL ACTION
            ================================================== */}

      {actionLabel && onAction && (
        <button type="button" className="emptyState-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
