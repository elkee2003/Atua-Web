import React from "react";
import "./OfferCard.css";

const OfferCard = ({
  offer,
  courier,
  order,
  onAccept,
  onCounter,
  isLatest,
  isAcceptDisabled,
}) => {
  const isUserTurn = isLatest && offer?.senderType === "COURIER";

  return (
    <div
      className={`maxi-offer-card ${isLatest ? "maxi-offer-card-latest" : ""}`}
    >
      <img
        src={courier?.imageUrl || "/placeholder.png"}
        alt={`${courier?.firstName || "Courier"} profile`}
        className="maxi-offer-avatar"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = "/placeholder.png";
        }}
      />

      <div className="maxi-offer-details">
        <h3 className="maxi-offer-name">
          {[courier?.firstName, courier?.lastName].filter(Boolean).join(" ") ||
            "Courier"}
        </h3>

        <p className="maxi-offer-vehicle">
          {[courier?.vehicleClass, courier?.model]
            .filter(Boolean)
            .join(" • ") || "Maxi courier"}
        </p>

        <p className="maxi-offer-price">
          ₦{Number(offer?.amount || 0).toLocaleString("en-NG")}
        </p>
      </div>

      <div className="maxi-offer-actions">
        <button
          type="button"
          className="maxi-offer-accept-button"
          onClick={onAccept}
          disabled={!isUserTurn || isAcceptDisabled}
        >
          Accept
        </button>

        <button
          type="button"
          className="maxi-offer-counter-button"
          onClick={onCounter}
          disabled={!isUserTurn}
        >
          Counter
        </button>
      </div>
    </div>
  );
};

export default OfferCard;
