import React, { useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useParams, useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Courier } from "../../../../../../../../models";
import "./CourierLiveTrackingPage.css";

function CourierLiveTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courier, setCourier] = useState(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(false);

  // ================= INITIAL FETCH =================
  const fetchCourier = async () => {
    try {
      console.log("Initial fetch:", id);

      const data = await DataStore.query(Courier, id);

      if (!data) {
        console.warn("Courier not found");
        setError(true);
        return;
      }

      setCourier(data);

      if (data.lat && data.lng) {
        setPosition({
          lat: Number(data.lat),
          lng: Number(data.lng),
        });
      } else {
        // fallback
        setPosition({
          lat: 6.5244,
          lng: 3.3792,
        });
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setError(true);

      setPosition({
        lat: 6.5244,
        lng: 3.3792,
      });
    }
  };

  // ================= REALTIME SUBSCRIPTION =================
  useEffect(() => {
    let subscription;

    const init = async () => {
      try {
        await fetchCourier();

        // 🔥 REAL-TIME LISTENER
        subscription = DataStore.observe(Courier, id).subscribe((msg) => {
          if (msg.opType === "UPDATE") {
            const updated = msg.element;

            console.log("Realtime update:", updated);

            setCourier(updated);

            if (updated.lat && updated.lng) {
              setPosition({
                lat: Number(updated.lat),
                lng: Number(updated.lng),
              });
            }
          }
        });

      } catch (err) {
        console.error("INIT ERROR:", err);
        setError(true);

        setPosition({
          lat: 6.5244,
          lng: 3.3792,
        });
      }
    };

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [id]);

  // ================= LOADING =================
  if (!position) {
    return <div className="loading">Loading live tracking...</div>;
  }

  return (
    <div className="live-page">

      {/* TOP BAR */}
      <div className="live-topbar">
        <button onClick={() => navigate(-1)}>← Back</button>
        <h2>🟢 Live Tracking</h2>
      </div>

      {/* ERROR */}
      {error && (
        <div className="error-banner">
          ⚠️ Unable to fetch live courier data
        </div>
      )}

      {/* MAP */}
      <GoogleMap
        mapContainerClassName="live-map"
        center={position}
        zoom={15}
      >
        <Marker
          position={position}
          icon={{
            url: "/atuaImages/Bike.jpg",
            scaledSize: new window.google.maps.Size(50, 60),
          }}
        />
      </GoogleMap>

      {/* INFO CARD */}
      <div className="live-card">
        <h3>
          {courier?.firstName || "Courier"} {courier?.lastName || ""}
        </h3>

        <p>📞 {courier?.phoneNumber || "N/A"}</p>

        <div className="status-row">
          <span className={`badge ${courier?.isOnline ? "online" : "offline"}`}>
            {courier?.isOnline ? "Online" : "Offline"}
          </span>

          <span className={`badge ${courier?.isApproved ? "approved" : "pending"}`}>
            {courier?.isApproved ? "Approved" : "Pending"}
          </span>
        </div>

        <p className="coords">
          Lat: {position.lat.toFixed(5)} | Lng: {position.lng.toFixed(5)}
        </p>
      </div>

    </div>
  );
}

export default CourierLiveTrackingPage;