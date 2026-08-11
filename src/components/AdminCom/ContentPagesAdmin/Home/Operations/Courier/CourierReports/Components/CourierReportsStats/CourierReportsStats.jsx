import React, { useMemo } from "react";

import {
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaExclamationCircle,
  FaFlag,
} from "react-icons/fa";

import "./CourierReportsStats.css";

function CourierReportsStats({
  courier,
  reports = [],
  totalReports,
  openReports,
  underReviewReports,
  resolvedReports,
  dismissedReports,
  loading = false,
}) {
  /*
  ==========================================================
  SAFE REPORT ARRAY
  ==========================================================
  */

  const safeReports = Array.isArray(reports) ? reports : [];

  /*
  ==========================================================
  REPORT STATISTICS
  ==========================================================
  */

  const statistics = useMemo(() => {
    /*
      ========================================================
      IF VALUES ARE PROVIDED BY PARENT

      Use them.

      Otherwise calculate directly from the reports array.
      ========================================================
      */

    const total =
      totalReports !== undefined && totalReports !== null
        ? Number(totalReports)
        : safeReports.length;

    const open =
      openReports !== undefined && openReports !== null
        ? Number(openReports)
        : safeReports.filter(
            (report) => String(report?.status || "").toUpperCase() === "OPEN",
          ).length;

    const underReview =
      underReviewReports !== undefined && underReviewReports !== null
        ? Number(underReviewReports)
        : safeReports.filter(
            (report) =>
              String(report?.status || "").toUpperCase() === "UNDER_REVIEW",
          ).length;

    const resolved =
      resolvedReports !== undefined && resolvedReports !== null
        ? Number(resolvedReports)
        : safeReports.filter(
            (report) =>
              String(report?.status || "").toUpperCase() === "RESOLVED",
          ).length;

    const dismissed =
      dismissedReports !== undefined && dismissedReports !== null
        ? Number(dismissedReports)
        : safeReports.filter(
            (report) =>
              String(report?.status || "").toUpperCase() === "DISMISSED",
          ).length;

    return {
      total,
      open,
      underReview,
      resolved,
      dismissed,
    };
  }, [
    safeReports,
    totalReports,
    openReports,
    underReviewReports,
    resolvedReports,
    dismissedReports,
  ]);

  /*
  ==========================================================
  STAT CARDS
  ==========================================================
  */

  const statCards = [
    {
      key: "total",
      label: "Total Reports",
      value: statistics.total,
      icon: <FaFlag />,
      className: "courierReportsStats-total",
      description: "All reports associated with this courier.",
    },

    {
      key: "open",
      label: "Open",
      value: statistics.open,
      icon: <FaExclamationCircle />,
      className: "courierReportsStats-open",
      description: "Reports waiting for review.",
    },

    {
      key: "underReview",
      label: "Under Review",
      value: statistics.underReview,
      icon: <FaClock />,
      className: "courierReportsStats-underReview",
      description: "Reports currently being investigated.",
    },

    {
      key: "resolved",
      label: "Resolved",
      value: statistics.resolved,
      icon: <FaCheckCircle />,
      className: "courierReportsStats-resolved",
      description: "Reports that have been resolved.",
    },

    {
      key: "dismissed",
      label: "Dismissed",
      value: statistics.dismissed,
      icon: <FaClipboardList />,
      className: "courierReportsStats-dismissed",
      description: "Reports closed without action.",
    },
  ];

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierReportsStats">
        <div className="courierReportsStats-header">
          <div>
            <div className="courierReportsStats-loadingTitle" />

            <div className="courierReportsStats-loadingSubtitle" />
          </div>
        </div>

        <div className="courierReportsStats-grid">
          {statCards.map((card) => (
            <div
              key={card.key}
              className="courierReportsStats-card courierReportsStats-loadingCard"
            >
              <div className="courierReportsStats-loadingIcon" />

              <div className="courierReportsStats-cardContent">
                <div className="courierReportsStats-loadingLabel" />

                <div className="courierReportsStats-loadingValue" />

                <div className="courierReportsStats-loadingDescription" />
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
    <section className="courierReportsStats">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierReportsStats-header">
        <div>
          <h2>Report Overview</h2>

          <p>
            A breakdown of reports and their current status for this courier.
          </p>
        </div>

        {courier && (
          <div className="courierReportsStats-courierLabel">
            <span>Courier</span>

            <strong>
              {[courier?.firstName, courier?.lastName]
                .filter(Boolean)
                .join(" ") || "Courier"}
            </strong>
          </div>
        )}
      </div>

      {/* ==================================================
          STAT GRID
      ================================================== */}

      <div className="courierReportsStats-grid">
        {statCards.map((card) => (
          <div
            key={card.key}
            className={`
              courierReportsStats-card
              ${card.className}
            `}
          >
            {/* ==================================================
                ICON
            ================================================== */}

            <div className="courierReportsStats-cardIcon">{card.icon}</div>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <div className="courierReportsStats-cardContent">
              <span className="courierReportsStats-label">{card.label}</span>

              <strong className="courierReportsStats-value">
                {Number(card.value || 0).toLocaleString("en-NG")}
              </strong>

              <span className="courierReportsStats-description">
                {card.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CourierReportsStats;
