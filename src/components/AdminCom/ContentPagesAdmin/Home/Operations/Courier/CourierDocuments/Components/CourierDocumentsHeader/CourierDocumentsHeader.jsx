import React from "react";

import {
  FaArrowLeft,
  FaFileAlt,
  FaPhone,
  FaRedo,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";

import "./CourierDocumentsHeader.css";

function CourierDocumentsHeader({
  courier,
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
    [courier?.firstName, courier?.lastName].filter(Boolean).join(" ").trim() ||
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
  TRANSPORTATION
  ==========================================================
  */

  const transportationType =
    courier?.transportationType || "Transportation not specified";

  const vehicleClass = courier?.vehicleClass || "Vehicle not specified";

  const vehicleModel = courier?.model || null;

  const plateNumber = courier?.plateNumber || "Plate not available";

  /*
  ==========================================================
  VEHICLE DESCRIPTION
  ==========================================================
  */

  const vehicleDescription = [vehicleClass, vehicleModel]
    .filter(Boolean)
    .join(" • ");

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <header className="courierDocumentsHeader">
      {/* ==================================================
          TOP NAVIGATION
      ================================================== */}

      <div className="courierDocumentsHeader-top">
        <button
          type="button"
          className="courierDocumentsHeader-backButton"
          onClick={onBack}
          title="Back to Courier"
          aria-label="Back to Courier"
        >
          <FaArrowLeft />

          <span>Back to Courier</span>
        </button>

        <button
          type="button"
          className="courierDocumentsHeader-refreshButton"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh documents"
          aria-label="Refresh documents"
        >
          <FaRedo
            className={
              refreshing
                ? "courierDocumentsHeader-refreshIcon spinning"
                : "courierDocumentsHeader-refreshIcon"
            }
          />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ==================================================
          COURIER IDENTITY
      ================================================== */}

      <div className="courierDocumentsHeader-profile">
        {/* ==================================================
            AVATAR
        ================================================== */}

        <div className="courierDocumentsHeader-avatar">
          {profileUrl ? (
            <img
              src={profileUrl}
              alt={courierName}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span>{courierInitial}</span>
          )}
        </div>

        {/* ==================================================
            MAIN INFORMATION
        ================================================== */}

        <div className="courierDocumentsHeader-info">
          <div className="courierDocumentsHeader-nameRow">
            <h1>{courierName}</h1>

            <span
              className={`courierDocumentsHeader-onlineBadge ${
                isOnline ? "online" : "offline"
              }`}
            >
              <span />

              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* ==================================================
              VEHICLE INFORMATION
          ================================================== */}

          <div className="courierDocumentsHeader-details">
            <span>{transportationType}</span>

            <span className="courierDocumentsHeader-separator">•</span>

            <span>{vehicleDescription || "Vehicle not specified"}</span>

            <span className="courierDocumentsHeader-separator">•</span>

            <span>{plateNumber}</span>
          </div>

          {/* ==================================================
              PHONE
          ================================================== */}

          {courier?.phoneNumber && (
            <div className="courierDocumentsHeader-phone">
              <FaPhone />

              <span>{courier.phoneNumber}</span>
            </div>
          )}
        </div>

        {/* ==================================================
            APPROVAL STATUS
        ================================================== */}

        <div className="courierDocumentsHeader-approval">
          <span>Account</span>

          <strong className={isApproved ? "approved" : "pending"}>
            {isApproved ? "Approved" : "Pending Approval"}
          </strong>
        </div>
      </div>

      {/* ==================================================
          PAGE TITLE
      ================================================== */}

      <div className="courierDocumentsHeader-pageTitle">
        <div className="courierDocumentsHeader-pageTitleMain">
          <div className="courierDocumentsHeader-titleIcon">
            <FaFileAlt />
          </div>

          <div>
            <h2>Courier Documents</h2>

            <p>
              Review and verify identity, guarantor, and vehicle documentation
              for this courier.
            </p>
          </div>
        </div>

        {/* ==================================================
            VERIFICATION INDICATOR
        ================================================== */}

        <div className="courierDocumentsHeader-verification">
          <div className="courierDocumentsHeader-verificationIcon">
            <FaShieldAlt />
          </div>

          <div>
            <span>Verification</span>

            <strong>Document Review</strong>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CourierDocumentsHeader;
