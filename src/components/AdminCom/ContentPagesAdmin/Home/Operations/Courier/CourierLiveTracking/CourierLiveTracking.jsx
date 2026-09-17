import React, { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

// ==========================================================
// AMPLIFY MODELS
// ==========================================================

// Courier = Courier profile, online status, assigned courier data
//
// CourierLiveLocation = Latest GPS location of the courier
//
// IMPORTANT:
// We no longer use courier.lat or courier.lng for tracking.
// The map position now comes from CourierLiveLocation.
// ==========================================================

import {
  Courier,
  CourierLiveLocation,
  Order,
} from "../../../../../../../models";

// ==========================================================
// CHILD COMPONENTS
// ==========================================================

import TrackingHeader from "./Components/TrackingHeader/TrackingHeader";

import TrackingMap from "./Components/TrackingMap/TrackingMap";

import CourierTrackingInfo from "./Components/CourierTrackingInfo/CourierTrackingInfo";

import TrackingStatus from "./Components/TrackingStatus/TrackingStatus";

// ==========================================================
// STYLES
// ==========================================================

import "./CourierLiveTracking.css";

function CourierLiveTracking() {
  /*
  ==========================================================
  ROUTING
  ==========================================================
  */

  const { id } = useParams();

  const navigate = useNavigate();

  /*
  ==========================================================
  STATE
  ==========================================================
  */

  // Courier profile information.
  const [courier, setCourier] = useState(null);

  // Active orders assigned to the courier currently being tracked.
  const [orders, setOrders] = useState([]);

  // Normalized GPS position used by the map.
  //
  // {
  //   lat: Number,
  //   lng: Number
  // }
  //
  // This now comes from CourierLiveLocation.
  const [position, setPosition] = useState(null);

  // The complete latest CourierLiveLocation record.
  //
  // Useful for:
  // - lastSeenAt
  // - isTracking
  // - trackingSource
  // - accuracy
  // - speed
  // - heading
  const [liveLocation, setLiveLocation] = useState(null);

  // Loading state for initial courier and location fetch.
  const [loading, setLoading] = useState(true);

  // Refresh button loading state.
  const [refreshing, setRefreshing] = useState(false);

  // Error message.
  const [error, setError] = useState("");

  // Last successful location update timestamp.
  const [lastUpdated, setLastUpdated] = useState(null);

  /*
  ==========================================================
  PROFILE IMAGE
  ==========================================================
  */

  const [profileUrl, setProfileUrl] = useState(null);

  /*
  ==========================================================
  NORMALIZE LIVE LOCATION
  ==========================================================

  IMPORTANT:

  The old code used:

    courier.lat
    courier.lng

  The new code uses:

    CourierLiveLocation.latitude
    CourierLiveLocation.longitude

  We normalize the coordinates here so that the existing
  TrackingMap component can continue receiving:

    position={{ lat, lng }}

  ==========================================================
  */

  const getLiveLocationPosition = useCallback((locationData) => {
    if (
      locationData?.latitude === null ||
      locationData?.latitude === undefined ||
      locationData?.longitude === null ||
      locationData?.longitude === undefined
    ) {
      return null;
    }

    const lat = Number(locationData.latitude);

    const lng = Number(locationData.longitude);

    // Reject invalid GPS coordinates.
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    // Reject impossible latitude values.
    if (lat < -90 || lat > 90) {
      return null;
    }

    // Reject impossible longitude values.
    if (lng < -180 || lng > 180) {
      return null;
    }

    return {
      lat,
      lng,
      /*
  GPS metadata used by TrackingStatus and
  CourierTrackingInfo.
  */

      heading: locationData.heading ?? null,

      speed: locationData.speed ?? null,

      accuracy: locationData.accuracy ?? null,

      altitude: locationData.altitude ?? null,

      isTracking: locationData.isTracking === true,

      trackingSource: locationData.trackingSource || null,

      lastSeenAt: locationData.lastSeenAt || null,
    };
  }, []);

  /*
  ==========================================================
  GET LOCATION UPDATE TIME
  ==========================================================

  CourierLiveLocation.lastSeenAt is the timestamp of the
  latest successful GPS update.

  We use it instead of courier.updatedAt because the courier
  profile may update without the courier sending GPS.

  ==========================================================
  */

  const getLocationUpdatedAt = useCallback((locationData) => {
    return locationData?.lastSeenAt || null;
  }, []);

  /*
  ==========================================================
  LOAD COURIER PROFILE IMAGE
  ==========================================================

  Courier.profilePic contains the Amplify Storage path.

  We convert that path into a temporary accessible URL
  using getUrl().

  ==========================================================
  */

  const loadProfileImage = useCallback(async (courierData) => {
    /*
    --------------------------------------------------------
    CLEAR PREVIOUS URL
    --------------------------------------------------------
    */

    setProfileUrl(null);

    /*
    --------------------------------------------------------
    NO COURIER
    --------------------------------------------------------
    */

    if (!courierData) {
      return;
    }

    /*
    --------------------------------------------------------
    PROFILE IMAGE PATH
    --------------------------------------------------------

    Main field:

      profilePic

    The additional fields make this component tolerant
    if an older courier record uses another field.

    --------------------------------------------------------
    */

    const profilePath =
      courierData.profilePic ||
      courierData.profilePhoto ||
      courierData.profileUrl ||
      null;

    /*
    --------------------------------------------------------
    NO PROFILE PHOTO
    --------------------------------------------------------
    */

    if (!profilePath) {
      console.log("Courier has no profile picture.");

      return;
    }

    console.log("Courier tracking profile picture path:", profilePath);

    /*
    --------------------------------------------------------
    IF ALREADY A FULL URL
    --------------------------------------------------------
    */

    if (
      typeof profilePath === "string" &&
      (profilePath.startsWith("http://") ||
        profilePath.startsWith("https://") ||
        profilePath.startsWith("blob:"))
    ) {
      setProfileUrl(profilePath);

      return;
    }

    /*
    --------------------------------------------------------
    GET AMPLIFY STORAGE URL
    --------------------------------------------------------
    */

    try {
      const result = await getUrl({
        path: profilePath,

        options: {
          validateObjectExistence: true,
        },
      });

      if (result?.url) {
        const resolvedUrl = result.url.toString();

        console.log("Courier tracking profile image URL:", resolvedUrl);

        setProfileUrl(resolvedUrl);
      } else {
        console.warn("No profile image URL returned from Amplify Storage.");

        setProfileUrl(null);
      }
    } catch (imageError) {
      console.error("Error loading courier profile image:", imageError);

      setProfileUrl(null);
    }
  }, []);

  /*
  ==========================================================
  APPLY COURIER DATA
  ==========================================================

  This function updates only courier profile information.

  IMPORTANT:

  We deliberately do NOT read:

    courier.lat
    courier.lng

  GPS position is handled separately by CourierLiveLocation.

  ==========================================================
  */

  const applyCourierData = useCallback(
    async (courierData) => {
      if (!courierData) {
        setCourier(null);

        setProfileUrl(null);

        return;
      }

      /*
      ------------------------------------------------------
      SAVE COURIER
      ------------------------------------------------------
      */

      setCourier(courierData);

      /*
      ------------------------------------------------------
      LOAD PROFILE IMAGE
      ------------------------------------------------------
      */

      await loadProfileImage(courierData);
    },
    [loadProfileImage],
  );

  /*
  ==========================================================
  APPLY LIVE LOCATION DATA
  ==========================================================

  This is the main replacement for the old code that used:

    courier.lat
    courier.lng

  The location now comes from:

    CourierLiveLocation

  ==========================================================
  */

  const applyLiveLocationData = useCallback(
    (locationData) => {
      /*
      ------------------------------------------------------
      NO LOCATION
      ------------------------------------------------------
      */

      if (!locationData) {
        setLiveLocation(null);

        setPosition(null);

        setLastUpdated(null);

        return;
      }

      /*
      ------------------------------------------------------
      SAVE COMPLETE LIVE LOCATION RECORD
      ------------------------------------------------------
      */

      setLiveLocation(locationData);

      /*
      ------------------------------------------------------
      CONVERT GPS TO MAP POSITION
      ------------------------------------------------------
      */

      const newPosition = getLiveLocationPosition(locationData);

      setPosition(newPosition);

      /*
      ------------------------------------------------------
      UPDATE LAST SEEN TIME
      ------------------------------------------------------

      This comes from:

        CourierLiveLocation.lastSeenAt

      NOT:

        Courier.updatedAt

      ------------------------------------------------------
      */

      setLastUpdated(getLocationUpdatedAt(locationData));

      console.log("Courier live location applied:", locationData);

      console.log("Courier map position:", newPosition);
    },
    [getLiveLocationPosition, getLocationUpdatedAt],
  );

  // ==========================================================
  // ACTIVE ORDER STATUSES
  // ==========================================================

  // Completed, cancelled, and disputed orders are not displayed
  // on the courier's live tracking map.
  const ACTIVE_ORDER_STATUSES = [
    "BIDDING",
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
  FETCH ORDERS ASSIGNED TO THIS COURIER
  ==========================================================

  Only orders whose assignedCourierId matches the courier ID
  from the URL are retrieved.

  Only active orders are kept on the map.

  Completed, cancelled, and disputed orders are excluded.
  ==========================================================
  */

  const fetchAssignedOrders = useCallback(async () => {
    if (!id) {
      setOrders([]);
      return;
    }

    try {
      console.log("Fetching orders assigned to courier:", id);

      const assignedOrders = await DataStore.query(Order, (c) =>
        c.assignedCourierId.eq(id),
      );

      /*
    --------------------------------------------------------
    FILTER ACTIVE ORDERS
    --------------------------------------------------------
    */

      const activeOrders = assignedOrders.filter((order) =>
        ACTIVE_ORDER_STATUSES.includes(order.status),
      );

      console.log("Assigned orders found:", assignedOrders);
      console.log("Active assigned orders:", activeOrders);

      setOrders(activeOrders);
    } catch (err) {
      console.error("Failed to fetch assigned orders:", err);

      /*
    Do not remove existing map data if the order fetch fails.
    */

      setError("Unable to load courier assigned orders.");
    }
  }, [id]);

  /*
  ==========================================================
  FETCH COURIER
  ==========================================================
  */

  const fetchCourier = useCallback(
    async ({ showRefreshing = false } = {}) => {
      if (!id) {
        setError("No courier ID was provided.");

        setLoading(false);

        return;
      }

      try {
        /*
        ----------------------------------------------------
        LOADING STATE
        ----------------------------------------------------
        */

        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
        ----------------------------------------------------
        GET COURIER
        ----------------------------------------------------
        */

        const data = await DataStore.query(Courier, id);

        /*
        ----------------------------------------------------
        COURIER NOT FOUND
        ----------------------------------------------------
        */

        if (!data) {
          setCourier(null);

          setLiveLocation(null);

          setPosition(null);

          setProfileUrl(null);

          setError("Courier could not be found.");

          return;
        }

        console.log("Courier loaded for live tracking:", data);

        console.log("Courier profilePic:", data.profilePic);

        /*
        ----------------------------------------------------
        APPLY COURIER DATA
        ----------------------------------------------------
        */

        await applyCourierData(data);
      } catch (err) {
        console.error("Failed to fetch courier:", err);

        setError("Unable to load courier tracking data.");
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [id, applyCourierData],
  );

  /*
  ==========================================================
  FETCH COURIER LIVE LOCATION
  ==========================================================
  */

  const fetchCourierLiveLocation = useCallback(
    async ({ showRefreshing = false } = {}) => {
      /*
    --------------------------------------------------------
    Validate courier ID
    --------------------------------------------------------
    */

      if (!id) {
        console.warn(
          "Cannot fetch live location because courier ID is missing.",
        );

        setLiveLocation(null);
        setPosition(null);
        setLastUpdated(null);

        return;
      }

      try {
        console.log("Fetching CourierLiveLocation for courier ID:", id);

        /*
      --------------------------------------------------------
      IMPORTANT FIX

      Correct DataStore predicate syntax:

        c.courierID.eq(id)

      Not:

        c.courierID("eq", id)
      --------------------------------------------------------
      */

        const locations = await DataStore.query(CourierLiveLocation, (c) =>
          c.courierID.eq(id),
        );

        console.log("CourierLiveLocation records found:", locations);

        /*
      --------------------------------------------------------
      No live-location record found
      --------------------------------------------------------
      */

        if (!locations || locations.length === 0) {
          console.warn("No CourierLiveLocation record found for courier:", id);

          setLiveLocation(null);
          setPosition(null);
          setLastUpdated(null);

          return;
        }

        /*
      --------------------------------------------------------
      Select the most recent location record
      --------------------------------------------------------
      */

        const latestLocation = locations.reduce((latest, current) => {
          if (!latest) {
            return current;
          }

          const latestTime = new Date(latest.lastSeenAt || 0).getTime();

          const currentTime = new Date(current.lastSeenAt || 0).getTime();

          return currentTime > latestTime ? current : latest;
        }, null);

        console.log("Latest CourierLiveLocation record:", latestLocation);

        /*
      --------------------------------------------------------
      Apply the latest location
      --------------------------------------------------------
      */

        applyLiveLocationData(latestLocation);
      } catch (err) {
        console.error("Failed to fetch courier live location:", err);

        /*
      Do not clear the previous location when a refresh
      request fails. Keeping the last known location is
      better than immediately removing it from the map.
      */

        setError("Unable to load courier live location.");
      }
    },
    [id, applyLiveLocationData],
  );

  /*
  ==========================================================
  INITIAL FETCH
  ==========================================================
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);

      setError("");

      try {
        /*
        ----------------------------------------------------
        LOAD COURIER PROFILE AND LIVE LOCATION
        ----------------------------------------------------
        */

        await Promise.all([
          fetchCourier(),
          fetchCourierLiveLocation(),
          fetchAssignedOrders(),
        ]);
      } catch (err) {
        console.error("Initial tracking data load failed:", err);

        setError("Unable to load courier tracking data.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, fetchCourier, fetchCourierLiveLocation, fetchAssignedOrders]);

  /*
  ==========================================================
  REAL-TIME COURIER PROFILE SUBSCRIPTION
  ==========================================================

  This subscription is still useful for:

  - isOnline
  - isBlocked
  - firstName
  - lastName
  - profilePic
  - vehicle details
  - other courier profile changes

  It is NOT responsible for GPS tracking.

  GPS tracking is handled by the CourierLiveLocation
  subscription below.

  ==========================================================
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let subscription;

    try {
      subscription = DataStore.observe(Courier, id).subscribe(
        async (message) => {
          if (!message) {
            return;
          }

          /*
          ------------------------------------------------
          UPDATE / INSERT
          ------------------------------------------------
          */

          if (message.opType === "UPDATE" || message.opType === "INSERT") {
            const updatedCourier = message.element;

            if (!updatedCourier) {
              return;
            }

            await applyCourierData(updatedCourier);
          }

          /*
          ------------------------------------------------
          DELETE
          ------------------------------------------------
          */

          if (message.opType === "DELETE") {
            setCourier(null);

            setLiveLocation(null);

            setPosition(null);

            setProfileUrl(null);

            setError("This courier record is no longer available.");
          }
        },
      );
    } catch (err) {
      console.error("Courier profile subscription error:", err);

      setError("Unable to establish live courier tracking.");
    }

    /*
    --------------------------------------------------------
    CLEANUP
    --------------------------------------------------------
    */

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [id, applyCourierData]);

  /*
  ==========================================================
  REAL-TIME COURIER LIVE LOCATION SUBSCRIPTION
  ==========================================================

  THIS IS THE IMPORTANT NEW PART.

  We subscribe to CourierLiveLocation changes.

  When the courier's background tracking updates the
  CourierLiveLocation record, the admin tracking map
  receives the new coordinates.

  We filter by courierID so that this page only responds
  to the selected courier's location.

  ==========================================================
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let subscription;

    try {
      subscription = DataStore.observe(CourierLiveLocation).subscribe(
        (message) => {
          if (!message) {
            return;
          }

          /*
          ------------------------------------------------
          GET LOCATION RECORD
          ------------------------------------------------
          */

          const locationData = message.element;

          if (!locationData) {
            return;
          }

          /*
          ------------------------------------------------
          ONLY HANDLE THIS COURIER'S LOCATION
          ------------------------------------------------

          This prevents another courier's GPS update
          from moving the current admin map.

          ------------------------------------------------
          */

          if (locationData.courierID !== id) {
            return;
          }

          /*
          ------------------------------------------------
          UPDATE / INSERT
          ------------------------------------------------
          */

          if (message.opType === "UPDATE" || message.opType === "INSERT") {
            applyLiveLocationData(locationData);
          }

          /*
          ------------------------------------------------
          DELETE
          ------------------------------------------------

          If the live location record is deleted, clear
          the map position.

          ------------------------------------------------
          */

          if (message.opType === "DELETE") {
            setLiveLocation(null);

            setPosition(null);

            setLastUpdated(null);
          }
        },
      );
    } catch (err) {
      console.error("Courier live location subscription error:", err);

      setError("Unable to establish live courier tracking.");
    }

    /*
    --------------------------------------------------------
    CLEANUP
    --------------------------------------------------------
    */

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [id, applyLiveLocationData]);

  /*
  ==========================================================
  REAL-TIME ASSIGNED ORDER SUBSCRIPTION
  ==========================================================

  This listens for order INSERT, UPDATE, and DELETE events.

  Only orders belonging to this courier are processed.

  The map automatically updates when:

  - An order is assigned to this courier.
  - An order status changes.
  - An order is reassigned to another courier.
  - An order is completed.
  - An order is cancelled.
  ==========================================================
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let subscription;

    try {
      subscription = DataStore.observe(Order).subscribe((message) => {
        if (!message) {
          return;
        }

        const changedOrder = message.element;

        if (!changedOrder) {
          return;
        }

        console.log("Order change received:", message);

        /*
      --------------------------------------------------------
      DELETE
      --------------------------------------------------------
      */

        if (message.opType === "DELETE") {
          setOrders((currentOrders) =>
            currentOrders.filter((order) => order.id !== changedOrder.id),
          );

          return;
        }

        /*
      --------------------------------------------------------
      ONLY PROCESS ORDERS ASSIGNED TO THIS COURIER
      --------------------------------------------------------
      */

        if (changedOrder.assignedCourierId !== id) {
          /*
        If the order was reassigned away from this courier,
        remove it from the map.
        */

          setOrders((currentOrders) =>
            currentOrders.filter((order) => order.id !== changedOrder.id),
          );

          return;
        }

        /*
      --------------------------------------------------------
      IGNORE COMPLETED / CANCELLED / DISPUTED ORDERS
      --------------------------------------------------------
      */

        const isActiveOrder = ACTIVE_ORDER_STATUSES.includes(
          changedOrder.status,
        );

        if (!isActiveOrder) {
          setOrders((currentOrders) =>
            currentOrders.filter((order) => order.id !== changedOrder.id),
          );

          return;
        }

        /*
      --------------------------------------------------------
      INSERT OR UPDATE ACTIVE ORDER
      --------------------------------------------------------
      */

        setOrders((currentOrders) => {
          const existingOrderIndex = currentOrders.findIndex(
            (order) => order.id === changedOrder.id,
          );

          /*
        Add a newly assigned active order.
        */

          if (existingOrderIndex === -1) {
            return [...currentOrders, changedOrder];
          }

          /*
        Update an existing order without duplicating it.
        */

          return currentOrders.map((order) =>
            order.id === changedOrder.id ? changedOrder : order,
          );
        });
      });
    } catch (err) {
      console.error("Assigned order subscription error:", err);

      setError("Unable to establish live assigned order tracking.");
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [id]);

  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      /*
      ----------------------------------------------------
      REFRESH COURIER PROFILE AND LIVE LOCATION
      ----------------------------------------------------
      */

      await Promise.all([
        fetchCourier({
          showRefreshing: true,
        }),

        fetchCourierLiveLocation({
          showRefreshing: true,
        }),

        fetchAssignedOrders(),
      ]);
    } catch (err) {
      console.error("Tracking refresh failed:", err);

      setError("Unable to refresh courier tracking data.");
    } finally {
      setRefreshing(false);
    }
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
  VIEW PROFILE
  ==========================================================
  */

  const handleViewProfile = () => {
    if (!courier?.id) {
      return;
    }

    navigate(`/admin/courier_full_profile/${courier.id}`);
  };

  /*
  ==========================================================
  LOADING SCREEN
  ==========================================================
  */

  if (loading && !courier) {
    return (
      <div className="courierLiveTracking">
        <div className="courierLiveTracking-loading">
          <div className="courierLiveTracking-spinner" />

          <h2>Loading live tracking</h2>

          <p>Connecting to courier location...</p>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  COURIER NOT FOUND
  ==========================================================
  */

  if (!courier) {
    return (
      <div className="courierLiveTracking">
        <div className="courierLiveTracking-errorPage">
          <div className="courierLiveTracking-errorIcon">!</div>

          <h2>Courier unavailable</h2>

          <p>{error || "The requested courier could not be found."}</p>

          <div className="courierLiveTracking-errorActions">
            <button
              type="button"
              className="courierLiveTracking-secondaryButton"
              onClick={handleBack}
            >
              Go Back
            </button>

            <button
              type="button"
              className="courierLiveTracking-primaryButton"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Retrying..." : "Retry"}
            </button>
          </div>
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
    <div className="courierLiveTracking">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <TrackingHeader
        courier={courier}
        profileUrl={profileUrl}
        position={position}
        onBack={handleBack}
        onRefresh={handleRefresh}
        onViewProfile={handleViewProfile}
        refreshing={refreshing}
      />

      {/* ==================================================
          ERROR BANNER
      ================================================== */}

      {error && (
        <div className="courierLiveTracking-errorBanner">
          <div className="courierLiveTracking-errorBannerIcon">!</div>

          <div className="courierLiveTracking-errorBannerText">
            <strong>Tracking connection issue</strong>

            <span>{error}</span>
          </div>

          <button type="button" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="courierLiveTracking-content">
        {/* ==================================================
            MAP AREA
        ================================================== */}

        <section className="courierLiveTracking-mapSection">
          <TrackingMap
            courier={courier}
            position={position}
            orders={orders}
            loading={false}
          />
        </section>

        {/* ==================================================
            RIGHT INFORMATION COLUMN
        ================================================== */}

        <aside className="courierLiveTracking-sidebar">
          <CourierTrackingInfo
            courier={courier}
            position={position}
            profileUrl={profileUrl}
          />

          <TrackingStatus
            courier={courier}
            liveLocation={liveLocation}
            position={position}
            lastUpdated={lastUpdated}
          />
        </aside>
      </main>

      {/* ==================================================
          BOTTOM CONNECTION BAR
      ================================================== */}

      <footer className="courierLiveTracking-footer">
        <div className="courierLiveTracking-footerStatus">
          <span
            className={`
              courierLiveTracking-footerDot
              ${courier.isOnline && position ? "active" : "inactive"}
            `}
          />

          <span>
            {courier.isOnline && position
              ? "Live location connected"
              : courier.isOnline
                ? "Courier online — waiting for location"
                : "Courier offline"}
          </span>
        </div>

        <div className="courierLiveTracking-footerUpdated">
          Last update:
          <strong>
            {lastUpdated
              ? new Date(lastUpdated).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "—"}
          </strong>
        </div>
      </footer>
    </div>
  );
}

export default CourierLiveTracking;
