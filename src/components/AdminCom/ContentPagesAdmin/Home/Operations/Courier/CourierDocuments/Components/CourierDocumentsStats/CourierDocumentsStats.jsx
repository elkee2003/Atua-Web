import React from "react";

import {
  FaCheckCircle,
  FaFileAlt,
  FaPercentage,
  FaExclamationTriangle,
} from "react-icons/fa";

import "./CourierDocumentsStats.css";

function CourierDocumentsStats({ courier, loading = false }) {
  /*
  ==========================================================
  REQUIRED DOCUMENTS
  ==========================================================
  
  Based strictly on the Courier schema:
  
  1. Courier NIN + NIN Image
  2. Guarantor NIN + Guarantor NIN Image
  3. Courier Profile Photo
  
  We do not invent other document types that are not
  represented in the schema.
  ==========================================================
  */

  const hasCourierNIN = Boolean(courier?.courierNIN);

  const hasCourierNINImage = Boolean(courier?.courierNINImage);

  const hasGuarantorNIN = Boolean(courier?.guarantorNIN);

  const hasGuarantorNINImage = Boolean(courier?.guarantorNINImage);

  const hasProfilePhoto = Boolean(courier?.profilePic);

  /*
  ==========================================================
  DOCUMENT COMPLETION
  ==========================================================
  */

  const documentChecks = [
    hasProfilePhoto,

    hasCourierNIN && hasCourierNINImage,

    hasGuarantorNIN && hasGuarantorNINImage,
  ];

  const requiredDocuments = documentChecks.length;

  const completedDocuments = documentChecks.filter(Boolean).length;

  const missingDocuments = requiredDocuments - completedDocuments;

  const completionPercentage =
    requiredDocuments > 0
      ? Math.round((completedDocuments / requiredDocuments) * 100)
      : 0;

  /*
  ==========================================================
  LOADING STATE
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierDocumentsStats">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="courierDocumentsStats-card courierDocumentsStats-loadingCard"
          >
            <div className="courierDocumentsStats-loadingIcon" />

            <div className="courierDocumentsStats-loadingContent">
              <div className="courierDocumentsStats-loadingLabel" />

              <div className="courierDocumentsStats-loadingValue" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierDocumentsStats">
      {/* ==================================================
          REQUIRED DOCUMENTS
      ================================================== */}

      <div className="courierDocumentsStats-card courierDocumentsStats-total">
        <div className="courierDocumentsStats-icon">
          <FaFileAlt />
        </div>

        <div className="courierDocumentsStats-content">
          <span>Required Documents</span>

          <strong>{requiredDocuments}</strong>

          <small>Core verification items</small>
        </div>
      </div>

      {/* ==================================================
          COMPLETED
      ================================================== */}

      <div className="courierDocumentsStats-card courierDocumentsStats-completed">
        <div className="courierDocumentsStats-icon">
          <FaCheckCircle />
        </div>

        <div className="courierDocumentsStats-content">
          <span>Completed</span>

          <strong>{completedDocuments}</strong>

          <small>Documents completed</small>
        </div>
      </div>

      {/* ==================================================
          MISSING
      ================================================== */}

      <div className="courierDocumentsStats-card courierDocumentsStats-missing">
        <div className="courierDocumentsStats-icon">
          <FaExclamationTriangle />
        </div>

        <div className="courierDocumentsStats-content">
          <span>Missing</span>

          <strong>{missingDocuments}</strong>

          <small>Documents requiring attention</small>
        </div>
      </div>

      {/* ==================================================
          COMPLETION
      ================================================== */}

      <div className="courierDocumentsStats-card courierDocumentsStats-percentage">
        <div className="courierDocumentsStats-icon">
          <FaPercentage />
        </div>

        <div className="courierDocumentsStats-content">
          <span>Completion</span>

          <strong>{completionPercentage}%</strong>

          <small>Verification progress</small>
        </div>
      </div>
    </section>
  );
}

export default CourierDocumentsStats;
