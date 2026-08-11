import React from "react";

import {
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaEye,
  FaFileAlt,
  FaFlag,
  FaImage,
  FaPlayCircle,
  FaTimesCircle,
  FaUser,
  FaBox,
} from "react-icons/fa";

import "./CourierReportCard.css";

function CourierReportCard({
  report,

  onViewReport,
  onViewOrder,
  onViewCustomer,

  onReview,
  onResolve,
  onDismiss,

  loading = false,
}) {
  /*
  ==========================================================
  SAFETY
  ==========================================================
  */

  if (!report) {
    return null;
  }

  /*
  ==========================================================
  REPORT VALUES
  ==========================================================
  */

  const reportId = report.id || "Unknown";

  const reason = report.reason || "Report submitted";

  const description = report.description || "";

  const status = String(report.status || "OPEN").toUpperCase();

  const adminComment = report.adminComment || "";

  const orderId = report.orderID || report.order?.id || null;

  const userId = report.userID || report.user?.id || null;

  /*
  ==========================================================
  CUSTOMER INFORMATION
  ==========================================================
  */

  const customer = report.user || {};

  const customerName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
    customer.name ||
    "Customer";

  const customerPhone =
    customer.phoneNumber || customer.phone || customer.number || null;

  /*
  ==========================================================
  EVIDENCE
  ==========================================================
  */

  const evidencePhotos = Array.isArray(report.evidencePhotos)
    ? report.evidencePhotos.filter(Boolean)
    : [];

  const evidencePhotoUrls = Array.isArray(report.evidencePhotoUrls)
    ? report.evidencePhotoUrls.filter(Boolean)
    : [];

  const evidenceVideo = report.evidenceVideo || null;

  const evidenceVideoUrl = report.evidenceVideoUrl || null;

  const photoCount = evidencePhotos.length || evidencePhotoUrls.length;

  const hasVideo = Boolean(evidenceVideo || evidenceVideoUrl);

  /*
  ==========================================================
  STATUS CONFIGURATION
  ==========================================================
  */

  const getStatusConfig = () => {
    switch (status) {
      case "OPEN":
        return {
          label: "Open",
          className: "courierReportCard-open",
          icon: <FaExclamationCircle />,
        };

      case "UNDER_REVIEW":
        return {
          label: "Under Review",
          className: "courierReportCard-underReview",
          icon: <FaClock />,
        };

      case "RESOLVED":
        return {
          label: "Resolved",
          className: "courierReportCard-resolved",
          icon: <FaCheckCircle />,
        };

      case "DISMISSED":
        return {
          label: "Dismissed",
          className: "courierReportCard-dismissed",
          icon: <FaTimesCircle />,
        };

      default:
        return {
          label: "Unknown",
          className: "courierReportCard-unknown",
          icon: <FaFlag />,
        };
    }
  };

  const statusConfig = getStatusConfig();

  /*
  ==========================================================
  REPORT DATE
  ==========================================================
  */

  const reportDate = report.createdAt || report.updatedAt || null;

  const formattedDate = reportDate
    ? new Date(reportDate).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  /*
  ==========================================================
  ACTION HANDLERS
  ==========================================================
  */

  const handleViewReport = () => {
    if (typeof onViewReport === "function") {
      onViewReport(report);
    }
  };

  const handleViewOrder = () => {
    if (typeof onViewOrder !== "function") {
      return;
    }

    onViewOrder(report.order || orderId || report);
  };

  const handleViewCustomer = () => {
    if (typeof onViewCustomer !== "function") {
      return;
    }

    onViewCustomer(report.user || userId || report);
  };

  const handleReview = () => {
    if (typeof onReview === "function") {
      onReview(report);
    }
  };

  const handleResolve = () => {
    if (typeof onResolve === "function") {
      onResolve(report);
    }
  };

  const handleDismiss = () => {
    if (typeof onDismiss === "function") {
      onDismiss(report);
    }
  };

  /*
  ==========================================================
  AVAILABLE ACTIONS
  ==========================================================
  */

  const canReview = status === "OPEN";

  const canResolve = status === "OPEN" || status === "UNDER_REVIEW";

  const canDismiss = status === "OPEN" || status === "UNDER_REVIEW";

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <article
      className={`
        courierReportCard
        ${statusConfig.className}
      `}
    >
      {/* ==================================================
          CARD HEADER
      ================================================== */}

      <div className="courierReportCard-header">
        <div className="courierReportCard-headerMain">
          {/* ==================================================
              REPORT ICON
          ================================================== */}

          <div className="courierReportCard-reportIcon">
            <FaFlag />
          </div>

          {/* ==================================================
              REPORT TITLE
          ================================================== */}

          <div className="courierReportCard-titleArea">
            <div className="courierReportCard-titleRow">
              <h3>{reason}</h3>

              <span
                className={`
                  courierReportCard-status
                  ${statusConfig.className}
                `}
              >
                {statusConfig.icon}

                <span>{statusConfig.label}</span>
              </span>
            </div>

            <div className="courierReportCard-meta">
              <span>Report ID:</span>

              <strong>{reportId}</strong>

              {formattedDate && (
                <>
                  <span className="courierReportCard-metaDivider">•</span>

                  <span>{formattedDate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            VIEW REPORT
        ================================================== */}

        {typeof onViewReport === "function" && (
          <button
            type="button"
            className="courierReportCard-viewButton"
            onClick={handleViewReport}
            disabled={loading}
          >
            <FaEye />

            <span>View Report</span>

            <FaArrowRight />
          </button>
        )}
      </div>

      {/* ==================================================
          DESCRIPTION
      ================================================== */}

      <div className="courierReportCard-descriptionSection">
        <div className="courierReportCard-sectionLabel">
          <FaFileAlt />

          <span>Report Details</span>
        </div>

        <p
          className={
            description
              ? "courierReportCard-description"
              : "courierReportCard-description courierReportCard-descriptionEmpty"
          }
        >
          {description ||
            "No additional description was provided with this report."}
        </p>
      </div>

      {/* ==================================================
          RELATION INFORMATION
      ================================================== */}

      <div className="courierReportCard-information">
        {/* ==================================================
            CUSTOMER
        ================================================== */}

        <div className="courierReportCard-informationItem">
          <div className="courierReportCard-informationIcon">
            <FaUser />
          </div>

          <div className="courierReportCard-informationContent">
            <span>Customer</span>

            <strong>{customerName}</strong>

            {customerPhone && <small>{customerPhone}</small>}
          </div>

          {typeof onViewCustomer === "function" && (
            <button
              type="button"
              className="courierReportCard-smallAction"
              onClick={handleViewCustomer}
              disabled={loading || !(userId || report.user)}
              title="View customer"
            >
              <FaArrowRight />
            </button>
          )}
        </div>

        {/* ==================================================
            ORDER
        ================================================== */}

        <div className="courierReportCard-informationItem">
          <div className="courierReportCard-informationIcon">
            <FaBox />
          </div>

          <div className="courierReportCard-informationContent">
            <span>Order</span>

            <strong>{orderId || "Order unavailable"}</strong>
          </div>

          {typeof onViewOrder === "function" && (
            <button
              type="button"
              className="courierReportCard-smallAction"
              onClick={handleViewOrder}
              disabled={loading || !orderId}
              title="View order"
            >
              <FaArrowRight />
            </button>
          )}
        </div>
      </div>

      {/* ==================================================
          EVIDENCE
      ================================================== */}

      <div className="courierReportCard-evidence">
        <div className="courierReportCard-sectionLabel">
          <FaImage />

          <span>Evidence</span>
        </div>

        <div className="courierReportCard-evidenceItems">
          <div
            className={`
              courierReportCard-evidenceItem
              ${photoCount > 0 ? "hasEvidence" : ""}
            `}
          >
            <FaImage />

            <div>
              <strong>{photoCount}</strong>

              <span>{photoCount === 1 ? "Photo" : "Photos"}</span>
            </div>
          </div>

          <div
            className={`
              courierReportCard-evidenceItem
              ${hasVideo ? "hasEvidence" : ""}
            `}
          >
            <FaPlayCircle />

            <div>
              <strong>{hasVideo ? "1" : "0"}</strong>

              <span>Video</span>
            </div>
          </div>
        </div>

        {/* ==================================================
            PHOTO PREVIEW
        ================================================== */}

        {evidencePhotoUrls.length > 0 && (
          <div className="courierReportCard-photoPreview">
            {evidencePhotoUrls.slice(0, 4).map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="courierReportCard-photo"
              >
                <img
                  src={imageUrl}
                  alt={`Report evidence ${index + 1}`}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
          ADMIN COMMENT
      ================================================== */}

      {adminComment && (
        <div className="courierReportCard-adminComment">
          <div className="courierReportCard-sectionLabel">
            <FaFileAlt />

            <span>Admin Comment</span>
          </div>

          <p>{adminComment}</p>
        </div>
      )}

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="courierReportCard-actions">
        {/* ==================================================
            REVIEW
        ================================================== */}

        {canReview && typeof onReview === "function" && (
          <button
            type="button"
            className="courierReportCard-reviewButton"
            onClick={handleReview}
            disabled={loading}
          >
            <FaClock />

            <span>Review Report</span>
          </button>
        )}

        {/* ==================================================
            RESOLVE
        ================================================== */}

        {canResolve && typeof onResolve === "function" && (
          <button
            type="button"
            className="courierReportCard-resolveButton"
            onClick={handleResolve}
            disabled={loading}
          >
            <FaCheckCircle />

            <span>Resolve</span>
          </button>
        )}

        {/* ==================================================
            DISMISS
        ================================================== */}

        {canDismiss && typeof onDismiss === "function" && (
          <button
            type="button"
            className="courierReportCard-dismissButton"
            onClick={handleDismiss}
            disabled={loading}
          >
            <FaTimesCircle />

            <span>Dismiss</span>
          </button>
        )}
      </div>
    </article>
  );
}

export default CourierReportCard;
