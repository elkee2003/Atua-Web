import React from "react";

import { FaExclamationCircle, FaFlag, FaSyncAlt } from "react-icons/fa";

import CourierReportCard from "../CourierReportCard/CourierReportCard";
import CourierReportsEmptyState from "../CourierReportsEmptyState/CourierReportsEmptyState";

import "./CourierReportsList.css";

function CourierReportsList({
  reports = [],
  loading = false,
  error = null,

  onRetry,

  onViewReport,
  onViewOrder,
  onViewCustomer,

  onReviewReport,
  onResolveReport,
  onDismissReport,

  page = 1,
  totalPages = 1,
  onPageChange,

  showPagination = true,
}) {
  /*
  ==========================================================
  SAFE REPORTS
  ==========================================================
  */

  const safeReports = Array.isArray(reports) ? reports : [];

  /*
  ==========================================================
  PAGE HANDLERS
  ==========================================================
  */

  const handlePreviousPage = () => {
    if (typeof onPageChange !== "function") {
      return;
    }

    if (page <= 1) {
      return;
    }

    onPageChange(page - 1);
  };

  const handleNextPage = () => {
    if (typeof onPageChange !== "function") {
      return;
    }

    if (page >= totalPages) {
      return;
    }

    onPageChange(page + 1);
  };

  const handlePageChange = (nextPage) => {
    if (typeof onPageChange !== "function") {
      return;
    }

    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    onPageChange(nextPage);
  };

  /*
  ==========================================================
  PAGE NUMBERS
  ==========================================================
  */

  const getPageNumbers = () => {
    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    const pages = [];

    pages.push(1);

    if (page > 3) {
      pages.push("ellipsis-start");
    }

    const start = Math.max(2, page - 1);

    const end = Math.min(totalPages - 1, page + 1);

    for (let number = start; number <= end; number += 1) {
      pages.push(number);
    }

    if (page < totalPages - 2) {
      pages.push("ellipsis-end");
    }

    pages.push(totalPages);

    return pages;
  };

  /*
  ==========================================================
  LOADING STATE
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierReportsList">
        <div className="courierReportsList-header">
          <div>
            <h2>Courier Reports</h2>

            <p>Loading reports for this courier...</p>
          </div>
        </div>

        <div className="courierReportsList-loading">
          {[1, 2, 3].map((item) => (
            <div key={item} className="courierReportsList-loadingCard">
              <div className="courierReportsList-loadingTop">
                <div className="courierReportsList-loadingIcon" />

                <div className="courierReportsList-loadingTitle" />

                <div className="courierReportsList-loadingBadge" />
              </div>

              <div className="courierReportsList-loadingLine large" />

              <div className="courierReportsList-loadingLine medium" />

              <div className="courierReportsList-loadingLine small" />

              <div className="courierReportsList-loadingBottom">
                <div className="courierReportsList-loadingSmallBox" />

                <div className="courierReportsList-loadingSmallBox" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  ERROR STATE
  ==========================================================
  */

  if (error) {
    return (
      <section className="courierReportsList">
        <div className="courierReportsList-header">
          <div>
            <h2>Courier Reports</h2>

            <p>Unable to load reports for this courier.</p>
          </div>
        </div>

        <div className="courierReportsList-error">
          <div className="courierReportsList-errorIcon">
            <FaExclamationCircle />
          </div>

          <h3>Something went wrong</h3>

          <p>
            {typeof error === "string"
              ? error
              : error?.message ||
                "We could not load the courier reports. Please try again."}
          </p>

          {typeof onRetry === "function" && (
            <button
              type="button"
              className="courierReportsList-retryButton"
              onClick={onRetry}
            >
              <FaSyncAlt />

              <span>Try Again</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  EMPTY STATE
  ==========================================================
  */

  if (safeReports.length === 0) {
    return (
      <section className="courierReportsList">
        <div className="courierReportsList-header">
          <div>
            <h2>Courier Reports</h2>

            <p>Reports associated with this courier.</p>
          </div>
        </div>

        <CourierReportsEmptyState />
      </section>
    );
  }

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierReportsList">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierReportsList-header">
        <div>
          <div className="courierReportsList-titleRow">
            <div className="courierReportsList-titleIcon">
              <FaFlag />
            </div>

            <div>
              <h2>Courier Reports</h2>

              <p>
                Review complaints, incidents, and issues associated with this
                courier.
              </p>
            </div>
          </div>
        </div>

        <div className="courierReportsList-count">
          <strong>{safeReports.length.toLocaleString("en-NG")}</strong>

          <span>{safeReports.length === 1 ? "report" : "reports"}</span>
        </div>
      </div>

      {/* ==================================================
          REPORT LIST
      ================================================== */}

      <div className="courierReportsList-items">
        {safeReports.map((report) => (
          <CourierReportCard
            key={report?.id || `report-${Math.random()}`}
            report={report}
            onViewReport={onViewReport}
            onViewOrder={onViewOrder}
            onViewCustomer={onViewCustomer}
            onReview={onReviewReport}
            onResolve={onResolveReport}
            onDismiss={onDismissReport}
          />
        ))}
      </div>

      {/* ==================================================
          PAGINATION
      ================================================== */}

      {showPagination && totalPages > 1 && (
        <div className="courierReportsList-pagination">
          {/* ==================================================
                PREVIOUS
            ================================================== */}

          <button
            type="button"
            className="courierReportsList-pageButton"
            onClick={handlePreviousPage}
            disabled={page <= 1}
          >
            Previous
          </button>

          {/* ==================================================
                PAGE NUMBERS
            ================================================== */}

          <div className="courierReportsList-pageNumbers">
            {getPageNumbers().map((pageNumber) => {
              if (typeof pageNumber !== "number") {
                return (
                  <span
                    key={pageNumber}
                    className="courierReportsList-ellipsis"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`
                        courierReportsList-pageNumber
                        ${pageNumber === page ? "active" : ""}
                      `}
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={pageNumber === page}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* ==================================================
                NEXT
            ================================================== */}

          <button
            type="button"
            className="courierReportsList-pageButton"
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

export default CourierReportsList;
