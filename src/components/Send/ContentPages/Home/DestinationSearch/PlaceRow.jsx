import React from "react";
import { HiLocationMarker } from "react-icons/hi";
import "./Destination.css";

const PlaceRow = ({ data }) => {
  const description =
    data.description || data.vicinity;

  return (
    <div className="placeRow">
      <div className="iconContainer">
        <HiLocationMarker
          size={18}
          color="#fff"
        />
      </div>

      <div className="textContainer">
        <p className="locationTitle">
          {description}
        </p>

        <p className="locationSubtitle">
          Click to select location
        </p>
      </div>
    </div>
  );
};

export default PlaceRow;