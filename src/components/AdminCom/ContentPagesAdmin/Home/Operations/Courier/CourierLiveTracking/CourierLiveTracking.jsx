import React, { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { Courier } from "../../../../../../../models";

import TrackingHeader from "./Components/TrackingHeader/TrackingHeader";
import TrackingMap from "./Components/TrackingMap/TrackingMap";
import CourierTrackingInfo from "./Components/CourierTrackingInfo/CourierTrackingInfo";
import TrackingStatus from "./Components/TrackingStatus/TrackingStatus";

import "./CourierLiveTracking.css";

function CourierLiveTracking() {
  const { id } = useParams();

  const navigate = useNavigate();

  /*
    ==========================================================
    STATE
    ==========================================================
    */

  const [courier, setCourier] = useState(null);

  const [position, setPosition] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  /*
    ==========================================================
    NORMALIZE LOCATION
    ==========================================================
    
    Your schema stores lat/lng on Courier.

    We normalize them here so the child components don't have
    to know anything about DataStore or the schema.
    ==========================================================
    */

  const getCourierPosition = useCallback((courierData) => {
    if (
      courierData?.lat === null ||
      courierData?.lat === undefined ||
      courierData?.lng === null ||
      courierData?.lng === undefined
    ) {
      return null;
    }

    const lat = Number(courierData.lat);

    const lng = Number(courierData.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return {
      lat,
      lng,
    };
  }, []);

  /*
    ==========================================================
    APPLY COURIER DATA
    ==========================================================
    
    This function keeps the Courier object and map position
    synchronized.
    ==========================================================
    */

  const applyCourierData = useCallback(
    (courierData) => {
      if (!courierData) {
        setCourier(null);
        setPosition(null);
        return;
      }

      setCourier(courierData);

      const newPosition = getCourierPosition(courierData);

      setPosition(newPosition);

      /*
            ----------------------------------------------
            LAST UPDATE
            ----------------------------------------------
            */

      setLastUpdated(courierData.updatedAt || new Date().toISOString());
    },
    [getCourierPosition],
  );

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
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await DataStore.query(Courier, id);

        if (!data) {
          setCourier(null);

          setPosition(null);

          setError("Courier could not be found.");

          return;
        }

        applyCourierData(data);
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
    INITIAL FETCH
    ==========================================================
    */

  useEffect(() => {
    fetchCourier();
  }, [fetchCourier]);

  /*
    ==========================================================
    REAL-TIME COURIER SUBSCRIPTION
    ==========================================================
    
    This is the important part.

    Whenever the Courier record changes in DataStore,
    the page receives the updated courier.

    If lat/lng changes, position changes and TrackingMap
    automatically pans to the new location.
    ==========================================================
    */

  useEffect(() => {
    if (!id) {
      return;
    }

    let subscription;

    try {
      subscription = DataStore.observe(Courier, id).subscribe((message) => {
        if (!message) {
          return;
        }

        /*
                        ------------------------------------------
                        UPDATE
                        ------------------------------------------
                        */

        if (message.opType === "UPDATE" || message.opType === "INSERT") {
          const updatedCourier = message.element;

          if (!updatedCourier) {
            return;
          }

          applyCourierData(updatedCourier);
        }

        /*
                        ------------------------------------------
                        DELETE
                        ------------------------------------------
                        */

        if (message.opType === "DELETE") {
          setCourier(null);

          setPosition(null);

          setError("This courier record is no longer available.");
        }
      });
    } catch (err) {
      console.error("Courier tracking subscription error:", err);

      setError("Unable to establish live courier tracking.");
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [id, applyCourierData]);

  /*
    ==========================================================
    REFRESH
    ==========================================================
    */

  const handleRefresh = async () => {
    await fetchCourier({
      showRefreshing: true,
    });
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
          <TrackingMap courier={courier} position={position} loading={false} />
        </section>

        {/* ==================================================
                    RIGHT INFORMATION COLUMN
                ================================================== */}

        <aside className="courierLiveTracking-sidebar">
          <CourierTrackingInfo courier={courier} position={position} />

          <TrackingStatus
            courier={courier}
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
            className={`courierLiveTracking-footerDot ${
              courier.isOnline && position ? "active" : "inactive"
            }`}
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
