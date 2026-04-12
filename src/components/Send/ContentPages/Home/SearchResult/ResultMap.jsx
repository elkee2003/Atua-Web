import React, { useEffect, useState, useMemo } from "react";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import holidays from '../../../../../assets/holiday';
import { DataStore } from 'aws-amplify/datastore';
import {Courier} from  '../../../../../models'

// ✅ Transport type images (web version)
const getImage = (type) => {
  if (type === "Micro X") return "/Bicycle.png";
  if (type === "Moto X") return "/Bike.jpg";
  if (type === "Maxi Batch") return "/top-UberXL.png";
  if (type === "Maxi") return "/Deliverybicycle.png";
  return "/Walk.png";
};

const ResultMap = ({
  setTotalMins,
  setTotalKm,
  setIsPeakHour,
  setIsWeekend,
  setIsNightTime,
  setIsHoliday,
}) => {
    const [couriers, setCouriers] = useState([]);
    const [directions, setDirections] = useState(null);
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    // ✅ Origin & Destination from context (like in RN)
    const {
        originPlace,
        destinationPlace,
        originPlaceLat,
        originPlaceLng,
        destinationPlaceLat,
        destinationPlaceLng
    } = useLocationContext();

    const origin = useMemo(
        () => ({
            lat: originPlaceLat || 4.8089763,
            lng: originPlaceLng || 7.0220555,
        }),
        [originPlaceLat, originPlaceLng]
    );

    const destination = useMemo(
        () => ({
            lat: destinationPlaceLat || 6.5243793,
            lng: destinationPlaceLng || 3.3792057,
        }),
        [destinationPlaceLat, destinationPlaceLng]
    );

    // ✅ Check if today is a holiday
    const checkIfHoliday = (date) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const formattedDate = `${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
        return holidays.includes(formattedDate);
    };

    // ✅ Fetch couriers who are online
    const fetchCouriers = async () => {
        try {
        const onlineCouriers = await DataStore.query(
            Courier,
            (c) => c.isOnline.eq(true)
        );
        setCouriers(onlineCouriers);
        } catch (e) {
        console.error("Error fetching couriers:", e);
        setErrorMsg(e.message);
        }
    };

    // ✅ Update time-based conditions
    const updateTimeDependentStates = () => {
        const currentHour = currentDateTime.getHours();
        const currentDay = currentDateTime.getDay();
        const today = new Date(currentDateTime);

        setIsPeakHour(currentHour >= 17 && currentHour <= 20);
        setIsNightTime(currentHour >= 22 || currentHour < 5);
        setIsWeekend(currentDay === 0 || currentDay === 6);
        setIsHoliday(checkIfHoliday(today));
    };

    // ✅ Update states when time changes
    useEffect(() => {
        updateTimeDependentStates();
    }, [currentDateTime]);

    // ✅ Fetch couriers initially and subscribe for changes
    useEffect(() => {
        fetchCouriers();
        const subscription = DataStore.observe(Courier).subscribe(({ opType }) => {
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
            fetchCouriers();
        }
        });
        return () => subscription.unsubscribe();
    }, []);

    // ✅ Get browser location
    useEffect(() => {
        if (!navigator.geolocation) {
        setErrorMsg("Geolocation not supported");
        return;
        }

        navigator.geolocation.getCurrentPosition(
        (pos) => {
            setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            });
        },
        (err) => {
            console.error("Error getting location:", err);
            setErrorMsg("Failed to get location");
            setLocation(origin); // fallback
        },
        { enableHighAccuracy: true }
        );
    }, []);

    // ✅ Calculate directions
    useEffect(() => {
        if (!window.google || !origin || !destination) return;

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
        {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            if (status === "OK" && result) {
            setDirections(result);
            const leg = result.routes[0].legs[0];
            const totalKm = leg.distance.value / 1000;
            const totalMins = leg.duration.value / 60;
            setTotalKm(totalKm);
            setTotalMins(totalMins);
            } else {
            console.error("Directions request failed:", status);
            }
        }
        );
    }, [origin, destination]);

    if (errorMsg) {
        return <p style={{ color: "red" }}>{errorMsg}</p>;
    }

    if (!location) {
        return <p>Loading map...</p>;
    }

  return (
    <div>
        <GoogleMap
            mapContainerClassName="map-container"
            center={origin}
            zoom={7}
            options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            }}
        >
            {/* ✅ Directions line */}
            {directions && <DirectionsRenderer directions={directions} />}

            {/* ✅ Origin marker */}
            <Marker position={origin} label="Origin" />

            {/* ✅ Destination marker */}
            <Marker position={destination} label="Dest" />

            {/* ✅ Courier markers */}
            {couriers
            .filter((c) => c?.lat != null && c?.lng != null)
            .map((courier) => (
                <Marker
                key={courier.id}
                position={{ lat: courier.lat, lng: courier.lng }}
                icon={{
                    url: getImage(courier.transportationType),
                    scaledSize: new window.google.maps.Size(45, 45),
                }}
                />
            ))}
        </GoogleMap>
    </div>
  );
};

export default ResultMap;
