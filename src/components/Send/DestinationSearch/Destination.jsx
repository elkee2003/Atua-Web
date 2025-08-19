import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete } from "@react-google-maps/api";
import "../SendStyles/Destination.css";
import { MdNavigateNext } from "react-icons/md";
import {useLocationContext} from '../../../../Provider/LocationProvider';

function DestinationSearch() {
  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const navigate = useNavigate();

  const {originPlace, destinationPlace, setOriginPlace, setDestinationPlace, originPlaceLat, setOriginPlaceLat, originPlaceLng, setOriginPlaceLng,  destinationPlaceLat, setDestinationPlaceLat, destinationPlaceLng, setDestinationPlaceLng} = useLocationContext()

  const handlePlaceChanged = (ref, type) => {
    if (!ref.current) return;
    const place = ref.current.getPlace();
    if (!place?.geometry) return;

    const address = place.formatted_address;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    if (type === "origin") {
      setOriginPlace(address);
      setOriginPlaceLat(lat);
      setOriginPlaceLng(lng);
    } else {
      setDestinationPlace(address);
      setDestinationPlaceLat(lat);
      setDestinationPlaceLng(lng);
    }
  };

  return (
    <div className="destinationCon">
      {/* Origin Input */}
      <div className="autocompleteContainer">
        <Autocomplete
          onLoad={(ref) => (originRef.current = ref)}
          onPlaceChanged={() => handlePlaceChanged(originRef, "origin")}
          options={{ componentRestrictions: { country: ["ng", "gh", "us"] } }}
        >
          <input
            type="text"
            placeholder="From?"
            className="inputAutoComplete"
          />
        </Autocomplete>
      </div>

      {/* Destination Input */}
      <div className="autocompleteContainer">
        <Autocomplete
          onLoad={(ref) => (destinationRef.current = ref)}
          onPlaceChanged={() => handlePlaceChanged(destinationRef, "destination")}
          options={{ componentRestrictions: { country: ["ng", "gh", "us"] } }}
        >
          <input
            type="text"
            placeholder="To?"
            className="inputAutoComplete"
          />
        </Autocomplete>
      </div>

      {/* Debug info */}
      <div style={{ marginTop: "20px" }}>
        <p>
          <strong>Origin:</strong> {originPlace} ({originPlaceLat},{" "}
          {originPlaceLng})
        </p>
        <p>
          <strong>Destination:</strong> {destinationPlace} (
          {destinationPlaceLat}, {destinationPlaceLng})
        </p>
      </div>

      {/* Next button */}
      <div
        className="locationNxtBtnCon"
        onClick={() => navigate("/send/parcel-notes")}
      >
        <MdNavigateNext className="locationNxtBtn" />
      </div>
    </div>
  );
}

export default DestinationSearch;