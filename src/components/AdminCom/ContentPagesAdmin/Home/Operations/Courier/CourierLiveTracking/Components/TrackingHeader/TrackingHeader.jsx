import React from "react";
import { FaArrowLeft, FaRedo, FaMapMarkerAlt, FaCircle } from "react-icons/fa";

import "./TrackingHeader.css";

function TrackingHeader({ courier, refreshing = false, onBack, onRefresh }) {
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
    COURIER STATUS
    ==========================================================
    */

  const isOnline = Boolean(courier?.isOnline);

  const isApproved = Boolean(courier?.isApproved);

  /*
    ==========================================================
    TRANSPORTATION TYPE
    ==========================================================
    */

  const transportationType = courier?.transportationType || "Courier";

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <div className="trackingHeader">
      {/* =================================================
                LEFT SECTION
            ================================================= */}

      <div className="trackingHeader-left">
        {/* BACK BUTTON */}

        <button
          type="button"
          className="trackingHeader-backButton"
          onClick={onBack}
          aria-label="Back to courier profile"
        >
          <FaArrowLeft />

          <span>Back</span>
        </button>

        {/* DIVIDER */}

        <div className="trackingHeader-divider" />

        {/* TITLE / COURIER INFORMATION */}

        <div className="trackingHeader-content">
          {/* TITLE */}

          <div className="trackingHeader-titleRow">
            <FaMapMarkerAlt className="trackingHeader-titleIcon" />

            <h1 className="trackingHeader-title">Live Tracking</h1>
          </div>

          {/* COURIER INFORMATION */}

          <div className="trackingHeader-courierRow">
            {/* NAME */}

            <span className="trackingHeader-courierName">{courierName}</span>

            {/* ONLINE STATUS */}

            <span
              className={`trackingHeader-onlineStatus ${
                isOnline ? "trackingHeader-online" : "trackingHeader-offline"
              }`}
            >
              <FaCircle />

              {isOnline ? "Online" : "Offline"}
            </span>

            {/* TRANSPORTATION TYPE */}

            <span className="trackingHeader-transport">
              {transportationType}
            </span>

            {/* APPROVAL STATUS */}

            <span
              className={`trackingHeader-approvalStatus ${
                isApproved
                  ? "trackingHeader-approved"
                  : "trackingHeader-pending"
              }`}
            >
              {isApproved ? "Approved" : "Pending Approval"}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
                RIGHT SECTION
            ================================================= */}

      <div className="trackingHeader-right">
        <button
          type="button"
          className="trackingHeader-refreshButton"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh courier tracking"
        >
          <FaRedo
            className={
              refreshing
                ? "trackingHeader-refreshIcon trackingHeader-refreshSpinning"
                : "trackingHeader-refreshIcon"
            }
          />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
}

export default TrackingHeader;
