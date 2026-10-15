import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  DirectionsService,
} from "@react-google-maps/api";

import { DataStore } from "aws-amplify/datastore";
import { Courier, CourierLiveLocation } from "../../../../../models";

import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";

import { TRANSPORT_TYPES } from "../../../../../../constants/transportTypes";

import "../SendStyles/ResultMap.css";

const FALLBACK_LOCATION = {
  lat: 4.8089763,
  lng: 7.0220555,
};

const LOCATION_STALE_AFTER_MS = 3 * 60 * 1000;
const LOCATION_REFRESH_INTERVAL_MS = 15 * 1000;

/*
========================================================
COORDINATE HELPERS
========================================================
*/

const readCoordinate = (value) => {
  const result = typeof value === "function" ? value() : value;
  const number = Number(result);

  return Number.isFinite(number) ? number : null;
};

const getCoordinates = (location) => {
  if (!location) return null;

  const lat = readCoordinate(location.lat);
  const lng = readCoordinate(location.lng);

  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
};

const getValidTimestamp = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const timestamp =
    typeof value === "number" ? value : new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return null;

  return timestamp;
};

const isFreshLiveLocation = (liveLocation, now = Date.now()) => {
  if (!liveLocation || liveLocation.isTracking !== true) {
    return false;
  }

  const coordinates = {
    lat: Number(liveLocation.latitude),
    lng: Number(liveLocation.longitude),
  };

  if (
    !Number.isFinite(coordinates.lat) ||
    !Number.isFinite(coordinates.lng) ||
    coordinates.lat < -90 ||
    coordinates.lat > 90 ||
    coordinates.lng < -180 ||
    coordinates.lng > 180
  ) {
    return false;
  }

  const lastSeen = getValidTimestamp(liveLocation.lastSeenAt);

  if (lastSeen === null) return false;

  const age = now - lastSeen;

  return age >= 0 && age <= LOCATION_STALE_AFTER_MS;
};

/*
========================================================
COMPONENT
========================================================
*/

const ResultMap = ({ onCouriersChange }) => {
  const mapRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [liveLocations, setLiveLocations] = useState([]);
  const [couriersLoaded, setCouriersLoaded] = useState(false);
  const [liveLocationsLoaded, setLiveLocationsLoaded] = useState(false);
  const [locationCheckTime, setLocationCheckTime] = useState(Date.now());
  const [directions, setDirections] = useState(null);

  const {
    originAddress,
    destinationAddress,
    setTotalKm,
    setTotalMins,
    setIsRouteReady,
  } = useLocationContext();

  /*
  ========================================================
  CUSTOMER DEVICE LOCATION
  ========================================================
  */

  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentLocation(FALLBACK_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(getCoordinates(coordinates) ?? FALLBACK_LOCATION);
      },
      () => {
        setCurrentLocation(FALLBACK_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  }, []);

  /*
  ========================================================
  ACTUAL PICKUP AND DESTINATION COORDINATES
  ========================================================
  */

  const pickupCoordinates = useMemo(
    () => getCoordinates(originAddress?.details?.geometry?.location),
    [originAddress],
  );

  const destinationCoordinates = useMemo(
    () => getCoordinates(destinationAddress?.details?.geometry?.location),
    [destinationAddress],
  );

  /*
  ========================================================
  MAP DISPLAY COORDINATES

  Fallback coordinates are for map display only.
  They must not be treated as a confirmed pickup location.
  ========================================================
  */

  const originLocation =
    pickupCoordinates ?? currentLocation ?? FALLBACK_LOCATION;

  const destinationLocation = destinationCoordinates ?? originLocation;

  /*
  ========================================================
  COURIER ELIGIBILITY
  ========================================================
  */

  const availableCouriers = useMemo(
    () =>
      couriers.filter(
        (courier) =>
          courier.isOnline === true &&
          courier.isApproved === true &&
          courier.isBlocked !== true,
      ),
    [couriers],
  );

  /*
  ========================================================
  LIVE COURIER LOCATIONS

  CourierLiveLocation is the GPS source of truth.
  Courier.lat/lng are deliberately not used.
  ========================================================
  */

  const nearbyMapCouriers = useMemo(() => {
    const couriersById = new Map(
      availableCouriers.map((courier) => [courier.id, courier]),
    );

    return liveLocations
      .filter((liveLocation) =>
        isFreshLiveLocation(liveLocation, locationCheckTime),
      )
      .map((liveLocation) => {
        const courier = couriersById.get(liveLocation.courierID);

        if (!courier) return null;

        return {
          courier,
          liveLocation,
          position: {
            lat: Number(liveLocation.latitude),
            lng: Number(liveLocation.longitude),
          },
        };
      })
      .filter(Boolean);
  }, [availableCouriers, liveLocations, locationCheckTime]);

  /*
  ========================================================
  PASS COURIERS TO PARENT

  null means availability has not finished loading.
  An empty array means loading finished but no valid
  courier locations are currently available.
  ========================================================
  */

  useEffect(() => {
    if (!couriersLoaded || !liveLocationsLoaded) return;

    onCouriersChange?.(nearbyMapCouriers);
  }, [
    couriersLoaded,
    liveLocationsLoaded,
    nearbyMapCouriers,
    onCouriersChange,
  ]);

  /*
  ========================================================
  FETCH INITIAL COURIER DATA
  ========================================================
  */

  useEffect(() => {
    let active = true;

    const fetchCouriers = async () => {
      try {
        const result = await DataStore.query(Courier);

        if (!active) return;

        setCouriers(result);
      } catch (error) {
        console.error("Failed to load couriers:", error);
      } finally {
        if (active) setCouriersLoaded(true);
      }
    };

    const fetchLiveLocations = async () => {
      try {
        const result = await DataStore.query(CourierLiveLocation);

        if (!active) return;

        setLiveLocations(result);
      } catch (error) {
        console.error("Failed to load live courier locations:", error);
      } finally {
        if (active) setLiveLocationsLoaded(true);
      }
    };

    fetchCouriers();
    fetchLiveLocations();

    return () => {
      active = false;
    };
  }, []);

  /*
  ========================================================
  OBSERVE COURIER PROFILE CHANGES
  ========================================================
  */

  useEffect(() => {
    const subscription = DataStore.observe(Courier).subscribe({
      next: ({ opType, element }) => {
        if (!element?.id) return;

        if (opType === "DELETE") {
          setCouriers((previous) =>
            previous.filter((courier) => courier.id !== element.id),
          );
          return;
        }

        if (opType === "INSERT" || opType === "UPDATE") {
          setCouriers((previous) => {
            const index = previous.findIndex(
              (courier) => courier.id === element.id,
            );

            if (index === -1) {
              return [...previous, element];
            }

            const updated = [...previous];
            updated[index] = element;

            return updated;
          });
        }
      },
      error: (error) => {
        console.error("Courier subscription error:", error);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  /*
  ========================================================
  OBSERVE LIVE LOCATION CHANGES
  ========================================================
  */

  useEffect(() => {
    const subscription = DataStore.observe(CourierLiveLocation).subscribe({
      next: ({ opType, element }) => {
        if (!element?.id) return;

        if (opType === "DELETE") {
          setLiveLocations((previous) =>
            previous.filter((location) => location.id !== element.id),
          );
          return;
        }

        if (opType === "INSERT" || opType === "UPDATE") {
          setLiveLocations((previous) => {
            const index = previous.findIndex(
              (location) => location.id === element.id,
            );

            if (index === -1) {
              return [...previous, element];
            }

            const updated = [...previous];
            updated[index] = element;

            return updated;
          });
        }
      },
      error: (error) => {
        console.error("Live location subscription error:", error);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  /*
  ========================================================
  RECHECK LOCATION FRESHNESS

  A courier disappears from the map when its last GPS
  update becomes older than three minutes, even if no
  new subscription event arrives.
  ========================================================
  */

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLocationCheckTime(Date.now());
    }, LOCATION_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  /*
  ========================================================
  RESET ROUTE WHEN ADDRESSES CHANGE
  ========================================================
  */

  useEffect(() => {
    setDirections(null);
    setTotalKm(0);
    setTotalMins(0);
    setIsRouteReady(false);
  }, [
    originAddress,
    destinationAddress,
    setTotalKm,
    setTotalMins,
    setIsRouteReady,
  ]);

  /*
  ========================================================
  DIRECTIONS CALLBACK
  ========================================================
  */

  const directionsCallback = useCallback(
    (result, status) => {
      if (status !== "OK" || !result?.routes?.[0]?.legs?.[0]) {
        setDirections(null);
        setTotalKm(0);
        setTotalMins(0);
        setIsRouteReady(false);
        return;
      }

      const leg = result.routes[0].legs[0];

      if (!leg.distance || !leg.duration) {
        setIsRouteReady(false);
        return;
      }

      setDirections(result);

      setTotalKm(Number((leg.distance.value / 1000).toFixed(2)));
      setTotalMins(Math.round(leg.duration.value / 60));
      setIsRouteReady(true);

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

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  /*
  ========================================================
  COURIER ICONS

  Support both service-specific transport values and
  general MICRO / MOTO / MAXI vehicle categories.
  ========================================================
  */

  const getCourierImage = (type) => {
    switch (type) {
      case TRANSPORT_TYPES.MICRO_EXPRESS:
      case "Micro X":
        return "/AtuaMicroX.png";

      case TRANSPORT_TYPES.MICRO_BATCH:
      case "Micro Batch":
        return "/AtuaMicroBatch.png";

      case TRANSPORT_TYPES.MOTO_EXPRESS:
      case "Moto X":
        return "/AtuaMotoX.png";

      case TRANSPORT_TYPES.MOTO_BATCH:
      case "Moto Batch":
        return "/AtuaMotoBatch.png";

      case TRANSPORT_TYPES.MAXI:
      case "Maxi":
        return "/AtuaMaxi.png";

      case "MICRO":
        return "/AtuaMicroX.png";

      case "MOTO":
        return "/AtuaMotoX.png";

      default:
        return "/AtuaMicroBatch.png";
    }
  };

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
  RENDER
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
        {/* ROUTE */}

        {!directions && pickupCoordinates && destinationCoordinates && (
          <DirectionsService
            options={{
              origin: pickupCoordinates,
              destination: destinationCoordinates,
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

        {/* PICKUP */}

        <Marker position={originLocation} title="Pickup Location" />

        {/* DESTINATION */}

        {destinationCoordinates && (
          <Marker position={destinationCoordinates} title="Destination" />
        )}

        {/* LIVE COURIERS */}

        {nearbyMapCouriers.map(({ courier, liveLocation, position }) => (
          <Marker
            key={liveLocation.id}
            position={position}
            icon={{
              url: getCourierImage(courier.transportationType),
              scaledSize: new window.google.maps.Size(42, 52),
              anchor: new window.google.maps.Point(21, 26),
            }}
            title={
              courier.firstName
                ? `${courier.firstName} ${courier.lastName ?? ""}`.trim()
                : "Courier"
            }
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default ResultMap;
