import React from "react";

import { FaSearch, FaTimes } from "react-icons/fa";

import "./CourierPayoutSearch.css";

function CourierPayoutSearch({
  searchQuery = "",
  setSearchQuery,
  placeholder = "Search payouts...",
}) {
  /*
    ==========================================================
    SEARCH HANDLER
    ==========================================================
    */

  const handleChange = (event) => {
    if (!setSearchQuery) {
      return;
    }

    setSearchQuery(event.target.value);
  };

  /*
    ==========================================================
    CLEAR SEARCH
    ==========================================================
    */

  const handleClear = () => {
    if (!setSearchQuery) {
      return;
    }

    setSearchQuery("");
  };

  /*
    ==========================================================
    KEYBOARD HANDLER
    ==========================================================
    */

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && searchQuery) {
      handleClear();
    }
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <div className="courierPayoutSearch">
      {/* ==================================================
                SEARCH ICON
            ================================================== */}

      <div
        className="
                courierPayoutSearch-icon
            "
      >
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
        className="
                    courierPayoutSearch-input
                "
        aria-label="Search payouts"
      />

      {/* ==================================================
                CLEAR BUTTON
            ================================================== */}

      {searchQuery && (
        <button
          type="button"
          className="
                        courierPayoutSearch-clear
                    "
          onClick={handleClear}
          aria-label="Clear search"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
}

export default CourierPayoutSearch;
