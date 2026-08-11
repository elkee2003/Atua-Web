import React from "react";

import { FaFilter, FaRedo, FaTimes } from "react-icons/fa";

import "./CourierReportsFilters.css";

function CourierReportsFilters({
  status = "ALL",
  onStatusChange,
  sortBy = "NEWEST",
  onSortChange,
  onClear,
  resultCount,
  totalCount,
  loading = false,
}) {
  /*
  ==========================================================
  STATUS OPTIONS
  ==========================================================
  */

  const statusOptions = [
    {
      value: "ALL",
      label: "All Reports",
    },
    {
      value: "OPEN",
      label: "Open",
    },
    {
      value: "UNDER_REVIEW",
      label: "Under Review",
    },
    {
      value: "RESOLVED",
      label: "Resolved",
    },
    {
      value: "DISMISSED",
      label: "Dismissed",
    },
  ];

  /*
  ==========================================================
  SORT OPTIONS
  ==========================================================
  */

  const sortOptions = [
    {
      value: "NEWEST",
      label: "Newest First",
    },
    {
      value: "OLDEST",
      label: "Oldest First",
    },
  ];

  /*
  ==========================================================
  HANDLERS
  ==========================================================
  */

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;

    if (typeof onStatusChange === "function") {
      onStatusChange(nextStatus);
    }
  };

  const handleSortChange = (event) => {
    const nextSort = event.target.value;

    if (typeof onSortChange === "function") {
      onSortChange(nextSort);
    }
  };

  const handleClear = () => {
    if (typeof onClear === "function") {
      onClear();
      return;
    }

    if (typeof onStatusChange === "function") {
      onStatusChange("ALL");
    }

    if (typeof onSortChange === "function") {
      onSortChange("NEWEST");
    }
  };

  /*
  ==========================================================
  ACTIVE FILTER
  ==========================================================
  */

  const hasActiveFilter = status !== "ALL" || sortBy !== "NEWEST";

  /*
  ==========================================================
  RESULT COUNT
  ==========================================================
  */

  const hasResultCount = resultCount !== undefined && resultCount !== null;

  const hasTotalCount = totalCount !== undefined && totalCount !== null;

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierReportsFilters">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierReportsFilters-header">
        <div className="courierReportsFilters-title">
          <div className="courierReportsFilters-titleIcon">
            <FaFilter />
          </div>

          <div>
            <h2>Filters</h2>

            <p>Filter courier reports by status and date order.</p>
          </div>
        </div>

        {/* ==================================================
            RESULTS
        ================================================== */}

        {hasResultCount && (
          <div className="courierReportsFilters-results">
            <strong>{Number(resultCount).toLocaleString("en-NG")}</strong>

            {hasTotalCount && (
              <span>of {Number(totalCount).toLocaleString("en-NG")}</span>
            )}

            <span>reports</span>
          </div>
        )}
      </div>

      {/* ==================================================
          FILTER CONTROLS
      ================================================== */}

      <div className="courierReportsFilters-controls">
        {/* ==================================================
            STATUS
        ================================================== */}

        <div className="courierReportsFilters-field">
          <label htmlFor="courierReportsStatus">Report Status</label>

          <select
            id="courierReportsStatus"
            value={status}
            onChange={handleStatusChange}
            disabled={loading}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* ==================================================
            SORT
        ================================================== */}

        <div className="courierReportsFilters-field">
          <label htmlFor="courierReportsSort">Sort Reports</label>

          <select
            id="courierReportsSort"
            value={sortBy}
            onChange={handleSortChange}
            disabled={loading}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* ==================================================
            CLEAR
        ================================================== */}

        {hasActiveFilter && (
          <button
            type="button"
            className="courierReportsFilters-clearButton"
            onClick={handleClear}
            disabled={loading}
          >
            <FaTimes />

            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* ==================================================
          ACTIVE FILTER STATUS
      ================================================== */}

      <div className="courierReportsFilters-footer">
        <div className="courierReportsFilters-active">
          <span>Current status:</span>

          <strong>
            {statusOptions.find((option) => option.value === status)?.label ||
              "All Reports"}
          </strong>

          {sortBy !== "NEWEST" && (
            <>
              <span className="courierReportsFilters-divider">•</span>

              <strong>Oldest First</strong>
            </>
          )}
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            className="courierReportsFilters-resetButton"
            onClick={handleClear}
            disabled={loading}
            title="Reset filters"
          >
            <FaRedo />

            <span>Reset</span>
          </button>
        )}
      </div>
    </section>
  );
}

export default CourierReportsFilters;
