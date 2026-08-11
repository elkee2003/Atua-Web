import React, { useCallback, useEffect, useMemo, useState } from "react";

import { FaArrowLeft, FaSyncAlt } from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { Order } from "../../../../../../../models";

import CourierOrdersHeader from "./Components/CourierOrdersHeader/CourierOrdersHeader";
import CourierOrderStats from "./Components/CourierOrderStats/CourierOrderStats";
import CourierOrderSearch from "./Components/CourierOrderSearch/CourierOrderSearch";
import CourierOrderFilters from "./Components/CourierOrderFilters/CourierOrderFilters";
import CourierOrderCard from "./Components/CourierOrderCard/CourierOrderCard";
import CourierOrderEmptyState from "./Components/CourierOrderEmptyState/CourierOrderEmptyState";

import "./CourierOrders.css";

function CourierOrders() {
  const navigate = useNavigate();

  const { id } = useParams();

  /*
    ==========================================================
    STATE
    ==========================================================
    */

  const [courier, setCourier] = useState(null);

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  /*
    ==========================================================
    FETCH ORDERS
    ==========================================================
    */

  const fetchOrders = useCallback(async () => {
    if (!id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const data = await DataStore.query(Order, (order) =>
        order.assignedCourierId.eq(id),
      );

      const sortedOrders = [...data].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

      setOrders(sortedOrders);
    } catch (err) {
      console.error("Failed to fetch courier orders:", err);

      setError("Unable to load this courier's orders.");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, [id]);

  /*
    ==========================================================
    INITIAL LOAD
    ==========================================================
    */

  useEffect(() => {
    setLoading(true);

    fetchOrders();
  }, [fetchOrders]);

  /*
    ==========================================================
    REALTIME ORDER OBSERVATION
    ==========================================================
    */

  useEffect(() => {
    if (!id) {
      return;
    }

    const subscription = DataStore.observe(Order).subscribe(
      ({ opType, element }) => {
        /*
                    Only refresh when the affected order
                    belongs to this courier.
                    */

        if (element?.assignedCourierId === id || opType === "DELETE") {
          fetchOrders();
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [id, fetchOrders]);

  /*
    ==========================================================
    REFRESH
    ==========================================================
    */

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    await fetchOrders();
  };

  /*
    ==========================================================
    NORMALIZE STATUS
    ==========================================================
    */

  const normalizeStatus = (status) => {
    if (!status) {
      return "";
    }

    return String(status).trim().toUpperCase().replace(/\s+/g, "_");
  };

  /*
    ==========================================================
    ORDER STATISTICS
    ==========================================================
    */

  const orderStats = useMemo(() => {
    const total = orders.length;

    const pending = orders.filter((order) => {
      const status = normalizeStatus(order.status);

      return (
        status === "PENDING" ||
        status === "AWAITING_ACCEPTANCE" ||
        status === "WAITING"
      );
    }).length;

    const inTransit = orders.filter((order) => {
      const status = normalizeStatus(order.status);

      return (
        status === "IN_TRANSIT" ||
        status === "PICKED_UP" ||
        status === "OUT_FOR_DELIVERY" ||
        status === "ON_THE_WAY"
      );
    }).length;

    const delivered = orders.filter(
      (order) => normalizeStatus(order.status) === "DELIVERED",
    ).length;

    const cancelled = orders.filter((order) => {
      const status = normalizeStatus(order.status);

      return status === "CANCELLED" || status === "CANCELED";
    }).length;

    return {
      total,
      pending,
      inTransit,
      delivered,
      cancelled,
    };
  }, [orders]);

  /*
    ==========================================================
    SEARCH + STATUS FILTER
    ==========================================================
    */

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    /*
        ======================================================
        SEARCH
        ======================================================
        */

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter((order) => {
        const searchableValues = [
          order.id,

          order.originAddress,

          order.destinationAddress,

          order.status,

          order.transportationType,

          order.vehicleClass,

          order.phoneNumber,

          order.customerPhone,

          order.customerName,
        ];

        return searchableValues
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
    }

    /*
        ======================================================
        STATUS
        ======================================================
        */

    if (statusFilter !== "ALL") {
      result = result.filter((order) => {
        const status = normalizeStatus(order.status);

        switch (statusFilter) {
          case "PENDING":
            return (
              status === "PENDING" ||
              status === "AWAITING_ACCEPTANCE" ||
              status === "WAITING"
            );

          case "IN_TRANSIT":
            return (
              status === "IN_TRANSIT" ||
              status === "PICKED_UP" ||
              status === "OUT_FOR_DELIVERY" ||
              status === "ON_THE_WAY"
            );

          case "DELIVERED":
            return status === "DELIVERED";

          case "CANCELLED":
            return status === "CANCELLED" || status === "CANCELED";

          default:
            return true;
        }
      });
    }

    return result;
  }, [orders, searchQuery, statusFilter]);

  /*
    ==========================================================
    DETERMINE EMPTY STATE
    ==========================================================
    */

  const emptyStateType = useMemo(() => {
    /*
        No orders exist for this courier.
        */

    if (orders.length === 0) {
      return "NO_ORDERS";
    }

    /*
        Orders exist but search/filter produced nothing.
        */

    if (searchQuery.trim()) {
      return "NO_SEARCH_RESULTS";
    }

    if (statusFilter !== "ALL") {
      return "NO_FILTER_RESULTS";
    }

    return "NO_ORDERS";
  }, [orders.length, searchQuery, statusFilter]);

  /*
    ==========================================================
    EMPTY STATE ACTION
    ==========================================================
    */

  const handleEmptyStateAction = () => {
    if (emptyStateType === "NO_SEARCH_RESULTS") {
      setSearchQuery("");

      return;
    }

    if (emptyStateType === "NO_FILTER_RESULTS") {
      setStatusFilter("ALL");

      return;
    }
  };

  /*
    ==========================================================
    VIEW ORDER
    ==========================================================
    */

  const handleViewOrder = (order) => {
    if (!order?.id) {
      return;
    }

    navigate(`/admin/order_details/${order.id}`);
  };

  /*
    ==========================================================
    BACK
    ==========================================================
    */

  const handleBack = () => {
    navigate(-1);
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <div className="courierOrders">
      {/* ==================================================
                PAGE HEADER
            ================================================== */}

      <div className="courierOrders-pageHeader">
        <button
          type="button"
          className="courierOrders-backButton"
          onClick={handleBack}
        >
          <FaArrowLeft />

          <span>Back</span>
        </button>

        <button
          type="button"
          className="courierOrders-refreshButton"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <FaSyncAlt
            className={
              refreshing
                ? "courierOrders-refreshIcon spinning"
                : "courierOrders-refreshIcon"
            }
          />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ==================================================
                COURIER HEADER
            ================================================== */}

      <CourierOrdersHeader courier={courier} courierId={id} />

      {/* ==================================================
                STATISTICS
            ================================================== */}

      <CourierOrderStats
        stats={orderStats}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* ==================================================
                SEARCH
            ================================================== */}

      <CourierOrderSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* ==================================================
                FILTERS
            ================================================== */}

      <CourierOrderFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* ==================================================
                ERROR
            ================================================== */}

      {error && (
        <div className="courierOrders-error">
          <strong>Something went wrong</strong>

          <span>{error}</span>

          <button type="button" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      )}

      {/* ==================================================
                ORDER CONTENT
            ================================================== */}

      <section className="courierOrders-content">
        <div className="courierOrders-contentHeader">
          <div>
            <h2>Orders</h2>

            <p>
              {loading
                ? "Loading orders..."
                : `${filteredOrders.length} ${
                    filteredOrders.length === 1 ? "order" : "orders"
                  } shown`}
            </p>
          </div>
        </div>

        {/* ==================================================
                    LOADING
                ================================================== */}

        {loading ? (
          <div className="courierOrders-loading">
            <div className="courierOrders-loadingSpinner" />

            <p>Loading courier orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* ==================================================
                       EMPTY
                    ================================================== */

          <CourierOrderEmptyState
            type={emptyStateType}
            actionLabel={emptyStateType === "NO_ORDERS" ? undefined : "Clear"}
            onAction={
              emptyStateType === "NO_ORDERS"
                ? undefined
                : handleEmptyStateAction
            }
          />
        ) : (
          /* ==================================================
                       ORDER LIST
                    ================================================== */

          <div className="courierOrders-list">
            {filteredOrders.map((order) => (
              <CourierOrderCard
                key={order.id}
                order={order}
                onViewOrder={handleViewOrder}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CourierOrders;
