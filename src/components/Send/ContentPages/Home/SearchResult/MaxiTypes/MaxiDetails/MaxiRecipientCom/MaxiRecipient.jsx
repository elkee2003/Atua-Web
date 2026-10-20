import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderContext } from "../../../../../../../../../Providers/ClientProvider/OrderProvider";
import { useAuthContext } from "../../../../../../../../../Providers/ClientProvider/AuthProvider";
import "./MaxiRecipient.css";

export default function MaxiRecipient() {
  const navigate = useNavigate();

  const {
    senderName,
    senderNumber,
    senderNumber2,
    recipientName,
    recipientNumber,
    recipientNumber2,
    setSenderName,
    setSenderNumber,
    setSenderNumber2,
    setRecipientName,
    setRecipientNumber,
    setRecipientNumber2,
    orders,
    setOrders,
    orderError,
    setOrderError,
  } = useOrderContext();

  const { dbUser } = useAuthContext();

  // useEffect to autofill Sender details

  useEffect(() => {
    if (!dbUser) return;

    const fullName = [dbUser.firstName, dbUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!senderName?.trim() && fullName) {
      setSenderName(fullName);
    }

    if (!senderNumber?.trim() && dbUser.phoneNumber) {
      setSenderNumber(dbUser.phoneNumber);
    }
  }, [dbUser, senderName, senderNumber, setSenderName, setSenderNumber]);

  const validateRecipientDetails = () => {
    setOrderError("");

    if (!senderName || senderName.trim().length < 2) {
      setOrderError("Sender name is required");
      return false;
    }

    if (!senderNumber || senderNumber.replace(/\D/g, "").length < 11) {
      setOrderError("Sender phone must be at least 11 digits");
      return false;
    }

    if (!recipientName || recipientName.trim().length < 2) {
      setOrderError("Recipient name is required");
      return false;
    }

    if (!recipientNumber || recipientNumber.replace(/\D/g, "").length < 11) {
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
        <h1 className="maxiRecipient__title">Sender & Recipient Details</h1>

        <div className="maxiRecipient__fields">
          {/* Sender Name */}

          <input
            type="text"
            className="maxiRecipient__input"
            placeholder="Sender Name *"
            value={senderName ?? ""}
            onChange={(event) => {
              setSenderName(event.target.value);
              setOrderError("");
            }}
            autoComplete="name"
          />

          {/* Sender Phone */}

          <input
            type="tel"
            inputMode="tel"
            className="maxiRecipient__input"
            placeholder="Sender Phone Number *"
            value={senderNumber ?? ""}
            onChange={(event) => {
              setSenderNumber(event.target.value);
              setOrderError("");
            }}
            autoComplete="tel"
          />

          {/* Sender Backup Phone */}

          <input
            type="tel"
            inputMode="tel"
            className="maxiRecipient__input"
            placeholder="Sender Backup Phone (Optional)"
            value={senderNumber2 ?? ""}
            onChange={(event) => setSenderNumber2(event.target.value)}
            autoComplete="off"
          />

          {/* Recipient Name */}

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

          {/* Recipient Phone */}

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

          {/* Recipient Backup Phone */}

          <input
            type="tel"
            inputMode="tel"
            className="maxiRecipient__input"
            placeholder="Recipient Backup Phone (Optional)"
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
