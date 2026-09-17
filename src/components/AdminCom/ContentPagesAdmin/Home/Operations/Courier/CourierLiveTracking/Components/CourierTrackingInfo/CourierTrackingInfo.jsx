import React, { useEffect, useMemo, useState } from "react";
import { getUrl } from "aws-amplify/storage";

import {
  FaPhone,
  FaMotorcycle,
  FaCar,
  FaTruck,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaClock,
  FaSatelliteDish,
  FaExclamationTriangle,
} from "react-icons/fa";

import "./CourierTrackingInfo.css";

/**
 * ==========================================================
 * COURIER TRACKING INFORMATION
 * ==========================================================
 *
 * This component receives:
 *
 * courier:
 *   General courier information from the Courier model.
 *
 * position:
 *   Latest location information from CourierLiveLocation,
 *   already converted by the parent component into:
 *
 *   {
 *     lat,
 *     lng,
 *     heading,
 *     speed,
 *     accuracy,
 *     altitude,
 *     isTracking,
 *     trackingSource,
 *     lastSeenAt
 *   }
 *
 * profileUrl:
 *   Optional profile image URL already resolved by the parent.
 *
 * IMPORTANT:
 * This component does not query CourierLiveLocation directly.
 * The parent CourierTracking component is responsible for
 * fetching and observing the live location.
 * ==========================================================
 */

function CourierTrackingInfo({
  courier,
  position,
  profileUrl: suppliedProfileUrl = null,
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
  COURIER INITIALS
  ==========================================================
  */

  const firstInitial = courier?.firstName?.charAt(0)?.toUpperCase() || "";

  const lastInitial = courier?.lastName?.charAt(0)?.toUpperCase() || "";

  const courierInitials = `${firstInitial}${lastInitial}` || "C";

  /*
  ==========================================================
  COURIER DATA
  ==========================================================
  */

  const phoneNumber = courier?.phoneNumber || "Not available";

  const transportationType = courier?.transportationType || "Not specified";

  const vehicleClass = courier?.vehicleClass || "Not specified";

  const plateNumber =
    courier?.plateNumber ||
    courier?.vehicleRegistrationNumber ||
    "Not available";

  /*
  ==========================================================
  COURIER ACCOUNT STATUS
  ==========================================================
  */

  const isOnline = Boolean(courier?.isOnline);

  const isApproved = Boolean(courier?.isApproved);

  /*
  ==========================================================
  LIVE LOCATION STATUS
  ==========================================================
  *
  * These values come from CourierLiveLocation through the
  * position prop.
  ==========================================================
  */

  const hasPosition = Boolean(
    position &&
    Number.isFinite(Number(position.lat)) &&
    Number.isFinite(Number(position.lng)),
  );

  const isTracking = Boolean(position?.isTracking);

  const trackingSource = position?.trackingSource || "Unknown source";

  const lastSeenAt = position?.lastSeenAt || null;

  /*
  ==========================================================
  COORDINATES
  ==========================================================
  */

  const latitude = hasPosition ? Number(position.lat).toFixed(5) : null;

  const longitude = hasPosition ? Number(position.lng).toFixed(5) : null;

  /*
  ==========================================================
  LAST SEEN TEXT
  ==========================================================
  */

  const formattedLastSeen = useMemo(() => {
    if (!lastSeenAt) {
      return "Not available";
    }

    const parsedDate = new Date(lastSeenAt);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return parsedDate.toLocaleString();
  }, [lastSeenAt]);

  /*
  ==========================================================
  LOCATION STATUS
  ==========================================================
  *
  * A valid coordinate does not automatically mean that the
  * courier is currently transmitting live location.
  *
  * We therefore distinguish between:
  *
  * 1. Live tracking
  * 2. Last known location
  * 3. No location
  ==========================================================
  */

  const locationStatus = useMemo(() => {
    if (!hasPosition) {
      return {
        label: "Waiting for courier location",
        className: "courierTrackingInfo-locationInactive",
        isLive: false,
      };
    }

    if (isTracking) {
      return {
        label: "Courier is transmitting live location",
        className: "courierTrackingInfo-locationActive",
        isLive: true,
      };
    }

    return {
      label: "Showing last known courier location",
      className: "courierTrackingInfo-locationInactive",
      isLive: false,
    };
  }, [hasPosition, isTracking]);

  /*
  ==========================================================
  PROFILE IMAGE STATE
  ==========================================================
  */

  const [resolvedProfileUrl, setResolvedProfileUrl] = useState(
    suppliedProfileUrl || null,
  );

  const [imageLoading, setImageLoading] = useState(
    Boolean(courier?.profilePic && !suppliedProfileUrl),
  );

  const [imageError, setImageError] = useState(false);

  /*
  ==========================================================
  RESOLVE PROFILE IMAGE
  ==========================================================
  */

  useEffect(() => {
    let cancelled = false;

    const resolveProfileImage = async () => {
      /*
      --------------------------------------------------------
      RESET IMAGE STATE
      --------------------------------------------------------
      */

      setImageError(false);

      /*
      --------------------------------------------------------
      USE URL SUPPLIED BY PARENT
      --------------------------------------------------------
      */

      if (suppliedProfileUrl) {
        setResolvedProfileUrl(suppliedProfileUrl);
        setImageLoading(false);
        return;
      }

      /*
      --------------------------------------------------------
      GET PROFILE IMAGE PATH
      --------------------------------------------------------
      */

      const profilePath =
        courier?.profilePic ||
        courier?.profilePhoto ||
        courier?.profileImage ||
        null;

      /*
      --------------------------------------------------------
      NO PROFILE IMAGE
      --------------------------------------------------------
      */

      if (!profilePath) {
        setResolvedProfileUrl(null);
        setImageLoading(false);
        return;
      }

      /*
      --------------------------------------------------------
      IF PROFILE IMAGE IS ALREADY A URL
      --------------------------------------------------------
      */

      if (
        typeof profilePath === "string" &&
        (profilePath.startsWith("http://") ||
          profilePath.startsWith("https://") ||
          profilePath.startsWith("blob:") ||
          profilePath.startsWith("data:"))
      ) {
        if (!cancelled) {
          setResolvedProfileUrl(profilePath);
          setImageLoading(false);
        }

        return;
      }

      /*
      --------------------------------------------------------
      LOAD PROFILE IMAGE FROM AMPLIFY STORAGE
      --------------------------------------------------------
      */

      try {
        setImageLoading(true);

        console.log("CourierTrackingInfo profile image path:", profilePath);

        const result = await getUrl({
          path: profilePath,
          options: {
            validateObjectExistence: true,
          },
        });

        if (cancelled) {
          return;
        }

        if (result?.url) {
          const url = result.url.toString();

          console.log("CourierTrackingInfo resolved profile URL:", url);

          setResolvedProfileUrl(url);
          setImageError(false);
        } else {
          console.warn("Amplify Storage returned no profile image URL.");

          setResolvedProfileUrl(null);
          setImageError(true);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "CourierTrackingInfo could not load profile image:",
          error,
        );

        setResolvedProfileUrl(null);
        setImageError(true);
      } finally {
        if (!cancelled) {
          setImageLoading(false);
        }
      }
    };

    resolveProfileImage();

    return () => {
      cancelled = true;
    };
  }, [
    courier?.profilePic,
    courier?.profilePhoto,
    courier?.profileImage,
    suppliedProfileUrl,
  ]);

  /*
  ==========================================================
  IMAGE ERROR HANDLER
  ==========================================================
  */

  const handleImageError = (event) => {
    console.error(
      "CourierTrackingInfo image failed:",
      event?.currentTarget?.src,
    );

    setImageError(true);
    setResolvedProfileUrl(null);
  };

  /*
  ==========================================================
  IMAGE LOADED HANDLER
  ==========================================================
  */

  const handleImageLoad = () => {
    setImageError(false);
    setImageLoading(false);
  };

  /*
  ==========================================================
  VEHICLE ICON
  ==========================================================
  */

  const getVehicleIcon = () => {
    const type = String(transportationType).toLowerCase();

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
      {/* ==================================================
          HEADER
      ================================================== */}

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

      {/* ==================================================
          COURIER IDENTITY
      ================================================== */}

      <div className="courierTrackingInfo-identity">
        <div className="courierTrackingInfo-avatar">
          {resolvedProfileUrl && !imageError ? (
            <img
              src={resolvedProfileUrl}
              alt={courierName}
              className="courierTrackingInfo-avatarImage"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : imageLoading ? (
            <span className="courierTrackingInfo-avatarLoading">
              <span />
            </span>
          ) : (
            <span className="courierTrackingInfo-avatarInitials">
              {courierInitials}
            </span>
          )}
        </div>

        <div className="courierTrackingInfo-identityText">
          <h3>{courierName}</h3>
          <p>{transportationType}</p>
        </div>

        <div
          className={`
            courierTrackingInfo-onlineBadge
            ${
              isOnline
                ? "courierTrackingInfo-online"
                : "courierTrackingInfo-offline"
            }
          `}
        >
          <span />
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>

      {/* ==================================================
          APPROVAL STATUS
      ================================================== */}

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

      {/* ==================================================
          COURIER DETAILS
      ================================================== */}

      <div className="courierTrackingInfo-section">
        <h4>Courier Details</h4>

        {/* PHONE NUMBER */}

        <div className="courierTrackingInfo-detail">
          <div className="courierTrackingInfo-detailIcon">
            <FaPhone />
          </div>

          <div className="courierTrackingInfo-detailContent">
            <span>Phone Number</span>
            <strong>{phoneNumber}</strong>
          </div>
        </div>

        {/* TRANSPORTATION TYPE */}

        <div className="courierTrackingInfo-detail">
          <div className="courierTrackingInfo-detailIcon">
            {getVehicleIcon()}
          </div>

          <div className="courierTrackingInfo-detailContent">
            <span>Transportation</span>
            <strong>{transportationType}</strong>
          </div>
        </div>

        {/* VEHICLE CLASS */}

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

      {/* ==================================================
          CURRENT LOCATION
      ================================================== */}

      <div className="courierTrackingInfo-locationSection">
        <div className="courierTrackingInfo-sectionHeading">
          <h4>Current Location</h4>

          {hasPosition && (
            <span className="courierTrackingInfo-liveLabel">
              <FaClock />

              {isTracking ? "Live" : "Last known"}
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

      {/* ==================================================
          LOCATION METADATA
      ================================================== */}

      {hasPosition && (
        <div className="courierTrackingInfo-section">
          <h4>Location Details</h4>

          {/* LAST SEEN */}

          <div className="courierTrackingInfo-detail">
            <div className="courierTrackingInfo-detailIcon">
              <FaClock />
            </div>

            <div className="courierTrackingInfo-detailContent">
              <span>Last Updated</span>
              <strong>{formattedLastSeen}</strong>
            </div>
          </div>

          {/* TRACKING SOURCE */}

          <div className="courierTrackingInfo-detail">
            <div className="courierTrackingInfo-detailIcon">
              <FaSatelliteDish />
            </div>

            <div className="courierTrackingInfo-detailContent">
              <span>Tracking Source</span>
              <strong>{trackingSource}</strong>
            </div>
          </div>

          {/* SPEED */}

          {Number.isFinite(Number(position?.speed)) && (
            <div className="courierTrackingInfo-detail">
              <div className="courierTrackingInfo-detailIcon">
                <FaMotorcycle />
              </div>

              <div className="courierTrackingInfo-detailContent">
                <span>Speed</span>
                <strong>{Number(position.speed).toFixed(2)} m/s</strong>
              </div>
            </div>
          )}

          {/* ACCURACY */}

          {Number.isFinite(Number(position?.accuracy)) && (
            <div className="courierTrackingInfo-detail">
              <div className="courierTrackingInfo-detailIcon">
                <FaMapMarkerAlt />
              </div>

              <div className="courierTrackingInfo-detailContent">
                <span>Location Accuracy</span>
                <strong>{Number(position.accuracy).toFixed(2)} meters</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          LIVE LOCATION STATUS
      ================================================== */}

      <div
        className={`
          courierTrackingInfo-locationStatus
          ${locationStatus.className}
        `}
      >
        <span className="courierTrackingInfo-locationStatusDot" />

        <span>{locationStatus.label}</span>
      </div>

      {/* ==================================================
          WARNING WHEN LOCATION IS NOT CURRENTLY TRACKING
      ================================================== */}

      {hasPosition && !isTracking && (
        <div className="courierTrackingInfo-noLocation">
          <FaExclamationTriangle />

          <div>
            <strong>Live tracking is inactive</strong>

            <span>
              The coordinates shown are the courier's last known location, not
              an actively transmitting position.
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default CourierTrackingInfo;
