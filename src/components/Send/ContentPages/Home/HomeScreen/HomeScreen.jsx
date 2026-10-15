import React, { useState, useEffect } from "react";
import "../SendStyles/HomeScreen.css";
import { FaSearchLocation, FaClock, FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { DataStore } from "aws-amplify/datastore";
import { getCurrentUser } from "aws-amplify/auth";
import { Courier, User } from "../../../../../models";

function HomeScreen() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [lastDestination, setLastDestination] = useState("");
  const [homeAddress, setHomeAddress] = useState("");

  const navigate = useNavigate();

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

  // Fetch the signed-in customer's home address from the User model.
  useEffect(() => {
    let isMounted = true;

    const fetchHomeAddress = async () => {
      try {
        const currentUser = await getCurrentUser();

        // Amplify userId corresponds to the Cognito user's sub.
        const users = await DataStore.query(User, (u) =>
          u.sub.eq(currentUser.userId),
        );

        const profile = users.find((user) => user.sub === currentUser.userId);

        if (isMounted && profile) {
          setHomeAddress(profile.address || profile.exactAddress || "");
        }
      } catch (error) {
        console.error("Failed to load customer home address:", error);
      }
    };

    fetchHomeAddress();

    return () => {
      isMounted = false;
    };
  }, []);

  // Get the customer's current location.
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (error) => {
        console.error("Failed to get current location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  }, []);

  // Fetch online couriers and observe updates.
  useEffect(() => {
    let isMounted = true;

    const fetchCouriers = async () => {
      try {
        const onlineCouriers = await DataStore.query(Courier, (c) =>
          c.isOnline.eq(true),
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
