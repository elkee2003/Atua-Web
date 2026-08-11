import React, { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

import { Courier } from "../../../../../../../models";

import TrackingHeader from "./Components/TrackingHeader/TrackingHeader";

import TrackingMap from "./Components/TrackingMap/TrackingMap";

import CourierTrackingInfo from "./Components/CourierTrackingInfo/CourierTrackingInfo";

import TrackingStatus from "./Components/TrackingStatus/TrackingStatus";

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

  const [courier, setCourier] = useState(null);

  const [position, setPosition] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  /*
  ==========================================================
  PROFILE IMAGE
  ==========================================================
  */

  const [profileUrl, setProfileUrl] = useState(null);

  /*
  ==========================================================
  NORMALIZE LOCATION
  ==========================================================
  
  Your Courier schema stores lat/lng on Courier.
  
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
  LOAD COURIER PROFILE IMAGE
  ==========================================================
  
  Courier.profilePic contains the Amplify Storage path.
  
  We convert that path into a temporary accessible URL
  using getUrl().
  
  ==========================================================
  */

  const loadProfileImage = useCallback(async (courierData) => {
    /*
        ------------------------------------------------------
        CLEAR PREVIOUS URL
        ------------------------------------------------------
        */

    setProfileUrl(null);

    /*
        ------------------------------------------------------
        NO COURIER
        ------------------------------------------------------
        */

    if (!courierData) {
      return;
    }

    /*
        ------------------------------------------------------
        PROFILE IMAGE PATH
        ------------------------------------------------------
        
        Your main field should be profilePic.
        
        The additional fields make this component tolerant
        if an older courier record uses another field.
        
        ------------------------------------------------------
        */

    const profilePath =
      courierData.profilePic ||
      courierData.profilePhoto ||
      courierData.profileUrl ||
      null;

    /*
        ------------------------------------------------------
        NO PROFILE PHOTO
        ------------------------------------------------------
        */

    if (!profilePath) {
      console.log("Courier has no profile picture.");

      return;
    }

    console.log("Courier tracking profile picture path:", profilePath);

    /*
        ------------------------------------------------------
        IF ALREADY A FULL URL
        ------------------------------------------------------
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
        ------------------------------------------------------
        GET AMPLIFY STORAGE URL
        ------------------------------------------------------
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
  
  This keeps the Courier object, map position, profile image
  and last-updated timestamp synchronized.
  
  ==========================================================
  */

  const applyCourierData = useCallback(
    async (courierData) => {
      if (!courierData) {
        setCourier(null);

        setPosition(null);

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
        UPDATE MAP POSITION
        ------------------------------------------------------
        */

      const newPosition = getCourierPosition(courierData);

      setPosition(newPosition);

      /*
        ------------------------------------------------------
        LOAD PROFILE IMAGE
        ------------------------------------------------------
        */

      await loadProfileImage(courierData);

      /*
        ------------------------------------------------------
        LAST UPDATE
        ------------------------------------------------------
        */

      setLastUpdated(courierData.updatedAt || new Date().toISOString());
    },
    [getCourierPosition, loadProfileImage],
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
  
  Whenever the Courier record changes in DataStore,
  the page receives the updated courier.
  
  If lat/lng changes, the position changes.
  
  If profilePic changes, the profile image is resolved again.
  
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

            setPosition(null);

            setProfileUrl(null);

            setError("This courier record is no longer available.");
          }
        },
      );
    } catch (err) {
      console.error("Courier tracking subscription error:", err);

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
