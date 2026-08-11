import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

import "./CourierSearch.css";

function CourierSearch({ searchQuery, setSearchQuery }) {
  const handleChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="courierSearch">
      <div className="courierSearch-inputWrapper">
        <FaSearch className="courierSearch-searchIcon" />

        <input
          type="text"
          className="courierSearch-input"
          placeholder="Search couriers by name, phone, vehicle, plate or transport type..."
          value={searchQuery}
          onChange={handleChange}
          aria-label="Search couriers"
        />

        {searchQuery && (
          <button
            type="button"
            className="courierSearch-clearButton"
            onClick={handleClear}
            aria-label="Clear courier search"
          >
            <FaTimes />
          </button>
        )}
      </div>

      <div className="courierSearch-resultInfo">
        {searchQuery ? (
          <span>
            Searching for <strong>"{searchQuery}"</strong>
          </span>
        ) : (
          <span>Search across courier details</span>
        )}
      </div>
    </div>
  );
}

export default CourierSearch;
