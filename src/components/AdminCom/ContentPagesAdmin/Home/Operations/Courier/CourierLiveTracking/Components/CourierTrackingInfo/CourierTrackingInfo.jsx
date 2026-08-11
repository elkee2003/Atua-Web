import React, { useEffect, useState } from "react";

import { getUrl } from "aws-amplify/storage";

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
  STATUS
  ==========================================================
  */

  const isOnline = Boolean(courier?.isOnline);

  const isApproved = Boolean(courier?.isApproved);

  /*
  ==========================================================
  PROFILE IMAGE
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
          ----------------------------------------------------
          RESET
          ----------------------------------------------------
          */

      setImageError(false);

      /*
          ----------------------------------------------------
          USE URL SUPPLIED BY PARENT
          ----------------------------------------------------
          */

      if (suppliedProfileUrl) {
        setResolvedProfileUrl(suppliedProfileUrl);

        setImageLoading(false);

        return;
      }

      /*
          ----------------------------------------------------
          GET STORAGE PATH
          ----------------------------------------------------
          */

      const profilePath =
        courier?.profilePic ||
        courier?.profilePhoto ||
        courier?.profileImage ||
        null;

      /*
          ----------------------------------------------------
          NO IMAGE
          ----------------------------------------------------
          */

      if (!profilePath) {
        setResolvedProfileUrl(null);

        setImageLoading(false);

        return;
      }

      /*
          ----------------------------------------------------
          IF ALREADY A URL
          ----------------------------------------------------
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
          ----------------------------------------------------
          LOAD FROM AMPLIFY STORAGE
          ----------------------------------------------------
          */

      try {
        setImageLoading(true);

        console.log("CourierTrackingInfo profilePic:", profilePath);

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
  IMAGE ERROR
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
  IMAGE LOADED
  ==========================================================
  */

  const handleImageLoad = () => {
    setImageError(false);

    setImageLoading(false);
  };

  /*
  ==========================================================
  POSITION
  ==========================================================
  */

  const hasPosition = Boolean(
    position &&
    Number.isFinite(Number(position.lat)) &&
    Number.isFinite(Number(position.lng)),
  );

  const latitude = hasPosition ? Number(position.lat).toFixed(5) : null;

  const longitude = hasPosition ? Number(position.lng).toFixed(5) : null;

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

      {/* ==================================================
          CURRENT LOCATION
      ================================================== */}

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

      {/* ==================================================
          LIVE LOCATION STATUS
      ================================================== */}

      <div
        className={`
          courierTrackingInfo-locationStatus
          ${
            hasPosition
              ? "courierTrackingInfo-locationActive"
              : "courierTrackingInfo-locationInactive"
          }
        `}
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
