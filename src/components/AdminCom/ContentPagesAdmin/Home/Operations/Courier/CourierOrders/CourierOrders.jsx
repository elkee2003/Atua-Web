import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaRedo,
  FaSyncAlt,
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

import { Courier, Order } from "../../../../../../../models";

import { getSignedUrl } from "../../../../../../../utils/s3";

import CourierOrdersHeader from "./Components/CourierOrdersHeader/CourierOrdersHeader";

import CourierOrderStats from "./Components/CourierOrderStats/CourierOrderStats";

import CourierOrderSearch from "./Components/CourierOrderSearch/CourierOrderSearch";

import CourierOrderFilters from "./Components/CourierOrderFilters/CourierOrderFilters";

import CourierOrderCard from "./Components/CourierOrderCard/CourierOrderCard";

import CourierOrderEmptyState from "./Components/CourierOrderEmptyState/CourierOrderEmptyState";

import "./CourierOrders.css";

function CourierOrders() {
  /*
  ==========================================================
  ROUTER
  ==========================================================
  */

  const navigate = useNavigate();

  const { id: courierId } = useParams();

  /*
  ==========================================================
  COURIER
  ==========================================================
  */

  const [courier, setCourier] = useState(null);

  const [profileUrl, setProfileUrl] = useState(null);

  /*
  ==========================================================
  ORDERS
  ==========================================================
  */

  const [orders, setOrders] = useState([]);

  /*
  ==========================================================
  LOADING / ERROR
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  /*
  ==========================================================
  SEARCH
  ==========================================================
  */

  const [searchQuery, setSearchQuery] = useState("");

  /*
  ==========================================================
  STATUS FILTER
  ==========================================================
  */

  const [statusFilter, setStatusFilter] = useState("ALL");

  /*
  ==========================================================
  IMAGE URL RESOLVER
  ==========================================================
  */

  const resolveImageUrl = useCallback(async (imagePath) => {
    if (!imagePath) {
      return null;
    }

    try {
      const pathValue =
        typeof imagePath === "string" ? imagePath.trim() : imagePath;

      if (!pathValue) {
        return null;
      }

      /*
          ----------------------------------------------------
          ALREADY A URL
          ----------------------------------------------------
          */

      if (
        typeof pathValue === "string" &&
        (pathValue.startsWith("http://") ||
          pathValue.startsWith("https://") ||
          pathValue.startsWith("blob:"))
      ) {
        return pathValue;
      }

      /*
          ----------------------------------------------------
          AMPLIFY STORAGE
          ----------------------------------------------------
          */

      try {
        const result = await getUrl({
          path: pathValue,

          options: {
            validateObjectExistence: true,
          },
        });

        if (result?.url) {
          return result.url.toString();
        }
      } catch (storageError) {
        console.warn(
          "Amplify Storage getUrl failed. Trying S3 helper:",
          storageError,
        );
      }

      /*
          ----------------------------------------------------
          CUSTOM S3 FALLBACK
          ----------------------------------------------------
          */

      try {
        const signedUrl = await getSignedUrl(pathValue);

        if (signedUrl) {
          return signedUrl.toString();
        }
      } catch (signedUrlError) {
        console.error("Custom S3 image URL resolution failed:", signedUrlError);
      }

      return null;
    } catch (imageError) {
      console.error("Failed to resolve courier profile image:", imageError);

      return null;
    }
  }, []);

  /*
  ==========================================================
  FETCH COURIER
  ==========================================================
  */

  const fetchCourier = useCallback(async () => {
    if (!courierId) {
      setCourier(null);

      return null;
    }

    try {
      const courierData = await DataStore.query(Courier, courierId);

      if (!courierData) {
        throw new Error("Courier not found.");
      }

      setCourier(courierData);

      return courierData;
    } catch (err) {
      console.error("Failed to fetch courier:", err);

      setCourier(null);

      throw err;
    }
  }, [courierId]);

  /*
  ==========================================================
  FETCH PROFILE IMAGE
  ==========================================================
  */

  const fetchProfileImage = useCallback(
    async (courierData) => {
      if (!courierData?.profilePic) {
        setProfileUrl(null);

        return;
      }

      try {
        const resolvedUrl = await resolveImageUrl(courierData.profilePic);

        setProfileUrl(resolvedUrl);
      } catch (imageError) {
        console.error("Failed to load courier profile image:", imageError);

        setProfileUrl(null);
      }
    },
    [resolveImageUrl],
  );

  /*
  ==========================================================
  FETCH ORDERS
  ==========================================================
  */

  const fetchOrders = useCallback(async () => {
    if (!courierId) {
      setOrders([]);

      return [];
    }

    try {
      const data = await DataStore.query(Order, (order) =>
        order.assignedCourierId.eq(courierId),
      );

      const sortedOrders = [...data].sort(
        (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
      );

      setOrders(sortedOrders);

      return sortedOrders;
    } catch (err) {
      console.error("Failed to fetch courier orders:", err);

      throw err;
    }
  }, [courierId]);

  /*
  ==========================================================
  FETCH EVERYTHING
  ==========================================================
  */

  const fetchCourierOrders = useCallback(
    async ({ showLoading = true, showRefreshing = false } = {}) => {
      if (!courierId) {
        setCourier(null);

        setOrders([]);

        setLoading(false);

        setError("No courier was selected.");

        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        if (showRefreshing) {
          setRefreshing(true);
        }

        setError(null);

        /*
          ----------------------------------------------------
          FETCH COURIER
          ----------------------------------------------------
          */

        const courierData = await fetchCourier();

        /*
          ----------------------------------------------------
          FETCH PROFILE IMAGE
          ----------------------------------------------------
          */

        await fetchProfileImage(courierData);

        /*
          ----------------------------------------------------
          FETCH ORDERS
          ----------------------------------------------------
          */

        await fetchOrders();
      } catch (err) {
        console.error("Failed to load courier orders:", err);

        setError(
          err?.message === "Courier not found."
            ? "The selected courier could not be found."
            : "Unable to load this courier's orders.",
        );
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [courierId, fetchCourier, fetchProfileImage, fetchOrders],
  );

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    fetchCourierOrders({
      showLoading: true,
      showRefreshing: false,
    });
  }, [fetchCourierOrders]);

  /*
  ==========================================================
  REAL-TIME COURIER OBSERVATION
  ==========================================================
  */

  useEffect(() => {
    if (!courierId) {
      return undefined;
    }

    const courierSubscription = DataStore.observe(Courier, courierId).subscribe(
      ({ element }) => {
        if (!element) {
          return;
        }

        /*
            --------------------------------------------------
            UPDATE COURIER
            --------------------------------------------------
            */

        setCourier(element);

        /*
            --------------------------------------------------
            UPDATE PROFILE IMAGE
            --------------------------------------------------
            */

        fetchProfileImage(element);
      },
    );

    return () => {
      courierSubscription.unsubscribe();
    };
  }, [courierId, fetchProfileImage]);

  /*
  ==========================================================
  REAL-TIME ORDER OBSERVATION
  ==========================================================
  */

  useEffect(() => {
    if (!courierId) {
      return undefined;
    }

    const subscription = DataStore.observe(Order).subscribe(
      ({ opType, element }) => {
        /*
            --------------------------------------------------
            INSERT / UPDATE
            --------------------------------------------------
            */

        if (element?.assignedCourierId === courierId) {
          fetchOrders();

          return;
        }

        /*
            --------------------------------------------------
            DELETE
            --------------------------------------------------
            */

        if (opType === "DELETE") {
          fetchOrders();
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [courierId, fetchOrders]);

  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = async () => {
    if (refreshing || loading) {
      return;
    }

    await fetchCourierOrders({
      showLoading: false,
      showRefreshing: true,
    });
  };

  /*
  ==========================================================
  NORMALIZE STATUS
  ==========================================================
  */

  const normalizeStatus = useCallback((status) => {
    if (!status) {
      return "";
    }

    return String(status).trim().toUpperCase().replace(/\s+/g, "_");
  }, []);

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
  }, [orders, normalizeStatus]);

  /*
  ==========================================================
  SEARCH + STATUS FILTER
  ==========================================================
  */

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    /*
        ------------------------------------------------------
        SEARCH
        ------------------------------------------------------
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
        ------------------------------------------------------
        STATUS
        ------------------------------------------------------
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
  }, [orders, searchQuery, statusFilter, normalizeStatus]);

  /*
  ==========================================================
  EMPTY STATE TYPE
  ==========================================================
  */

  const emptyStateType = useMemo(() => {
    /*
        ------------------------------------------------------
        NO ORDERS
        ------------------------------------------------------
        */

    if (orders.length === 0) {
      return "NO_ORDERS";
    }

    /*
        ------------------------------------------------------
        SEARCH
        ------------------------------------------------------
        */

    if (searchQuery.trim()) {
      return "NO_SEARCH_RESULTS";
    }

    /*
        ------------------------------------------------------
        FILTER
        ------------------------------------------------------
        */

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
    }
  };

  /*
  ==========================================================
  CLEAR ALL SEARCH / FILTERS
  ==========================================================
  */

  const handleClearAll = () => {
    setSearchQuery("");

    setStatusFilter("ALL");
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
  LIVE TRACKING
  ==========================================================
  */

  const handleTrack = () => {
    if (!courierId) {
      return;
    }

    navigate(`/courier_tracking/${courierId}`);
  };

  /*
  ==========================================================
  NO COURIER ID
  ==========================================================
  */

  if (!courierId) {
    return (
      <div className="courierOrders">
        <div className="courierOrders-error">
          <div className="courierOrders-errorIcon">
            <FaExclamationTriangle />
          </div>

          <strong>Courier ID Missing</strong>

          <span>No courier was specified for this page.</span>

          <button type="button" onClick={handleBack}>
            <FaArrowLeft />

            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  ERROR STATE
  ==========================================================
  */

  if (error && !loading && !courier) {
    return (
      <div className="courierOrders">
        <div className="courierOrders-error">
          <div className="courierOrders-errorIcon">
            <FaExclamationTriangle />
          </div>

          <strong>Unable to Load Courier</strong>

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              fetchCourierOrders({
                showLoading: true,
                showRefreshing: false,
              })
            }
          >
            <FaRedo />

            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

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

      <CourierOrdersHeader
        courier={courier}
        profileUrl={profileUrl}
        courierId={courierId}
        onBack={handleBack}
        onTrack={handleTrack}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && courier && (
        <div
          className="
              courierOrders-error
              courierOrders-error-inline
            "
        >
          <FaExclamationTriangle />

          <span>{error}</span>

          <button type="button" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      )}

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

          {!loading &&
            orders.length > 0 &&
            (searchQuery || statusFilter !== "ALL") && (
              <button
                type="button"
                className="courierOrders-clearButton"
                onClick={handleClearAll}
              >
                Clear
              </button>
            )}
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
