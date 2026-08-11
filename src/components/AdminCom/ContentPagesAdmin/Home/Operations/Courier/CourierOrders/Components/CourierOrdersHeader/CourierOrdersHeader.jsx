import React from "react";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhone,
  FaSyncAlt,
  FaUser,
} from "react-icons/fa";

import "./CourierOrdersHeader.css";

function CourierOrdersHeader({
  courier,
  profileUrl,
  onBack,
  onTrack,
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

  const courierInitial =
    courier?.firstName?.charAt(0)?.toUpperCase() ||
    courier?.lastName?.charAt(0)?.toUpperCase() ||
    "C";

  /*
    ==========================================================
    STATUS
    ==========================================================
    */

  const isOnline = Boolean(courier?.isOnline);

  const isApproved = Boolean(courier?.isApproved);

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <header className="courierOrdersHeader">
      {/* ==================================================
                TOP NAVIGATION
            ================================================== */}

      <div className="courierOrdersHeader-top">
        <button
          type="button"
          className="courierOrdersHeader-backButton"
          onClick={onBack}
        >
          <FaArrowLeft />

          <span>Back to Courier</span>
        </button>

        <div className="courierOrdersHeader-actions">
          {/* ==========================================
                        REFRESH
                    ========================================== */}

          <button
            type="button"
            className="courierOrdersHeader-refreshButton"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh orders"
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "courierOrdersHeader-refreshIcon spinning"
                  : "courierOrdersHeader-refreshIcon"
              }
            />

            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* ==========================================
                        LIVE TRACKING
                    ========================================== */}

          <button
            type="button"
            className="courierOrdersHeader-trackButton"
            onClick={onTrack}
          >
            <FaMapMarkerAlt />

            <span>Live Track</span>
          </button>
        </div>
      </div>

      {/* ==================================================
                COURIER IDENTITY
            ================================================== */}

      <div className="courierOrdersHeader-profile">
        {/* ==========================================
                    AVATAR
                ========================================== */}

        <div className="courierOrdersHeader-avatar">
          {profileUrl ? (
            <img src={profileUrl} alt={courierName} />
          ) : (
            <span>{courierInitial}</span>
          )}
        </div>

        {/* ==========================================
                    MAIN INFORMATION
                ========================================== */}

        <div className="courierOrdersHeader-info">
          <div className="courierOrdersHeader-nameRow">
            <h1>{courierName}</h1>

            <span
              className={`courierOrdersHeader-onlineBadge ${
                isOnline ? "online" : "offline"
              }`}
            >
              <span />

              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          <div className="courierOrdersHeader-details">
            <span>
              {courier?.transportationType || "Transportation not specified"}
            </span>

            <span className="courierOrdersHeader-separator">•</span>

            <span>{courier?.vehicleClass || "Vehicle not specified"}</span>

            <span className="courierOrdersHeader-separator">•</span>

            <span>{courier?.plateNumber || "Plate not available"}</span>
          </div>

          {courier?.phoneNumber && (
            <div className="courierOrdersHeader-phone">
              <FaPhone />

              <span>{courier.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* ==========================================
                    APPROVAL STATUS
                ========================================== */}

        <div className="courierOrdersHeader-approval">
          <span>Account</span>

          <strong className={isApproved ? "approved" : "pending"}>
            {isApproved ? "Approved" : "Pending Approval"}
          </strong>
        </div>
      </div>

      {/* ==================================================
                PAGE TITLE
            ================================================== */}

      <div className="courierOrdersHeader-pageTitle">
        <div>
          <div className="courierOrdersHeader-titleIcon">
            <FaUser />
          </div>

          <div>
            <h2>Courier Orders</h2>

            <p>View and manage orders assigned to this courier.</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CourierOrdersHeader;
