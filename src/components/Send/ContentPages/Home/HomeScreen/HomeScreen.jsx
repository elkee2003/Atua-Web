import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import "../SendStyles/HomeScreen.css";
import { FaSearchLocation, FaClock, FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { DataStore } from "aws-amplify/datastore";
import { Courier } from "../../../../../models";

function HomeScreen() {
  const { authUser, dbUser } = useAuthContext();
  const navigate = useNavigate();

  const [currentPosition, setCurrentPosition] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [lastDestination, setLastDestination] = useState("");

  const homeAddress = dbUser?.address || dbUser?.exactAddress || "";

  // Check profile completion for signed-in users only.
  useEffect(() => {
    // Wait for the initial authentication check.
    if (authUser === undefined) return;

    // Signed-out users can view this screen.
    // DestinationSearch handles the sign-in alert.
    if (authUser === null) return;

    // Wait for the database profile to finish loading.
    if (dbUser === undefined) return;

    const phoneNumber = dbUser?.phoneNumber?.trim() || "";

    const profileComplete = Boolean(
      dbUser?.firstName?.trim() && phoneNumber && phoneNumber.length >= 10,
    );

    // Redirect signed-in users with incomplete profiles.
    if (!profileComplete) {
      alert("Kindly complete your profile before continuing.");

      navigate("/send/edit_profile", {
        replace: true,
      });
    }
  }, [authUser, dbUser, navigate]);

  // Load the last destination from browser storage.
  useEffect(() => {
    try {
      const destination = localStorage.getItem("lastDestination");

      if (destination) {
        setLastDestination(destination);
      }
    } catch (error) {
      console.error("Failed to load last destination:", error);
    }
  }, []);

  // Get the customer's current location.
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    let isMounted = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMounted) return;

        setCurrentPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (error) => {
        if (isMounted) {
          console.error("Failed to get current location:", error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch online couriers and observe updates.
  useEffect(() => {
    let isMounted = true;

    const fetchCouriers = async () => {
      try {
        const onlineCouriers = await DataStore.query(Courier, (courier) =>
          courier.isOnline.eq(true),
        );

        if (isMounted) {
          setCouriers(onlineCouriers);
        }
      } catch (error) {
        console.error("Failed to fetch couriers:", error);
      }
    };

    fetchCouriers();

    const subscription = DataStore.observe(Courier).subscribe({
      next: ({ opType }) => {
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          fetchCouriers();
        }
      },
      error: (error) => {
        console.error("Courier observer error:", error);
      },
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Get the marker image based on transportation type.
  const getImage = (type) => {
    switch (type) {
      case "Micro X":
        return "/atuaImages/Bicycle.png";

      case "Moto X":
        return "/atuaImages/Bike.jpg";

      case "Maxi Batch":
        return "/atuaImages/top-UberXL.png";

      case "Maxi":
        return "/atuaImages/Deliverybicycle.png";

      default:
        return "/atuaImages/Walk.png";
    }
  };

  const truncateAddress = (value) => {
    if (!value) return "";

    return value.length > 30 ? `${value.substring(0, 30)}...` : value;
  };

  const handleDestinationSearch = () => {
    navigate("/send/destination_search");
  };

  const handleLastDestinationPress = () => {
    navigate("/send/destination_search", {
      state: { lastDestination },
    });
  };

  const handleHomePress = () => {
    navigate("/send/destination_search", {
      state: { address: homeAddress },
    });
  };

  // Check whether the customer's profile is complete.
  const phoneNumber = dbUser?.phoneNumber?.trim() || "";

  const profileComplete = Boolean(
    dbUser?.firstName?.trim() && phoneNumber && phoneNumber.length >= 10,
  );

  // Wait while authentication is loading.
  if (authUser === undefined) {
    return null;
  }

  // For signed-in users, wait for the profile check.
  // Signed-out users are allowed to see the home screen.
  if (authUser !== null && (dbUser === undefined || !profileComplete)) {
    return null;
  }

  return (
    <div className="homeScreenContainer">
      {/* Map */}
      {currentPosition ? (
        <div className="homeScreenMapCard">
          <GoogleMap
            mapContainerClassName="homeScreenMap"
            center={currentPosition}
            zoom={14}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            <Marker position={currentPosition} />

            {couriers
              .filter(
                (courier) =>
                  typeof courier.lat === "number" &&
                  typeof courier.lng === "number",
              )
              .map((courier) => (
                <Marker
                  key={courier.id}
                  position={{
                    lat: courier.lat,
                    lng: courier.lng,
                  }}
                  icon={{
                    url: getImage(courier.transportationType),
                    scaledSize: new window.google.maps.Size(40, 50),
                  }}
                />
              ))}
          </GoogleMap>
        </div>
      ) : (
        <div className="homeScreenLoading">Loading map...</div>
      )}

      {/* Search panel */}
      <div className="homeScreenSearchContainer">
        <button
          type="button"
          className="homeScreenSearchCard"
          onClick={handleDestinationSearch}
        >
          <span className="homeScreenSearchText">What's the destination?</span>

          <FaSearchLocation className="homeScreenSearchIcon" />
        </button>

        {/* Last destination */}
        {lastDestination && (
          <button
            type="button"
            className="homeScreenDestinationRow"
            onClick={handleLastDestinationPress}
          >
            <span className="homeScreenDestinationIcon">
              <FaClock />
            </span>

            <span className="homeScreenDestinationText">
              {truncateAddress(lastDestination)}
            </span>
          </button>
        )}

        {/* Customer's saved home address */}
        {homeAddress && (
          <button
            type="button"
            className="homeScreenDestinationRow"
            onClick={handleHomePress}
          >
            <span className="homeScreenDestinationIcon homeScreenHomeIcon">
              <FaHome />
            </span>

            <span className="homeScreenDestinationText">
              {truncateAddress(homeAddress)}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default HomeScreen;
