import React, { useMemo } from "react";

import {
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaFlag,
  FaMinusCircle,
} from "react-icons/fa";

import "./CourierReportsSummary.css";

function CourierReportsSummary({
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
  CALCULATE SUMMARY
  ==========================================================
  */

  const summary = useMemo(() => {
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

    /*
      ========================================================
      ACTIVE REPORTS

      Reports still requiring attention.
      ========================================================
      */

    const active = open + underReview;

    /*
      ========================================================
      CLOSED REPORTS

      Resolved + dismissed.
      ========================================================
      */

    const closed = resolved + dismissed;

    /*
      ========================================================
      RESOLUTION RATE

      Resolved reports as a percentage of all reports.
      ========================================================
      */

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    /*
      ========================================================
      ACTIVE RATE
      ========================================================
      */

    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;

    return {
      total,
      open,
      underReview,
      resolved,
      dismissed,
      active,
      closed,
      resolutionRate,
      activeRate,
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
  STATUS DATA
  ==========================================================
  */

  const statusItems = [
    {
      key: "OPEN",
      label: "Open",
      value: summary.open,
      icon: <FaExclamationCircle />,
      className: "courierReportsSummary-open",
    },

    {
      key: "UNDER_REVIEW",
      label: "Under Review",
      value: summary.underReview,
      icon: <FaClock />,
      className: "courierReportsSummary-underReview",
    },

    {
      key: "RESOLVED",
      label: "Resolved",
      value: summary.resolved,
      icon: <FaCheckCircle />,
      className: "courierReportsSummary-resolved",
    },

    {
      key: "DISMISSED",
      label: "Dismissed",
      value: summary.dismissed,
      icon: <FaMinusCircle />,
      className: "courierReportsSummary-dismissed",
    },
  ];

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierReportsSummary">
        <div className="courierReportsSummary-loadingHeader">
          <div className="courierReportsSummary-loadingTitle" />

          <div className="courierReportsSummary-loadingDescription" />
        </div>

        <div className="courierReportsSummary-loadingBody">
          <div className="courierReportsSummary-loadingOverview">
            <div className="courierReportsSummary-loadingCircle" />

            <div className="courierReportsSummary-loadingOverviewContent">
              <div className="courierReportsSummary-loadingSmallTitle" />

              <div className="courierReportsSummary-loadingLargeValue" />

              <div className="courierReportsSummary-loadingSmallText" />
            </div>
          </div>

          <div className="courierReportsSummary-loadingStatuses">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="courierReportsSummary-loadingStatus">
                <div className="courierReportsSummary-loadingStatusIcon" />

                <div className="courierReportsSummary-loadingStatusContent">
                  <div className="courierReportsSummary-loadingStatusLabel" />

                  <div className="courierReportsSummary-loadingStatusBar" />
                </div>

                <div className="courierReportsSummary-loadingStatusValue" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  EMPTY SUMMARY
  ==========================================================
  */

  const hasReports = summary.total > 0;

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierReportsSummary">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierReportsSummary-header">
        <div>
          <div className="courierReportsSummary-titleRow">
            <div className="courierReportsSummary-titleIcon">
              <FaFlag />
            </div>

            <div>
              <h2>Report Summary</h2>

              <p>
                Current status and resolution overview for this courier's
                reports.
              </p>
            </div>
          </div>
        </div>

        <div className="courierReportsSummary-totalBadge">
          <strong>{summary.total.toLocaleString("en-NG")}</strong>

          <span>{summary.total === 1 ? "Total Report" : "Total Reports"}</span>
        </div>
      </div>

      {/* ==================================================
          MAIN SUMMARY BODY
      ================================================== */}

      <div className="courierReportsSummary-body">
        {/* ==================================================
            OVERVIEW
        ================================================== */}

        <div className="courierReportsSummary-overview">
          <div className="courierReportsSummary-overviewIcon">
            <FaFlag />
          </div>

          <div className="courierReportsSummary-overviewContent">
            <span>Reports Requiring Attention</span>

            <strong>{summary.active.toLocaleString("en-NG")}</strong>

            <p>
              {summary.active === 0
                ? "No reports currently require attention."
                : summary.active === 1
                  ? "1 report is currently active."
                  : `${summary.active} reports are currently active.`}
            </p>
          </div>

          <div className="courierReportsSummary-overviewRate">
            <strong>{summary.activeRate}%</strong>

            <span>Active</span>
          </div>
        </div>

        {/* ==================================================
            RESOLUTION SUMMARY
        ================================================== */}

        <div className="courierReportsSummary-resolution">
          <div className="courierReportsSummary-resolutionHeader">
            <div>
              <span>Resolution Rate</span>

              <strong>{summary.resolutionRate}%</strong>
            </div>

            <div className="courierReportsSummary-resolutionCounts">
              <span>{summary.resolved} resolved</span>

              <span>{summary.closed} closed</span>
            </div>
          </div>

          <div className="courierReportsSummary-resolutionTrack">
            <div
              className="courierReportsSummary-resolutionProgress"
              style={{
                width: `${summary.resolutionRate}%`,
              }}
            />
          </div>
        </div>

        {/* ==================================================
            STATUS BREAKDOWN
        ================================================== */}

        <div className="courierReportsSummary-statusSection">
          <div className="courierReportsSummary-sectionTitle">
            <h3>Status Breakdown</h3>

            <span>
              {hasReports ? "All courier reports" : "No reports available"}
            </span>
          </div>

          <div className="courierReportsSummary-statusList">
            {statusItems.map((item) => {
              const percentage =
                summary.total > 0
                  ? Math.round((item.value / summary.total) * 100)
                  : 0;

              return (
                <div
                  key={item.key}
                  className={`
                      courierReportsSummary-statusItem
                      ${item.className}
                    `}
                >
                  {/* ======================================
                        ICON
                    ====================================== */}

                  <div className="courierReportsSummary-statusIcon">
                    {item.icon}
                  </div>

                  {/* ======================================
                        MAIN
                    ====================================== */}

                  <div className="courierReportsSummary-statusMain">
                    <div className="courierReportsSummary-statusTop">
                      <span>{item.label}</span>

                      <strong>{item.value.toLocaleString("en-NG")}</strong>
                    </div>

                    <div className="courierReportsSummary-statusTrack">
                      <div
                        className="courierReportsSummary-statusProgress"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* ======================================
                        PERCENTAGE
                    ====================================== */}

                  <span className="courierReportsSummary-statusPercentage">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================================================
            FOOTER INSIGHT
        ================================================== */}

        <div className="courierReportsSummary-insight">
          <div className="courierReportsSummary-insightIcon">
            {summary.active > 0 ? <FaExclamationCircle /> : <FaCheckCircle />}
          </div>

          <div>
            <strong>
              {summary.active > 0
                ? "Reports need attention"
                : "No active reports"}
            </strong>

            <p>
              {summary.active > 0
                ? `${summary.active} ${summary.active === 1 ? "report is" : "reports are"} currently open or under review.`
                : "There are currently no open or under-review reports for this courier."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourierReportsSummary;
