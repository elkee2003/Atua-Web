import React, { useMemo } from "react";

import {
  FaCircle,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaWifi,
  FaExclamationTriangle,
  FaTachometerAlt,
  FaCompass,
  FaCrosshairs,
} from "react-icons/fa";

import "./TrackingStatus.css";

/*
==========================================================
CONSTANTS
==========================================================
*/

// *Speed - Speed tells you how fast the courier is moving.
// 0 km/h — courier is stationary.
// 5 km/h — moving slowly, perhaps in traffic.
// 35 km/h — moving at a normal city-driving speed.
// 80 km/h — moving quickly, possibly on a highway.

// Accuracy - Accuracy tells you how close the reported GPS position is likely to be to the courier's actual position.

// 1-5 m: Very good GPS accuracy
// 5-15 m: Good and usually useful
// 15-50 m: Moderate accuracy
// 50-100 m: Poor accuracy
// 100 m+: Very unreliable for precise tracking
// Lower is better.

// Heading - Heading tells you the direction the courier is moving, measured in degrees.
// 0° or 360°- North
// 45° - Northeast
// 90° - East
// 135° - Southeast
// 180° - South
// 225° - Southwest
// 270° - West
// 315° - Northwest

// Altitude - Altitude tells you the phone's estimated height above sea level.
// Eg: Altitude: 35.8 m

// Tracking Source - This describes where the location data came from.
// GPS - Location obtained primarily through GPS satellites

// NETWORK - Location estimated using mobile network or Wi-Fi

// PASSIVE - Location supplied by another location service

// BACKGROUND - Location captured while the app is running in the background

/**
 * A live-location record older than this amount of time
 * is considered stale.
 *
 * Three minutes is used as the maximum acceptable age
 * for displaying the location as LIVE.
 */
const LIVE_LOCATION_STALE_AFTER_MS = 3 * 60 * 1000;

/*
==========================================================
HELPER FUNCTIONS
==========================================================
*/

/**
 * Safely converts a value to a finite number.
 *
 * Returns null when the value is not a valid number.
 */
function toFiniteNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/**
 * Checks whether latitude and longitude are valid.
 */
function isValidCoordinates(latitude, longitude) {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Safely formats a timestamp.
 */
function formatTime(timestamp) {
  if (!timestamp) {
    return "Waiting for update";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Formats only the date of the last GPS update.
 *
 * Example:
 * Sep 13, 2026
 */
function formatDate(timestamp) {
  if (!timestamp) {
    return "Date unavailable";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats speed.
 *
 * CourierLiveLocation.speed is assumed to be in metres
 * per second. The value is converted to kilometres/hour.
 */
function formatSpeed(speed) {
  const numericSpeed = toFiniteNumber(speed);

  if (numericSpeed === null) {
    return "Unavailable";
  }

  const speedInKmh = numericSpeed * 3.6;

  return `${speedInKmh.toFixed(1)} km/h`;
}

/**
 * Formats GPS accuracy.
 */
function formatAccuracy(accuracy) {
  const numericAccuracy = toFiniteNumber(accuracy);

  if (numericAccuracy === null) {
    return "Unavailable";
  }

  return `${numericAccuracy.toFixed(1)} m`;
}

/**
 * Formats heading.
 */
function formatHeading(heading) {
  const numericHeading = toFiniteNumber(heading);

  if (numericHeading === null) {
    return "Unavailable";
  }

  return `${numericHeading.toFixed(0)}°`;
}

/*
==========================================================
TRACKING STATUS COMPONENT
==========================================================

Props:

courier
  -> Courier model

liveLocation
  -> CourierLiveLocation model

position
  -> Normalized fallback object:
     {
       lat,
       lng,
       isTracking,
       trackingSource,
       lastSeenAt,
       speed,
       accuracy,
       heading
     }

lastUpdated
  -> Optional compatibility fallback timestamp

IMPORTANT:

Courier is responsible for courier/profile status.

CourierLiveLocation is responsible for GPS/tracking status.
==========================================================
*/

function TrackingStatus({
  courier,
  liveLocation = null,
  position = null,
  lastUpdated = null,
}) {
  /*
  ==========================================================
  COURIER STATUS
  ==========================================================
  */

  const isOnline = courier?.isOnline === true;

  const isApproved = courier?.isApproved === true;

  /*
  ==========================================================
  LIVE LOCATION COORDINATES
  ==========================================================

  CourierLiveLocation is the primary source.

  position is only used as a compatibility fallback.
  ==========================================================
  */

  const currentLatitude = useMemo(() => {
    const liveLatitude = toFiniteNumber(liveLocation?.latitude);

    if (liveLatitude !== null) {
      return liveLatitude;
    }

    return toFiniteNumber(position?.lat);
  }, [liveLocation?.latitude, position?.lat]);

  const currentLongitude = useMemo(() => {
    const liveLongitude = toFiniteNumber(liveLocation?.longitude);

    if (liveLongitude !== null) {
      return liveLongitude;
    }

    return toFiniteNumber(position?.lng);
  }, [liveLocation?.longitude, position?.lng]);

  /*
  ==========================================================
  VALID POSITION
  ==========================================================
  */

  const hasPosition = useMemo(() => {
    return isValidCoordinates(currentLatitude, currentLongitude);
  }, [currentLatitude, currentLongitude]);

  /*
  ==========================================================
  LIVE TRACKING FLAG
  ==========================================================

  This must come from CourierLiveLocation.

  A courier being online does not automatically mean that
  the courier's device is actively sending GPS data.
  ==========================================================
  */

  const isTracking =
    liveLocation?.isTracking === true || position?.isTracking === true;

  /*
  ==========================================================
  TRACKING SOURCE
  ==========================================================
  */

  const trackingSource =
    liveLocation?.trackingSource || position?.trackingSource || null;

  /*
  ==========================================================
  LAST GPS UPDATE
  ==========================================================

  Primary:
    liveLocation.lastSeenAt

  Fallback:
    position.lastSeenAt

  Final fallback:
    lastUpdated
  ==========================================================
  */

  const effectiveLastUpdated =
    liveLocation?.lastSeenAt || position?.lastSeenAt || lastUpdated || null;

  /*
  ==========================================================
  LOCATION FRESHNESS
  ==========================================================
  */

  const locationIsFresh = useMemo(() => {
    if (!effectiveLastUpdated) {
      return false;
    }

    const timestamp = new Date(effectiveLastUpdated).getTime();

    if (Number.isNaN(timestamp)) {
      return false;
    }

    const age = Date.now() - timestamp;

    /*
    A future timestamp is accepted as fresh because small
    clock differences can happen between devices and servers.
    */
    if (age < 0) {
      return true;
    }

    return age <= LIVE_LOCATION_STALE_AFTER_MS;
  }, [effectiveLastUpdated]);

  /*
  ==========================================================
  OVERALL TRACKING STATE
  ==========================================================

  Tracking is considered LIVE only when:

  1. Courier is online.
  2. Courier is approved.
  3. CourierLiveLocation says tracking is enabled.
  4. Coordinates are valid.
  5. GPS update is fresh.
  ==========================================================
  */

  const trackingActive =
    isOnline && isApproved && isTracking && hasPosition && locationIsFresh;

  /*
  ==========================================================
  LOCATION STATUS
  ==========================================================
  */

  const locationStatus = useMemo(() => {
    if (!hasPosition) {
      return "Unavailable";
    }

    if (!isTracking) {
      return "Tracking Off";
    }

    if (!locationIsFresh) {
      return "Stale";
    }

    return "Available";
  }, [hasPosition, isTracking, locationIsFresh]);

  /*
  ==========================================================
  LOCATION STATUS CSS CLASS
  ==========================================================
  */

  const locationStatusClass = useMemo(() => {
    if (trackingActive) {
      return "trackingStatus-valueLocation";
    }

    return "trackingStatus-valueWarning";
  }, [trackingActive]);

  /*
  ==========================================================
  GPS DETAILS
  ==========================================================

  Primary source:
    liveLocation

  Fallback:
    position
  ==========================================================
  */

  const speed = liveLocation?.speed ?? position?.speed ?? null;

  const accuracy = liveLocation?.accuracy ?? position?.accuracy ?? null;

  const heading = liveLocation?.heading ?? position?.heading ?? null;

  const altitude = liveLocation?.altitude ?? position?.altitude ?? null;

  /*
  ==========================================================
  TRACKING MESSAGE
  ==========================================================
  */

  const trackingMessage = useMemo(() => {
    if (trackingActive) {
      return "The courier is online, approved, actively sending GPS data, and the latest location is current.";
    }

    if (!isOnline) {
      return "The courier is currently offline. Live location updates are not expected.";
    }

    if (!isApproved) {
      return "The courier has not been approved. Live tracking is unavailable until approval is completed.";
    }

    if (!liveLocation && !position) {
      return "The courier is online, but no live location record has been received yet.";
    }

    if (!isTracking) {
      return "The courier is online, but their device is not currently sending live location.";
    }

    if (!hasPosition) {
      return "A live-location record exists, but valid coordinates have not been received.";
    }

    if (!locationIsFresh) {
      return "The courier has a location, but the last GPS update is stale.";
    }

    return "Live location is currently unavailable.";
  }, [
    trackingActive,
    isOnline,
    isApproved,
    liveLocation,
    position,
    isTracking,
    hasPosition,
    locationIsFresh,
  ]);

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
            <FaWifi aria-hidden="true" />
          </div>

          <div>
            <h2>Tracking Status</h2>

            <p>Live courier connection</p>
          </div>
        </div>

        {/* MAIN TRACKING BADGE */}

        <div
          className={`trackingStatus-mainBadge ${
            trackingActive
              ? "trackingStatus-mainBadgeActive"
              : "trackingStatus-mainBadgeInactive"
          }`}
        >
          <FaCircle aria-hidden="true" />

          <span>{trackingActive ? "LIVE" : "INACTIVE"}</span>
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
            <FaCircle aria-hidden="true" />
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
            <FaCheckCircle aria-hidden="true" />
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
              trackingActive
                ? "trackingStatus-iconLocation"
                : "trackingStatus-iconWarning"
            }`}
          >
            {trackingActive ? (
              <FaMapMarkerAlt aria-hidden="true" />
            ) : (
              <FaExclamationTriangle aria-hidden="true" />
            )}
          </div>

          <div className="trackingStatus-itemContent">
            <span>Location</span>

            <strong className={locationStatusClass}>{locationStatus}</strong>
          </div>
        </div>

        {/* =================================================
            LAST GPS UPDATE
        ================================================= */}

        <div className="trackingStatus-item">
          <div className="trackingStatus-itemIcon trackingStatus-iconUpdate">
            <FaWifi aria-hidden="true" />
          </div>

          <div className="trackingStatus-itemContent">
            <span>Last GPS Update</span>

            <div className="trackingStatus-lastGps">
              {/* Displays the time separately */}
              <strong className="trackingStatus-lastGpsTime">
                {formatTime(effectiveLastUpdated)}
              </strong>

              {/* Displays the date separately */}
              <span className="trackingStatus-lastGpsDate">
                {formatDate(effectiveLastUpdated)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          TRACKING MESSAGE
      ================================================= */}

      <div
        className={`trackingStatus-message ${
          trackingActive
            ? "trackingStatus-messageActive"
            : "trackingStatus-messageInactive"
        }`}
      >
        <span className="trackingStatus-messageDot" aria-hidden="true" />

        <div>
          <strong>
            {trackingActive
              ? "Live tracking is active"
              : "Live tracking is inactive"}
          </strong>

          <p>{trackingMessage}</p>
        </div>
      </div>

      {/* =================================================
          COORDINATES SUMMARY
      ================================================= */}

      {hasPosition && currentLatitude !== null && currentLongitude !== null && (
        <div className="trackingStatus-coordinates">
          <div className="trackingStatus-coordinateHeader">
            <span>Current Coordinates</span>
          </div>

          <div className="trackingStatus-coordinateValues">
            <div className="trackingStatus-coordinate">
              <span>LAT</span>

              <strong>{currentLatitude.toFixed(5)}</strong>
            </div>

            <div className="trackingStatus-coordinate">
              <span>LNG</span>

              <strong>{currentLongitude.toFixed(5)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          GPS DETAILS
      ================================================= */}

      {hasPosition && (
        <div className="trackingStatus-gpsDetails">
          {/* SPEED */}

          <div className="trackingStatus-gpsDetail">
            <FaTachometerAlt aria-hidden="true" />

            <div>
              <span>Speed</span>

              <strong>{formatSpeed(speed)}</strong>
            </div>
          </div>

          {/* ACCURACY */}

          <div className="trackingStatus-gpsDetail">
            <FaCrosshairs aria-hidden="true" />

            <div>
              <span>Accuracy</span>

              <strong>{formatAccuracy(accuracy)}</strong>
            </div>
          </div>

          {/* HEADING */}

          <div className="trackingStatus-gpsDetail">
            <FaCompass aria-hidden="true" />

            <div>
              <span>Heading</span>

              <strong>{formatHeading(heading)}</strong>
            </div>
          </div>

          {/* ALTITUDE */}

          <div className="trackingStatus-gpsDetail">
            <FaMapMarkerAlt aria-hidden="true" />

            <div>
              <span>Altitude</span>

              <strong>
                {toFiniteNumber(altitude) !== null
                  ? `${toFiniteNumber(altitude).toFixed(1)} m`
                  : "Unavailable"}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          TRACKING SOURCE
      ================================================= */}

      {trackingSource && (
        <div className="trackingStatus-source">
          <span>Tracking Source</span>

          <strong>{trackingSource}</strong>
        </div>
      )}
    </section>
  );
}

export default TrackingStatus;
