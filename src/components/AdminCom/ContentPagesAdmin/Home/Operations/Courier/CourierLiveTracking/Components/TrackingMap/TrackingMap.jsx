import React, { useCallback, useEffect, useMemo, useRef } from "react";

import { GoogleMap, Marker } from "@react-google-maps/api";

import "./TrackingMap.css";

/*
  ==========================================================
  TRACKING MAP
  ==========================================================

  This component displays:

  1. The selected courier's latest live GPS location.
  2. Pickup locations for the courier's assigned active orders.
  3. Destination locations for the courier's assigned active orders.

  IMPORTANT:

  The courier's location comes from:

    CourierLiveLocation

  The courier's live position is received through:

    position={{ lat, lng, ... }}

  Assigned orders are received through:

    orders={[...]}

  The parent component is responsible for retrieving:

  - Courier
  - CourierLiveLocation
  - Order

  ==========================================================
*/

function TrackingMap({ courier, position, orders = [], loading = false }) {
  /*
    ==========================================================
    MAP REFERENCE
    ==========================================================

    Stores the Google Maps instance after the map loads.

    It allows us to:

    - Pan to the courier.
    - Center the map on the courier.
    - Change the zoom level.
    ==========================================================
  */

  const mapRef = useRef(null);

  /*
    ==========================================================
    DEFAULT MAP CENTER
    ==========================================================

    This is only used when the courier has no valid live GPS
    position yet.

    It is not displayed as the courier's actual location.
    ==========================================================
  */

  const defaultCenter = useMemo(
    () => ({
      lat: 4.8089763,
      lng: 7.0220555,
    }),
    [],
  );

  /*
    ==========================================================
    VALIDATE COORDINATES
    ==========================================================

    Google Maps requires:

    Latitude:
      -90 to 90

    Longitude:
      -180 to 180

    This helper is used for:

    - Courier coordinates
    - Pickup coordinates
    - Destination coordinates
    ==========================================================
  */

  const normalizeCoordinates = useCallback((latitude, longitude) => {
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return null;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    if (lat < -90 || lat > 90) {
      return null;
    }

    if (lng < -180 || lng > 180) {
      return null;
    }

    return {
      lat,
      lng,
    };
  }, []);

  /*
    ==========================================================
    COURIER POSITION
    ==========================================================

    The courier position comes from the parent component's:

      CourierLiveLocation

    The parent normalizes the location to:

      position.lat
      position.lng
    ==========================================================
  */

  const courierPosition = useMemo(() => {
    return normalizeCoordinates(position?.lat, position?.lng);
  }, [position?.lat, position?.lng, normalizeCoordinates]);

  /*
    ==========================================================
    COURIER HEADING
    ==========================================================

    Heading is represented in degrees:

      0   = North
      90  = East
      180 = South
      270 = West

    The value is normalized between 0 and 360.
    ==========================================================
  */

  const courierHeading = useMemo(() => {
    const heading = Number(position?.heading);

    if (!Number.isFinite(heading)) {
      return 0;
    }

    return ((heading % 360) + 360) % 360;
  }, [position?.heading]);

  /*
    ==========================================================
    COURIER IMAGE
    ==========================================================

    These images should exist in your React public folder.

    Example:

      public/AtuaMicroBatch.png
      public/AtuaMotoX.png
      public/AtuaMaxi.png
      public/AtuaMicroX.png

    If one of these files does not exist, Google Maps may fall
    back to its default marker or show a broken image icon.

    Make sure the filenames match exactly.
    ==========================================================
  */

  const getCourierImage = useCallback((transportationType) => {
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
  }, []);

  /*
    ==========================================================
    COURIER NAME
    ==========================================================
  */

  const courierName = useMemo(() => {
    const fullName = [courier?.firstName, courier?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return fullName || "Courier";
  }, [courier?.firstName, courier?.lastName]);

  /*
    ==========================================================
    PREPARE ASSIGNED ORDER MARKERS
    ==========================================================

    Each order may contain:

      originLat
      originLng
      originAddress
      destinationLat
      destinationLng
      destinationAddress

    We create two possible markers per order:

    1. Pickup marker
    2. Destination marker

    Orders with invalid coordinates are ignored safely.
    ==========================================================
  */

  const orderMarkers = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return [];
    }

    const markers = [];

    orders.forEach((order) => {
      if (!order?.id) {
        return;
      }

      /*
        ------------------------------------------------------
        PICKUP MARKER
        ------------------------------------------------------
      */

      const pickupPosition = normalizeCoordinates(
        order.originLat,
        order.originLng,
      );

      if (pickupPosition) {
        markers.push({
          id: `${order.id}-pickup`,
          orderId: order.id,
          type: "pickup",
          position: pickupPosition,
          title: `Pickup - Order ${order.id}`,
          address:
            order.originAddress || order.originState || "Pickup location",
          status: order.status || "Unknown",
        });
      }

      /*
        ------------------------------------------------------
        DESTINATION MARKER
        ------------------------------------------------------
      */

      const destinationPosition = normalizeCoordinates(
        order.destinationLat,
        order.destinationLng,
      );

      if (destinationPosition) {
        markers.push({
          id: `${order.id}-destination`,
          orderId: order.id,
          type: "destination",
          position: destinationPosition,
          title: `Destination - Order ${order.id}`,
          address:
            order.destinationAddress ||
            order.destinationState ||
            "Destination location",
          status: order.status || "Unknown",
        });
      }
    });

    return markers;
  }, [orders, normalizeCoordinates]);

  /*
    ==========================================================
    PICKUP MARKER ICON
    ==========================================================

    We use a Google Maps circle symbol instead of requiring
    another image file.

    Pickup:
      Blue circle

    Destination:
      Red circle

    The Google Maps API may not be available during the first
    render, so we safely return undefined until it is ready.
    ==========================================================
  */

  const pickupMarkerIcon = useMemo(() => {
    if (
      typeof window === "undefined" ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.SymbolPath
    ) {
      return undefined;
    }

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: "#2563eb",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 3,
    };
  }, []);

  /*
    ==========================================================
    DESTINATION MARKER ICON
    ==========================================================
  */

  const destinationMarkerIcon = useMemo(() => {
    if (
      typeof window === "undefined" ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.SymbolPath
    ) {
      return undefined;
    }

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: "#dc2626",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 3,
    };
  }, []);

  /*
    ==========================================================
    COURIER MARKER ICON
    ==========================================================

    The courier marker uses the transport type image and
    rotates according to the courier's heading.
    ==========================================================
  */

  const courierMarkerIcon = useMemo(() => {
    if (
      typeof window === "undefined" ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.Size ||
      !window.google.maps.Point
    ) {
      return undefined;
    }

    return {
      url: getCourierImage(courier?.transportationType),

      scaledSize: new window.google.maps.Size(46, 56),

      anchor: new window.google.maps.Point(23, 56),

      rotation: courierHeading,
    };
  }, [courier?.transportationType, courierHeading, getCourierImage]);

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

    Whenever the courier's latitude or longitude changes,
    the map smoothly pans to the new location.

    We intentionally depend only on:

      courierPosition.lat
      courierPosition.lng

    This prevents unnecessary panning when only speed,
    heading, accuracy, or lastSeenAt changes.
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
    CENTER MAP ON COURIER
    ==========================================================
  */

  const handleCenterCourier = useCallback(() => {
    if (!mapRef.current || !courierPosition) {
      return;
    }

    mapRef.current.panTo(courierPosition);
    mapRef.current.setZoom(16);
  }, [courierPosition]);

  /*
    ==========================================================
    MAP OPTIONS
    ==========================================================
  */

  const mapOptions = useMemo(
    () => ({
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      clickableIcons: false,
      zoomControl: true,
      gestureHandling: "greedy",
      keyboardShortcuts: true,
    }),
    [],
  );

  /*
    ==========================================================
    LOADING STATE
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
      {/* =====================================================
          GOOGLE MAP
          ===================================================== */}

      <GoogleMap
        mapContainerClassName="trackingMap-googleMap"
        center={courierPosition || defaultCenter}
        zoom={courierPosition ? 16 : 12}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        options={mapOptions}
      >
        {/* =================================================
            COURIER LIVE MARKER
            =================================================

            This marker is displayed only when the parent has
            supplied a valid CourierLiveLocation position.
        */}

        {courierPosition && (
          <Marker
            position={courierPosition}
            title={courierName}
            icon={courierMarkerIcon}
            zIndex={1000}
          />
        )}

        {/* =================================================
            ASSIGNED ORDER MARKERS
            =================================================

            Each active assigned order may have:

            - One pickup marker
            - One destination marker
        */}

        {orderMarkers.map((marker) => {
          const isPickup = marker.type === "pickup";

          return (
            <Marker
              key={marker.id}
              position={marker.position}
              title={marker.title}
              icon={isPickup ? pickupMarkerIcon : destinationMarkerIcon}
              zIndex={isPickup ? 500 : 400}
            />
          );
        })}
      </GoogleMap>

      {/* =====================================================
          LOCATION UNAVAILABLE
          ===================================================== */}

      {!courierPosition && (
        <div className="trackingMap-unavailable">
          <div className="trackingMap-unavailableIcon">📍</div>

          <strong>Location unavailable</strong>

          <span>This courier has not provided a valid live location yet.</span>
        </div>
      )}

      {/* =====================================================
          MAP LEGEND
          =====================================================

          The legend explains the marker colors.
      ===================================================== */}

      <div className="trackingMap-legend">
        <div className="trackingMap-legendItem">
          <span className="trackingMap-legendDot trackingMap-legendDotCourier" />

          <span>Courier</span>
        </div>

        <div className="trackingMap-legendItem">
          <span className="trackingMap-legendDot trackingMap-legendDotPickup" />

          <span>Pickup</span>
        </div>

        <div className="trackingMap-legendItem">
          <span className="trackingMap-legendDot trackingMap-legendDotDestination" />

          <span>Destination</span>
        </div>
      </div>

      {/* =====================================================
          LIVE INDICATOR
          ===================================================== */}

      <div className="trackingMap-liveIndicator">
        <span
          className={
            courierPosition
              ? "trackingMap-liveDot"
              : "trackingMap-liveDot trackingMap-liveDotInactive"
          }
        />

        <span>{courierPosition ? "Live" : "Waiting for location"}</span>
      </div>

      {/* =====================================================
          COURIER LABEL
          ===================================================== */}

      {courierPosition && (
        <div className="trackingMap-courierLabel">
          <span className="trackingMap-courierLabelDot" />

          <div>
            <strong>{courierName}</strong>

            <span>{courier?.transportationType || "Courier"}</span>
          </div>
        </div>
      )}

      {/* =====================================================
          ASSIGNED ORDER COUNT
          ===================================================== */}

      {orders.length > 0 && (
        <div className="trackingMap-orderCount">
          <strong>{orders.length}</strong>

          <span>{orders.length === 1 ? "active order" : "active orders"}</span>
        </div>
      )}

      {/* =====================================================
          CENTER COURIER BUTTON
          ===================================================== */}

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
