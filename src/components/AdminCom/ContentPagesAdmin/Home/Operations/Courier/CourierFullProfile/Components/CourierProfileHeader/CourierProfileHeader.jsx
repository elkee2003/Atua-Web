import React from "react";

import {
  FaBan,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaRedo,
  FaStar,
  FaTimesCircle,
} from "react-icons/fa";

import "./CourierProfileHeader.css";

function CourierProfileHeader({
  courier,
  profileUrl,

  approvalLoading = false,
  blockLoading = false,
  resetLoading = false,

  onApprove,
  onBlock,
  onForceReset,
  onTrack,
}) {
  /*
  ==========================================================
  SAFETY
  ==========================================================
  */

  if (!courier) {
    return null;
  }

  /*
  ==========================================================
  BASIC INFORMATION
  ==========================================================
  */

  const firstName = courier.firstName || "";
  const lastName = courier.lastName || "";

  const fullName = `${firstName} ${lastName}`.trim() || "Unknown Courier";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase() || "C";

  const phoneNumber = courier.phoneNumber || "No phone number";

  const transportationType = courier.transportationType || "Courier";

  const vehicleClass = courier.vehicleClass || "Vehicle not specified";

  /*
  ==========================================================
  STATUS
  ==========================================================
  */

  const isOnline = Boolean(courier.isOnline);
  const isApproved = Boolean(courier.isApproved);
  const isBlocked = Boolean(courier.isBlocked);

  /*
  ==========================================================
  RATING
  ==========================================================
  */

  const rating =
    courier.averageRating !== null && courier.averageRating !== undefined
      ? Number(courier.averageRating)
      : 0;

  const reviewCount = Number(courier.reviewCount || 0);

  /*
  ==========================================================
  LOCATION
  ==========================================================
  */

  const locationText =
    courier.currentLocation || courier.location || courier.address || null;

  /*
  ==========================================================
  TRACK
  ==========================================================
  */

  const handleTrack = () => {
    if (!onTrack) {
      return;
    }

    onTrack();
  };

  /*
  ==========================================================
  APPROVAL
  ==========================================================
  */

  const handleApproval = () => {
    if (!onApprove || approvalLoading) {
      return;
    }

    onApprove();
  };

  /*
  ==========================================================
  BLOCK / UNBLOCK
  ==========================================================
  */

  const handleBlock = () => {
    if (!onBlock || blockLoading) {
      return;
    }

    onBlock();
  };

  /*
  ==========================================================
  FORCE RESET
  ==========================================================
  */

  const handleForceReset = () => {
    if (!onForceReset || resetLoading) {
      return;
    }

    onForceReset();
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierProfileHeader">
      {/* ==================================================
          TOP ROW
      ================================================== */}

      <div className="courierProfileHeader-top">
        {/* ==================================================
            IDENTITY
        ================================================== */}

        <div className="courierProfileHeader-identity">
          {/* AVATAR */}

          <div className="courierProfileHeader-avatar">
            {profileUrl ? (
              <img
                src={profileUrl}
                alt={fullName}
                className="courierProfileHeader-avatarImage"
              />
            ) : (
              <span className="courierProfileHeader-initials">{initials}</span>
            )}
          </div>

          {/* INFORMATION */}

          <div className="courierProfileHeader-info">
            {/* NAME */}

            <div className="courierProfileHeader-nameRow">
              <h1 className="courierProfileHeader-name">{fullName}</h1>

              {isApproved && (
                <FaCheckCircle
                  className="courierProfileHeader-verifiedIcon"
                  title="Approved courier"
                />
              )}
            </div>

            {/* PHONE */}

            <div className="courierProfileHeader-phone">
              <FaPhone />

              <span>{phoneNumber}</span>
            </div>

            {/* VEHICLE META */}

            <div className="courierProfileHeader-meta">
              <span className="courierProfileHeader-transport">
                {transportationType}
              </span>

              <span className="courierProfileHeader-vehicle">
                {vehicleClass}
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================
            ONLINE STATUS
        ================================================== */}

        <div
          className={`
            courierProfileHeader-onlineStatus
            ${
              isOnline
                ? "courierProfileHeader-online"
                : "courierProfileHeader-offline"
            }
          `}
        >
          <span className="courierProfileHeader-statusDot" />

          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>
      </div>

      {/* ==================================================
          BOTTOM ROW
      ================================================== */}

      <div className="courierProfileHeader-bottom">
        {/* ==================================================
            STATUS INFORMATION
        ================================================== */}

        <div className="courierProfileHeader-statusGroup">
          {/* APPROVAL STATUS */}

          <div
            className={`
              courierProfileHeader-approvalBadge
              ${
                isApproved
                  ? "courierProfileHeader-approved"
                  : "courierProfileHeader-pending"
              }
            `}
          >
            {isApproved ? <FaCheckCircle /> : <FaTimesCircle />}

            <span>{isApproved ? "Approved" : "Pending Approval"}</span>
          </div>

          {/* RATING */}

          <div className="courierProfileHeader-rating">
            <FaStar />

            <strong>{rating > 0 ? rating.toFixed(1) : "No rating"}</strong>

            <span>
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>

          {/* LOCATION */}

          {locationText && (
            <div className="courierProfileHeader-location">
              <FaMapMarkerAlt />

              <span>{locationText}</span>
            </div>
          )}
        </div>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div className="courierProfileHeader-actions">
          {/* ==================================================
              TRACK COURIER
          ================================================== */}

          <button
            type="button"
            className="courierProfileHeader-trackButton"
            onClick={handleTrack}
            disabled={!onTrack}
          >
            <FaMapMarkerAlt />

            <span>Track Courier</span>
          </button>

          {/* ==================================================
              BLOCK / UNBLOCK COURIER
          ================================================== */}

          <button
            type="button"
            className={`
              courierProfileHeader-blockButton
              ${isBlocked ? "courierProfileHeader-unblockButton" : ""}
            `}
            onClick={handleBlock}
            disabled={blockLoading || !onBlock}
          >
            {blockLoading ? (
              <>
                <span className="courierProfileHeader-buttonSpinner" />

                <span>Updating...</span>
              </>
            ) : isBlocked ? (
              <>
                <FaCheckCircle />

                <span>Unblock Courier</span>
              </>
            ) : (
              <>
                <FaBan />

                <span>Block Courier</span>
              </>
            )}
          </button>

          {/* ==================================================
              FORCE RESET COURIER CAPACITY
          ================================================== */}

          <button
            type="button"
            className="courierProfileHeader-resetButton"
            onClick={handleForceReset}
            disabled={resetLoading || !onForceReset}
            title="Reset the courier's current Express and Batch capacity counters"
          >
            {resetLoading ? (
              <>
                <span className="courierProfileHeader-buttonSpinner" />

                <span>Resetting...</span>
              </>
            ) : (
              <>
                <FaRedo />

                <span>Force Reset</span>
              </>
            )}
          </button>

          {/* ==================================================
              APPROVE / UNAPPROVE
          ================================================== */}

          <button
            type="button"
            className={`
              courierProfileHeader-approvalButton
              ${
                isApproved
                  ? "courierProfileHeader-unapproveButton"
                  : "courierProfileHeader-approveButton"
              }
            `}
            onClick={handleApproval}
            disabled={approvalLoading || !onApprove}
          >
            {approvalLoading ? (
              <>
                <span className="courierProfileHeader-buttonSpinner" />

                <span>Updating...</span>
              </>
            ) : isApproved ? (
              <>
                <FaTimesCircle />

                <span>Unapprove</span>
              </>
            ) : (
              <>
                <FaCheckCircle />

                <span>Approve Courier</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export default CourierProfileHeader;
