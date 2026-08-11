import React, { useCallback, useEffect, useRef } from "react";

import { GoogleMap, Marker } from "@react-google-maps/api";

import "./TrackingMap.css";

function TrackingMap({ courier, position, loading = false }) {
  const mapRef = useRef(null);

  /*
    ==========================================================
    DEFAULT LOCATION
    ==========================================================
    
    This is only used to give Google Maps a valid center while
    the actual courier position is unavailable.

    We do NOT display this as the courier's location.
    ==========================================================
    */

  const defaultCenter = {
    lat: 4.8089763,
    lng: 7.0220555,
  };

  /*
    ==========================================================
    COURIER POSITION
    ==========================================================
    */

  const courierPosition =
    position &&
    Number.isFinite(Number(position.lat)) &&
    Number.isFinite(Number(position.lng))
      ? {
          lat: Number(position.lat),
          lng: Number(position.lng),
        }
      : null;

  /*
    ==========================================================
    COURIER ICON
    ==========================================================
    */

  const getCourierImage = (transportationType) => {
    switch (transportationType) {
      case "MICRO":
        return "/AtuaMicroBatch.png";

      case "MOTO":
        return "/AtuaMotoX.png";

      case "MAXI":
        return "/AtuaMaxi.png";

      default:
        return "/AtuaMicroX.png";
    }
  };

  /*
    ==========================================================
    COURIER NAME
    ==========================================================
    */

  const courierName =
    [courier?.firstName, courier?.lastName].filter(Boolean).join(" ") ||
    "Courier";

  /*
    ==========================================================
    MAP LOAD
    ==========================================================
    */

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  /*
    ==========================================================
    MAP UNMOUNT
    ==========================================================
    */

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  /*
    ==========================================================
    MOVE MAP TO COURIER
    ==========================================================
    
    Whenever the courier's position changes, move the map
    smoothly to the new position.

    ==========================================================
    */

  useEffect(() => {
    if (!mapRef.current || !courierPosition) {
      return;
    }

    mapRef.current.panTo(courierPosition);
  }, [courierPosition?.lat, courierPosition?.lng]);

  /*
    ==========================================================
    CENTER MAP BUTTON
    ==========================================================
    */

  const handleCenterCourier = () => {
    if (!mapRef.current || !courierPosition) {
      return;
    }

    mapRef.current.panTo(courierPosition);

    mapRef.current.setZoom(16);
  };

  /*
    ==========================================================
    MAP OPTIONS
    ==========================================================
    */

  const mapOptions = {
    fullscreenControl: false,

    streetViewControl: false,

    mapTypeControl: false,

    clickableIcons: false,

    zoomControl: true,

    gestureHandling: "greedy",

    keyboardShortcuts: true,
  };

  /*
    ==========================================================
    LOADING
    ==========================================================
    */

  if (loading) {
    return (
      <div className="trackingMap-container">
        <div className="trackingMap-loading">
          <div className="trackingMap-loadingSpinner" />

          <span>Loading live location...</span>
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
    <div className="trackingMap-container">
      {/* =================================================
                MAP
            ================================================= */}

      <GoogleMap
        mapContainerClassName="trackingMap-googleMap"
        center={courierPosition || defaultCenter}
        zoom={courierPosition ? 16 : 12}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        options={mapOptions}
      >
        {/* =================================================
                    COURIER MARKER
                ================================================= */}

        {courierPosition && (
          <Marker
            position={courierPosition}
            title={courierName}
            icon={
              window.google
                ? {
                    url: getCourierImage(courier?.transportationType),

                    scaledSize: new window.google.maps.Size(46, 56),

                    anchor: new window.google.maps.Point(23, 28),
                  }
                : undefined
            }
          />
        )}
      </GoogleMap>

      {/* =================================================
                LOCATION UNAVAILABLE
            ================================================= */}

      {!courierPosition && (
        <div className="trackingMap-unavailable">
          <div className="trackingMap-unavailableIcon">📍</div>

          <strong>Location unavailable</strong>

          <span>This courier has not provided a valid location yet.</span>
        </div>
      )}

      {/* =================================================
                LIVE INDICATOR
            ================================================= */}

      <div className="trackingMap-liveIndicator">
        <span className="trackingMap-liveDot" />

        <span>Live</span>
      </div>

      {/* =================================================
                COURIER LABEL
            ================================================= */}

      {courierPosition && (
        <div className="trackingMap-courierLabel">
          <span className="trackingMap-courierLabelDot" />

          <div>
            <strong>{courierName}</strong>

            <span>{courier?.transportationType || "Courier"}</span>
          </div>
        </div>
      )}

      {/* =================================================
                CENTER COURIER BUTTON
            ================================================= */}

      {courierPosition && (
        <button
          type="button"
          className="trackingMap-centerButton"
          onClick={handleCenterCourier}
          aria-label="Center map on courier"
        >
          <span className="trackingMap-centerIcon">◎</span>

          <span>Center</span>
        </button>
      )}
    </div>
  );
}

export default TrackingMap;
