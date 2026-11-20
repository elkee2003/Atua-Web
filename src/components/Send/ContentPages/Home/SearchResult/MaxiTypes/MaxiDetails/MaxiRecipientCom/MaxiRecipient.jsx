import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderContext } from "../../../../../../../../../Providers/ClientProvider/OrderProvider";
import { useAuthContext } from "../../../../../../../../../Providers/ClientProvider/AuthProvider";
import "./MaxiRecipient.css";

const PAYER_OPTIONS = [
  {
    value: "SENDER",
    title: "Myself (Sender)",
    description: "I'll pay for this delivery.",
    icon: "👤",
  },
  {
    value: "RECEIVER",
    title: "Receiver",
    description: "The recipient will pay for this delivery.",
    icon: "📦",
  },
];

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
    paymentResponsibility,
    setPaymentResponsibility,
    paymentTiming,
    setPaymentTiming,
    paymentMethod,
    setPaymentMethod,
    orderError,
    setOrderError,
  } = useOrderContext();

  const { dbUser } = useAuthContext();

  // Tracks whether sender autofill has already been attempted.
  // This prevents cleared fields from being filled again.
  const hasAutofilledSender = useRef(false);

  // Autofill sender details from the authenticated user's profile.
  // Uses the same approach as WriteOrder.jsx.
  useEffect(() => {
    if (!dbUser || hasAutofilledSender.current) return;

    const fullName = [dbUser.firstName, dbUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const phone = dbUser.phoneNumber?.trim() || "";

    // Wait until at least one sender detail is available.
    if (!fullName && !phone) return;

    // Mark autofill as completed so cleared fields won't refill.
    hasAutofilledSender.current = true;

    // Only autofill sender fields that are currently empty.
    if (!senderName?.trim() && fullName) {
      setSenderName(fullName);
    }

    if (!senderNumber?.trim() && phone) {
      setSenderNumber(phone);
    }
  }, [dbUser, senderName, senderNumber, setSenderName, setSenderNumber]);

  const selectPaymentResponsibility = (responsibility) => {
    setPaymentResponsibility(responsibility);

    if (responsibility === "SENDER") {
      // Default selection; sender can change this to cash at pickup.
      setPaymentTiming("BEFORE_PICKUP");
      setPaymentMethod("PAYSTACK");
    } else {
      // Receiver chooses cash or electronic payment on delivery.
      setPaymentTiming("ON_DELIVERY");
      setPaymentMethod(null);
    }

    setOrderError("");
  };

  const validateRecipientDetails = () => {
    setOrderError("");

    if (!senderName?.trim() || senderName.trim().length < 2) {
      setOrderError("Sender name is required.");
      return false;
    }

    if (!senderNumber || senderNumber.replace(/\D/g, "").length < 11) {
      setOrderError("Sender phone must be at least 11 digits.");
      return false;
    }

    if (!recipientName?.trim() || recipientName.trim().length < 2) {
      setOrderError("Recipient name is required.");
      return false;
    }

    if (!recipientNumber || recipientNumber.replace(/\D/g, "").length < 11) {
      setOrderError("Recipient phone must be at least 11 digits.");
      return false;
    }

    if (!["SENDER", "RECEIVER"].includes(paymentResponsibility)) {
      setOrderError("Please select who will pay for the delivery.");
      return false;
    }

    const validPaymentArrangement =
      (paymentResponsibility === "SENDER" &&
        paymentTiming === "BEFORE_PICKUP" &&
        paymentMethod === "PAYSTACK") ||
      (paymentResponsibility === "SENDER" &&
        paymentTiming === "AT_PICKUP" &&
        paymentMethod === "CASH") ||
      (paymentResponsibility === "RECEIVER" &&
        paymentTiming === "ON_DELIVERY" &&
        paymentMethod == null);

    if (!validPaymentArrangement) {
      setOrderError("Please select who will pay for the delivery again.");
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

        <section className="maxiRecipient__payerSection">
          <h2 className="maxiRecipient__sectionTitle">
            Who will pay for this delivery?
          </h2>

          <p className="maxiRecipient__payerSubtitle">
            Choose who is responsible for paying the delivery fee.
          </p>

          <div
            className="maxiRecipient__payerOptions"
            role="radiogroup"
            aria-label="Who will pay for this delivery?"
          >
            {PAYER_OPTIONS.map((option) => {
              const selected = paymentResponsibility === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={[
                    "maxiRecipient__payerOption",
                    selected ? "maxiRecipient__payerOption--selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => selectPaymentResponsibility(option.value)}
                  role="radio"
                  aria-checked={selected}
                >
                  <span className="maxiRecipient__payerIcon">
                    {option.icon}
                  </span>

                  <span className="maxiRecipient__payerText">
                    <span className="maxiRecipient__payerTitle">
                      {option.title}
                    </span>

                    <span className="maxiRecipient__payerDescription">
                      {option.description}
                    </span>
                  </span>

                  <span
                    className={[
                      "maxiRecipient__radio",
                      selected ? "maxiRecipient__radio--selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-hidden="true"
                  >
                    {selected && <span className="maxiRecipient__radioInner" />}
                  </span>
                </button>
              );
            })}
          </div>

          {paymentResponsibility === "SENDER" && (
            <div className="maxiRecipient__paymentMethods">
              <h3 className="maxiRecipient__sectionTitle">
                How would you like to pay?
              </h3>

              <button
                type="button"
                className={`maxiRecipient__payerOption ${
                  paymentTiming === "BEFORE_PICKUP" &&
                  paymentMethod === "PAYSTACK"
                    ? "maxiRecipient__payerOption--selected"
                    : ""
                }`}
                onClick={() => {
                  setPaymentTiming("BEFORE_PICKUP");
                  setPaymentMethod("PAYSTACK");
                  setOrderError("");
                }}
                aria-pressed={
                  paymentTiming === "BEFORE_PICKUP" &&
                  paymentMethod === "PAYSTACK"
                }
              >
                <span className="maxiRecipient__payerText">
                  <span className="maxiRecipient__payerTitle">
                    Pay electronically before pickup
                  </span>
                  <span className="maxiRecipient__payerDescription">
                    Pay online. Payment must be verified before pickup proceeds
                    under the applicable payment rules.
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={`maxiRecipient__payerOption ${
                  paymentTiming === "AT_PICKUP" && paymentMethod === "CASH"
                    ? "maxiRecipient__payerOption--selected"
                    : ""
                }`}
                onClick={() => {
                  setPaymentTiming("AT_PICKUP");
                  setPaymentMethod("CASH");
                  setOrderError("");
                }}
                aria-pressed={
                  paymentTiming === "AT_PICKUP" && paymentMethod === "CASH"
                }
              >
                <span className="maxiRecipient__payerText">
                  <span className="maxiRecipient__payerTitle">
                    Pay cash at pickup
                  </span>
                  <span className="maxiRecipient__payerDescription">
                    Pay the courier in cash when your item is collected.
                  </span>
                </span>
              </button>
            </div>
          )}

          <div className="maxiRecipient__payerNotice" role="note">
            {paymentResponsibility === "SENDER" &&
            paymentTiming === "BEFORE_PICKUP" &&
            paymentMethod === "PAYSTACK"
              ? "You will pay electronically before pickup. Payment must be verified before it is treated as paid."
              : paymentResponsibility === "SENDER" &&
                  paymentTiming === "AT_PICKUP" &&
                  paymentMethod === "CASH"
                ? "You will pay the courier in cash when your item is collected."
                : paymentResponsibility === "RECEIVER"
                  ? "The receiver can pay in cash or electronically when the courier arrives. If the receiver refuses or fails to pay, you, the sender, remain responsible for settling the outstanding delivery fee with Atua. Electronic payments must be verified before they count as paid."
                  : "Please select who will pay for the delivery."}
          </div>
        </section>

        <section className="maxiRecipient__section">
          <h2 className="maxiRecipient__sectionTitle">Sender Details</h2>

          <div className="maxiRecipient__fields">
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
              aria-label="Sender name"
            />

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
              aria-label="Sender phone number"
            />

            <input
              type="tel"
              inputMode="tel"
              className="maxiRecipient__input"
              placeholder="Sender Backup Phone (Optional)"
              value={senderNumber2 ?? ""}
              onChange={(event) => setSenderNumber2(event.target.value)}
              autoComplete="off"
              aria-label="Sender backup phone"
            />
          </div>
        </section>

        <section className="maxiRecipient__section">
          <h2 className="maxiRecipient__sectionTitle">Recipient Details</h2>

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
              aria-label="Recipient name"
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
              aria-label="Recipient phone number"
            />

            <input
              type="tel"
              inputMode="tel"
              className="maxiRecipient__input"
              placeholder="Recipient Backup Phone (Optional)"
              value={recipientNumber2 ?? ""}
              onChange={(event) => setRecipientNumber2(event.target.value)}
              autoComplete="off"
              aria-label="Recipient backup phone"
            />
          </div>
        </section>
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
