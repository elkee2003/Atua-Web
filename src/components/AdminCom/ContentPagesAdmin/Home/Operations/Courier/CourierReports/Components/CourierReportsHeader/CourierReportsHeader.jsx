import React from "react";

import {
  FaArrowLeft,
  FaCheckCircle,
  FaFlag,
  FaMapMarkerAlt,
  FaPhone,
  FaSyncAlt,
  FaTimesCircle,
  FaUser,
} from "react-icons/fa";

import "./CourierReportsHeader.css";

function CourierReportsHeader({
  courier,
  profileUrl,
  loading = false,
  refreshing = false,
  onBack,
  onRefresh,
  onTrack,
}) {
  /*
  ==========================================================
  SAFETY
  ==========================================================
  */

  /*
  We still render a loading shell when the courier has not
  loaded yet so the page does not simply appear empty.
  */

  if (!courier && !loading) {
    return null;
  }

  /*
  ==========================================================
  COURIER INFORMATION
  ==========================================================
  */

  const firstName = courier?.firstName || "";

  const lastName = courier?.lastName || "";

  const courierName = `${firstName} ${lastName}`.trim() || "Courier";

  /*
  ==========================================================
  INITIALS
  ==========================================================
  */

  const initials =
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`
      .trim()
      .toUpperCase() || "C";

  /*
  ==========================================================
  PHONE
  ==========================================================
  */

  const phoneNumber = courier?.phoneNumber || "Phone number not available";

  /*
  ==========================================================
  TRANSPORTATION
  ==========================================================
  */

  const transportationType =
    courier?.transportationType || "Transportation not specified";

  /*
  ==========================================================
  VEHICLE
  ==========================================================
  */

  const vehicleClass = courier?.vehicleClass || "Vehicle not specified";

  /*
  ==========================================================
  PLATE
  ==========================================================
  */

  const plateNumber = courier?.plateNumber || "Plate not available";

  /*
  ==========================================================
  STATUS
  ==========================================================
  */

  const isOnline = Boolean(courier?.isOnline);

  const isApproved = Boolean(courier?.isApproved);

  /*
  ==========================================================
  REPORT COUNT
  ==========================================================
  */

  const totalReports = Number(courier?.totalReports ?? 0);

  /*
  ==========================================================
  HANDLERS
  ==========================================================
  */

  const handleBack = () => {
    if (typeof onBack !== "function") {
      return;
    }

    onBack();
  };

  const handleRefresh = () => {
    if (typeof onRefresh !== "function" || refreshing) {
      return;
    }

    onRefresh();
  };

  const handleTrack = () => {
    if (typeof onTrack !== "function") {
      return;
    }

    onTrack();
  };

  /*
  ==========================================================
  LOADING STATE
  ==========================================================
  */

  if (loading && !courier) {
    return (
      <header className="courierReportsHeader">
        {/* ==================================================
            TOP NAVIGATION
        ================================================== */}

        <div className="courierReportsHeader-top">
          <button
            type="button"
            className="courierReportsHeader-iconButton"
            disabled
            aria-label="Back to courier"
          >
            <FaArrowLeft />
          </button>

          <div className="courierReportsHeader-topActions">
            <button
              type="button"
              className="courierReportsHeader-iconButton"
              disabled
              aria-label="Refresh reports"
            >
              <FaSyncAlt />
            </button>
          </div>
        </div>

        {/* ==================================================
            LOADING PROFILE
        ================================================== */}

        <div className="courierReportsHeader-profile">
          <div className="courierReportsHeader-loadingAvatar" />

          <div className="courierReportsHeader-loadingInfo">
            <div className="courierReportsHeader-loadingName" />

            <div className="courierReportsHeader-loadingDetails" />

            <div className="courierReportsHeader-loadingPhone" />
          </div>

          <div className="courierReportsHeader-loadingStatus" />
        </div>

        {/* ==================================================
            LOADING PAGE TITLE
        ================================================== */}

        <div className="courierReportsHeader-pageTitle">
          <div className="courierReportsHeader-loadingTitleIcon" />

          <div>
            <div className="courierReportsHeader-loadingTitle" />

            <div className="courierReportsHeader-loadingSubtitle" />
          </div>
        </div>
      </header>
    );
  }

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <header className="courierReportsHeader">
      {/* ==================================================
          TOP NAVIGATION
      ================================================== */}

      <div className="courierReportsHeader-top">
        {/* ==================================================
            BACK
        ================================================== */}

        <button
          type="button"
          className="courierReportsHeader-iconButton"
          onClick={handleBack}
          aria-label="Back to courier"
          title="Back to courier"
        >
          <FaArrowLeft />
        </button>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div className="courierReportsHeader-topActions">
          {/* ==================================================
              REFRESH
          ================================================== */}

          <button
            type="button"
            className="courierReportsHeader-iconButton"
            onClick={handleRefresh}
            disabled={refreshing || typeof onRefresh !== "function"}
            aria-label="Refresh reports"
            title={refreshing ? "Refreshing reports" : "Refresh reports"}
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "courierReportsHeader-refreshIcon spinning"
                  : "courierReportsHeader-refreshIcon"
              }
            />
          </button>

          {/* ==================================================
              TRACK
          ================================================== */}

          {typeof onTrack === "function" && (
            <button
              type="button"
              className="courierReportsHeader-trackButton"
              onClick={handleTrack}
              aria-label="Track courier"
              title="Track courier"
            >
              <FaMapMarkerAlt />
            </button>
          )}
        </div>
      </div>

      {/* ==================================================
          COURIER PROFILE
      ================================================== */}

      <div className="courierReportsHeader-profile">
        {/* ==================================================
            AVATAR
        ================================================== */}

        <div className="courierReportsHeader-avatar">
          {profileUrl ? (
            <img
              src={profileUrl}
              alt={courierName}
              className="courierReportsHeader-avatarImage"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="courierReportsHeader-initials">{initials}</span>
          )}
        </div>

        {/* ==================================================
            MAIN INFORMATION
        ================================================== */}

        <div className="courierReportsHeader-info">
          <div className="courierReportsHeader-nameRow">
            <h1>{courierName}</h1>

            <span
              className={`
                courierReportsHeader-onlineBadge
                ${isOnline ? "online" : "offline"}
              `}
            >
              <span />

              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* ==================================================
              VEHICLE DETAILS
          ================================================== */}

          <div className="courierReportsHeader-details">
            <span>{transportationType}</span>

            <span className="courierReportsHeader-separator">•</span>

            <span>{vehicleClass}</span>

            <span className="courierReportsHeader-separator">•</span>

            <span>{plateNumber}</span>
          </div>

          {/* ==================================================
              PHONE
          ================================================== */}

          <div className="courierReportsHeader-phone">
            <FaPhone />

            <span>{phoneNumber}</span>
          </div>
        </div>

        {/* ==================================================
            ACCOUNT STATUS
        ================================================== */}

        <div className="courierReportsHeader-account">
          <span>Account</span>

          <strong className={isApproved ? "approved" : "pending"}>
            {isApproved ? "Approved" : "Pending Approval"}
          </strong>
        </div>
      </div>

      {/* ==================================================
          PAGE TITLE
      ================================================== */}

      <div className="courierReportsHeader-pageTitle">
        <div className="courierReportsHeader-pageTitleLeft">
          <div className="courierReportsHeader-titleIcon">
            <FaFlag />
          </div>

          <div>
            <div className="courierReportsHeader-titleRow">
              <h2>Courier Reports</h2>

              <span className="courierReportsHeader-reportCount">
                {totalReports}

                <span>{totalReports === 1 ? " report" : " reports"}</span>
              </span>
            </div>

            <p>
              View and manage reports, complaints, incidents, and administrative
              issues associated with this courier.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CourierReportsHeader;
