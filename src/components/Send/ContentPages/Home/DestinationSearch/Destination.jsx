import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdNavigateNext } from "react-icons/md";
import { AiFillCloseCircle } from "react-icons/ai";

import "../SendStyles/Destination.css";

import PlaceRow from "./PlaceRow";

import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import "./Destination.css";

function DestinationSearch() {
  const navigate = useNavigate();

  /* ------------------ INPUT REFS ------------------ */

  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  /* ------------------ DROPDOWN STATES ------------------ */

  const [originPredictions, setOriginPredictions] = useState([]);
  const [destinationPredictions, setDestinationPredictions] = useState([]);

  const [showOriginDropdown, setShowOriginDropdown] =
    useState(false);

  const [
    showDestinationDropdown,
    setShowDestinationDropdown,
  ] = useState(false);

  /* ------------------ CONTEXT ------------------ */

  const {
    setOriginAddress,
    setDestinationAddress,

    originLat,
    setOriginLat,

    originLng,
    setOriginLng,

    destinationLat,
    setDestinationLat,

    destinationLng,
    setDestinationLng,

    originState,
    setOriginState,

    destinationState,
    setDestinationState,

    setIsInterState,
  } = useLocationContext();

  /* ------------------ LOADING ------------------ */

  const [originLoading, setOriginLoading] =
    useState(false);

  const [
    destinationLoading,
    setDestinationLoading,
  ] = useState(false);

  /* ------------------ HELPERS ------------------ */

  const extractCoordinates = (details) => {
    const location =
      details?.geometry?.location;

    if (!location) return null;

    return {
      lat: location.lat(),
      lng: location.lng(),
    };
  };

  const extractState = (details) => {
    if (!details?.address_components)
      return null;

    const stateComponent =
      details.address_components.find(
        (component) =>
          component.types.includes(
            "administrative_area_level_1"
          )
      );

    return (
      stateComponent?.long_name || null
    );
  };

  const saveLastDestination = async (
    destination
  ) => {
    try {
      localStorage.setItem(
        "lastDestination",
        destination
      );
    } catch (error) {
      console.log(error);
    }
  };

  /* ------------------ CLEAR INPUTS ------------------ */

  const clearOriginInput = () => {
    if (originInputRef.current) {
      originInputRef.current.value = "";
    }

    setOriginAddress(null);
  };

  const clearDestinationInput = () => {
    if (destinationInputRef.current) {
      destinationInputRef.current.value =
        "";
    }

    setDestinationAddress(null);
  };


  /* ------------------ INTERSTATE DETECTION ------------------ */

  useEffect(() => {
    if (
      originState &&
      destinationState
    ) {
      setIsInterState(
        originState !==
          destinationState
      );
    }
  }, [originState, destinationState]);

  /* ------------------ PREPOPULATE CURRENT LOCATION ------------------ */

  const populateCurrentLocation =
    async () => {
      try {
        if (!navigator.geolocation) {
          console.log(
            "Geolocation not supported"
          );

          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            setOriginLat(latitude);
            setOriginLng(longitude);

            const geocoder =
              new window.google.maps.Geocoder();

            geocoder.geocode(
              {
                location: {
                  lat: latitude,
                  lng: longitude,
                },
              },
              (results, status) => {
                if (
                  status === "OK" &&
                  results &&
                  results[0]
                ) {
                  const result =
                    results[0];

                  const address =
                    result.formatted_address;

                  if (
                    address &&
                    originInputRef.current
                  ) {
                    originInputRef.current.value =
                      address;

                    const details = {
                      geometry: {
                        location: {
                          lat: latitude,
                          lng: longitude,
                        },
                      },
                      address_components:
                        result.address_components,
                    };

                    setOriginAddress({
                      data: {
                        description:
                          address,
                      },
                      details,
                    });

                    const state =
                      extractState(
                        details
                      );

                    setOriginState(
                      state
                    );
                  }
                }
              }
            );
          },
          (error) => {
            console.log(
              "Location error",
              error
            );
          },
          {
            enableHighAccuracy: true,
          }
        );
      } catch (error) {
        console.log(
          "Location error",
          error
        );
      }
    };

  useEffect(() => {
    populateCurrentLocation();
  }, []);

  /* ------------------ GOOGLE PREDICTIONS ------------------ */

  const getPredictions = (
    value,
    type
  ) => {
    if (!value) {
      if (type === "origin") {
        setOriginPredictions([]);
      } else {
        setDestinationPredictions(
          []
        );
      }

      return;
    }

    const service =
      new window.google.maps.places
        .AutocompleteService();

    service.getPlacePredictions(
      {
        input: value,
        componentRestrictions: {
          country: "ng",
        },
      },
      (predictions, status) => {
        if (
          status !==
          window.google.maps.places
            .PlacesServiceStatus.OK
        ) {
          return;
        }

        if (type === "origin") {
          setOriginPredictions(
            predictions || []
          );

          setShowOriginDropdown(
            true
          );
        } else {
          setDestinationPredictions(
            predictions || []
          );

          setShowDestinationDropdown(
            true
          );
        }
      }
    );
  };

  /* ------------------ SELECT PLACE ------------------ */

  const selectPrediction = (
    prediction,
    type
  ) => {
    const service =
      new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

    service.getDetails(
      {
        placeId: prediction.place_id,
      },
      (details, status) => {
        if (
          status !==
          window.google.maps.places
            .PlacesServiceStatus.OK
        ) {
          return;
        }

        const address =
          details.formatted_address;

        const coords =
          extractCoordinates(details);

        const state =
          extractState(details);

        if (type === "origin") {
          setOriginAddress({
            data: prediction,
            details,
          });

          if (coords) {
            setOriginLat(coords.lat);
            setOriginLng(coords.lng);
          }

          setOriginState(state);

          setOriginPredictions([]);

          setShowOriginDropdown(
            false
          );

          if (originInputRef.current) {
            originInputRef.current.value =
              address;
          }
        } else {
          setDestinationAddress({
            data: prediction,
            details,
          });

          if (coords) {
            setDestinationLat(
              coords.lat
            );

            setDestinationLng(
              coords.lng
            );
          }

          setDestinationState(
            state
          );

          saveLastDestination(
            address
          );

          setDestinationPredictions(
            []
          );

          setShowDestinationDropdown(
            false
          );

          if (
            destinationInputRef.current
          ) {
            destinationInputRef.current.value =
              address;
          }
        }
      }
    );
  };

  /* ------------------ NEXT BUTTON ------------------ */

  const handleNextClick = () => {
    if (
      !originLat ||
      !destinationLat
    ) {
      alert(
        "Please select both pickup and destination locations."
      );

      return;
    }

    navigate("/send/parcel_notes");
  };

  return (
    <div className="destinationCon">
      {/* HEADER */}

      <div className="destinationHeader">
        <h2>
          Pickup & delivery
          locations
        </h2>
      </div>

      {/* SEARCH CARD */}

      <div className="destinationCard">
        {/* ORIGIN */}

        <div className="autocompleteContainer">
          <div className="inputWrapper">
            <input
              ref={originInputRef}
              type="text"
              placeholder="Pickup location"
              className="inputAutoComplete"
              onChange={(e) =>
                getPredictions(
                  e.target.value,
                  "origin"
                )
              }
              onFocus={() =>
                setShowOriginDropdown(
                  true
                )
              }
            />

            <div className="rightButtonContainer">
              {originLoading && (
                <span className="loadingText">
                  Loading...
                </span>
              )}

              <AiFillCloseCircle
                className="clearBtn"
                onClick={
                  clearOriginInput
                }
              />
            </div>
          </div>

          {/* ORIGIN DROPDOWN */}

          {showOriginDropdown &&
            originPredictions.length >
              0 && (
              <div className="placesDropdown">
                {originPredictions.map(
                  (item) => (
                    <div
                      key={
                        item.place_id
                      }
                      onClick={() =>
                        selectPrediction(
                          item,
                          "origin"
                        )
                      }
                    >
                      <PlaceRow
                        data={item}
                      />
                    </div>
                  )
                )}
              </div>
            )}
        </div>

        {/* DESTINATION */}

        <div className="autocompleteContainer">
          <div className="inputWrapper">
            <input
              ref={
                destinationInputRef
              }
              type="text"
              placeholder="Destination"
              className="inputAutoComplete"
              onChange={(e) =>
                getPredictions(
                  e.target.value,
                  "destination"
                )
              }
              onFocus={() =>
                setShowDestinationDropdown(
                  true
                )
              }
            />

            <div className="rightButtonContainer">
              {destinationLoading && (
                <span className="loadingText">
                  Loading...
                </span>
              )}

              <AiFillCloseCircle
                className="clearBtn"
                onClick={
                  clearDestinationInput
                }
              />
            </div>
          </div>

          {/* DESTINATION DROPDOWN */}

          {showDestinationDropdown &&
            destinationPredictions.length >
              0 && (
              <div className="placesDropdown">
                {destinationPredictions.map(
                  (item) => (
                    <div
                      key={
                        item.place_id
                      }
                      onClick={() =>
                        selectPrediction(
                          item,
                          "destination"
                        )
                      }
                    >
                      <PlaceRow
                        data={item}
                      />
                    </div>
                  )
                )}
              </div>
            )}
        </div>
      </div>

      {/* NEXT BUTTON */}

      <div
        className="locationNxtBtnCon"
        onClick={handleNextClick}
      >
        <MdNavigateNext className="locationNxtBtn" />
      </div>
    </div>
  );
}

export default DestinationSearch;