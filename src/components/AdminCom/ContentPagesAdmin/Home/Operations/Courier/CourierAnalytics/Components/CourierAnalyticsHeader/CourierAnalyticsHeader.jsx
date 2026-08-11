import React from "react";
import { FaArrowLeft, FaChartLine, FaSyncAlt } from "react-icons/fa";

import "./CourierAnalyticsHeader.css";

function CourierAnalyticsHeader({
  courier,
  courierId,
  onBack,
  onRefresh,
  refreshing = false,
}) {
  /*
    ==========================================================
    COURIER NAME
    ==========================================================
    */

  const courierName = courier
    ? `${courier.firstName || ""} ${courier.lastName || ""}`.trim()
    : "Courier";

  /*
    ==========================================================
    COURIER DETAILS
    ==========================================================
    */

  const courierPhone = courier?.phoneNumber || null;

  const transportationType =
    courier?.transportationType || courier?.vehicleClass || null;

  /*
    ==========================================================
    SAFE ACTIONS
    ==========================================================
    */

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
    }
  };

  const handleRefresh = () => {
    if (typeof onRefresh === "function" && !refreshing) {
      onRefresh();
    }
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <header className="courierAnalyticsHeader">
      {/* ==================================================
                LEFT
            ================================================== */}

      <div className="courierAnalyticsHeader-left">
        <button
          type="button"
          className="courierAnalyticsHeader-backButton"
          onClick={handleBack}
          aria-label="Go back"
        >
          <FaArrowLeft />

          <span>Back</span>
        </button>

        <div className="courierAnalyticsHeader-divider" />

        {/* ==================================================
                    ICON
                ================================================== */}

        <div className="courierAnalyticsHeader-icon">
          <FaChartLine />
        </div>

        {/* ==================================================
                    TITLE
                ================================================== */}

        <div className="courierAnalyticsHeader-content">
          <div className="courierAnalyticsHeader-titleRow">
            <h1>Courier Analytics</h1>
          </div>

          <p className="courierAnalyticsHeader-description">
            Performance and operational insights
            {courierName ? ` for ${courierName}` : " for this courier"}
          </p>

          {/* ==================================================
                        COURIER META
                    ================================================== */}

          {(courierPhone || transportationType) && (
            <div className="courierAnalyticsHeader-meta">
              {courierPhone && <span>{courierPhone}</span>}

              {courierPhone && transportationType && (
                <span className="courierAnalyticsHeader-metaDivider">•</span>
              )}

              {transportationType && <span>{transportationType}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
                RIGHT
            ================================================== */}

      <div className="courierAnalyticsHeader-right">
        <button
          type="button"
          className="courierAnalyticsHeader-refreshButton"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaSyncAlt
            className={
              refreshing
                ? "courierAnalyticsHeader-refreshIcon courierAnalyticsHeader-refreshIcon-spinning"
                : "courierAnalyticsHeader-refreshIcon"
            }
          />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>
    </header>
  );
}

export default CourierAnalyticsHeader;
