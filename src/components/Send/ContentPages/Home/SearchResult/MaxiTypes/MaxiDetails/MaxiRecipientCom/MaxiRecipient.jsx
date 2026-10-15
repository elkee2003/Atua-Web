import React from "react";
import { useNavigate } from "react-router-dom";
import { useOrderContext } from "../../../../../../../../../Providers/ClientProvider/OrderProvider";
import "./MaxiRecipient.css";

export default function MaxiRecipient() {
  const navigate = useNavigate();

  const {
    recipientName,
    recipientNumber,
    recipientNumber2,
    setRecipientName,
    setRecipientNumber,
    setRecipientNumber2,
    orderError,
    setOrderError,
  } = useOrderContext();

  const validateRecipientDetails = () => {
    setOrderError("");

    if (!recipientName || recipientName.trim().length < 2) {
      setOrderError("Recipient name is required");
      return false;
    }

    if (!recipientNumber || recipientNumber.length < 11) {
      setOrderError("Recipient phone must be at least 11 digits");
      return false;
    }

    return true;
  };

  const handleReviewOrder = () => {
    if (!validateRecipientDetails()) return;

    navigate("/send/maxi_submit");
  };

  return (
    <main className="maxiRecipient">
      <div className="maxiRecipient__content">
        <h1 className="maxiRecipient__title">Recipient Details</h1>

        <div className="maxiRecipient__fields">
          <input
            type="text"
            className="maxiRecipient__input"
            placeholder="Recipient Name *"
            value={recipientName ?? ""}
            onChange={(event) => {
              setRecipientName(event.target.value);
              setOrderError("");
            }}
            autoComplete="name"
          />

          <input
            type="tel"
            inputMode="tel"
            className="maxiRecipient__input"
            placeholder="Recipient Phone Number *"
            value={recipientNumber ?? ""}
            onChange={(event) => {
              setRecipientNumber(event.target.value);
              setOrderError("");
            }}
            autoComplete="tel"
          />

          <input
            type="tel"
            inputMode="tel"
            className="maxiRecipient__input"
            placeholder="Backup Phone Number"
            value={recipientNumber2 ?? ""}
            onChange={(event) => setRecipientNumber2(event.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {orderError && (
        <p className="maxiRecipient__error" role="alert">
          {orderError}
        </p>
      )}

      <footer className="maxiRecipient__footer">
        <button
          type="button"
          className="maxiRecipient__button"
          onClick={handleReviewOrder}
        >
          Review Order
        </button>
      </footer>
    </main>
  );
}
