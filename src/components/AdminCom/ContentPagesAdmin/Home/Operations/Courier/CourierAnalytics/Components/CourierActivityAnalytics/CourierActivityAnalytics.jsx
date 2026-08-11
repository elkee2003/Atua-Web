// CourierActivityAnalytics answers "How is the courier actually operating?"

import React, { useMemo, useState } from "react";

import {
  FaBolt,
  FaClock,
  FaRoute,
  FaCheckCircle,
  FaCalendarAlt,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaTruck,
} from "react-icons/fa";

import "./CourierActivityAnalytics.css";

/*
==========================================================
PERIOD OPTIONS
==========================================================
*/

const PERIOD_OPTIONS = [
  {
    key: "7D",
    label: "7 Days",
    days: 7,
  },
  {
    key: "30D",
    label: "30 Days",
    days: 30,
  },
  {
    key: "90D",
    label: "90 Days",
    days: 90,
  },
  {
    key: "ALL",
    label: "All Time",
    days: null,
  },
];

/*
==========================================================
ACTIVE STATUSES
==========================================================
*/

const ACTIVE_STATUSES = [
  "READY_FOR_PICKUP",
  "ACCEPTED",
  "ARRIVED_PICKUP",
  "LOADING",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_DROPOFF",
  "UNLOADING",
  "HANDOVER_TO_LOGISTICS",
  "IN_LOGISTICS_TRANSIT",
];

/*
==========================================================
HELPERS
==========================================================
*/

const getDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getPeriodStart = (days) => {
  if (!days) {
    return null;
  }

  const date = new Date();

  date.setHours(0, 0, 0, 0);

  date.setDate(date.getDate() - (days - 1));

  return date;
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString("en-NG");
};

const formatDuration = (minutes) => {
  const value = Number(minutes) || 0;

  if (value < 1) {
    return "—";
  }

  if (value < 60) {
    return `${Math.round(value)} min`;
  }

  const hours = Math.floor(value / 60);

  const remainingMinutes = Math.round(value % 60);

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

const formatDate = (date) => {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
};

const getMinutesBetween = (start, end) => {
  const startDate = getDate(start);
  const endDate = getDate(end);

  if (!startDate || !endDate) {
    return null;
  }

  const difference = (endDate.getTime() - startDate.getTime()) / 60000;

  if (difference < 0) {
    return null;
  }

  return difference;
};

/*
==========================================================
COMPONENT
==========================================================
*/

function CourierActivityAnalytics({
  orders = [],
  courier = null,
  period = "30D",
  onPeriodChange,
}) {
  const [localPeriod, setLocalPeriod] = useState(period);

  /*
    ========================================================
    PERIOD
    ========================================================
    */

  const selectedPeriod =
    PERIOD_OPTIONS.find((item) => item.key === localPeriod) ||
    PERIOD_OPTIONS[1];

  /*
    ========================================================
    PERIOD CHANGE
    ========================================================
    */

  const handlePeriodChange = (value) => {
    setLocalPeriod(value);

    if (onPeriodChange) {
      onPeriodChange(value);
    }
  };

  /*
    ========================================================
    FILTER ORDERS
    ========================================================
    */

  const periodOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }

    const periodStart = getPeriodStart(selectedPeriod.days);

    if (!periodStart) {
      return orders;
    }

    return orders.filter((order) => {
      const date = getDate(order?.createdAt);

      if (!date) {
        return false;
      }

      return date >= periodStart;
    });
  }, [orders, selectedPeriod.days]);

  /*
    ========================================================
    COMPLETED ORDERS
    ========================================================
    */

  const completedOrders = useMemo(() => {
    return periodOrders.filter((order) => order?.status === "DELIVERED");
  }, [periodOrders]);

  /*
    ========================================================
    ACTIVE ORDERS
    ========================================================
    */

  const activeOrders = useMemo(() => {
    return periodOrders.filter((order) =>
      ACTIVE_STATUSES.includes(order?.status),
    );
  }, [periodOrders]);

  /*
    ========================================================
    ACTIVITY SUMMARY
    ========================================================
    */

  const activitySummary = useMemo(() => {
    const totalOrders = periodOrders.length;

    const completed = completedOrders.length;

    const active = activeOrders.length;

    const cancelled = periodOrders.filter(
      (order) => order?.status === "CANCELLED",
    ).length;

    const disputed = periodOrders.filter(
      (order) => order?.status === "DISPUTED",
    ).length;

    const acceptanceTimes = [];

    const pickupTimes = [];

    const loadingTimes = [];

    const transitTimes = [];

    const totalDeliveryTimes = [];

    completedOrders.forEach((order) => {
      const acceptanceTime = getMinutesBetween(
        order?.acceptedAt,
        order?.arrivedPickupAt,
      );

      if (acceptanceTime !== null) {
        acceptanceTimes.push(acceptanceTime);
      }

      const pickupTime = getMinutesBetween(
        order?.arrivedPickupAt,
        order?.loadingStartedAt,
      );

      if (pickupTime !== null) {
        pickupTimes.push(pickupTime);
      }

      const loadingTime = getMinutesBetween(
        order?.loadingStartedAt,
        order?.tripStartedAt,
      );

      if (loadingTime !== null) {
        loadingTimes.push(loadingTime);
      }

      const transitTime = getMinutesBetween(
        order?.tripStartedAt,
        order?.arrivedDropoffAt,
      );

      if (transitTime !== null) {
        transitTimes.push(transitTime);
      }

      const deliveryTime = getMinutesBetween(
        order?.acceptedAt,
        order?.unloadingCompletedAt,
      );

      if (deliveryTime !== null) {
        totalDeliveryTimes.push(deliveryTime);
      }
    });

    const average = (values) => {
      if (!values.length) {
        return 0;
      }

      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };

    return {
      totalOrders,

      completed,

      active,

      cancelled,

      disputed,

      completionRate: totalOrders > 0 ? (completed / totalOrders) * 100 : 0,

      averageAcceptance: average(acceptanceTimes),

      averagePickup: average(pickupTimes),

      averageLoading: average(loadingTimes),

      averageTransit: average(transitTimes),

      averageDelivery: average(totalDeliveryTimes),
    };
  }, [periodOrders, completedOrders, activeOrders]);

  /*
    ========================================================
    DAILY ACTIVITY
    ========================================================
    */

  const dailyActivity = useMemo(() => {
    const days = selectedPeriod.days || 30;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const result = [];

    for (let index = days - 1; index >= 0; index--) {
      const date = new Date(today);

      date.setDate(today.getDate() - index);

      const dayOrders = periodOrders.filter((order) => {
        const orderDate = getDate(order?.createdAt);

        if (!orderDate) {
          return false;
        }

        return (
          orderDate.getFullYear() === date.getFullYear() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getDate() === date.getDate()
        );
      });

      const completed = dayOrders.filter(
        (order) => order?.status === "DELIVERED",
      ).length;

      const active = dayOrders.filter((order) =>
        ACTIVE_STATUSES.includes(order?.status),
      ).length;

      result.push({
        date,

        orders: dayOrders.length,

        completed,

        active,
      });
    }

    return result;
  }, [periodOrders, selectedPeriod.days]);

  /*
    ========================================================
    MAX ACTIVITY
    ========================================================
    */

  const maxActivity = Math.max(...dailyActivity.map((item) => item.orders), 1);

  /*
    ========================================================
    DAY OF WEEK ACTIVITY
    ========================================================
    */

  const weekdayActivity = useMemo(() => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const result = weekdays.map((day) => ({
      day,

      orders: 0,

      completed: 0,
    }));

    periodOrders.forEach((order) => {
      const date = getDate(order?.createdAt);

      if (!date) {
        return;
      }

      const index = date.getDay();

      result[index].orders += 1;

      if (order?.status === "DELIVERED") {
        result[index].completed += 1;
      }
    });

    return result;
  }, [periodOrders]);

  /*
    ========================================================
    PEAK DAY
    ========================================================
    */

  const peakDay = useMemo(() => {
    if (!weekdayActivity.length) {
      return null;
    }

    return weekdayActivity.reduce(
      (highest, current) =>
        current.orders > highest.orders ? current : highest,
      weekdayActivity[0],
    );
  }, [weekdayActivity]);

  /*
    ========================================================
    TRANSPORTATION ACTIVITY
    ========================================================
    */

  const transportationActivity = useMemo(() => {
    const map = {};

    periodOrders.forEach((order) => {
      const type = order?.transportationType || "Unknown";

      if (!map[type]) {
        map[type] = {
          type,

          orders: 0,

          completed: 0,
        };
      }

      map[type].orders += 1;

      if (order?.status === "DELIVERED") {
        map[type].completed += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.orders - a.orders);
  }, [periodOrders]);

  /*
    ========================================================
    MAX TRANSPORT ORDERS
    ========================================================
    */

  const maxTransportOrders = Math.max(
    ...transportationActivity.map((item) => item.orders),
    1,
  );

  /*
    ========================================================
    RENDER
    ========================================================
    */

  return (
    <section className="courierActivityAnalytics">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierActivityAnalytics-header">
        <div className="courierActivityAnalytics-heading">
          <div className="courierActivityAnalytics-titleIcon">
            <FaBolt />
          </div>

          <div>
            <h2>Activity Analytics</h2>

            <p>Operational activity and delivery efficiency</p>
          </div>
        </div>

        <div className="courierActivityAnalytics-periods">
          {PERIOD_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={localPeriod === item.key ? "active" : ""}
              onClick={() => handlePeriodChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================
                KPI CARDS
            ================================================== */}

      <div className="courierActivityAnalytics-summary">
        <div className="courierActivityAnalytics-summaryCard">
          <div className="courierActivityAnalytics-summaryIcon activity">
            <FaBolt />
          </div>

          <div>
            <span>Total Activity</span>

            <strong>{formatNumber(activitySummary.totalOrders)}</strong>

            <small>Orders handled</small>
          </div>
        </div>

        <div className="courierActivityAnalytics-summaryCard">
          <div className="courierActivityAnalytics-summaryIcon completed">
            <FaCheckCircle />
          </div>

          <div>
            <span>Completed</span>

            <strong>{formatNumber(activitySummary.completed)}</strong>

            <small>
              {activitySummary.completionRate.toFixed(1)}% completion
            </small>
          </div>
        </div>

        <div className="courierActivityAnalytics-summaryCard">
          <div className="courierActivityAnalytics-summaryIcon active">
            <FaRoute />
          </div>

          <div>
            <span>Active</span>

            <strong>{formatNumber(activitySummary.active)}</strong>

            <small>Current lifecycle</small>
          </div>
        </div>

        <div className="courierActivityAnalytics-summaryCard">
          <div className="courierActivityAnalytics-summaryIcon time">
            <FaClock />
          </div>

          <div>
            <span>Avg. Delivery Time</span>

            <strong>{formatDuration(activitySummary.averageDelivery)}</strong>

            <small>Accepted → completed</small>
          </div>
        </div>
      </div>

      {/* ==================================================
                MAIN GRID
            ================================================== */}

      <div className="courierActivityAnalytics-main">
        {/* ==================================================
                    DAILY ACTIVITY
                ================================================== */}

        <div className="courierActivityAnalytics-card">
          <div className="courierActivityAnalytics-cardHeader">
            <div>
              <h3>Daily Activity</h3>

              <p>Orders handled across the selected period</p>
            </div>

            <FaCalendarAlt />
          </div>

          <div className="courierActivityAnalytics-chart">
            <div className="courierActivityAnalytics-yAxis">
              <span>{maxActivity}</span>

              <span>{Math.round(maxActivity * 0.75)}</span>

              <span>{Math.round(maxActivity * 0.5)}</span>

              <span>{Math.round(maxActivity * 0.25)}</span>

              <span>0</span>
            </div>

            <div className="courierActivityAnalytics-bars">
              {dailyActivity.map((item, index) => {
                const height = (item.orders / maxActivity) * 100;

                const showLabel =
                  selectedPeriod.days <= 7
                    ? true
                    : selectedPeriod.days <= 30
                      ? index % 5 === 0
                      : index % 15 === 0;

                return (
                  <div
                    key={item.date.toISOString()}
                    className="courierActivityAnalytics-barGroup"
                  >
                    <div className="courierActivityAnalytics-barArea">
                      <div
                        className="courierActivityAnalytics-bar"
                        style={{
                          height:
                            item.orders > 0 ? `${Math.max(height, 5)}%` : "0%",
                        }}
                        title={`${item.orders} orders`}
                      />
                    </div>

                    <span>{showLabel ? formatDate(item.date) : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="courierActivityAnalytics-legend">
            <span>
              <i className="orders" />
              Orders
            </span>

            <span>
              <i className="completed" />
              Completed
            </span>
          </div>
        </div>

        {/* ==================================================
                    ACTIVITY TIMING
                ================================================== */}

        <div className="courierActivityAnalytics-card">
          <div className="courierActivityAnalytics-cardHeader">
            <div>
              <h3>Delivery Timing</h3>

              <p>Average time between recorded order events</p>
            </div>

            <FaHourglassHalf />
          </div>

          <div className="courierActivityAnalytics-timing">
            <div className="courierActivityAnalytics-timingRow">
              <div>
                <span className="blue">
                  <FaClock />
                </span>

                <div>
                  <strong>Acceptance → Pickup</strong>

                  <small>Time to reach pickup</small>
                </div>
              </div>

              <b>{formatDuration(activitySummary.averageAcceptance)}</b>
            </div>

            <div className="courierActivityAnalytics-timingRow">
              <div>
                <span className="orange">
                  <FaMapMarkerAlt />
                </span>

                <div>
                  <strong>Pickup → Loading</strong>

                  <small>Time before loading begins</small>
                </div>
              </div>

              <b>{formatDuration(activitySummary.averagePickup)}</b>
            </div>

            <div className="courierActivityAnalytics-timingRow">
              <div>
                <span className="purple">
                  <FaTruck />
                </span>

                <div>
                  <strong>Loading → Trip</strong>

                  <small>Loading preparation time</small>
                </div>
              </div>

              <b>{formatDuration(activitySummary.averageLoading)}</b>
            </div>

            <div className="courierActivityAnalytics-timingRow">
              <div>
                <span className="green">
                  <FaRoute />
                </span>

                <div>
                  <strong>Trip → Dropoff</strong>

                  <small>Recorded transit time</small>
                </div>
              </div>

              <b>{formatDuration(activitySummary.averageTransit)}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
                WEEKDAY ACTIVITY
            ================================================== */}

      <div className="courierActivityAnalytics-card">
        <div className="courierActivityAnalytics-cardHeader">
          <div>
            <h3>Activity by Day</h3>

            <p>Which days generate the most courier activity</p>
          </div>

          {peakDay && (
            <span className="courierActivityAnalytics-peak">
              Peak: {peakDay.day}
            </span>
          )}
        </div>

        <div className="courierActivityAnalytics-weekdays">
          {weekdayActivity.map((item) => {
            const height =
              (item.orders /
                Math.max(...weekdayActivity.map((day) => day.orders), 1)) *
              100;

            return (
              <div key={item.day} className="courierActivityAnalytics-weekday">
                <div className="courierActivityAnalytics-weekdayChart">
                  <div
                    className="courierActivityAnalytics-weekdayBar"
                    style={{
                      height:
                        item.orders > 0 ? `${Math.max(height, 7)}%` : "0%",
                    }}
                  />
                </div>

                <strong>{item.day}</strong>

                <span>{formatNumber(item.orders)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================
                TRANSPORTATION ACTIVITY
            ================================================== */}

      <div className="courierActivityAnalytics-card">
        <div className="courierActivityAnalytics-cardHeader">
          <div>
            <h3>Activity by Transportation Type</h3>

            <p>Order activity across the courier's assigned service types</p>
          </div>
        </div>

        {transportationActivity.length === 0 ? (
          <div className="courierActivityAnalytics-empty">
            No transportation activity available for this period.
          </div>
        ) : (
          <div className="courierActivityAnalytics-transportGrid">
            {transportationActivity.map((item) => {
              const width = (item.orders / maxTransportOrders) * 100;

              const completion =
                item.orders > 0 ? (item.completed / item.orders) * 100 : 0;

              return (
                <div
                  key={item.type}
                  className="courierActivityAnalytics-transportItem"
                >
                  <div className="courierActivityAnalytics-transportTop">
                    <div>
                      <strong>{item.type}</strong>

                      <small>{formatNumber(item.orders)} orders</small>
                    </div>

                    <span>{completion.toFixed(0)}%</span>
                  </div>

                  <div className="courierActivityAnalytics-transportTrack">
                    <span
                      style={{
                        width: `${width}%`,
                      }}
                    />
                  </div>

                  <small className="courierActivityAnalytics-transportCompleted">
                    {formatNumber(item.completed)} completed
                  </small>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================
                CURRENT COURIER STATE
            ================================================== */}

      {courier && (
        <div className="courierActivityAnalytics-currentState">
          <div>
            <span>Current Courier State</span>

            <strong>{courier.isOnline ? "Online" : "Offline"}</strong>
          </div>

          <div>
            <span>Approval</span>

            <strong>{courier.isApproved ? "Approved" : "Pending"}</strong>
          </div>

          <div>
            <span>Transportation</span>

            <strong>{courier.transportationType || "Not specified"}</strong>
          </div>
        </div>
      )}
    </section>
  );
}

export default CourierActivityAnalytics;
