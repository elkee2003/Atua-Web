import React from "react";

import {
  FaArrowLeft,
  FaCheckCircle,
  FaMoneyBillWave,
  FaSyncAlt,
} from "react-icons/fa";

import "./CourierPayoutsHeader.css";

function CourierPayoutsHeader({
  courier,
  refreshing = false,
  onBack,
  onRefresh,
}) {
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
    COURIER INFORMATION
    ==========================================================
    */

  const firstName = courier.firstName || "";

  const lastName = courier.lastName || "";

  const fullName = `${firstName} ${lastName}`.trim() || "Unknown Courier";

  const isApproved = Boolean(courier.isApproved);

  /*
    ==========================================================
    BACK HANDLER
    ==========================================================
    */

  const handleBack = () => {
    if (!onBack) {
      return;
    }

    onBack();
  };

  /*
    ==========================================================
    REFRESH HANDLER
    ==========================================================
    */

  const handleRefresh = () => {
    if (!onRefresh || refreshing) {
      return;
    }

    onRefresh();
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierPayoutsHeader">
      {/* ==================================================
                TOP ROW
            ================================================== */}

      <div className="courierPayoutsHeader-top">
        {/* ==================================================
                    LEFT
                ================================================== */}

        <div className="courierPayoutsHeader-left">
          {/* ==================================================
                        BACK BUTTON
                    ================================================== */}

          {onBack && (
            <button
              type="button"
              className="courierPayoutsHeader-backButton"
              onClick={handleBack}
            >
              <FaArrowLeft />

              <span>Back to Courier</span>
            </button>
          )}

          {/* ==================================================
                        TITLE AREA
                    ================================================== */}

          <div className="courierPayoutsHeader-titleArea">
            <div className="courierPayoutsHeader-titleRow">
              <div className="courierPayoutsHeader-icon">
                <FaMoneyBillWave />
              </div>

              <div className="courierPayoutsHeader-heading">
                <div className="courierPayoutsHeader-titleLine">
                  <h1>Courier Payouts</h1>

                  {isApproved && (
                    <FaCheckCircle
                      className="courierPayoutsHeader-approvedIcon"
                      title="Approved courier"
                    />
                  )}
                </div>

                <p>Manage payouts for {fullName}.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
                    REFRESH
                ================================================== */}

        {onRefresh && (
          <button
            type="button"
            className="courierPayoutsHeader-refreshButton"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "courierPayoutsHeader-refreshIcon spinning"
                  : "courierPayoutsHeader-refreshIcon"
              }
            />

            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        )}
      </div>

      {/* ==================================================
                COURIER META
            ================================================== */}

      <div className="courierPayoutsHeader-meta">
        <span className="courierPayoutsHeader-metaLabel">Courier</span>

        <span className="courierPayoutsHeader-metaValue">{fullName}</span>

        {courier.phoneNumber && (
          <>
            <span className="courierPayoutsHeader-divider">/</span>

            <span className="courierPayoutsHeader-phone">
              {courier.phoneNumber}
            </span>
          </>
        )}
      </div>
    </section>
  );
}

export default CourierPayoutsHeader;
