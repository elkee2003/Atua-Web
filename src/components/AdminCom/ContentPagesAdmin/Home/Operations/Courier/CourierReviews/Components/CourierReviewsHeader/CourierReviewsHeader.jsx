import React from "react";

import {
  FaArrowLeft,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaRedo,
  FaStar,
  FaTimesCircle,
  FaUser,
} from "react-icons/fa";

import "./CourierReviewsHeader.css";

function CourierReviewsHeader({
  courier,
  profileUrl,
  onBack,
  onRefresh,
  refreshing = false,
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
  COURIER IDENTITY
  ==========================================================
  */

  const firstName = courier.firstName || "";

  const lastName = courier.lastName || "";

  const courierName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || "Courier";

  const courierInitials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase() || "C";

  /*
  ==========================================================
  CONTACT
  ==========================================================
  */

  const phoneNumber =
    courier.phoneNumber || courier.phone || "Phone number not available";

  /*
  ==========================================================
  TRANSPORTATION
  ==========================================================
  */

  const transportationType =
    courier.transportationType || "Transportation not specified";

  const vehicleClass = courier.vehicleClass || "Vehicle not specified";

  const plateNumber =
    courier.plateNumber ||
    courier.vehicleRegistrationNumber ||
    "Plate not available";

  /*
  ==========================================================
  STATUS
  ==========================================================
  */

  const isOnline = Boolean(courier.isOnline);

  const isApproved = Boolean(courier.isApproved);

  /*
  ==========================================================
  RATING
  ==========================================================
  */

  const rating =
    courier.averageRating !== null && courier.averageRating !== undefined
      ? Number(courier.averageRating)
      : 0;

  const reviewCount = Number(courier.reviewCount ?? 0);

  /*
  ==========================================================
  LOCATION
  ==========================================================
  */

  const location =
    courier.currentLocation || courier.location || courier.address || null;

  /*
  ==========================================================
  HANDLERS
  ==========================================================
  */

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
    }
  };

  const handleRefresh = () => {
    if (typeof onRefresh !== "function" || refreshing) {
      return;
    }

    onRefresh();
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <header className="courierReviewsHeader">
      {/* ==================================================
          TOP NAVIGATION
      ================================================== */}

      <div className="courierReviewsHeader-top">
        <button
          type="button"
          className="courierReviewsHeader-iconButton"
          onClick={handleBack}
          aria-label="Back to courier"
          title="Back to courier"
        >
          <FaArrowLeft />
        </button>

        <button
          type="button"
          className="courierReviewsHeader-iconButton"
          onClick={handleRefresh}
          disabled={refreshing || typeof onRefresh !== "function"}
          aria-label="Refresh reviews"
          title="Refresh reviews"
        >
          <FaRedo
            className={refreshing ? "courierReviewsHeader-refreshSpinning" : ""}
          />
        </button>
      </div>

      {/* ==================================================
          COURIER IDENTITY
      ================================================== */}

      <div className="courierReviewsHeader-profile">
        {/* ==================================================
            AVATAR
        ================================================== */}

        <div className="courierReviewsHeader-avatar">
          {profileUrl ? (
            <img
              src={profileUrl}
              alt={courierName}
              className="courierReviewsHeader-avatarImage"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="courierReviewsHeader-initials">
              {courierInitials}
            </span>
          )}
        </div>

        {/* ==================================================
            COURIER INFORMATION
        ================================================== */}

        <div className="courierReviewsHeader-info">
          {/* NAME */}

          <div className="courierReviewsHeader-nameRow">
            <h1>{courierName}</h1>

            {isApproved ? (
              <FaCheckCircle
                className="courierReviewsHeader-approvedIcon"
                title="Approved courier"
              />
            ) : (
              <FaTimesCircle
                className="courierReviewsHeader-pendingIcon"
                title="Pending approval"
              />
            )}

            <span
              className={`
                courierReviewsHeader-onlineBadge
                ${
                  isOnline
                    ? "courierReviewsHeader-online"
                    : "courierReviewsHeader-offline"
                }
              `}
            >
              <span />

              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* TRANSPORTATION */}

          <div className="courierReviewsHeader-details">
            <span>{transportationType}</span>

            <span className="courierReviewsHeader-separator">•</span>

            <span>{vehicleClass}</span>

            <span className="courierReviewsHeader-separator">•</span>

            <span>{plateNumber}</span>
          </div>

          {/* PHONE */}

          <div className="courierReviewsHeader-phone">
            <FaPhone />

            <span>{phoneNumber}</span>
          </div>

          {/* LOCATION */}

          {location && (
            <div className="courierReviewsHeader-location">
              <FaMapMarkerAlt />

              <span>{location}</span>
            </div>
          )}
        </div>

        {/* ==================================================
            RATING SUMMARY
        ================================================== */}

        <div className="courierReviewsHeader-rating">
          <span className="courierReviewsHeader-ratingLabel">
            Overall Rating
          </span>

          <div className="courierReviewsHeader-ratingValue">
            <FaStar />

            <strong>{rating > 0 ? rating.toFixed(1) : "N/A"}</strong>
          </div>

          <span className="courierReviewsHeader-reviewCount">
            {reviewCount.toLocaleString("en-NG")}{" "}
            {reviewCount === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      {/* ==================================================
          PAGE TITLE
      ================================================== */}

      <div className="courierReviewsHeader-pageTitle">
        <div className="courierReviewsHeader-pageTitleIcon">
          <FaStar />
        </div>

        <div className="courierReviewsHeader-pageTitleContent">
          <h2>Courier Reviews</h2>

          <p>View and manage customer feedback and ratings for this courier.</p>
        </div>
      </div>
    </header>
  );
}

export default CourierReviewsHeader;
