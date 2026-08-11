import React from "react";
import {
  FaCircle,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaWifi,
  FaExclamationTriangle,
} from "react-icons/fa";

import "./TrackingStatus.css";

function TrackingStatus({ courier, position, lastUpdated = null }) {
  /*
    ==========================================================
    COURIER STATUS
    ==========================================================
    */

  const isOnline = Boolean(courier?.isOnline);

  const isApproved = Boolean(courier?.isApproved);

  /*
    ==========================================================
    LOCATION STATUS
    ==========================================================
    */

  const hasPosition =
    position &&
    Number.isFinite(Number(position.lat)) &&
    Number.isFinite(Number(position.lng));

  /*
    ==========================================================
    LAST UPDATED
    ==========================================================
    */

  const formatLastUpdated = () => {
    if (!lastUpdated) {
      return "Waiting for update";
    }

    const date = new Date(lastUpdated);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /*
    ==========================================================
    OVERALL TRACKING STATE
    ==========================================================
    */

  const trackingActive = isOnline && hasPosition;

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="trackingStatus">
      {/* =================================================
                HEADER
            ================================================= */}

      <div className="trackingStatus-header">
        <div className="trackingStatus-headerTitle">
          <div className="trackingStatus-headerIcon">
            <FaWifi />
          </div>

          <div>
            <h2>Tracking Status</h2>

            <p>Live courier connection</p>
          </div>
        </div>

        <div
          className={`trackingStatus-mainBadge ${
            trackingActive
              ? "trackingStatus-mainBadgeActive"
              : "trackingStatus-mainBadgeInactive"
          }`}
        >
          <FaCircle />

          {trackingActive ? "LIVE" : "INACTIVE"}
        </div>
      </div>

      {/* =================================================
                STATUS GRID
            ================================================= */}

      <div className="trackingStatus-grid">
        {/* =================================================
                    ONLINE STATUS
                ================================================= */}

        <div className="trackingStatus-item">
          <div
            className={`trackingStatus-itemIcon ${
              isOnline
                ? "trackingStatus-iconOnline"
                : "trackingStatus-iconOffline"
            }`}
          >
            <FaCircle />
          </div>

          <div className="trackingStatus-itemContent">
            <span>Connection</span>

            <strong
              className={
                isOnline
                  ? "trackingStatus-valueOnline"
                  : "trackingStatus-valueOffline"
              }
            >
              {isOnline ? "Online" : "Offline"}
            </strong>
          </div>
        </div>

        {/* =================================================
                    APPROVAL STATUS
                ================================================= */}

        <div className="trackingStatus-item">
          <div
            className={`trackingStatus-itemIcon ${
              isApproved
                ? "trackingStatus-iconApproved"
                : "trackingStatus-iconPending"
            }`}
          >
            <FaCheckCircle />
          </div>

          <div className="trackingStatus-itemContent">
            <span>Approval</span>

            <strong
              className={
                isApproved
                  ? "trackingStatus-valueApproved"
                  : "trackingStatus-valuePending"
              }
            >
              {isApproved ? "Approved" : "Pending"}
            </strong>
          </div>
        </div>

        {/* =================================================
                    LOCATION STATUS
                ================================================= */}

        <div className="trackingStatus-item">
          <div
            className={`trackingStatus-itemIcon ${
              hasPosition
                ? "trackingStatus-iconLocation"
                : "trackingStatus-iconWarning"
            }`}
          >
            {hasPosition ? <FaMapMarkerAlt /> : <FaExclamationTriangle />}
          </div>

          <div className="trackingStatus-itemContent">
            <span>Location</span>

            <strong
              className={
                hasPosition
                  ? "trackingStatus-valueLocation"
                  : "trackingStatus-valueWarning"
              }
            >
              {hasPosition ? "Available" : "Unavailable"}
            </strong>
          </div>
        </div>

        {/* =================================================
                    LAST UPDATE
                ================================================= */}

        <div className="trackingStatus-item">
          <div className="trackingStatus-itemIcon trackingStatus-iconUpdate">
            <FaWifi />
          </div>

          <div className="trackingStatus-itemContent">
            <span>Last Update</span>

            <strong>{formatLastUpdated()}</strong>
          </div>
        </div>
      </div>

      {/* =================================================
                LOCATION MESSAGE
            ================================================= */}

      <div
        className={`trackingStatus-message ${
          trackingActive
            ? "trackingStatus-messageActive"
            : "trackingStatus-messageInactive"
        }`}
      >
        <span className="trackingStatus-messageDot" />

        <div>
          <strong>
            {trackingActive
              ? "Live tracking is active"
              : "Live tracking is inactive"}
          </strong>

          <p>
            {trackingActive
              ? "The courier is online and a valid location is currently available."
              : !isOnline
                ? "The courier is currently offline. Live location updates may not be available."
                : "The courier is online, but a valid location has not been received yet."}
          </p>
        </div>
      </div>

      {/* =================================================
                COORDINATES SUMMARY
            ================================================= */}

      {hasPosition && (
        <div className="trackingStatus-coordinates">
          <div className="trackingStatus-coordinateHeader">
            <span>Current Coordinates</span>
          </div>

          <div className="trackingStatus-coordinateValues">
            <div className="trackingStatus-coordinate">
              <span>LAT</span>

              <strong>{Number(position.lat).toFixed(5)}</strong>
            </div>

            <div className="trackingStatus-coordinate">
              <span>LNG</span>

              <strong>{Number(position.lng).toFixed(5)}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default TrackingStatus;
