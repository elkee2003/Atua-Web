import React, { useEffect, useState, useMemo, useRef } from "react";
import "../../Home/SendStyles/OrderLiveUpdate.css";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

const getImage = (type) => {
  if (type === "Micro X") return "/Bicycle.png";
  if (type === "Moto X") return "/Bike.jpg";
  if (type === "Maxi Batch") return "/top-UberXL.png";
  if (type === "Maxi") return "/Deliverybicycle.png";
  return "/Walk.png";
};

const OrderLiveUpdate = ({ order, courier }) => {
  const navigate = useNavigate();
  const [directions, setDirections] = useState(null);

  const mapRef = useRef(null);

  const origin = useMemo(
    () => ({
      lat: order?.parcelOriginLat || 4.8089763,
      lng: order?.parcelOriginLng || 7.0220555,
    }),
    [order]
  );

  const destination = useMemo(
    () => ({
      lat: order?.parcelDestinationLat || 6.5243793,
      lng: order?.parcelDestinationLng || 3.3792057,
    }),
    [order]
  );

  const courierLoc = useMemo(
    () => ({
      lat: courier?.lat || 0,
      lng: courier?.lng || 0,
    }),
    [courier]
  );

  // ✅ Choose where courier is going
  const getDestination = () => {
    if (order?.status === "ACCEPTED") return origin;
    return destination;
  };

  // ✅ Fetch directions
  useEffect(() => {
    if (!window.google || !courierLoc.lat || !courierLoc.lng) return;
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: courierLoc,
        destination: getDestination(),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  }, [courierLoc, order]);

  return (
    <div className="order-container">
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      {/* Google Map */}
      <GoogleMap
        mapContainerClassName="map-container"
        center={origin}
        zoom={10}
        onLoad={(map) => (mapRef.current = map)}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Directions line */}
        {directions && <DirectionsRenderer directions={directions} />}

        {/* Origin Marker */}
        <Marker position={origin} label="Origin" />

        {/* Destination Marker */}
        <Marker position={destination} label="Destination" />

        {/* Courier Marker */}
        {courier?.lat && (
          <Marker
            position={courierLoc}
            icon={{
              url: getImage(courier.transportationType),
              scaledSize: new window.google.maps.Size(50, 50),
            }}
            title={courier.firstName}
          />
        )}
      </GoogleMap>

      {/* Bottom Info Sheet */}
      <div className="bottom-sheet">
        {courier?.profilePic && (
          <div className="image-container">
            <img
              src={courier.profilePic}
              alt={courier.firstName}
              className="courier-img"
            />
          </div>
        )}
        <h2 className="courier-name">{courier?.firstName}</h2>
      </div>
    </div>
  );
};

export default OrderLiveUpdate;
