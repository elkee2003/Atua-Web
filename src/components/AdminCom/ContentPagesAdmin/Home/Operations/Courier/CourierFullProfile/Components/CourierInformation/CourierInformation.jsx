import React from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaUserShield,
} from "react-icons/fa";

import "./CourierInformation.css";

function CourierInformation({ courier }) {
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
    BASIC INFORMATION
    ==========================================================
    */

  const firstName = courier.firstName || "";

  const lastName = courier.lastName || "";

  const fullName = `${firstName} ${lastName}`.trim() || "Not provided";

  const phoneNumber = courier.phoneNumber;

  /*
    ==========================================================
    EMAIL
    ==========================================================
    */

  const email = courier.email || courier.emailAddress;

  /*
    ==========================================================
    DATE OF BIRTH
    ==========================================================
    */

  const dateOfBirth = courier.dateOfBirth || courier.dob;

  /*
    ==========================================================
    ADDRESS
    ==========================================================
    */

  const address =
    courier.address || courier.homeAddress || courier.currentAddress;

  /*
    ==========================================================
    ID INFORMATION
    ==========================================================
    */

  const idType = courier.idType || courier.identificationType;

  const idNumber = courier.idNumber || courier.identificationNumber;

  /*
    ==========================================================
    ACCOUNT DATES
    ==========================================================
    */

  const joinedDate = courier.createdAt || courier.joinedAt;

  const updatedDate = courier.updatedAt;

  /*
    ==========================================================
    APPROVAL
    ==========================================================
    */

  const isApproved = Boolean(courier.isApproved);

  const approvedBy = courier.approvedById;

  const approvedAt = courier.approvedAt;

  /*
    ==========================================================
    LOCATION
    ==========================================================
    */

  const city = courier.city || courier.location?.city;

  const area = courier.area || courier.location?.area;

  const state = courier.state || courier.location?.state;

  const formattedLocation = [area, city, state].filter(Boolean).join(", ");

  /*
    ==========================================================
    INFORMATION ITEMS
    ==========================================================
    */

  const personalInformation = [
    {
      key: "full-name",
      label: "Full Name",
      value: fullName,
      icon: <FaUser />,
    },

    {
      key: "phone",
      label: "Phone Number",
      value: formatValue(phoneNumber),
      icon: <FaPhone />,
    },

    {
      key: "email",
      label: "Email Address",
      value: formatValue(email),
      icon: <FaEnvelope />,
    },

    {
      key: "dob",
      label: "Date of Birth",
      value: formatDate(dateOfBirth),
      icon: <FaCalendarAlt />,
    },
  ];

  /*
    ==========================================================
    LOCATION ITEMS
    ==========================================================
    */

  const locationInformation = [
    {
      key: "address",
      label: "Address",
      value: formatValue(address),
      icon: <FaMapMarkerAlt />,
    },

    {
      key: "location",
      label: "Location",
      value: formattedLocation || "Not provided",
      icon: <FaMapMarkerAlt />,
    },
  ];

  /*
    ==========================================================
    ID ITEMS
    ==========================================================
    */

  const identificationInformation = [
    {
      key: "id-type",
      label: "ID Type",
      value: formatValue(idType),
      icon: <FaIdCard />,
    },

    {
      key: "id-number",
      label: "ID Number",
      value: formatValue(idNumber),
      icon: <FaIdCard />,
    },
  ];

  /*
    ==========================================================
    ACCOUNT ITEMS
    ==========================================================
    */

  const accountInformation = [
    {
      key: "joined",
      label: "Joined Atua",
      value: formatDate(joinedDate),
      icon: <FaCalendarAlt />,
    },

    {
      key: "updated",
      label: "Last Updated",
      value: formatDate(updatedDate),
      icon: <FaCalendarAlt />,
    },

    {
      key: "approved-by",
      label: "Approved By",
      value: formatValue(approvedBy),
      icon: <FaUserShield />,
    },

    {
      key: "approved-at",
      label: "Approval Date",
      value: formatDate(approvedAt),
      icon: <FaCheckCircle />,
    },
  ];

  /*
    ==========================================================
    INFORMATION ITEM COMPONENT
    ==========================================================
    */

  const InformationItem = ({ item }) => (
    <div className="courierInformation-item">
      <div className="courierInformation-itemIcon">{item.icon}</div>

      <div className="courierInformation-itemContent">
        <span className="courierInformation-itemLabel">{item.label}</span>

        <span
          className={`courierInformation-itemValue ${
            item.value === "Not provided" || item.value === "Not available"
              ? "courierInformation-itemValueMuted"
              : ""
          }`}
          title={item.value}
        >
          {item.value}
        </span>
      </div>
    </div>
  );

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierInformation">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierInformation-header">
        <div className="courierInformation-headerIcon">
          <FaUser />
        </div>

        <div>
          <h2 className="courierInformation-title">Courier Information</h2>

          <p className="courierInformation-description">
            Personal and account information for this courier.
          </p>
        </div>
      </div>

      {/* ==================================================
                PERSONAL INFORMATION
            ================================================== */}

      <div className="courierInformation-section">
        <h3 className="courierInformation-sectionTitle">
          Personal Information
        </h3>

        <div className="courierInformation-grid">
          {personalInformation.map((item) => (
            <InformationItem key={item.key} item={item} />
          ))}
        </div>
      </div>

      {/* ==================================================
                LOCATION
            ================================================== */}

      <div className="courierInformation-section">
        <h3 className="courierInformation-sectionTitle">Location & Address</h3>

        <div className="courierInformation-grid">
          {locationInformation.map((item) => (
            <InformationItem key={item.key} item={item} />
          ))}
        </div>
      </div>

      {/* ==================================================
                IDENTIFICATION
            ================================================== */}

      <div className="courierInformation-section">
        <h3 className="courierInformation-sectionTitle">Identification</h3>

        <div className="courierInformation-grid">
          {identificationInformation.map((item) => (
            <InformationItem key={item.key} item={item} />
          ))}
        </div>
      </div>

      {/* ==================================================
                ACCOUNT INFORMATION
            ================================================== */}

      <div className="courierInformation-section">
        <h3 className="courierInformation-sectionTitle">Account & Approval</h3>

        <div className="courierInformation-grid">
          {accountInformation.map((item) => (
            <InformationItem key={item.key} item={item} />
          ))}
        </div>
      </div>

      {/* ==================================================
                APPROVAL STATUS
            ================================================== */}

      <div
        className={`courierInformation-approval ${
          isApproved
            ? "courierInformation-approvalApproved"
            : "courierInformation-approvalPending"
        }`}
      >
        <div className="courierInformation-approvalIcon">
          {isApproved ? <FaCheckCircle /> : <FaUserShield />}
        </div>

        <div className="courierInformation-approvalContent">
          <strong>
            {isApproved ? "Courier is approved" : "Courier approval is pending"}
          </strong>

          <span>
            {isApproved
              ? "This courier is currently approved to operate on Atua."
              : "This courier has not yet been approved to operate on Atua."}
          </span>
        </div>
      </div>
    </section>
  );
}

export default CourierInformation;
