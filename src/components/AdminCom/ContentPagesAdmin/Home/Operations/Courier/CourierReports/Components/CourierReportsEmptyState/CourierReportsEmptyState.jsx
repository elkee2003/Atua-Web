import React from "react";

import { FaFileAlt, FaFlag, FaRedo, FaSearch } from "react-icons/fa";

import "./CourierReportsEmptyState.css";

function CourierReportsEmptyState({
  type = "empty",
  title,
  message,
  onClearFilters,
  onRefresh,
  loading = false,
}) {
  /*
  ==========================================================
  EMPTY STATE TYPE
  ==========================================================
  */

  const isSearchEmpty = type === "search";

  const isFilterEmpty = type === "filter";

  /*
  ==========================================================
  DEFAULT CONTENT
  ==========================================================
  */

  const defaultTitle = isSearchEmpty
    ? "No Reports Found"
    : isFilterEmpty
      ? "No Matching Reports"
      : "No Courier Reports";

  const defaultMessage = isSearchEmpty
    ? "No courier reports match your current search. Try a different search term."
    : isFilterEmpty
      ? "There are no reports matching the selected filters for this courier."
      : "There are currently no reports associated with this courier.";

  /*
  ==========================================================
  ICON
  ==========================================================
  */

  const renderIcon = () => {
    if (isSearchEmpty) {
      return <FaSearch />;
    }

    if (isFilterEmpty) {
      return <FaFlag />;
    }

    return <FaFileAlt />;
  };

  /*
  ==========================================================
  ACTION AVAILABILITY
  ==========================================================
  */

  const hasClearAction = typeof onClearFilters === "function";

  const hasRefreshAction = typeof onRefresh === "function";

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierReportsEmptyState">
      {/* ==================================================
          ICON
      ================================================== */}

      <div className="courierReportsEmptyState-icon">{renderIcon()}</div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="courierReportsEmptyState-content">
        <h2>{title || defaultTitle}</h2>

        <p>{message || defaultMessage}</p>
      </div>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      {(hasClearAction || hasRefreshAction) && (
        <div className="courierReportsEmptyState-actions">
          {/* ==================================================
              CLEAR FILTERS
          ================================================== */}

          {hasClearAction && (
            <button
              type="button"
              className="courierReportsEmptyState-primaryButton"
              onClick={onClearFilters}
              disabled={loading}
            >
              <FaRedo />

              <span>Clear Filters</span>
            </button>
          )}

          {/* ==================================================
              REFRESH
          ================================================== */}

          {hasRefreshAction && (
            <button
              type="button"
              className="courierReportsEmptyState-secondaryButton"
              onClick={onRefresh}
              disabled={loading}
            >
              <FaRedo
                className={loading ? "courierReportsEmptyState-spinning" : ""}
              />

              <span>{loading ? "Refreshing..." : "Refresh Reports"}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default CourierReportsEmptyState;
