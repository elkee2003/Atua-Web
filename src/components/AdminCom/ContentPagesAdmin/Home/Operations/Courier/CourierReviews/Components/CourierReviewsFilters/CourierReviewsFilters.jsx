import React from "react";

import { FaCalendarAlt, FaFilter, FaStar, FaTimes } from "react-icons/fa";

import "./CourierReviewsFilters.css";

function CourierReviewsFilters({
  rating = "ALL",
  period = "ALL",
  status = "ALL",
  onRatingChange,
  onPeriodChange,
  onStatusChange,
  onClear,
  loading = false,
}) {
  /*
  ==========================================================
  FILTER OPTIONS
  ==========================================================
  */

  const ratingOptions = [
    {
      value: "ALL",
      label: "All Ratings",
    },
    {
      value: "5",
      label: "5 Stars",
    },
    {
      value: "4",
      label: "4 Stars",
    },
    {
      value: "3",
      label: "3 Stars",
    },
    {
      value: "2",
      label: "2 Stars",
    },
    {
      value: "1",
      label: "1 Star",
    },
  ];

  const periodOptions = [
    {
      value: "ALL",
      label: "All Time",
    },
    {
      value: "TODAY",
      label: "Today",
    },
    {
      value: "7_DAYS",
      label: "Last 7 Days",
    },
    {
      value: "30_DAYS",
      label: "Last 30 Days",
    },
    {
      value: "90_DAYS",
      label: "Last 90 Days",
    },
    {
      value: "THIS_YEAR",
      label: "This Year",
    },
  ];

  const statusOptions = [
    {
      value: "ALL",
      label: "All Reviews",
    },
    {
      value: "COMMENTED",
      label: "With Comments",
    },
    {
      value: "RATING_ONLY",
      label: "Rating Only",
    },
  ];

  /*
  ==========================================================
  ACTIVE FILTER COUNT
  ==========================================================
  */

  const activeFilterCount = [
    rating !== "ALL",
    period !== "ALL",
    status !== "ALL",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  /*
  ==========================================================
  HANDLERS
  ==========================================================
  */

  const handleRatingChange = (event) => {
    if (loading || typeof onRatingChange !== "function") {
      return;
    }

    onRatingChange(event.target.value);
  };

  const handlePeriodChange = (event) => {
    if (loading || typeof onPeriodChange !== "function") {
      return;
    }

    onPeriodChange(event.target.value);
  };

  const handleStatusChange = (event) => {
    if (loading || typeof onStatusChange !== "function") {
      return;
    }

    onStatusChange(event.target.value);
  };

  const handleClear = () => {
    if (loading || typeof onClear !== "function") {
      return;
    }

    onClear();
  };

  /*
  ==========================================================
  RENDER SELECT
  ==========================================================
  */

  const renderOptions = (options) => {
    return options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ));
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierReviewsFilters">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierReviewsFilters-header">
        <div className="courierReviewsFilters-title">
          <div className="courierReviewsFilters-titleIcon">
            <FaFilter />
          </div>

          <div>
            <h2>Review Filters</h2>

            <p>Narrow down customer reviews using the available filters.</p>
          </div>
        </div>

        {/* ==================================================
            CLEAR FILTERS
        ================================================== */}

        {hasActiveFilters && (
          <button
            type="button"
            className="courierReviewsFilters-clearButton"
            onClick={handleClear}
            disabled={loading}
          >
            <FaTimes />

            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* ==================================================
          FILTER CONTROLS
      ================================================== */}

      <div className="courierReviewsFilters-controls">
        {/* ==================================================
            RATING
        ================================================== */}

        <div className="courierReviewsFilters-field">
          <label htmlFor="courierReviewsFilters-rating">
            <FaStar />

            <span>Rating</span>
          </label>

          <div className="courierReviewsFilters-selectWrapper">
            <select
              id="courierReviewsFilters-rating"
              value={rating}
              onChange={handleRatingChange}
              disabled={loading}
            >
              {renderOptions(ratingOptions)}
            </select>
          </div>
        </div>

        {/* ==================================================
            PERIOD
        ================================================== */}

        <div className="courierReviewsFilters-field">
          <label htmlFor="courierReviewsFilters-period">
            <FaCalendarAlt />

            <span>Period</span>
          </label>

          <div className="courierReviewsFilters-selectWrapper">
            <select
              id="courierReviewsFilters-period"
              value={period}
              onChange={handlePeriodChange}
              disabled={loading}
            >
              {renderOptions(periodOptions)}
            </select>
          </div>
        </div>

        {/* ==================================================
            REVIEW STATUS
        ================================================== */}

        <div className="courierReviewsFilters-field">
          <label htmlFor="courierReviewsFilters-status">
            <FaFilter />

            <span>Review Type</span>
          </label>

          <div className="courierReviewsFilters-selectWrapper">
            <select
              id="courierReviewsFilters-status"
              value={status}
              onChange={handleStatusChange}
              disabled={loading}
            >
              {renderOptions(statusOptions)}
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================
          ACTIVE FILTER SUMMARY
      ================================================== */}

      <div className="courierReviewsFilters-footer">
        <div className="courierReviewsFilters-active">
          <span>Active Filters</span>

          <strong>{activeFilterCount}</strong>
        </div>

        {loading && (
          <div className="courierReviewsFilters-loading">
            <span className="courierReviewsFilters-spinner" />

            <span>Updating reviews...</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default CourierReviewsFilters;
