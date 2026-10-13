import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { biddingEngine } from "../../../../../../../../modules/biddingEngine";
import "./MaxiBiddingSheet.css";

const MaxiBiddingSheet = ({
  order,
  offers = [],
  onAcceptOffer,
  onCounterOffer,
  expiresAt,
}) => {
  const listRef = useRef(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingCourierName, setWaitingCourierName] = useState("");
  const [counterAmount, setCounterAmount] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const navigate = useNavigate();

  const latestOffer = offers[0]?.offer;
  const latestOfferId = latestOffer?.id;

  const isAcceptDisabled =
    order?.status === "ACCEPTED" || latestOffer?.senderType !== "COURIER";

  // Stop waiting when a courier sends a new offer.
  useEffect(() => {
    if (isWaiting && latestOffer?.senderType === "COURIER") {
      setIsWaiting(false);
      setWaitingCourierName("");
    }
  }, [latestOffer, isWaiting]);

  // Scroll to the latest offer when the list updates.
  useEffect(() => {
    if (offers.length > 0 && listRef.current) {
      listRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [offers]);

  // Reset selection if offers are cleared.
  useEffect(() => {
    if (offers.length === 0) {
      setIsWaiting(false);
      setSelectedOffer(null);
      setCounterAmount("");
    }
  }, [offers.length]);

  // Prepopulate the counter input with the selected offer.
  useEffect(() => {
    if (selectedOffer && !isWaiting) {
      setCounterAmount(String(selectedOffer.amount ?? ""));
    }
  }, [selectedOffer, isWaiting]);

  const handleAccept = (offer) => {
    console.log("MAXI ACCEPT PRESSED:", {
      clickedOfferId: offer.id,
      latestOfferId,
      sameOffer: offer.id === latestOfferId,
    });

    if (offer.id !== latestOfferId || isAcceptDisabled) return;

    onAcceptOffer?.(offer);
  };

  const handleSelectCounter = (offer) => {
    if (offer.id !== latestOfferId || isWaiting) return;

    setSelectedOffer(offer);
    setCounterAmount(String(offer.amount ?? ""));
  };

  const handleSendCounter = () => {
    const amount = Number(counterAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Please enter a valid counter-offer amount.");
      return;
    }

    if (!selectedOffer || !latestOffer) {
      window.alert("Please select the latest offer first.");
      return;
    }

    const result = biddingEngine({
      order,
      latestOffer,
      newOffer: amount,
      offeredBy: "USER",
    });

    if (!result.success) {
      window.alert(result.message);
      return;
    }

    // If the customer matches the courier's amount, accept the offer.
    if (result.action === "ACCEPT") {
      onAcceptOffer?.(latestOffer);
      return;
    }

    const courierName = selectedOffer?.courier?.firstName || "Courier";

    onCounterOffer?.({
      offerId: selectedOffer.id,
      orderID: selectedOffer.orderID,
      courierID: selectedOffer.courierID,
      amount,
    });

    setWaitingCourierName(courierName);
    setCounterAmount("");
    setSelectedOffer(null);
    setIsWaiting(true);
  };

  return (
    <div className="maxi-bidding-container">
      {/* HEADER */}

      <div className="maxi-bidding-header">
        <div>
          <h2 className="maxi-bidding-title">Courier offers</h2>
          <p className="maxi-bidding-subtitle">
            Compare offers and choose the best price for your delivery.
          </p>
        </div>

        <span className="maxi-offer-count">
          {offers.length} {offers.length === 1 ? "offer" : "offers"}
        </span>
      </div>

      {/* OFFER STATUS */}

      <div
        className={`maxi-bidding-status ${
          offers.length === 0
            ? "maxi-bidding-status-waiting"
            : "maxi-bidding-status-active"
        }`}
      >
        <span className="maxi-bidding-status-dot" />

        <span>
          {offers.length === 0
            ? "Waiting for courier offers"
            : "Offers received"}
        </span>
      </div>

      {/* OFFER LIST */}

      <div className="maxi-offer-list" ref={listRef}>
        {offers.length === 0 ? (
          <div className="maxi-offer-empty">
            <div className="maxi-offer-empty-icon">₦</div>
            <h3>No offers yet</h3>
            <p>
              Nearby couriers will send their prices here when they respond to
              your delivery request.
            </p>
            {expiresAt && (
              <p className="maxi-offer-expiry">
                Offer deadline: {new Date(expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          offers.map((item) => {
            const offer = item.offer;
            const courier = item.courier;
            const isLatest = offer?.id === latestOfferId;
            const isSelected = selectedOffer?.id === offer?.id;

            return (
              <article
                className={`maxi-offer-card ${
                  isLatest ? "maxi-offer-card-latest" : ""
                } ${isSelected ? "maxi-offer-card-selected" : ""}`}
                key={offer.id}
              >
                <div className="maxi-offer-card-main">
                  <img
                    className="maxi-offer-avatar"
                    src={courier?.imageUrl || "/placeholder.png"}
                    alt={`${courier?.firstName || "Courier"} profile`}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/placeholder.png";
                    }}
                  />

                  <div className="maxi-offer-courier-info">
                    <div className="maxi-offer-name-row">
                      <h3>{courier?.firstName || "Courier"}</h3>

                      {isLatest && (
                        <span className="maxi-latest-badge">Latest</span>
                      )}
                    </div>

                    <p className="maxi-offer-vehicle">
                      {[courier?.transportationType, courier?.vehicleClass]
                        .filter(Boolean)
                        .join(" • ") || "Maxi courier"}
                    </p>

                    {courier?.vehicleColour && (
                      <p className="maxi-offer-vehicle-meta">
                        {[courier.vehicleColour, courier.plateNumber]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}

                    <p className="maxi-offer-sender">
                      {offer?.senderType === "COURIER"
                        ? "Courier offer"
                        : "Your counter-offer"}
                    </p>
                  </div>

                  <div className="maxi-offer-price">
                    <span className="maxi-offer-price-label">Offer</span>
                    <strong>
                      ₦{Number(offer?.amount || 0).toLocaleString("en-NG")}
                    </strong>
                  </div>
                </div>

                {isLatest && (
                  <div className="maxi-offer-actions">
                    <button
                      type="button"
                      className="maxi-accept-button"
                      disabled={isAcceptDisabled || isWaiting}
                      onClick={() => handleAccept(offer)}
                    >
                      Accept offer
                    </button>

                    <button
                      type="button"
                      className="maxi-counter-button"
                      disabled={isWaiting}
                      onClick={() => handleSelectCounter(offer)}
                    >
                      Counter
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* COUNTER-OFFER INPUT */}

      {selectedOffer && (
        <form
          className="maxi-counter-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSendCounter();
          }}
        >
          <label className="maxi-counter-label" htmlFor="maxi-counter-amount">
            Your counter-offer (₦)
          </label>

          <div className="maxi-counter-input-row">
            <input
              id="maxi-counter-amount"
              type="number"
              min="1"
              step="1"
              value={counterAmount}
              onChange={(event) => setCounterAmount(event.target.value)}
              placeholder="Enter counter offer"
              disabled={isWaiting}
              autoFocus
              required
            />

            <button
              type="submit"
              className="maxi-send-counter-button"
              disabled={isWaiting}
            >
              Send
            </button>
          </div>
        </form>
      )}

      {/* WAITING MESSAGE */}

      {isWaiting && (
        <div className="maxi-waiting-message" role="status">
          <span className="maxi-waiting-spinner" />
          <span>Waiting for {waitingCourierName}...</span>
        </div>
      )}

      {/* ORDER HISTORY */}

      <button
        type="button"
        className="maxi-order-history-button"
        onClick={() => navigate("/send/orders")}
      >
        Order History
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
};

export default MaxiBiddingSheet;
