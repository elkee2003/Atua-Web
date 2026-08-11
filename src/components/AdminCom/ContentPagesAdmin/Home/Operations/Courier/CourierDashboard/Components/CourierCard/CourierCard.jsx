import React from "react";
import {
  FaStar,
  FaPhone,
  FaMotorcycle,
  FaMapMarkerAlt,
  FaEye,
  FaLocationArrow,
  FaCheckCircle,
  FaClock,
  FaBox,
  FaBolt,
} from "react-icons/fa";

import "./CourierCard.css";

function CourierCard({
  courier,
  profileUrl,
  loading,
  onApprove,
  onViewProfile,
  onTrack,
}) {
  const fullName =
    [courier?.firstName, courier?.lastName].filter(Boolean).join(" ") ||
    "Unnamed Courier";

  const firstInitial = courier?.firstName?.charAt(0)?.toUpperCase() || "C";

  const isOnline = Boolean(courier?.isOnline);
  const isApproved = Boolean(courier?.isApproved);

  const hasLocation =
    courier?.lat !== null &&
    courier?.lat !== undefined &&
    courier?.lng !== null &&
    courier?.lng !== undefined;

  const rating =
    courier?.averageRating !== null && courier?.averageRating !== undefined
      ? Number(courier.averageRating).toFixed(1)
      : "—";

  const reviewCount = courier?.reviewCount ?? 0;

  const batchCount = courier?.currentBatchCount ?? 0;

  const expressCount = courier?.currentExpressCount ?? 0;

  const maxiCount = courier?.currentMaxiCount ?? 0;

  const transportType = courier?.transportationType || "Transportation not set";

  const vehicleClass = courier?.vehicleClass || "Vehicle not specified";

  const vehicleModel = courier?.model || "Model not specified";

  const plateNumber = courier?.plateNumber || "No plate number";

  const handleCardClick = () => {
    onViewProfile();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onViewProfile();
    }
  };

  const handleApproveClick = (event) => {
    event.stopPropagation();

    if (!loading) {
      onApprove();
    }
  };

  const handleTrackClick = (event) => {
    event.stopPropagation();

    if (!hasLocation || !onTrack) {
      return;
    }

    onTrack();
  };

  return (
    <article
      className="courierCard"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View profile of ${fullName}`}
    >
      {/* ==================================================
                TOP SECTION
            ================================================== */}

      <div className="courierCard-header">
        <div className="courierCard-identity">
          <div className="courierCard-avatar">
            {profileUrl ? (
              <img src={profileUrl} alt={fullName} />
            ) : (
              <span>{firstInitial}</span>
            )}

            <span
              className={`courierCard-onlineIndicator ${
                isOnline ? "courierCard-online" : "courierCard-offline"
              }`}
              title={isOnline ? "Online" : "Offline"}
            />
          </div>

          <div className="courierCard-identityInfo">
            <h3 className="courierCard-name">{fullName}</h3>

            <div className="courierCard-phone">
              <FaPhone />
              <span>{courier?.phoneNumber || "No phone number"}</span>
            </div>
          </div>
        </div>

        <div
          className={`courierCard-status ${
            isOnline ? "courierCard-statusOnline" : "courierCard-statusOffline"
          }`}
        >
          <span className="courierCard-statusDot" />
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>

      {/* ==================================================
                TRANSPORT TYPE
            ================================================== */}

      <div className="courierCard-transportRow">
        <div className="courierCard-transportBadge">
          <FaMotorcycle />

          <span>{transportType}</span>
        </div>

        <div className="courierCard-rating">
          <FaStar />

          <strong>{rating}</strong>

          <span>({reviewCount})</span>
        </div>
      </div>

      {/* ==================================================
                VEHICLE INFORMATION
            ================================================== */}

      <div className="courierCard-vehicle">
        <div className="courierCard-vehicleItem">
          <span className="courierCard-label">Vehicle</span>

          <strong>{vehicleClass}</strong>
        </div>

        <div className="courierCard-vehicleItem">
          <span className="courierCard-label">Model</span>

          <strong>{vehicleModel}</strong>
        </div>

        <div className="courierCard-vehicleItem">
          <span className="courierCard-label">Plate</span>

          <strong>{plateNumber}</strong>
        </div>
      </div>

      {/* ==================================================
                CURRENT WORKLOAD
            ================================================== */}

      <div className="courierCard-workload">
        <div className="courierCard-workloadHeader">
          <span>Current workload</span>
        </div>

        <div className="courierCard-workloadStats">
          <div className="courierCard-workloadItem">
            <div className="courierCard-workloadIcon courierCard-batchIcon">
              <FaBox />
            </div>

            <div>
              <strong>{batchCount}</strong>

              <span>Batch</span>
            </div>
          </div>

          <div className="courierCard-workloadItem">
            <div className="courierCard-workloadIcon courierCard-expressIcon">
              <FaBolt />
            </div>

            <div>
              <strong>{expressCount}</strong>

              <span>Express</span>
            </div>
          </div>

          <div className="courierCard-workloadItem">
            <div className="courierCard-workloadIcon courierCard-maxiIcon">
              <FaMotorcycle />
            </div>

            <div>
              <strong>{maxiCount}</strong>

              <span>Maxi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
                STATUS
            ================================================== */}

      <div className="courierCard-approvalRow">
        <div className="courierCard-approval">
          {isApproved ? <FaCheckCircle /> : <FaClock />}

          <span>{isApproved ? "Approved" : "Pending approval"}</span>
        </div>

        {hasLocation && (
          <div className="courierCard-locationAvailable">
            <FaMapMarkerAlt />
            <span>Location available</span>
          </div>
        )}
      </div>

      {/* ==================================================
                ACTIONS
            ================================================== */}

      <div className="courierCard-actions">
        <button
          type="button"
          className="courierCard-action courierCard-viewButton"
          onClick={(event) => {
            event.stopPropagation();
            onViewProfile();
          }}
        >
          <FaEye />
          <span>View Profile</span>
        </button>

        <button
          type="button"
          className={`courierCard-action courierCard-trackButton ${
            !hasLocation ? "courierCard-trackDisabled" : ""
          }`}
          onClick={handleTrackClick}
          disabled={!hasLocation}
          title={
            hasLocation
              ? "View live location"
              : "Courier location is unavailable"
          }
        >
          <FaLocationArrow />
          <span>Track</span>
        </button>

        <button
          type="button"
          className={`courierCard-action courierCard-approvalButton ${
            isApproved
              ? "courierCard-unapproveButton"
              : "courierCard-approveButton"
          }`}
          onClick={handleApproveClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="courierCard-spinner" />
              <span>Updating</span>
            </>
          ) : isApproved ? (
            <>
              <span>Unapprove</span>
            </>
          ) : (
            <>
              <span>Approve</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default CourierCard;
