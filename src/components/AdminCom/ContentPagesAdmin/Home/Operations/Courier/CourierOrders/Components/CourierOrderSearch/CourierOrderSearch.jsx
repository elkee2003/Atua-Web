import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

import "./CourierOrderSearch.css";

function CourierOrderSearch({
  searchQuery = "",
  setSearchQuery,
  placeholder = "Search order ID, address, customer...",
}) {
  /*
    ==========================================================
    HANDLE SEARCH
    ==========================================================
    */

  const handleChange = (event) => {
    const value = event.target.value;

    if (typeof setSearchQuery === "function") {
      setSearchQuery(value);
    }
  };

  /*
    ==========================================================
    CLEAR SEARCH
    ==========================================================
    */

  const handleClear = () => {
    if (typeof setSearchQuery === "function") {
      setSearchQuery("");
    }
  };

  /*
    ==========================================================
    HANDLE ENTER
    ==========================================================
    */

  const handleKeyDown = (event) => {
    /*
        Search is handled live by the parent,
        so Enter does not need to submit anything.
        */

    if (event.key === "Escape") {
      handleClear();
    }
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierOrderSearch">
      <div className="courierOrderSearch-container">
        {/* ==================================================
                    SEARCH ICON
                ================================================== */}

        <div className="courierOrderSearch-icon">
          <FaSearch />
        </div>

        {/* ==================================================
                    INPUT
                ================================================== */}

        <input
          type="text"
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="courierOrderSearch-input"
          aria-label="Search courier orders"
        />

        {/* ==================================================
                    CLEAR BUTTON
                ================================================== */}

        {searchQuery && (
          <button
            type="button"
            className="courierOrderSearch-clear"
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </section>
  );
}

export default CourierOrderSearch;
