import React from "react";

import {
  FaFilter,
  FaCalendarAlt,
  FaTruck,
  FaClipboardList,
  FaTimes,
} from "react-icons/fa";

import "./CourierAnalyticsFilters.css";

/*
==========================================================
PERIOD OPTIONS
==========================================================
*/

const PERIOD_OPTIONS = [
  {
    value: "7D",
    label: "Last 7 Days",
  },
  {
    value: "30D",
    label: "Last 30 Days",
  },
  {
    value: "90D",
    label: "Last 90 Days",
  },
  {
    value: "ALL",
    label: "All Time",
  },
];

/*
==========================================================
TRANSPORTATION OPTIONS
==========================================================
*/

const TRANSPORTATION_OPTIONS = [
  {
    value: "ALL",
    label: "All Types",
  },
  {
    value: "Micro X",
    label: "Micro X",
  },
  {
    value: "Micro Batch",
    label: "Micro Batch",
  },
  {
    value: "Moto X",
    label: "Moto X",
  },
  {
    value: "Moto Batch",
    label: "Moto Batch",
  },
  {
    value: "Maxi",
    label: "Maxi",
  },
];

/*
==========================================================
STATUS OPTIONS
==========================================================
*/

const STATUS_OPTIONS = [
  {
    value: "ALL",
    label: "All Statuses",
  },
  {
    value: "BIDDING",
    label: "Bidding",
  },
  {
    value: "READY_FOR_PICKUP",
    label: "Ready for Pickup",
  },
  {
    value: "ACCEPTED",
    label: "Accepted",
  },
  {
    value: "ARRIVED_PICKUP",
    label: "Arrived Pickup",
  },
  {
    value: "LOADING",
    label: "Loading",
  },
  {
    value: "PICKED_UP",
    label: "Picked Up",
  },
  {
    value: "IN_TRANSIT",
    label: "In Transit",
  },
  {
    value: "ARRIVED_DROPOFF",
    label: "Arrived Dropoff",
  },
  {
    value: "UNLOADING",
    label: "Unloading",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
  },
  {
    value: "HANDOVER_TO_LOGISTICS",
    label: "Handed to Logistics",
  },
  {
    value: "IN_LOGISTICS_TRANSIT",
    label: "Logistics Transit",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
  {
    value: "DISPUTED",
    label: "Disputed",
  },
];

/*
==========================================================
COMPONENT
==========================================================
*/

function CourierAnalyticsFilters({
  period = "30D",
  transportationType = "ALL",
  orderStatus = "ALL",

  setPeriod,
  setTransportationType,
  setOrderStatus,

  onReset,

  showPeriod = true,
  showTransportation = true,
  showStatus = true,
}) {
  /*
    ========================================================
    ACTIVE FILTER COUNT
    ========================================================
    */

  const activeFilterCount = [
    period !== "30D",
    transportationType !== "ALL",
    orderStatus !== "ALL",
  ].filter(Boolean).length;

  /*
    ========================================================
    HANDLERS
    ========================================================
    */

  const handlePeriodChange = (event) => {
    if (setPeriod) {
      setPeriod(event.target.value);
    }
  };

  const handleTransportationChange = (event) => {
    if (setTransportationType) {
      setTransportationType(event.target.value);
    }
  };

  const handleStatusChange = (event) => {
    if (setOrderStatus) {
      setOrderStatus(event.target.value);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
      return;
    }

    if (setPeriod) {
      setPeriod("30D");
    }

    if (setTransportationType) {
      setTransportationType("ALL");
    }

    if (setOrderStatus) {
      setOrderStatus("ALL");
    }
  };

  /*
    ========================================================
    RENDER
    ========================================================
    */

  return (
    <section className="courierAnalyticsFilters">
      {/* ==================================================
                FILTER HEADER
            ================================================== */}

      <div className="courierAnalyticsFilters-header">
        <div className="courierAnalyticsFilters-title">
          <span className="courierAnalyticsFilters-titleIcon">
            <FaFilter />
          </span>

          <div>
            <h3>Analytics Filters</h3>

            <p>Refine the courier performance data</p>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <span className="courierAnalyticsFilters-count">
            {activeFilterCount}

            {activeFilterCount === 1 ? " filter" : " filters"}
          </span>
        )}
      </div>

      {/* ==================================================
                FILTER CONTROLS
            ================================================== */}

      <div className="courierAnalyticsFilters-controls">
        {/* ==================================================
                    PERIOD
                ================================================== */}

        {showPeriod && (
          <div className="courierAnalyticsFilters-field">
            <label htmlFor="courierAnalyticsPeriod">
              <FaCalendarAlt />
              Period
            </label>

            <div className="courierAnalyticsFilters-selectWrapper">
              <select
                id="courierAnalyticsPeriod"
                value={period}
                onChange={handlePeriodChange}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ==================================================
                    TRANSPORTATION
                ================================================== */}

        {showTransportation && (
          <div className="courierAnalyticsFilters-field">
            <label htmlFor="courierAnalyticsTransportation">
              <FaTruck />
              Transportation
            </label>

            <div className="courierAnalyticsFilters-selectWrapper">
              <select
                id="courierAnalyticsTransportation"
                value={transportationType}
                onChange={handleTransportationChange}
              >
                {TRANSPORTATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ==================================================
                    ORDER STATUS
                ================================================== */}

        {showStatus && (
          <div className="courierAnalyticsFilters-field">
            <label htmlFor="courierAnalyticsStatus">
              <FaClipboardList />
              Order Status
            </label>

            <div className="courierAnalyticsFilters-selectWrapper">
              <select
                id="courierAnalyticsStatus"
                value={orderStatus}
                onChange={handleStatusChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ==================================================
                    RESET
                ================================================== */}

        <button
          type="button"
          className="courierAnalyticsFilters-reset"
          onClick={handleReset}
          disabled={activeFilterCount === 0}
        >
          <FaTimes />
          Reset
        </button>
      </div>

      {/* ==================================================
                ACTIVE FILTER SUMMARY
            ================================================== */}

      {activeFilterCount > 0 && (
        <div className="courierAnalyticsFilters-active">
          <span className="courierAnalyticsFilters-activeLabel">Active:</span>

          {period !== "30D" && (
            <span className="courierAnalyticsFilters-tag">
              {PERIOD_OPTIONS.find((option) => option.value === period)
                ?.label || period}
            </span>
          )}

          {transportationType !== "ALL" && (
            <span className="courierAnalyticsFilters-tag">
              {TRANSPORTATION_OPTIONS.find(
                (option) => option.value === transportationType,
              )?.label || transportationType}
            </span>
          )}

          {orderStatus !== "ALL" && (
            <span className="courierAnalyticsFilters-tag">
              {STATUS_OPTIONS.find((option) => option.value === orderStatus)
                ?.label || orderStatus}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

export default CourierAnalyticsFilters;
