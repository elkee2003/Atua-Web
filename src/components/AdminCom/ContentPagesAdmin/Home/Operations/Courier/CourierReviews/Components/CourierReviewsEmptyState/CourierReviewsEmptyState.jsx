import React from "react";

import {
  FaCommentAlt,
  FaFilter,
  FaSearch,
  FaStar,
  FaTimes,
} from "react-icons/fa";

import "./CourierReviewsEmptyState.css";

function CourierReviewsEmptyState({
  searchValue = "",
  hasActiveFilters = false,
  onClearSearch,
  onClearFilters,
  onRefresh,
}) {
  /*
  ==========================================================
  SEARCH STATE
  ==========================================================
  */

  const hasSearch = String(searchValue || "").trim().length > 0;

  /*
  ==========================================================
  FILTER STATE
  ==========================================================
  */

  const hasFilters = Boolean(hasActiveFilters);

  const hasQuery = hasSearch || hasFilters;

  /*
  ==========================================================
  EMPTY STATE TYPE
  ==========================================================
  */

  let title = "No Reviews Yet";

  let description =
    "This courier has not received any customer reviews yet. Reviews will appear here once customers rate their delivery experience.";

  /*
  ==========================================================
  SEARCH EMPTY STATE
  ==========================================================
  */

  if (hasSearch) {
    title = "No Reviews Found";

    description = `No customer reviews matched "${searchValue}". Try a different search term or clear the search to see all reviews.`;
  } else if (hasFilters) {

  /*
  ==========================================================
  FILTER EMPTY STATE
  ==========================================================
  */
    title = "No Matching Reviews";

    description =
      "There are no reviews matching the selected filters. Try changing the filters or clear them to see all courier reviews.";
  }

  /*
  ==========================================================
  CLEAR HANDLERS
  ==========================================================
  */

  const handleClearSearch = () => {
    if (typeof onClearSearch !== "function") {
      return;
    }

    onClearSearch();
  };

  const handleClearFilters = () => {
    if (typeof onClearFilters !== "function") {
      return;
    }

    onClearFilters();
  };

  const handleRefresh = () => {
    if (typeof onRefresh !== "function") {
      return;
    }

    onRefresh();
  };

  /*
  ==========================================================
  ICON
  ==========================================================
  */

  const renderIcon = () => {
    if (hasSearch) {
      return <FaSearch />;
    }

    if (hasFilters) {
      return <FaFilter />;
    }

    return <FaCommentAlt />;
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierReviewsEmptyState">
      {/* ==================================================
          ICON
      ================================================== */}

      <div
        className={`
          courierReviewsEmptyState-icon
          ${hasQuery ? "courierReviewsEmptyState-iconFiltered" : ""}
        `}
      >
        {renderIcon()}
      </div>

      {/* ==================================================
          TITLE
      ================================================== */}

      <h3>{title}</h3>

      {/* ==================================================
          DESCRIPTION
      ================================================== */}

      <p>{description}</p>

      {/* ==================================================
          EMPTY STATE DECORATION
      ================================================== */}

      {!hasQuery && (
        <div className="courierReviewsEmptyState-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar key={star} />
          ))}
        </div>
      )}

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="courierReviewsEmptyState-actions">
        {/* ==================================================
            CLEAR SEARCH
        ================================================== */}

        {hasSearch && typeof onClearSearch === "function" && (
          <button
            type="button"
            className="courierReviewsEmptyState-primaryButton"
            onClick={handleClearSearch}
          >
            <FaTimes />

            <span>Clear Search</span>
          </button>
        )}

        {/* ==================================================
            CLEAR FILTERS
        ================================================== */}

        {hasFilters && typeof onClearFilters === "function" && (
          <button
            type="button"
            className="courierReviewsEmptyState-primaryButton"
            onClick={handleClearFilters}
          >
            <FaTimes />

            <span>Clear Filters</span>
          </button>
        )}

        {/* ==================================================
            REFRESH
        ================================================== */}

        {!hasQuery && typeof onRefresh === "function" && (
          <button
            type="button"
            className="courierReviewsEmptyState-secondaryButton"
            onClick={handleRefresh}
          >
            <FaCommentAlt />

            <span>Refresh Reviews</span>
          </button>
        )}
      </div>
    </section>
  );
}

export default CourierReviewsEmptyState;
