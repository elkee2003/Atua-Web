import React from "react";

import {
  FaArrowLeft,
  FaWallet,
  FaSyncAlt,
  FaCheckCircle,
} from "react-icons/fa";

import "./CourierWalletHeader.css";

function CourierWalletHeader({
  courier,
  wallet,
  profileUrl,
  onBack,
  onRefresh,
  refreshing = false,
}) {
  /*
  ==========================================================
  COURIER NAME
  ==========================================================
  */

  const courierName =
    [courier?.firstName, courier?.lastName].filter(Boolean).join(" ") ||
    "Courier";

  /*
  ==========================================================
  COURIER INITIAL
  ==========================================================
  */

  const courierInitial = courier?.firstName?.charAt(0)?.toUpperCase() || "C";

  /*
  ==========================================================
  WALLET ID
  ==========================================================
  */

  const walletId = wallet?.id || courier?.walletID || "Not assigned";

  /*
  ==========================================================
  TRANSPORTATION TYPE
  ==========================================================
  */

  const transportationType =
    courier?.transportationType || courier?.vehicleClass || "Courier";

  /*
  ==========================================================
  ONLINE STATUS
  ==========================================================
  */

  const isOnline = Boolean(courier?.isOnline);

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierWalletHeader">
      {/* ==================================================
          LEFT SIDE
      ================================================== */}

      <div className="courierWalletHeader-left">
        {/* BACK BUTTON */}

        <button
          type="button"
          className="courierWalletHeader-backButton"
          onClick={onBack}
          aria-label="Go back"
          title="Go back"
        >
          <FaArrowLeft />
        </button>

        {/* WALLET ICON */}

        <div className="courierWalletHeader-walletIcon">
          <FaWallet />
        </div>

        {/* TITLE */}

        <div className="courierWalletHeader-title">
          <div className="courierWalletHeader-titleRow">
            <h1>Courier Wallet</h1>

            {courier?.isApproved && (
              <span className="courierWalletHeader-approved">
                <FaCheckCircle />
                Approved
              </span>
            )}
          </div>

          <p>Manage and monitor this courier's wallet</p>
        </div>
      </div>

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="courierWalletHeader-right">
        {/* ==================================================
            COURIER IDENTITY
        ================================================== */}

        <div className="courierWalletHeader-courier">
          {/* AVATAR */}

          <div className="courierWalletHeader-avatar">
            {profileUrl ? (
              <img src={profileUrl} alt={courierName} />
            ) : (
              <span>{courierInitial}</span>
            )}
          </div>

          {/* INFORMATION */}

          <div className="courierWalletHeader-courierInfo">
            <strong>{courierName}</strong>

            <div className="courierWalletHeader-meta">
              <span>{transportationType}</span>

              <span className="courierWalletHeader-metaDivider">•</span>

              <span className={isOnline ? "online" : "offline"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================
            WALLET ID
        ================================================== */}

        <div className="courierWalletHeader-walletId">
          <span>Wallet ID</span>

          <strong title={walletId}>{walletId}</strong>
        </div>

        {/* ==================================================
            REFRESH
        ================================================== */}

        <button
          type="button"
          className="courierWalletHeader-refresh"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <FaSyncAlt className={refreshing ? "spinning" : ""} />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>
    </section>
  );
}

export default CourierWalletHeader;
