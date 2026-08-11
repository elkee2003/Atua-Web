import React from "react";

import { FaSearch, FaTimes } from "react-icons/fa";

import "./CourierReviewsSearch.css";

function CourierReviewsSearch({
  value = "",
  onChange,
  placeholder = "Search reviews, customers or order ID...",
  loading = false,
  disabled = false,
}) {
  /*
  ==========================================================
  SAFE SEARCH VALUE
  ==========================================================
  */

  const searchValue = value ?? "";

  /*
  ==========================================================
  HANDLERS
  ==========================================================
  */

  const handleChange = (event) => {
    if (typeof onChange !== "function" || disabled) {
      return;
    }

    onChange(event.target.value);
  };

  const handleClear = () => {
    if (typeof onChange !== "function" || disabled) {
      return;
    }

    onChange("");
  };

  /*
  ==========================================================
  KEYBOARD HANDLER
  ==========================================================
  */

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && searchValue) {
      handleClear();
    }
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierReviewsSearch">
      {/* ==================================================
          SEARCH LABEL
      ================================================== */}

      <div className="courierReviewsSearch-header">
        <div>
          <h2>Search Reviews</h2>

          <p>Find reviews by customer, review text, or order reference.</p>
        </div>
      </div>

      {/* ==================================================
          SEARCH INPUT
      ================================================== */}

      <div
        className={`
          courierReviewsSearch-inputWrapper
          ${disabled ? "courierReviewsSearch-disabled" : ""}
        `}
      >
        <FaSearch
          className="courierReviewsSearch-searchIcon"
          aria-hidden="true"
        />

        <input
          type="text"
          value={searchValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          aria-label="Search courier reviews"
          autoComplete="off"
        />

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <span
            className="courierReviewsSearch-spinner"
            aria-label="Searching"
          />
        )}

        {/* ==================================================
            CLEAR
        ================================================== */}

        {!loading && searchValue.length > 0 && (
          <button
            type="button"
            className="courierReviewsSearch-clearButton"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear search"
            title="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* ==================================================
          SEARCH STATUS
      ================================================== */}

      {searchValue.length > 0 && (
        <div className="courierReviewsSearch-status">
          <span>Searching for:</span>

          <strong>"{searchValue}"</strong>

          {!loading && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="courierReviewsSearch-resetButton"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default CourierReviewsSearch;
