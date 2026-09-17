import React, { useEffect, useState } from "react";

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
  profileUrl = null,
  position = null,
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

  const firstInitial =
    courier?.firstName?.trim()?.charAt(0)?.toUpperCase() || "";

  const lastInitial = courier?.lastName?.trim()?.charAt(0)?.toUpperCase() || "";

  const courierInitials = `${firstInitial}${lastInitial}`.trim() || "C";

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
    courier?.transportationType ||
    courier?.vehicleClass ||
    courier?.vehicleType ||
    "Courier";

  /*
  ==========================================================
  IMAGE ERROR STATE
  ==========================================================

  If the profile image fails to load, the component displays
  the courier initials instead.

  ==========================================================
  */

  const [imageError, setImageError] = useState(false);

  /*
  ==========================================================
  RESET IMAGE ERROR WHEN PROFILE URL CHANGES
  ==========================================================

  This is important when the courier changes or Amplify
  generates a new signed profile image URL.

  ==========================================================
  */

  useEffect(() => {
    setImageError(false);
  }, [profileUrl]);

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
  BACK BUTTON
  ==========================================================
  */

  const handleBackClick = () => {
    if (typeof onBack === "function") {
      onBack();
    }
  };

  /*
  ==========================================================
  REFRESH BUTTON
  ==========================================================
  */

  const handleRefreshClick = () => {
    if (refreshing) {
      return;
    }

    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  /*
  ==========================================================
  VIEW PROFILE
  ==========================================================
  */

  const handleProfileClick = () => {
    if (typeof onViewProfile === "function") {
      onViewProfile();
    }
  };

  /*
  ==========================================================
  BUTTON STATES
  ==========================================================
  */

  const isProfileButtonDisabled = typeof onViewProfile !== "function";

  const isBackButtonDisabled = typeof onBack !== "function";

  const isRefreshButtonDisabled = refreshing || typeof onRefresh !== "function";

  /*
  ==========================================================
  REFRESH ICON CLASS
  ==========================================================
  */

  const refreshIconClassName = [
    "trackingHeader-refreshIcon",
    refreshing ? "trackingHeader-refreshSpinning" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <header className="trackingHeader">
      {/* =================================================
          LEFT SECTION
      ================================================= */}

      <div className="trackingHeader-left">
        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          type="button"
          className="trackingHeader-backButton"
          onClick={handleBackClick}
          disabled={isBackButtonDisabled}
          aria-label="Back to courier profile"
          title="Back"
        >
          <FaArrowLeft />

          <span>Back</span>
        </button>

        {/* =================================================
            DIVIDER
        ================================================= */}

        <div className="trackingHeader-divider" aria-hidden="true" />

        {/* =================================================
            COURIER PROFILE IMAGE
        ================================================= */}

        <button
          type="button"
          className="trackingHeader-profile"
          onClick={handleProfileClick}
          disabled={isProfileButtonDisabled}
          aria-label={`View ${courierName} profile`}
          title={`View ${courierName} profile`}
        >
          <div className="trackingHeader-avatar">
            {profileUrl && !imageError ? (
              <img
                src={profileUrl}
                alt={`${courierName} profile`}
                className="trackingHeader-avatarImage"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <span
                className="trackingHeader-avatarInitials"
                aria-hidden="true"
              >
                {courierInitials}
              </span>
            )}
          </div>
        </button>

        {/* =================================================
            TITLE AND COURIER INFORMATION
        ================================================= */}

        <div className="trackingHeader-content">
          {/* =================================================
              TITLE
          ================================================= */}

          <div className="trackingHeader-titleRow">
            <FaMapMarkerAlt
              className="trackingHeader-titleIcon"
              aria-hidden="true"
            />

            <h1 className="trackingHeader-title">Live Tracking</h1>
          </div>

          {/* =================================================
              COURIER INFORMATION
          ================================================= */}

          <div className="trackingHeader-courierRow">
            {/* COURIER NAME */}

            <span className="trackingHeader-courierName">{courierName}</span>

            {/* ONLINE STATUS */}

            <span
              className={[
                "trackingHeader-onlineStatus",
                isOnline ? "trackingHeader-online" : "trackingHeader-offline",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={`Courier status: ${isOnline ? "Online" : "Offline"}`}
            >
              <FaCircle aria-hidden="true" />

              <span>{isOnline ? "Online" : "Offline"}</span>
            </span>

            {/* TRANSPORTATION TYPE */}

            <span className="trackingHeader-transport">
              {transportationType}
            </span>

            {/* APPROVAL STATUS */}

            <span
              className={[
                "trackingHeader-approvalStatus",
                isApproved
                  ? "trackingHeader-approved"
                  : "trackingHeader-pending",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={`Courier approval status: ${
                isApproved ? "Approved" : "Pending Approval"
              }`}
            >
              {isApproved && <FaCheckCircle aria-hidden="true" />}

              <span>{isApproved ? "Approved" : "Pending Approval"}</span>
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
          onClick={handleRefreshClick}
          disabled={isRefreshButtonDisabled}
          aria-label="Refresh courier tracking"
          title="Refresh"
        >
          <FaRedo className={refreshIconClassName} aria-hidden="true" />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>
    </header>
  );
}

export default TrackingHeader;
