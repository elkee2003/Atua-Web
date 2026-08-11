import React, { useEffect, useRef } from "react";

import { FaSearch, FaTimes } from "react-icons/fa";

import "./CourierWalletSearch.css";

function CourierWalletSearch({
  searchQuery = "",
  setSearchQuery,
  transactions = [],
}) {
  /*
  ==========================================================
  REF
  ==========================================================
  */

  const inputRef = useRef(null);

  /*
  ==========================================================
  KEYBOARD SHORTCUT
  ==========================================================
  */

  useEffect(() => {
    const handleKeyDown = (event) => {
      /*
      --------------------------------------------------------
      Focus search with /
      --------------------------------------------------------
      */

      if (
        event.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();

        inputRef.current?.focus();
      }

      /*
      --------------------------------------------------------
      Escape clears search
      --------------------------------------------------------
      */

      if (
        event.key === "Escape" &&
        document.activeElement === inputRef.current
      ) {
        if (searchQuery) {
          setSearchQuery?.("");
        } else {
          inputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchQuery, setSearchQuery]);

  /*
  ==========================================================
  CLEAR SEARCH
  ==========================================================
  */

  const handleClear = () => {
    setSearchQuery?.("");

    inputRef.current?.focus();
  };

  /*
  ==========================================================
  SEARCH CHANGE
  ==========================================================
  */

  const handleChange = (event) => {
    setSearchQuery?.(event.target.value);
  };

  /*
  ==========================================================
  SEARCH RESULT COUNT
  ==========================================================
  */

  const searchResultCount = searchQuery.trim()
    ? transactions.filter((transaction) => {
        const query = searchQuery.trim().toLowerCase();

        const searchableText = [
          transaction?.description,

          transaction?.orderID,

          transaction?.paymentID,

          transaction?.id,

          transaction?.type,

          transaction?.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      }).length
    : transactions.length;

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierWalletSearch">
      {/* ==================================================
          SEARCH LABEL
      ================================================== */}

      <div className="courierWalletSearch-heading">
        <span>Search Transactions</span>
      </div>

      {/* ==================================================
          SEARCH BOX
      ================================================== */}

      <div className="courierWalletSearch-box">
        <FaSearch className="courierWalletSearch-searchIcon" />

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleChange}
          placeholder="Search transaction, order or payment..."
          aria-label="Search wallet transactions"
          autoComplete="off"
          spellCheck="false"
        />

        {/* ==================================================
            CLEAR
        ================================================== */}

        {searchQuery && (
          <button
            type="button"
            className="courierWalletSearch-clear"
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
          >
            <FaTimes />
          </button>
        )}

        {/* ==================================================
            KEYBOARD SHORTCUT
        ================================================== */}

        {!searchQuery && (
          <span className="courierWalletSearch-shortcut">/</span>
        )}
      </div>

      {/* ==================================================
          RESULT COUNT
      ================================================== */}

      <div className="courierWalletSearch-resultCount">
        {searchQuery.trim() ? (
          <>
            {searchResultCount} {searchResultCount === 1 ? "result" : "results"}
          </>
        ) : (
          <>
            {transactions.length}{" "}
            {transactions.length === 1 ? "transaction" : "transactions"}
          </>
        )}
      </div>
    </section>
  );
}

export default CourierWalletSearch;
