import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import {
  Courier,
  CourierLiveLocation,
  Order,
} from "../../../../../../../models";

import TrackingMap from "./Components/TrackingMap/TrackingMap";
import "./OrderLiveTracking.css";

const TERMINAL_STATUSES = ["DELIVERED", "CANCELLED", "DISPUTED"];

const STATUS_LABELS = {
  BIDDING: "Bidding",
  AWAITING_PAYMENT: "Awaiting payment",
  READY_FOR_PICKUP: "Ready for pickup",
  ACCEPTED: "Accepted",
  ARRIVED_PICKUP: "Arrived at pickup",
  LOADING: "Loading",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  ARRIVED_DROPOFF: "Arrived at drop-off",
  UNLOADING: "Unloading",
  DELIVERED: "Delivered",
  HANDOVER_TO_LOGISTICS: "Handed over to logistics",
  IN_LOGISTICS_TRANSIT: "In logistics transit",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

const formatStatus = (status) =>
  STATUS_LABELS[status] ||
  String(status || "Unknown")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
};

const getCourierName = (courier) => {
  if (!courier) return "Courier not found";

  const name = [courier.firstName, courier.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Name unavailable";
};

const getStatusClass = (status) => {
  if (status === "DELIVERED") return "success";

  if (["CANCELLED", "DISPUTED"].includes(status)) return "danger";

  if (["BIDDING", "AWAITING_PAYMENT"].includes(status)) return "warning";

  if (
    [
      "ACCEPTED",
      "ARRIVED_PICKUP",
      "LOADING",
      "PICKED_UP",
      "IN_TRANSIT",
      "ARRIVED_DROPOFF",
      "UNLOADING",
      "HANDOVER_TO_LOGISTICS",
      "IN_LOGISTICS_TRANSIT",
    ].includes(status)
  ) {
    return "info";
  }

  return "neutral";
};

const isValidCoordinate = (latitude, longitude) => {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return false;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

function OrderLiveTracking() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState({});
  const [locations, setLocations] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadTrackingData = useCallback(async ({ manual = false } = {}) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const allOrders = await DataStore.query(Order);

      const activeOrders = (allOrders || []).filter(
        (order) => order.status && !TERMINAL_STATUSES.includes(order.status),
      );

      activeOrders.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();

        return bTime - aTime;
      });

      setOrders(activeOrders);

      setSelectedOrderId((currentId) => {
        if (currentId && activeOrders.some((order) => order.id === currentId)) {
          return currentId;
        }

        return activeOrders[0]?.id || "";
      });

      const courierIds = [
        ...new Set(
          activeOrders.map((order) => order.assignedCourierId).filter(Boolean),
        ),
      ];

      const courierEntries = await Promise.all(
        courierIds.map(async (courierId) => {
          try {
            const courier = await DataStore.query(Courier, courierId);
            return [courierId, courier];
          } catch (courierError) {
            console.error("Failed to load courier:", courierId, courierError);
            return [courierId, null];
          }
        }),
      );

      const nextCouriers = Object.fromEntries(courierEntries);
      setCouriers(nextCouriers);

      const locationEntries = await Promise.all(
        courierIds.map(async (courierId) => {
          try {
            const records = await DataStore.query(
              CourierLiveLocation,
              (record) => record.courierID.eq(courierId),
            );

            if (!records?.length) return [courierId, null];

            const latest = records.reduce((currentLatest, record) => {
              if (!currentLatest) return record;

              const currentTime = new Date(
                currentLatest.lastSeenAt || 0,
              ).getTime();

              const recordTime = new Date(record.lastSeenAt || 0).getTime();

              return recordTime > currentTime ? record : currentLatest;
            }, null);

            return [courierId, latest];
          } catch (locationError) {
            console.error(
              "Failed to load courier location:",
              courierId,
              locationError,
            );
            return [courierId, null];
          }
        }),
      );

      setLocations(Object.fromEntries(locationEntries));
      setLastUpdated(new Date());
    } catch (loadError) {
      console.error("Failed to load order tracking data:", loadError);
      setError("Unable to load order tracking data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrackingData();

    const orderSubscription = DataStore.observe(Order).subscribe({
      next: () => loadTrackingData(),
      error: (subscriptionError) => {
        console.error("Order tracking subscription error:", subscriptionError);
      },
    });

    const locationSubscription = DataStore.observe(
      CourierLiveLocation,
    ).subscribe({
      next: () => loadTrackingData(),
      error: (subscriptionError) => {
        console.error("Live-location subscription error:", subscriptionError);
      },
    });

    return () => {
      orderSubscription.unsubscribe();
      locationSubscription.unsubscribe();
    };
  }, [loadTrackingData]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const courier = couriers[order.assignedCourierId];
      const courierName = getCourierName(courier);

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchesSearch =
        !query ||
        String(order.id || "")
          .toLowerCase()
          .includes(query) ||
        String(order.originAddress || "")
          .toLowerCase()
          .includes(query) ||
        String(order.destinationAddress || "")
          .toLowerCase()
          .includes(query) ||
        courierName.toLowerCase().includes(query) ||
        String(order.senderName || "")
          .toLowerCase()
          .includes(query) ||
        String(order.recipientName || "")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, couriers, search, statusFilter]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const selectedCourier = selectedOrder?.assignedCourierId
    ? couriers[selectedOrder.assignedCourierId] || null
    : null;

  const selectedLocation = selectedOrder?.assignedCourierId
    ? locations[selectedOrder.assignedCourierId] || null
    : null;

  const position = useMemo(() => {
    if (
      !selectedLocation ||
      !isValidCoordinate(selectedLocation.latitude, selectedLocation.longitude)
    ) {
      return null;
    }

    return {
      lat: Number(selectedLocation.latitude),
      lng: Number(selectedLocation.longitude),
      heading: selectedLocation.heading ?? null,
      speed: selectedLocation.speed ?? null,
      accuracy: selectedLocation.accuracy ?? null,
      isTracking: selectedLocation.isTracking === true,
      trackingSource: selectedLocation.trackingSource || null,
      lastSeenAt: selectedLocation.lastSeenAt || null,
    };
  }, [selectedLocation]);

  const selectedCourierOrders = useMemo(() => {
    if (!selectedOrder?.assignedCourierId) return [];

    return orders.filter(
      (order) => order.assignedCourierId === selectedOrder.assignedCourierId,
    );
  }, [orders, selectedOrder]);

  const gpsAgeMinutes = useMemo(() => {
    if (!selectedLocation?.lastSeenAt) return null;

    const timestamp = new Date(selectedLocation.lastSeenAt).getTime();

    if (Number.isNaN(timestamp)) return null;

    return Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  }, [selectedLocation, lastUpdated]);

  const liveCount = useMemo(
    () =>
      orders.filter((order) => {
        const location = locations[order.assignedCourierId];

        return (
          Boolean(order.assignedCourierId) &&
          Boolean(location) &&
          isValidCoordinate(location.latitude, location.longitude)
        );
      }).length,
    [orders, locations],
  );

  const assignedCount = useMemo(
    () => orders.filter((order) => Boolean(order.assignedCourierId)).length,
    [orders],
  );

  if (loading) {
    return (
      <div className="orderLiveTracking">
        <div className="orderLiveTracking-state">
          <span className="orderLiveTracking-spinner" />
          <h2>Loading live order tracking</h2>
          <p>Retrieving active orders and courier locations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orderLiveTracking">
      <div className="orderLiveTracking-topbar">
        <button
          type="button"
          className="orderLiveTracking-backButton"
          onClick={() => navigate("/admin/orders")}
        >
          <i className="bi bi-arrow-left" />
          <span>Back to orders</span>
        </button>

        <button
          type="button"
          className="orderLiveTracking-refreshButton"
          onClick={() => loadTrackingData({ manual: true })}
          disabled={refreshing}
        >
          <i
            className={`bi ${refreshing ? "bi-arrow-repeat" : "bi-arrow-clockwise"}`}
          />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <header className="orderLiveTracking-header">
        <div>
          <span className="orderLiveTracking-eyebrow">OPERATIONS</span>
          <h1>Order live tracking</h1>
          <p>Monitor active deliveries and their assigned couriers.</p>
        </div>

        <div className="orderLiveTracking-updated">
          <span className="orderLiveTracking-liveDot" />
          <span>Last refreshed: {formatDate(lastUpdated)}</span>
        </div>
      </header>

      {error && (
        <div className="orderLiveTracking-error">
          <i className="bi bi-exclamation-circle" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadTrackingData({ manual: true })}
            disabled={refreshing}
          >
            Try again
          </button>
        </div>
      )}

      <section className="orderLiveTracking-metrics">
        <div className="orderLiveTracking-metric">
          <span className="orderLiveTracking-metricIcon">
            <i className="bi bi-box-seam" />
          </span>
          <div>
            <span>Active orders</span>
            <strong>{orders.length}</strong>
          </div>
        </div>

        <div className="orderLiveTracking-metric">
          <span className="orderLiveTracking-metricIcon">
            <i className="bi bi-person-check" />
          </span>
          <div>
            <span>Assigned to courier</span>
            <strong>{assignedCount}</strong>
          </div>
        </div>

        <div className="orderLiveTracking-metric">
          <span className="orderLiveTracking-metricIcon">
            <i className="bi bi-geo-alt" />
          </span>
          <div>
            <span>Orders with GPS</span>
            <strong>{liveCount}</strong>
          </div>
        </div>
      </section>

      <div className="orderLiveTracking-layout">
        <aside className="orderLiveTracking-sidebar">
          <div className="orderLiveTracking-listHeader">
            <div>
              <h2>Active deliveries</h2>
              <span>{filteredOrders.length} orders</span>
            </div>
          </div>

          <label className="orderLiveTracking-search">
            <i className="bi bi-search" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, address, courier..."
            />
          </label>

          <select
            className="orderLiveTracking-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter orders by status"
          >
            <option value="ALL">All active statuses</option>
            {Object.entries(STATUS_LABELS)
              .filter(([status]) => !TERMINAL_STATUSES.includes(status))
              .map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
          </select>

          <div className="orderLiveTracking-orderList">
            {filteredOrders.length === 0 ? (
              <div className="orderLiveTracking-emptyList">
                <i className="bi bi-inbox" />
                <strong>No matching orders</strong>
                <span>Try changing the search or status filter.</span>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const courier = couriers[order.assignedCourierId];
                const location = locations[order.assignedCourierId];
                const hasGps =
                  location &&
                  isValidCoordinate(location.latitude, location.longitude);

                return (
                  <button
                    type="button"
                    key={order.id}
                    className={`orderLiveTracking-orderCard ${
                      selectedOrderId === order.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="orderLiveTracking-orderCardTop">
                      <span className="orderLiveTracking-orderId">
                        #{String(order.id).slice(-8)}
                      </span>
                      <span
                        className={`orderLiveTracking-status ${getStatusClass(order.status)}`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </div>

                    <div className="orderLiveTracking-routeLine">
                      <span className="orderLiveTracking-routeDot pickup" />
                      <span>{order.originAddress || "Pickup unavailable"}</span>
                    </div>

                    <div className="orderLiveTracking-routeLine">
                      <span className="orderLiveTracking-routeDot destination" />
                      <span>
                        {order.destinationAddress || "Destination unavailable"}
                      </span>
                    </div>

                    <div className="orderLiveTracking-orderCardBottom">
                      <span className="orderLiveTracking-courierName">
                        <i className="bi bi-person-badge" />
                        {order.assignedCourierId
                          ? getCourierName(courier)
                          : "No courier assigned"}
                      </span>

                      <span
                        className={`orderLiveTracking-gpsBadge ${
                          hasGps ? "available" : "unavailable"
                        }`}
                      >
                        <span />
                        {hasGps ? "GPS available" : "No live GPS"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="orderLiveTracking-main">
          <section className="orderLiveTracking-mapPanel">
            <div className="orderLiveTracking-panelHeader">
              <div>
                <h2>Delivery map</h2>
                <p>
                  {selectedOrder
                    ? `Order #${String(selectedOrder.id).slice(-8)}`
                    : "Select an order to view its route"}
                </p>
              </div>
              {position && (
                <span className="orderLiveTracking-mapLive">
                  <span />
                  GPS position available
                </span>
              )}
            </div>

            <div className="orderLiveTracking-map">
              {selectedOrder ? (
                <TrackingMap
                  courier={selectedCourier}
                  position={position}
                  orders={selectedCourierOrders}
                />
              ) : (
                <div className="orderLiveTracking-mapEmpty">
                  <i className="bi bi-map" />
                  <strong>No active orders to display</strong>
                  <span>
                    Active deliveries will appear here when available.
                  </span>
                </div>
              )}
            </div>
          </section>

          {selectedOrder && (
            <section className="orderLiveTracking-detailsPanel">
              <div className="orderLiveTracking-panelHeader">
                <div>
                  <h2>Selected order</h2>
                  <p>Key delivery and courier information</p>
                </div>
                <button
                  type="button"
                  className="orderLiveTracking-detailsButton"
                  onClick={() =>
                    navigate(
                      `/admin/orders/${encodeURIComponent(selectedOrder.id)}`,
                    )
                  }
                >
                  View order details
                  <i className="bi bi-arrow-up-right" />
                </button>
              </div>

              <div className="orderLiveTracking-detailsGrid">
                <div className="orderLiveTracking-detail">
                  <span>Order reference</span>
                  <strong>{selectedOrder.id}</strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>Order status</span>
                  <strong>
                    <span
                      className={`orderLiveTracking-status ${getStatusClass(selectedOrder.status)}`}
                    >
                      {formatStatus(selectedOrder.status)}
                    </span>
                  </strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>Order value</span>
                  <strong>{formatCurrency(selectedOrder.totalPrice)}</strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>Transportation</span>
                  <strong>
                    {selectedOrder.transportationType || "Not specified"}
                    {selectedOrder.vehicleClass
                      ? ` · ${selectedOrder.vehicleClass}`
                      : ""}
                  </strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>Assigned courier</span>
                  <strong>
                    {selectedOrder.assignedCourierId
                      ? getCourierName(selectedCourier)
                      : "Not assigned"}
                  </strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>Courier phone</span>
                  <strong>
                    {selectedCourier?.phoneNumber || "Not available"}
                  </strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>Last GPS update</span>
                  <strong>{formatDate(selectedLocation?.lastSeenAt)}</strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>Tracking state</span>
                  <strong>
                    {!position
                      ? "Location unavailable"
                      : selectedLocation?.isTracking
                        ? "Tracking active"
                        : "Last known location"}
                  </strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>GPS accuracy</span>
                  <strong>
                    {selectedLocation?.accuracy !== null &&
                    selectedLocation?.accuracy !== undefined
                      ? `${selectedLocation.accuracy} m`
                      : "Not available"}
                  </strong>
                </div>

                <div className="orderLiveTracking-detail">
                  <span>Order created</span>
                  <strong>{formatDate(selectedOrder.createdAt)}</strong>
                </div>
              </div>

              {selectedOrder.assignedCourierId && (
                <div className="orderLiveTracking-locationNotice">
                  <i className="bi bi-info-circle" />
                  <span>
                    {position
                      ? gpsAgeMinutes === null
                        ? "A courier location is available, but its update time could not be determined."
                        : gpsAgeMinutes <= 2
                          ? "The courier has reported a recent GPS location."
                          : `The last GPS update was approximately ${gpsAgeMinutes} minute${gpsAgeMinutes === 1 ? "" : "s"} ago. This may be a last-known location rather than the courier's current position.`
                      : "No valid live GPS coordinates are available for this courier. The map will show the unavailable-location state."}
                  </span>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default OrderLiveTracking;
