import React, { useState } from "react";

import {
  FaArrowLeft,
  FaRedo,
  FaMapMarkerAlt,
  FaCircle,
  FaCheckCircle,
} from "react-icons/fa";

import "./TrackingHeader.css";

function TrackingHeader({
  courier,
  profileUrl,
  position,
  refreshing = false,
  onBack,
  onRefresh,
  onViewProfile,
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
  INITIALS
  ==========================================================
  */

  const firstInitial = courier?.firstName?.charAt(0)?.toUpperCase() || "";

  const lastInitial = courier?.lastName?.charAt(0)?.toUpperCase() || "";

  const courierInitials = `${firstInitial}${lastInitial}` || "C";

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

  const transportationType =
    courier?.transportationType || courier?.vehicleClass || "Courier";

  /*
  ==========================================================
  IMAGE ERROR
  ==========================================================
  
  If the signed URL expires or the image cannot be loaded,
  we automatically show the courier initials instead.
  
  ==========================================================
  */

  const [imageError, setImageError] = useState(false);

  /*
  ==========================================================
  IMAGE LOADED
  ==========================================================
  */

  const handleImageLoad = () => {
    setImageError(false);
  };

  /*
  ==========================================================
  IMAGE ERROR
  ==========================================================
  */

  const handleImageError = () => {
    console.error("Unable to display courier profile image:", profileUrl);

    setImageError(true);
  };

  /*
  ==========================================================
  VIEW PROFILE
  ==========================================================
  */

  const handleProfileClick = () => {
    if (!onViewProfile) {
      return;
    }

    onViewProfile();
  };

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
          title="Back"
        >
          <FaArrowLeft />

          <span>Back</span>
        </button>

        {/* DIVIDER */}

        <div className="trackingHeader-divider" />

        {/* =================================================
            COURIER PROFILE IMAGE
        ================================================= */}

        <button
          type="button"
          className="trackingHeader-profile"
          onClick={handleProfileClick}
          disabled={!onViewProfile}
          aria-label={`View ${courierName} profile`}
          title={`View ${courierName} profile`}
        >
          <div className="trackingHeader-avatar">
            {profileUrl && !imageError ? (
              <img
                src={profileUrl}
                alt={courierName}
                className="trackingHeader-avatarImage"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <span className="trackingHeader-avatarInitials">
                {courierInitials}
              </span>
            )}
          </div>
        </button>

        {/* =================================================
            TITLE / COURIER INFORMATION
        ================================================= */}

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
              className={`
                trackingHeader-onlineStatus
                ${isOnline ? "trackingHeader-online" : "trackingHeader-offline"}
              `}
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
              className={`
                trackingHeader-approvalStatus
                ${
                  isApproved
                    ? "trackingHeader-approved"
                    : "trackingHeader-pending"
                }
              `}
            >
              {isApproved && <FaCheckCircle />}

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
          title="Refresh"
        >
          <FaRedo
            className={
              refreshing
                ? `
                    trackingHeader-refreshIcon
                    trackingHeader-refreshSpinning
                  `
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
