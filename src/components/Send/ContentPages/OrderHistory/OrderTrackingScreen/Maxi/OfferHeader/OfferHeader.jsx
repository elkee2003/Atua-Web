import React from "react";
import "./OfferHeader.css";

const OfferHeader = ({ offersCount }) => {
  const isEmpty = offersCount === 0;
  const offerText = offersCount === 1 ? "Offer" : "Offers";

  return (
    <div className="maxi-offer-header">
      {/* STATUS PILL */}

      <div
        className={`maxi-offer-status-pill ${
          isEmpty ? "maxi-offer-status-waiting" : "maxi-offer-status-active"
        }`}
      >
        <span
          className={`maxi-offer-status-dot ${
            isEmpty ? "maxi-offer-dot-waiting" : "maxi-offer-dot-active"
          }`}
        />

        <span className="maxi-offer-status-text">
          {isEmpty ? "Waiting for couriers" : "Live offers"}
        </span>
      </div>

      {/* MAIN TITLE */}

      <h2 className="maxi-offer-header-title">
        {isEmpty
          ? "Finding nearby couriers..."
          : `${offersCount} ${offerText} Received`}
      </h2>

      {/* SUBTITLE */}

      <p className="maxi-offer-header-subtitle">
        {isEmpty
          ? "We've notified available couriers in your area"
          : "Compare and select the best offer"}
      </p>
    </div>
  );
};

export default OfferHeader;
