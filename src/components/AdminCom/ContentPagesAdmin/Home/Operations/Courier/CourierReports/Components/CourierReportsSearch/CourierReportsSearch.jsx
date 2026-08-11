import React, { useEffect, useState } from "react";

import { FaSearch, FaTimes } from "react-icons/fa";

import "./CourierReportsSearch.css";

function CourierReportsSearch({
  value = "",
  onSearch,
  placeholder = "Search reports...",
  loading = false,
  resultCount,
  totalCount,
}) {
  /*
  ==========================================================
  SEARCH VALUE
  ==========================================================
  */

  const [searchValue, setSearchValue] = useState(value || "");

  /*
  ==========================================================
  SYNC WITH PARENT VALUE
  ==========================================================
  */

  useEffect(() => {
    setSearchValue(value || "");
  }, [value]);

  /*
  ==========================================================
  SEARCH HANDLER
  ==========================================================
  */

  const handleChange = (event) => {
    const nextValue = event.target.value;

    setSearchValue(nextValue);

    if (typeof onSearch === "function") {
      onSearch(nextValue);
    }
  };

  /*
  ==========================================================
  CLEAR SEARCH
  ==========================================================
  */

  const handleClear = () => {
    setSearchValue("");

    if (typeof onSearch === "function") {
      onSearch("");
    }
  };

  /*
  ==========================================================
  KEYBOARD
  ==========================================================
  */

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && searchValue) {
      handleClear();
    }
  };

  /*
  ==========================================================
  RESULT TEXT
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
    <section className="courierReportsSearch">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierReportsSearch-header">
        <div>
          <h2>Search Reports</h2>

          <p>
            Search reports by reason, description, order, customer, or report
            ID.
          </p>
        </div>

        {hasResultCount && (
          <div className="courierReportsSearch-count">
            <strong>{Number(resultCount).toLocaleString("en-NG")}</strong>

            <span>
              {hasTotalCount
                ? ` of ${Number(totalCount).toLocaleString("en-NG")}`
                : ""}
            </span>
          </div>
        )}
      </div>

      {/* ==================================================
          SEARCH FIELD
      ================================================== */}

      <div className="courierReportsSearch-fieldWrapper">
        <div className="courierReportsSearch-icon">
          <FaSearch />
        </div>

        <input
          type="search"
          value={searchValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search courier reports"
          disabled={loading}
          className="courierReportsSearch-input"
          autoComplete="off"
          spellCheck="false"
        />

        {/* ==================================================
            CLEAR BUTTON
        ================================================== */}

        {searchValue && (
          <button
            type="button"
            className="courierReportsSearch-clearButton"
            onClick={handleClear}
            disabled={loading}
            aria-label="Clear report search"
            title="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* ==================================================
          SEARCH STATUS
      ================================================== */}

      <div className="courierReportsSearch-footer">
        <span className="courierReportsSearch-hint">
          {searchValue
            ? `Showing results for "${searchValue}"`
            : "Enter a search term to find a report."}
        </span>

        {loading && (
          <span className="courierReportsSearch-loading">Searching...</span>
        )}
      </div>
    </section>
  );
}

export default CourierReportsSearch;
