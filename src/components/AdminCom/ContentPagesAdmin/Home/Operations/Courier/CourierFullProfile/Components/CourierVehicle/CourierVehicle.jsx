import React from "react";
import {
  FaCar,
  FaCheckCircle,
  FaIdCard,
  FaMotorcycle,
  FaTruck,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";

import "./CourierVehicle.css";

function CourierVehicle({ courier }) {
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
    HELPERS
    ==========================================================
    */

  const formatValue = (value, fallback = "Not provided") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    return value;
  };

  const formatDate = (value) => {
    if (!value) {
      return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /*
    ==========================================================
    VEHICLE INFORMATION
    ==========================================================
    */

  const transportationType = courier.transportationType;

  const vehicleClass = courier.vehicleClass;

  const plateNumber = courier.plateNumber;

  const vehicleMake = courier.vehicleMake || courier.make;

  const vehicleModel = courier.vehicleModel || courier.model;

  const vehicleColor = courier.vehicleColor || courier.color;

  const vehicleYear = courier.vehicleYear || courier.year;

  /*
    ==========================================================
    VEHICLE REGISTRATION
    ==========================================================
    */

  const vehicleRegistrationNumber =
    courier.vehicleRegistrationNumber ||
    courier.vehicleRegNumber ||
    courier.registrationNumber;

  const registrationExpiry =
    courier.registrationExpiry || courier.vehicleRegistrationExpiry;

  /*
    ==========================================================
    VEHICLE OWNER
    ==========================================================
    */

  const vehicleOwner = courier.vehicleOwner || courier.ownerName;

  /*
    ==========================================================
    VEHICLE STATUS
    ==========================================================
    */

  const isApproved = Boolean(courier.isApproved);

  const isOnline = Boolean(courier.isOnline);

  /*
    ==========================================================
    VEHICLE TYPE ICON
    ==========================================================
    */

  const getVehicleIcon = () => {
    const type = transportationType?.toLowerCase()?.trim();

    if (type?.includes("micro")) {
      return <FaMotorcycle />;
    }

    if (type?.includes("moto")) {
      return <FaMotorcycle />;
    }

    if (type?.includes("maxi")) {
      return <FaTruck />;
    }

    if (type?.includes("car") || type?.includes("vehicle")) {
      return <FaCar />;
    }

    return <FaCar />;
  };

  /*
    ==========================================================
    VEHICLE DISPLAY NAME
    ==========================================================
    */

  const vehicleName =
    [vehicleMake, vehicleModel].filter(Boolean).join(" ") ||
    vehicleClass ||
    transportationType ||
    "Vehicle";

  /*
    ==========================================================
    INFORMATION ITEMS
    ==========================================================
    */

  const vehicleInformation = [
    {
      key: "transportation-type",
      label: "Transportation Type",
      value: formatValue(transportationType),
      icon: getVehicleIcon(),
    },

    {
      key: "vehicle-class",
      label: "Vehicle Class",
      value: formatValue(vehicleClass),
      icon: <FaCar />,
    },

    {
      key: "plate-number",
      label: "Plate Number",
      value: formatValue(plateNumber),
      icon: <FaIdCard />,
    },

    {
      key: "make",
      label: "Vehicle Make",
      value: formatValue(vehicleMake),
      icon: <FaCar />,
    },

    {
      key: "model",
      label: "Vehicle Model",
      value: formatValue(vehicleModel),
      icon: <FaCar />,
    },

    {
      key: "color",
      label: "Vehicle Color",
      value: formatValue(vehicleColor),
      icon: <FaCar />,
    },

    {
      key: "year",
      label: "Vehicle Year",
      value: formatValue(vehicleYear),
      icon: <FaCalendarAlt />,
    },

    {
      key: "registration",
      label: "Registration Number",
      value: formatValue(vehicleRegistrationNumber),
      icon: <FaIdCard />,
    },

    {
      key: "owner",
      label: "Registered Owner",
      value: formatValue(vehicleOwner),
      icon: <FaUser />,
    },

    {
      key: "registration-expiry",
      label: "Registration Expiry",
      value: formatDate(registrationExpiry),
      icon: <FaCalendarAlt />,
    },
  ];

  /*
    ==========================================================
    RENDER INFORMATION ITEM
    ==========================================================
    */

  const InformationItem = ({ item }) => {
    const isMissing =
      item.value === "Not provided" || item.value === "Not available";

    return (
      <div className="courierVehicle-item">
        <div className="courierVehicle-itemIcon">{item.icon}</div>

        <div className="courierVehicle-itemContent">
          <span className="courierVehicle-itemLabel">{item.label}</span>

          <span
            className={`courierVehicle-itemValue ${
              isMissing ? "courierVehicle-itemValueMuted" : ""
            }`}
            title={item.value}
          >
            {item.value}
          </span>
        </div>
      </div>
    );
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierVehicle">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierVehicle-header">
        <div className="courierVehicle-headerIcon">{getVehicleIcon()}</div>

        <div className="courierVehicle-headerContent">
          <h2 className="courierVehicle-title">Vehicle Information</h2>

          <p className="courierVehicle-description">
            Vehicle and transportation details registered to this courier.
          </p>
        </div>
      </div>

      {/* ==================================================
                VEHICLE SUMMARY
            ================================================== */}

      <div className="courierVehicle-summary">
        <div className="courierVehicle-summaryIcon">{getVehicleIcon()}</div>

        <div className="courierVehicle-summaryInfo">
          <span className="courierVehicle-summaryLabel">
            Registered Vehicle
          </span>

          <strong className="courierVehicle-summaryName">{vehicleName}</strong>

          <span className="courierVehicle-summaryMeta">
            {formatValue(
              transportationType,
              "Transportation type not provided",
            )}
          </span>
        </div>

        <div className="courierVehicle-summaryStatus">
          <span
            className={`courierVehicle-statusBadge ${
              isApproved
                ? "courierVehicle-statusApproved"
                : "courierVehicle-statusPending"
            }`}
          >
            <span className="courierVehicle-statusDot" />

            {isApproved ? "Approved" : "Pending Approval"}
          </span>

          <span
            className={`courierVehicle-onlineBadge ${
              isOnline ? "courierVehicle-online" : "courierVehicle-offline"
            }`}
          >
            {isOnline ? "Currently Online" : "Currently Offline"}
          </span>
        </div>
      </div>

      {/* ==================================================
                VEHICLE DETAILS
            ================================================== */}

      <div className="courierVehicle-section">
        <h3 className="courierVehicle-sectionTitle">Vehicle Details</h3>

        <div className="courierVehicle-grid">
          {vehicleInformation.map((item) => (
            <InformationItem key={item.key} item={item} />
          ))}
        </div>
      </div>

      {/* ==================================================
                OPERATIONAL NOTE
            ================================================== */}

      <div className="courierVehicle-note">
        <div className="courierVehicle-noteIcon">
          <FaCheckCircle />
        </div>

        <div className="courierVehicle-noteContent">
          <strong>Vehicle verification</strong>

          <span>
            Vehicle information should match the courier's submitted
            registration and verification documents.
          </span>
        </div>
      </div>
    </section>
  );
}

export default CourierVehicle;
