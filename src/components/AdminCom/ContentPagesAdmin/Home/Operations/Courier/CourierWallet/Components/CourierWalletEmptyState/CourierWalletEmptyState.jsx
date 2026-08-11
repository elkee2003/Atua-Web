import React from "react";

import { FaWallet, FaExchangeAlt, FaSearch, FaRedoAlt } from "react-icons/fa";

import "./CourierWalletEmptyState.css";

function CourierWalletEmptyState({
  type = "TRANSACTIONS",
  title,
  description,
  actionLabel,
  onAction,
}) {
  /*
  ==========================================================
  EMPTY STATE CONFIGURATION
  ==========================================================
  */

  const configs = {
    WALLET: {
      icon: <FaWallet />,
      title: "Wallet Not Available",
      description:
        "This courier does not have a wallet linked to their account yet.",
      iconClass: "wallet",
    },

    TRANSACTIONS: {
      icon: <FaExchangeAlt />,
      title: "No Transactions Yet",
      description:
        "There are no wallet transactions recorded for this courier.",
      iconClass: "transactions",
    },

    SEARCH: {
      icon: <FaSearch />,
      title: "No Transactions Found",
      description: "No transactions match your current search.",
      iconClass: "search",
    },

    FILTER: {
      icon: <FaSearch />,
      title: "No Matching Transactions",
      description: "No transactions match the current filters.",
      iconClass: "filter",
    },

    ERROR: {
      icon: <FaRedoAlt />,
      title: "Unable to Load Wallet",
      description:
        "We couldn't load the courier wallet information. Please try again.",
      iconClass: "error",
    },
  };

  /*
  ==========================================================
  SELECT CONFIGURATION
  ==========================================================
  */

  const config = configs[type] || configs.TRANSACTIONS;

  /*
  ==========================================================
  FINAL VALUES
  ==========================================================
  */

  const finalTitle = title || config.title;

  const finalDescription = description || config.description;

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section
      className={`
        courierWalletEmptyState
        courierWalletEmptyState-${config.iconClass}
      `}
    >
      {/* ==================================================
          ICON
      ================================================== */}

      <div className="courierWalletEmptyState-icon">{config.icon}</div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="courierWalletEmptyState-content">
        <h3>{finalTitle}</h3>

        <p>{finalDescription}</p>
      </div>

      {/* ==================================================
          ACTION
      ================================================== */}

      {actionLabel && onAction && (
        <button
          type="button"
          className="courierWalletEmptyState-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

export default CourierWalletEmptyState;
