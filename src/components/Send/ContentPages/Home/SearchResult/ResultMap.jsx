import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  DirectionsService,
} from "@react-google-maps/api";

import { DataStore } from "aws-amplify/datastore";
import { Courier } from "../../../../../models";

import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";

import "../SendStyles/ResultMap.css";

const ResultMap = () => {
  /*
  ========================================================
  MAP
  ========================================================
  */

  const mapRef = useRef(null);

  /*
  ========================================================
  STATE
  ========================================================
  */

  const [currentLocation, setCurrentLocation] = useState(null);

  const [couriers, setCouriers] = useState([]);

  const [directions, setDirections] = useState(null);

  /*
  ========================================================
  LOCATION CONTEXT
  ========================================================
  */

  const {
    originAddress,
    destinationAddress,

    setTotalKm,
    setTotalMins,
    setIsRouteReady,
  } = useLocationContext();

  /*
  ========================================================
  CURRENT LOCATION
  ========================================================
  */

  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentLocation({
        lat: 4.8089763,
        lng: 7.0220555,
      });

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },

      () => {
        setCurrentLocation({
          lat: 4.8089763,
          lng: 7.0220555,
        });
      },

      {
        enableHighAccuracy: true,
      },
    );
  }, []);

  /*
  ========================================================
  ORIGIN
  ========================================================
  */

  const originLocation = {
    lat:
      originAddress?.details?.geometry?.location?.lat ??
      currentLocation?.lat ??
      4.8089763,

    lng:
      originAddress?.details?.geometry?.location?.lng ??
      currentLocation?.lng ??
      7.0220555,
  };

  /*
  ========================================================
  DESTINATION
  ========================================================
  */

  const destinationLocation = {
    lat:
      destinationAddress?.details?.geometry?.location?.lat ??
      originLocation.lat,

    lng:
      destinationAddress?.details?.geometry?.location?.lng ??
      originLocation.lng,
  };

  /*
  ========================================================
  COURIER ICON
  ========================================================
  */

  const getCourierImage = (type) => {
    switch (type) {
      case "Micro X":
        return "/AtuaMicroX.png";

      case "Micro Batch":
        return "/AtuaMicroBatch.png";

      case "Moto X":
        return "/AtuaMotoX.png";

      case "Moto Batch":
        return "/AtuaMotoBatch.png";

      case "Maxi":
        return "/AtuaMaxi.png";

      default:
        return "/AtuaMicroBatch.png";
    }
  };

  /*
  ========================================================
  FETCH COURIERS
  ========================================================
  */

  const fetchCouriers = useCallback(async () => {
    try {
      const onlineCouriers = await DataStore.query(Courier, (c) =>
        c.isOnline.eq(true),
      );

      setCouriers(onlineCouriers);
    } catch (error) {
      console.error("Failed to fetch couriers:", error);
    }
  }, []);

  /*
  ========================================================
  OBSERVE COURIERS
  ========================================================
  */

  useEffect(() => {
    fetchCouriers();

    const subscription = DataStore.observe(Courier).subscribe(({ opType }) => {
      if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
        fetchCouriers();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchCouriers]);
  /*
  ========================================================
  RESET ROUTE WHEN LOCATIONS CHANGE
  ========================================================
  */

  useEffect(() => {
    setDirections(null);

    setIsRouteReady(false);
  }, [originAddress, destinationAddress, setIsRouteReady]);

  /*
  ========================================================
  DIRECTIONS CALLBACK
  ========================================================
  */

  const directionsCallback = useCallback(
    (result) => {
      if (!result) return;

      if (result.status !== "OK") return;

      setDirections(result);

      const leg = result.routes[0].legs[0];

      setTotalKm(Number(leg.distance.value / 1000).toFixed(2));

      setTotalMins(Math.round(leg.duration.value / 60));

      setIsRouteReady(true);

      /*
      ======================================
      Fit route inside map
      ======================================
      */

      if (mapRef.current && window.google) {
        const bounds = new window.google.maps.LatLngBounds();

        result.routes[0].overview_path.forEach((point) => {
          bounds.extend(point);
        });

        mapRef.current.fitBounds(bounds);
      }
    },
    [setTotalKm, setTotalMins, setIsRouteReady],
  );

  /*
  ========================================================
  MAP LOAD
  ========================================================
  */

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  /*
  ========================================================
  MAP UNMOUNT
  ========================================================
  */

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  /*
  ========================================================
  LOADING
  ========================================================
  */

  if (!currentLocation) {
    return <div className="resultMapLoading">Loading map...</div>;
  }

  /*
  ========================================================
  READY TO RENDER
  ========================================================
  */

  return (
    <div className="resultMapContainer">
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: "100%",
        }}
        center={originLocation}
        zoom={14}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        {/* ======================================
            ROUTE
        ====================================== */}

        {!directions && originAddress && destinationAddress && (
          <DirectionsService
            options={{
              origin: originLocation,
              destination: destinationLocation,
              travelMode: window.google.maps.TravelMode.DRIVING,
            }}
            callback={directionsCallback}
          />
        )}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#FF3B30",
                strokeOpacity: 0.9,
                strokeWeight: 5,
              },
            }}
          />
        )}

        {/* ======================================
            ORIGIN
        ====================================== */}

        <Marker position={originLocation} title="Pickup Location" />

        {/* ======================================
            DESTINATION
        ====================================== */}

        {destinationAddress && (
          <Marker position={destinationLocation} title="Destination" />
        )}

        {/* ======================================
            ONLINE COURIERS
        ====================================== */}

        {couriers
          .filter((courier) => courier.lat != null && courier.lng != null)
          .map((courier) => (
            <Marker
              key={courier.id}
              position={{
                lat: courier.lat,
                lng: courier.lng,
              }}
              icon={{
                url: getCourierImage(courier.transportationType),
                scaledSize: new window.google.maps.Size(42, 52),
              }}
              title={
                courier.firstName
                  ? `${courier.firstName} ${courier.lastName ?? ""}`
                  : "Courier"
              }
            />
          ))}
      </GoogleMap>
    </div>
  );
};

export default ResultMap;
