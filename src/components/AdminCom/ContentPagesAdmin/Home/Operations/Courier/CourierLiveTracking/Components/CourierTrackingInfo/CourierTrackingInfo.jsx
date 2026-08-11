import React from "react";
import {
  FaPhone,
  FaMotorcycle,
  FaCar,
  FaTruck,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

import "./CourierTrackingInfo.css";

function CourierTrackingInfo({ courier, position }) {
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
    COURIER DATA
    ==========================================================
    */

  const phoneNumber = courier?.phoneNumber || "Not available";

  const transportationType = courier?.transportationType || "Not specified";

  const vehicleClass = courier?.vehicleClass || "Not specified";

  const plateNumber = courier?.plateNumber || "Not available";

  /*
    ==========================================================
    STATUS
    ==========================================================
    */

  const isOnline = Boolean(courier?.isOnline);

  const isApproved = Boolean(courier?.isApproved);

  /*
    ==========================================================
    POSITION
    ==========================================================
    */

  const hasPosition =
    position &&
    Number.isFinite(Number(position.lat)) &&
    Number.isFinite(Number(position.lng));

  const latitude = hasPosition ? Number(position.lat).toFixed(5) : null;

  const longitude = hasPosition ? Number(position.lng).toFixed(5) : null;

  /*
    ==========================================================
    VEHICLE ICON
    ==========================================================
    */

  const getVehicleIcon = () => {
    const type = transportationType.toLowerCase();

    if (type.includes("micro")) {
      return <FaMotorcycle />;
    }

    if (type.includes("moto")) {
      return <FaMotorcycle />;
    }

    if (type.includes("maxi")) {
      return <FaTruck />;
    }

    return <FaCar />;
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <aside className="courierTrackingInfo">
      {/* =================================================
                HEADER
            ================================================= */}

      <div className="courierTrackingInfo-header">
        <div className="courierTrackingInfo-headerTitle">
          <span className="courierTrackingInfo-headerIcon">
            <FaMapMarkerAlt />
          </span>

          <div>
            <h2>Courier Information</h2>

            <p>Current courier status</p>
          </div>
        </div>
      </div>

      {/* =================================================
                COURIER IDENTITY
            ================================================= */}

      <div className="courierTrackingInfo-identity">
        <div className="courierTrackingInfo-avatar">
          {courier?.profilePic ? (
            <img src={courier.profilePic} alt={courierName} />
          ) : (
            <span>{courier?.firstName?.charAt(0)?.toUpperCase() || "C"}</span>
          )}
        </div>

        <div className="courierTrackingInfo-identityText">
          <h3>{courierName}</h3>

          <p>{transportationType}</p>
        </div>

        <div
          className={`courierTrackingInfo-onlineBadge ${
            isOnline
              ? "courierTrackingInfo-online"
              : "courierTrackingInfo-offline"
          }`}
        >
          <span />

          {isOnline ? "Online" : "Offline"}
        </div>
      </div>

      {/* =================================================
                APPROVAL STATUS
            ================================================= */}

      <div className="courierTrackingInfo-approval">
        <div className="courierTrackingInfo-approvalIcon">
          <FaCheckCircle />
        </div>

        <div className="courierTrackingInfo-approvalText">
          <span>Account Status</span>

          <strong
            className={
              isApproved
                ? "courierTrackingInfo-statusApproved"
                : "courierTrackingInfo-statusPending"
            }
          >
            {isApproved ? "Approved" : "Pending Approval"}
          </strong>
        </div>
      </div>

      {/* =================================================
                INFORMATION LIST
            ================================================= */}

      <div className="courierTrackingInfo-section">
        <h4>Courier Details</h4>

        {/* PHONE */}

        <div className="courierTrackingInfo-detail">
          <div className="courierTrackingInfo-detailIcon">
            <FaPhone />
          </div>

          <div className="courierTrackingInfo-detailContent">
            <span>Phone Number</span>

            <strong>{phoneNumber}</strong>
          </div>
        </div>

        {/* TRANSPORTATION */}

        <div className="courierTrackingInfo-detail">
          <div className="courierTrackingInfo-detailIcon">
            {getVehicleIcon()}
          </div>

          <div className="courierTrackingInfo-detailContent">
            <span>Transportation</span>

            <strong>{transportationType}</strong>
          </div>
        </div>

        {/* VEHICLE */}

        <div className="courierTrackingInfo-detail">
          <div className="courierTrackingInfo-detailIcon">
            <FaCar />
          </div>

          <div className="courierTrackingInfo-detailContent">
            <span>Vehicle</span>

            <strong>{vehicleClass}</strong>
          </div>
        </div>

        {/* PLATE NUMBER */}

        <div className="courierTrackingInfo-detail">
          <div className="courierTrackingInfo-detailIcon">
            <FaMotorcycle />
          </div>

          <div className="courierTrackingInfo-detailContent">
            <span>Plate Number</span>

            <strong>{plateNumber}</strong>
          </div>
        </div>
      </div>

      {/* =================================================
                CURRENT LOCATION
            ================================================= */}

      <div className="courierTrackingInfo-locationSection">
        <div className="courierTrackingInfo-sectionHeading">
          <h4>Current Location</h4>

          {hasPosition && (
            <span className="courierTrackingInfo-liveLabel">
              <FaClock />
              Live
            </span>
          )}
        </div>

        {hasPosition ? (
          <div className="courierTrackingInfo-coordinates">
            <div className="courierTrackingInfo-coordinate">
              <span>Latitude</span>

              <strong>{latitude}</strong>
            </div>

            <div className="courierTrackingInfo-coordinate">
              <span>Longitude</span>

              <strong>{longitude}</strong>
            </div>
          </div>
        ) : (
          <div className="courierTrackingInfo-noLocation">
            <FaMapMarkerAlt />

            <div>
              <strong>Location unavailable</strong>

              <span>
                No valid coordinates have been received from this courier.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =================================================
                LIVE LOCATION STATUS
            ================================================= */}

      <div
        className={`courierTrackingInfo-locationStatus ${
          hasPosition
            ? "courierTrackingInfo-locationActive"
            : "courierTrackingInfo-locationInactive"
        }`}
      >
        <span className="courierTrackingInfo-locationStatusDot" />

        <span>
          {hasPosition
            ? "Courier location is available"
            : "Waiting for courier location"}
        </span>
      </div>
    </aside>
  );
}

export default CourierTrackingInfo;
