import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { FaArrowLeft, FaSyncAlt } from "react-icons/fa";

import { Courier, Order, Wallet, Payout } from "../../../../../../../models";

import CourierAnalyticsHeader from "./Components/CourierAnalyticsHeader/CourierAnalyticsHeader";

import CourierAnalyticsStats from "./Components/CourierAnalyticsStats/CourierAnalyticsStats";

import CourierPerformance from "./Components/CourierPerformance/CourierPerformance";

import CourierOrderAnalytics from "./Components/CourierOrderAnalytics/CourierOrderAnalytics";

import CourierEarningsAnalytics from "./Components/CourierEarningsAnalytics/CourierEarningsAnalytics";

import CourierActivityAnalytics from "./Components/CourierActivityAnalytics/CourierActivityAnalytics";

import CourierAnalyticsFilters from "./Components/CourierAnalyticsFilters/CourierAnalyticsFilters";

import CourierAnalyticsEmptyState from "./Components/CourierAnalyticsEmptyState/CourierAnalyticsEmptyState";

import "./CourierAnalytics.css";

/*
==========================================================
ACTIVE ORDER STATUSES
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
PERIOD HELPER
==========================================================
*/

const getPeriodStart = (period) => {
  if (period === "ALL") {
    return null;
  }

  const daysMap = {
    "7D": 7,
    "30D": 30,
    "90D": 90,
  };

  const days = daysMap[period] || 30;

  const date = new Date();

  date.setHours(0, 0, 0, 0);

  date.setDate(date.getDate() - (days - 1));

  return date;
};

/*
==========================================================
DATE HELPER
==========================================================
*/

const isWithinPeriod = (value, period) => {
  if (period === "ALL") {
    return true;
  }

  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const start = getPeriodStart(period);

  if (!start) {
    return true;
  }

  return date >= start;
};

/*
==========================================================
COMPONENT
==========================================================
*/

function CourierAnalytics() {
  const { id } = useParams();

  const navigate = useNavigate();

  /*
    ========================================================
    STATE
    ========================================================
    */

  const [courier, setCourier] = useState(null);

  const [orders, setOrders] = useState([]);

  const [wallet, setWallet] = useState(null);

  const [payouts, setPayouts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  /*
    ========================================================
    FILTER STATE
    ========================================================
    */

  const [analyticsPeriod, setAnalyticsPeriod] = useState("30D");

  const [transportationType, setTransportationType] = useState("ALL");

  const [orderStatus, setOrderStatus] = useState("ALL");

  /*
    ========================================================
    FETCH COURIER
    ========================================================
    */

  const fetchCourier = useCallback(async () => {
    if (!id) {
      throw new Error("Courier ID is missing.");
    }

    const result = await DataStore.query(Courier, id);

    if (!result) {
      throw new Error("Courier not found.");
    }

    return result;
  }, [id]);

  /*
    ========================================================
    FETCH ORDERS
    ========================================================
    */

  const fetchOrders = useCallback(async () => {
    if (!id) {
      return [];
    }

    /*
                ------------------------------------------------
                IMPORTANT

                Order.assignedCourierId has:

                @index(
                    name: "byAssignedCourier"
                )

                so we query directly against the courier.
                ------------------------------------------------
                */

    const result = await DataStore.query(Order, (order) =>
      order.assignedCourierId.eq(id),
    );

    return result || [];
  }, [id]);

  /*
    ========================================================
    FETCH WALLET
    ========================================================
    */

  const fetchWallet = useCallback(async (courierData) => {
    if (!courierData) {
      return null;
    }

    /*
                ------------------------------------------------
                Courier has walletID and a hasOne Wallet
                relationship.

                Prefer walletID when available.
                ------------------------------------------------
                */

    if (courierData.walletID) {
      const walletData = await DataStore.query(Wallet, courierData.walletID);

      return walletData || null;
    }

    /*
                ------------------------------------------------
                Fallback to ownerID.

                Wallet.ownerID belongs to the courier.
                ------------------------------------------------
                */

    const walletResults = await DataStore.query(Wallet, (wallet) =>
      wallet.ownerID.eq(courierData.id),
    );

    return walletResults?.[0] || null;
  }, []);

  /*
    ========================================================
    FETCH PAYOUTS
    ========================================================
    */

  const fetchPayouts = useCallback(async () => {
    if (!id) {
      return [];
    }

    /*
                ------------------------------------------------
                Payout has:

                courierID @index(name: "byCourier")
                ------------------------------------------------
                */

    const result = await DataStore.query(Payout, (payout) =>
      payout.courierID.eq(id),
    );

    return result || [];
  }, [id]);

  /*
    ========================================================
    FETCH ALL ANALYTICS DATA
    ========================================================
    */

  const fetchAnalytics = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        /*
                    --------------------------------------------
                    FETCH COURIER FIRST
                    --------------------------------------------
                    */

        const courierData = await fetchCourier();

        setCourier(courierData);

        /*
                    --------------------------------------------
                    FETCH ORDERS
                    --------------------------------------------
                    */

        const [orderData, walletData, payoutData] = await Promise.all([
          fetchOrders(),

          fetchWallet(courierData),

          fetchPayouts(),
        ]);

        setOrders(orderData);

        setWallet(walletData);

        setPayouts(payoutData);
      } catch (err) {
        console.error("Courier analytics error:", err);

        setError(err?.message || "Unable to load courier analytics.");
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [fetchCourier, fetchOrders, fetchWallet, fetchPayouts],
  );

  /*
    ========================================================
    INITIAL LOAD
    ========================================================
    */

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /*
    ========================================================
    REAL-TIME SUBSCRIPTIONS
    ========================================================
    */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    /*
        ----------------------------------------------------
        COURIER
        ----------------------------------------------------
        */

    const courierSubscription = DataStore.observe(Courier, id).subscribe(
      ({ opType }) => {
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          fetchAnalytics(true);
        }
      },
    );

    /*
        ----------------------------------------------------
        ORDERS
        ----------------------------------------------------
        */

    const orderSubscription = DataStore.observe(Order).subscribe(
      ({ opType, element }) => {
        if (!["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          return;
        }

        /*
                    Only refresh if the changed order
                    belongs to this courier.

                    For DELETE, element may still contain
                    assignedCourierId depending on DataStore
                    behaviour.
                    */

        if (element?.assignedCourierId === id || opType === "DELETE") {
          fetchAnalytics(true);
        }
      },
    );

    /*
        ----------------------------------------------------
        PAYOUTS
        ----------------------------------------------------
        */

    const payoutSubscription = DataStore.observe(Payout).subscribe(
      ({ opType, element }) => {
        if (!["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          return;
        }

        if (element?.courierID === id || opType === "DELETE") {
          fetchAnalytics(true);
        }
      },
    );

    /*
        ----------------------------------------------------
        WALLET
        ----------------------------------------------------
        */

    const walletSubscription = DataStore.observe(Wallet).subscribe(
      ({ opType, element }) => {
        if (!["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          return;
        }

        if (element?.ownerID === id || element?.id === courier?.walletID) {
          fetchAnalytics(true);
        }
      },
    );

    /*
        ----------------------------------------------------
        CLEANUP
        ----------------------------------------------------
        */

    return () => {
      courierSubscription.unsubscribe();

      orderSubscription.unsubscribe();

      payoutSubscription.unsubscribe();

      walletSubscription.unsubscribe();
    };
  }, [id, courier?.walletID, fetchAnalytics]);

  /*
    ========================================================
    FILTERED ORDERS
    ========================================================
    */

  const filteredOrders = useMemo(() => {
    let data = [...orders];

    /*
            --------------------------------------------
            PERIOD
            --------------------------------------------
            */

    data = data.filter((order) =>
      isWithinPeriod(order?.createdAt, analyticsPeriod),
    );

    /*
            --------------------------------------------
            TRANSPORTATION
            --------------------------------------------
            */

    if (transportationType !== "ALL") {
      data = data.filter(
        (order) => order?.transportationType === transportationType,
      );
    }

    /*
            --------------------------------------------
            STATUS
            --------------------------------------------
            */

    if (orderStatus !== "ALL") {
      data = data.filter((order) => order?.status === orderStatus);
    }

    /*
            --------------------------------------------
            SORT

            Newest first.
            --------------------------------------------
            */

    data.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );

    return data;
  }, [orders, analyticsPeriod, transportationType, orderStatus]);

  /*
    ========================================================
    PERIOD ORDERS WITHOUT STATUS FILTER
    ========================================================

    This is useful for KPI calculations where the status
    filter should not distort the overall courier numbers.
    ========================================================
    */

  const periodOrders = useMemo(() => {
    let data = orders.filter((order) =>
      isWithinPeriod(order?.createdAt, analyticsPeriod),
    );

    if (transportationType !== "ALL") {
      data = data.filter(
        (order) => order?.transportationType === transportationType,
      );
    }

    return data;
  }, [orders, analyticsPeriod, transportationType]);

  /*
    ========================================================
    ANALYTICS STATS
    ========================================================
    */

  const analyticsStats = useMemo(() => {
    const total = periodOrders.length;

    const completed = periodOrders.filter(
      (order) => order?.status === "DELIVERED",
    ).length;

    const active = periodOrders.filter((order) =>
      ACTIVE_STATUSES.includes(order?.status),
    ).length;

    const cancelled = periodOrders.filter(
      (order) => order?.status === "CANCELLED",
    ).length;

    const disputed = periodOrders.filter(
      (order) => order?.status === "DISPUTED",
    ).length;

    const totalEarnings = periodOrders.reduce(
      (sum, order) => sum + (Number(order?.courierEarnings) || 0),
      0,
    );

    const completedEarnings = periodOrders
      .filter((order) => order?.status === "DELIVERED")
      .reduce((sum, order) => sum + (Number(order?.courierEarnings) || 0), 0);

    const averageEarnings = completed > 0 ? completedEarnings / completed : 0;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

    return {
      total,

      completed,

      active,

      cancelled,

      disputed,

      totalEarnings,

      completedEarnings,

      averageEarnings,

      completionRate,

      cancellationRate,

      averageRating: Number(courier?.averageRating) || 0,

      reviewCount: Number(courier?.reviewCount) || 0,
    };
  }, [periodOrders, courier]);

  /*
    ========================================================
    RESET FILTERS
    ========================================================
    */

  const handleResetFilters = useCallback(() => {
    setAnalyticsPeriod("30D");

    setTransportationType("ALL");

    setOrderStatus("ALL");
  }, []);

  /*
    ========================================================
    PERIOD CHANGE
    ========================================================
    */

  const handlePeriodChange = useCallback((value) => {
    setAnalyticsPeriod(value);
  }, []);

  /*
    ========================================================
    HEADER REFRESH
    ========================================================
    */

  const handleRefresh = useCallback(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  /*
    ========================================================
    LOADING
    ========================================================
    */

  if (loading) {
    return (
      <div className="courierAnalytics-page">
        <div className="courierAnalytics-loading">
          <div className="courierAnalytics-loadingSpinner" />

          <h3>Loading courier analytics...</h3>

          <p>Preparing orders, earnings and activity data.</p>
        </div>
      </div>
    );
  }

  /*
    ========================================================
    ERROR
    ========================================================
    */

  if (error) {
    return (
      <div className="courierAnalytics-page">
        <div className="courierAnalytics-error">
          <div className="courierAnalytics-errorIcon">!</div>

          <h2>Unable to load analytics</h2>

          <p>{error}</p>

          <div className="courierAnalytics-errorActions">
            <button type="button" onClick={() => fetchAnalytics(true)}>
              <FaSyncAlt />
              Try Again
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
    ========================================================
    NO COURIER
    ========================================================
    */

  if (!courier) {
    return (
      <div className="courierAnalytics-page">
        <CourierAnalyticsEmptyState
          title="Courier not found"
          description="The courier record could not be found. It may have been removed or the link may be invalid."
          actionLabel="Go Back"
          icon="refresh"
          onAction={() => navigate(-1)}
        />
      </div>
    );
  }

  /*
    ========================================================
    NO ORDERS
    ========================================================
    */

  const hasNoOrders = orders.length === 0;

  /*
    ========================================================
    RENDER
    ========================================================
    */

  return (
    <div className="courierAnalytics-page">
      {/* ==================================================
                TOP NAVIGATION
            ================================================== */}

      <div className="courierAnalytics-topNavigation">
        <button
          type="button"
          className="courierAnalytics-backButton"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </button>

        <button
          type="button"
          className="courierAnalytics-refreshButton"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaSyncAlt className={refreshing ? "spinning" : ""} />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ==================================================
                HEADER
            ================================================== */}

      <CourierAnalyticsHeader
        courier={courier}
        period={analyticsPeriod}
        onPeriodChange={handlePeriodChange}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* ==================================================
                FILTERS
            ================================================== */}

      <CourierAnalyticsFilters
        period={analyticsPeriod}
        transportationType={transportationType}
        orderStatus={orderStatus}
        setPeriod={setAnalyticsPeriod}
        setTransportationType={setTransportationType}
        setOrderStatus={setOrderStatus}
        onReset={handleResetFilters}
      />

      {/* ==================================================
                EMPTY DATA
            ================================================== */}

      {hasNoOrders ? (
        <CourierAnalyticsEmptyState
          title="No courier analytics yet"
          description={`${
            courier.firstName || "This courier"
          } has no assigned orders yet. Analytics will appear once courier activity begins.`}
          actionLabel="Refresh Data"
          icon="chart"
          onAction={handleRefresh}
        />
      ) : (
        <>
          {/* ==================================================
                        STATS
                    ================================================== */}

          <CourierAnalyticsStats
            stats={analyticsStats}
            courier={courier}
            wallet={wallet}
            payouts={payouts}
          />

          {/* ==================================================
                        PERFORMANCE
                    ================================================== */}

          <CourierPerformance
            courier={courier}
            orders={periodOrders}
            period={analyticsPeriod}
          />

          {/* ==================================================
                        ORDER ANALYTICS
                    ================================================== */}

          {filteredOrders.length > 0 ? (
            <CourierOrderAnalytics
              orders={filteredOrders}
              courier={courier}
              period={analyticsPeriod}
            />
          ) : (
            <CourierAnalyticsEmptyState
              title="No matching orders"
              description="No orders match the selected analytics filters. Try changing the transportation type or order status."
              actionLabel="Reset Filters"
              icon="filter"
              onAction={handleResetFilters}
              compact
            />
          )}

          {/* ==================================================
                        EARNINGS
                    ================================================== */}

          <CourierEarningsAnalytics
            orders={periodOrders}
            wallet={wallet}
            payouts={payouts}
            period={analyticsPeriod}
            onPeriodChange={handlePeriodChange}
          />

          {/* ==================================================
                        ACTIVITY
                    ================================================== */}

          <CourierActivityAnalytics
            orders={periodOrders}
            courier={courier}
            period={analyticsPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </>
      )}
    </div>
  );
}

export default CourierAnalytics;
