import React from "react";

import {
  FaCheckCircle,
  FaExclamationCircle,
  FaIdCard,
  FaShieldAlt,
  FaUserShield,
  FaMotorcycle,
} from "react-icons/fa";

import "./CourierDocumentsSummary.css";

function CourierDocumentsSummary({ courier, loading = false }) {
  /*
  ==========================================================
  DOCUMENT STATUS HELPERS
  ==========================================================
  */

  const hasProfilePhoto = Boolean(courier?.profilePic);

  const hasCourierNIN = Boolean(courier?.courierNIN);

  const hasCourierNINImage = Boolean(courier?.courierNINImage);

  const hasGuarantorName = Boolean(
    courier?.guarantorName || courier?.guarantorLastName,
  );

  const hasGuarantorPhone = Boolean(courier?.guarantorNumber);

  const hasGuarantorRelationship = Boolean(courier?.guarantorRelationship);

  const hasGuarantorNIN = Boolean(courier?.guarantorNIN);

  const hasGuarantorNINImage = Boolean(courier?.guarantorNINImage);

  const hasVehicleInformation = Boolean(
    courier?.transportationType ||
    courier?.vehicleClass ||
    courier?.model ||
    courier?.plateNumber,
  );

  /*
  ==========================================================
  SECTION STATUS
  ==========================================================
  */

  const identityComplete =
    hasProfilePhoto && hasCourierNIN && hasCourierNINImage;

  const guarantorComplete =
    hasGuarantorName &&
    hasGuarantorPhone &&
    hasGuarantorRelationship &&
    hasGuarantorNIN &&
    hasGuarantorNINImage;

  const vehicleComplete = hasVehicleInformation;

  /*
  ==========================================================
  STATUS COMPONENT
  ==========================================================
  */

  const StatusBadge = ({ complete }) => {
    return (
      <span
        className={
          complete
            ? "courierDocumentsSummary-status complete"
            : "courierDocumentsSummary-status incomplete"
        }
      >
        {complete ? <FaCheckCircle /> : <FaExclamationCircle />}

        {complete ? "Complete" : "Incomplete"}
      </span>
    );
  };

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierDocumentsSummary">
        <div className="courierDocumentsSummary-header">
          <div className="courierDocumentsSummary-loadingTitle" />

          <div className="courierDocumentsSummary-loadingText" />
        </div>

        <div className="courierDocumentsSummary-grid">
          {[1, 2, 3].map((item) => (
            <div key={item} className="courierDocumentsSummary-card">
              <div className="courierDocumentsSummary-loadingIcon" />

              <div className="courierDocumentsSummary-loadingBody">
                <div className="courierDocumentsSummary-loadingHeading" />

                <div className="courierDocumentsSummary-loadingLine" />

                <div className="courierDocumentsSummary-loadingLine short" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierDocumentsSummary">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierDocumentsSummary-header">
        <div className="courierDocumentsSummary-headerIcon">
          <FaShieldAlt />
        </div>

        <div>
          <h2>Document Verification Summary</h2>

          <p>
            Review the courier's identity, guarantor, and vehicle information
            before approval.
          </p>
        </div>
      </div>

      {/* ==================================================
          SUMMARY GRID
      ================================================== */}

      <div className="courierDocumentsSummary-grid">
        {/* ==================================================
            COURIER IDENTITY
        ================================================== */}

        <div className="courierDocumentsSummary-card">
          <div className="courierDocumentsSummary-cardHeader">
            <div className="courierDocumentsSummary-cardIcon identity">
              <FaIdCard />
            </div>

            <div className="courierDocumentsSummary-cardTitle">
              <h3>Courier Identity</h3>

              <StatusBadge complete={identityComplete} />
            </div>
          </div>

          <div className="courierDocumentsSummary-items">
            <div className="courierDocumentsSummary-item">
              <span>Profile Photo</span>

              <strong className={hasProfilePhoto ? "available" : "missing"}>
                {hasProfilePhoto ? "Available" : "No Photo"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>Courier NIN</span>

              <strong className={hasCourierNIN ? "available" : "missing"}>
                {hasCourierNIN ? "Provided" : "Missing"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>NIN Photo</span>

              <strong className={hasCourierNINImage ? "available" : "missing"}>
                {hasCourierNINImage ? "Available" : "No Photo"}
              </strong>
            </div>
          </div>
        </div>

        {/* ==================================================
            GUARANTOR
        ================================================== */}

        <div className="courierDocumentsSummary-card">
          <div className="courierDocumentsSummary-cardHeader">
            <div className="courierDocumentsSummary-cardIcon guarantor">
              <FaUserShield />
            </div>

            <div className="courierDocumentsSummary-cardTitle">
              <h3>Guarantor</h3>

              <StatusBadge complete={guarantorComplete} />
            </div>
          </div>

          <div className="courierDocumentsSummary-items">
            <div className="courierDocumentsSummary-item">
              <span>Guarantor Name</span>

              <strong className={hasGuarantorName ? "available" : "missing"}>
                {hasGuarantorName ? "Provided" : "Missing"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>Phone Number</span>

              <strong className={hasGuarantorPhone ? "available" : "missing"}>
                {hasGuarantorPhone ? "Provided" : "Missing"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>Relationship</span>

              <strong
                className={hasGuarantorRelationship ? "available" : "missing"}
              >
                {hasGuarantorRelationship ? "Provided" : "Missing"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>Guarantor NIN</span>

              <strong className={hasGuarantorNIN ? "available" : "missing"}>
                {hasGuarantorNIN ? "Provided" : "Missing"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>NIN Photo</span>

              <strong
                className={hasGuarantorNINImage ? "available" : "missing"}
              >
                {hasGuarantorNINImage ? "Available" : "No Photo"}
              </strong>
            </div>
          </div>
        </div>

        {/* ==================================================
            VEHICLE
        ================================================== */}

        <div className="courierDocumentsSummary-card">
          <div className="courierDocumentsSummary-cardHeader">
            <div className="courierDocumentsSummary-cardIcon vehicle">
              <FaMotorcycle />
            </div>

            <div className="courierDocumentsSummary-cardTitle">
              <h3>Vehicle Information</h3>

              <StatusBadge complete={vehicleComplete} />
            </div>
          </div>

          <div className="courierDocumentsSummary-items">
            <div className="courierDocumentsSummary-item">
              <span>Transportation Type</span>

              <strong
                className={
                  courier?.transportationType ? "available" : "missing"
                }
              >
                {courier?.transportationType || "Not specified"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>Vehicle Class</span>

              <strong
                className={courier?.vehicleClass ? "available" : "missing"}
              >
                {courier?.vehicleClass || "Not specified"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>Model</span>

              <strong className={courier?.model ? "available" : "missing"}>
                {courier?.model || "Not specified"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>Vehicle Colour</span>

              <strong
                className={courier?.vehicleColour ? "available" : "missing"}
              >
                {courier?.vehicleColour || "Not specified"}
              </strong>
            </div>

            <div className="courierDocumentsSummary-item">
              <span>Plate Number</span>

              <strong
                className={courier?.plateNumber ? "available" : "missing"}
              >
                {courier?.plateNumber || "Not specified"}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourierDocumentsSummary;
