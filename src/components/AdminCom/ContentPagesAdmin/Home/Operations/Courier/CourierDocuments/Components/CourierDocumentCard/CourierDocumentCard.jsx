import React from "react";

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaImage,
} from "react-icons/fa";

import "./CourierDocumentCard.css";

function CourierDocumentCard({
  title = "Document",
  description = "",
  icon,
  status = "available",
  statusLabel,
  documentNumber,
  imageUrl,
  imageAlt = "Document",
  onView,
  children,
}) {
  /*
  ==========================================================
  STATUS
  ==========================================================
  */

  const normalizedStatus = String(status || "available").toLowerCase();

  const isComplete =
    normalizedStatus === "complete" ||
    normalizedStatus === "available" ||
    normalizedStatus === "verified";

  const isPending = normalizedStatus === "pending";

  const resolvedStatusLabel =
    statusLabel ||
    (isComplete ? "Available" : isPending ? "Pending" : "Missing");

  /*
  ==========================================================
  STATUS ICON
  ==========================================================
  */

  const renderStatusIcon = () => {
    if (isComplete) {
      return <FaCheckCircle />;
    }

    if (isPending) {
      return <FaExclamationTriangle />;
    }

    return <FaExclamationTriangle />;
  };

  /*
  ==========================================================
  DOCUMENT ICON
  ==========================================================
  */

  const documentIcon = icon || <FaFileAlt />;

  /*
  ==========================================================
  VIEW HANDLER
  ==========================================================
  */

  const handleView = () => {
    if (!imageUrl) {
      return;
    }

    if (typeof onView === "function") {
      onView(imageUrl);
      return;
    }

    window.open(imageUrl, "_blank", "noopener,noreferrer");
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <article className="courierDocumentCard">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierDocumentCard-header">
        <div className="courierDocumentCard-icon">{documentIcon}</div>

        <div className="courierDocumentCard-heading">
          <h3>{title}</h3>

          {description && <p>{description}</p>}
        </div>

        <div
          className={`courierDocumentCard-status ${
            isComplete ? "complete" : isPending ? "pending" : "missing"
          }`}
        >
          {renderStatusIcon()}

          <span>{resolvedStatusLabel}</span>
        </div>
      </div>

      {/* ==================================================
          DOCUMENT NUMBER
      ================================================== */}

      {documentNumber && (
        <div className="courierDocumentCard-number">
          <span>Document Number</span>

          <strong>{documentNumber}</strong>
        </div>
      )}

      {/* ==================================================
          DOCUMENT IMAGE
      ================================================== */}

      <div className="courierDocumentCard-documentArea">
        {imageUrl ? (
          <div className="courierDocumentCard-imageWrapper">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="courierDocumentCard-image"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <button
              type="button"
              className="courierDocumentCard-viewButton"
              onClick={handleView}
              title="View document"
            >
              <FaEye />

              <span>View Document</span>
            </button>
          </div>
        ) : (
          <div className="courierDocumentCard-noImage">
            <div className="courierDocumentCard-noImageIcon">
              <FaImage />
            </div>

            <h4>No Photo Available</h4>

            <p>No document photo has been uploaded or provided.</p>
          </div>
        )}
      </div>

      {/* ==================================================
          ADDITIONAL CONTENT
      ================================================== */}

      {children && <div className="courierDocumentCard-extra">{children}</div>}
    </article>
  );
}

export default CourierDocumentCard;
