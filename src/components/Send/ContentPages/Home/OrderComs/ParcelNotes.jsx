import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoArrowBack,
  IoArrowForward,
  IoPersonOutline,
  IoPersonAddOutline,
  IoCheckmarkCircle,
  IoEllipseOutline,
} from "react-icons/io5";

import "../SendStyles/ParcelNotes.css";

import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";
import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";

function ParcelNotes() {
  const navigate = useNavigate();

  const {
    paymentResponsibility,
    setPaymentResponsibility,
    paymentTiming,
    setPaymentTiming,
    paymentMethod,
    setPaymentMethod,
    senderName,
    senderNumber,
    senderNumber2,
    recipientName,
    recipientNumber,
    recipientNumber2,
    orderDetails,
    setSenderName,
    setSenderNumber,
    setSenderNumber2,
    setRecipientName,
    setRecipientNumber,
    setRecipientNumber2,
    setOrderDetails,
  } = useOrderContext();

  const { dbUser } = useAuthContext();

  const [recipientNameError, setRecipientNameError] = useState("");
  const [recipientNumberError, setRecipientNumberError] = useState("");
  const [senderNameError, setSenderNameError] = useState("");
  const [senderNumberError, setSenderNumberError] = useState("");

  console.log("Payment Method:", paymentMethod);

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

    // Complete the autofill attempt so cleared fields won't refill.
    hasAutofilledSender.current = true;

    // Only fill sender fields that are currently empty.
    if (!senderName?.trim() && fullName) {
      setSenderName(fullName);
    }

    if (!senderNumber?.trim() && phone) {
      setSenderNumber(phone);
    }
  }, [dbUser, senderName, senderNumber, setSenderName, setSenderNumber]);

  const selectPaymentResponsibility = (responsibility) => {
    // Always update all related payment fields together.
    // Do not leave values from the previous selection behind.

    if (responsibility === "SENDER") {
      setPaymentResponsibility("SENDER");
      setPaymentTiming("BEFORE_PICKUP");
      setPaymentMethod("PAYSTACK");
      return;
    }

    if (responsibility === "RECEIVER") {
      setPaymentResponsibility("RECEIVER");
      setPaymentTiming("ON_DELIVERY");
      setPaymentMethod(null);
      console.log("Payment Method In Receiver:", paymentMethod);
    }
  };

  const selectPaymentArrangement = (timing, method) => {
    setPaymentTiming(timing);
    setPaymentMethod(method);
  };

  // Validate the form before continuing.
  const validate = () => {
    let hasError = false;

    if (!senderName?.trim() || senderName.trim().length < 2) {
      setSenderNameError("Sender name must be at least 2 characters.");
      hasError = true;
    } else {
      setSenderNameError("");
    }

    if (!senderNumber?.trim() || senderNumber.trim().length < 11) {
      setSenderNumberError(
        "Sender phone number must be at least 11 characters.",
      );
      hasError = true;
    } else {
      setSenderNumberError("");
    }

    if (!recipientName?.trim() || recipientName.trim().length < 2) {
      setRecipientNameError("Recipient name must be at least 2 characters.");
      hasError = true;
    } else {
      setRecipientNameError("");
    }

    if (!recipientNumber?.trim() || recipientNumber.trim().length < 11) {
      setRecipientNumberError("Phone number must be at least 11 characters.");
      hasError = true;
    } else {
      setRecipientNumberError("");
    }

    return !hasError;
  };

  const goToReviewOrder = () => {
    if (validate()) {
      navigate("/send/checkout");
    }
  };

  const isFormValid =
    (senderName || "").trim().length >= 2 &&
    (senderNumber || "").trim().length >= 11 &&
    (recipientName || "").trim().length >= 2 &&
    (recipientNumber || "").trim().length >= 11;

  return (
    <div className="parcelNotesPage">
      {/* Header */}
      <div className="parcelNotesHeader">
        <button
          type="button"
          className="parcelNotesBackButton"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <IoArrowBack />
        </button>

        <div>
          <h1 className="parcelNotesTitle">New Delivery</h1>
          <p className="parcelNotesSubtitle">Enter Package Details</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="parcelNotesCard">
        {/* Payment Responsibility and Arrangement */}
        <div className="parcelNotesPaymentSection">
          <div className="parcelNotesPaymentHeading">
            <h2 className="parcelNotesPaymentTitle">
              Who will pay for this delivery?
            </h2>

            <p className="parcelNotesPaymentSubtitle">
              Choose who is responsible for paying the delivery fee.
            </p>
          </div>

          {/* Sender pays */}
          <button
            type="button"
            className={`parcelNotesPaymentOption ${
              paymentResponsibility === "SENDER"
                ? "parcelNotesPaymentOptionSelected"
                : ""
            }`}
            onClick={() => selectPaymentResponsibility("SENDER")}
            aria-pressed={paymentResponsibility === "SENDER"}
          >
            <span className="parcelNotesPaymentIcon">
              <IoPersonOutline />
            </span>

            <span className="parcelNotesPaymentContent">
              <span className="parcelNotesPaymentOptionTitle">I'll pay</span>
              <span className="parcelNotesPaymentOptionDescription">
                You pay the delivery fee. Choose electronic payment before
                pickup or cash at pickup.
              </span>
            </span>

            <span className="parcelNotesPaymentRadio">
              {paymentResponsibility === "SENDER" ? (
                <IoCheckmarkCircle />
              ) : (
                <IoEllipseOutline />
              )}
            </span>
          </button>

          {/* Receiver pays */}
          <button
            type="button"
            className={`parcelNotesPaymentOption ${
              paymentResponsibility === "RECEIVER"
                ? "parcelNotesPaymentOptionSelected"
                : ""
            }`}
            onClick={() => selectPaymentResponsibility("RECEIVER")}
            aria-pressed={paymentResponsibility === "RECEIVER"}
          >
            <span className="parcelNotesPaymentIcon">
              <IoPersonAddOutline />
            </span>

            <span className="parcelNotesPaymentContent">
              <span className="parcelNotesPaymentOptionTitle">
                The receiver will pay
              </span>
              <span className="parcelNotesPaymentOptionDescription">
                The receiver can pay electronically or in cash when the courier
                arrives.
              </span>
            </span>

            <span className="parcelNotesPaymentRadio">
              {paymentResponsibility === "RECEIVER" ? (
                <IoCheckmarkCircle />
              ) : (
                <IoEllipseOutline />
              )}
            </span>
          </button>

          {paymentResponsibility === "SENDER" ? (
            <>
              <div className="parcelNotesPaymentHeading parcelNotesPaymentMethodHeading">
                <h2 className="parcelNotesPaymentTitle">
                  How would you like to pay?
                </h2>

                <p className="parcelNotesPaymentSubtitle">
                  Choose how you will settle the delivery fee.
                </p>
              </div>

              {/* Sender pays electronically before pickup */}
              <button
                type="button"
                className={`parcelNotesPaymentOption ${
                  paymentTiming === "BEFORE_PICKUP" &&
                  paymentMethod === "PAYSTACK"
                    ? "parcelNotesPaymentOptionSelected"
                    : ""
                }`}
                onClick={() =>
                  selectPaymentArrangement("BEFORE_PICKUP", "PAYSTACK")
                }
                aria-pressed={
                  paymentTiming === "BEFORE_PICKUP" &&
                  paymentMethod === "PAYSTACK"
                }
              >
                <span className="parcelNotesPaymentIcon">
                  <IoPersonOutline />
                </span>

                <span className="parcelNotesPaymentContent">
                  <span className="parcelNotesPaymentOptionTitle">
                    Pay electronically before pickup
                  </span>
                  <span className="parcelNotesPaymentOptionDescription">
                    Pay through Paystack. Atua must verify the payment before
                    the order proceeds under the applicable payment rules.
                  </span>
                </span>

                <span className="parcelNotesPaymentRadio">
                  {paymentTiming === "BEFORE_PICKUP" &&
                  paymentMethod === "PAYSTACK" ? (
                    <IoCheckmarkCircle />
                  ) : (
                    <IoEllipseOutline />
                  )}
                </span>
              </button>

              {/* Sender pays cash at pickup */}
              <button
                type="button"
                className={`parcelNotesPaymentOption ${
                  paymentTiming === "AT_PICKUP" && paymentMethod === "CASH"
                    ? "parcelNotesPaymentOptionSelected"
                    : ""
                }`}
                onClick={() => selectPaymentArrangement("AT_PICKUP", "CASH")}
                aria-pressed={
                  paymentTiming === "AT_PICKUP" && paymentMethod === "CASH"
                }
              >
                <span className="parcelNotesPaymentIcon">
                  <IoPersonOutline />
                </span>

                <span className="parcelNotesPaymentContent">
                  <span className="parcelNotesPaymentOptionTitle">
                    Pay cash at pickup
                  </span>
                  <span className="parcelNotesPaymentOptionDescription">
                    Pay the courier in cash when your package is collected.
                  </span>
                </span>

                <span className="parcelNotesPaymentRadio">
                  {paymentTiming === "AT_PICKUP" && paymentMethod === "CASH" ? (
                    <IoCheckmarkCircle />
                  ) : (
                    <IoEllipseOutline />
                  )}
                </span>
              </button>
            </>
          ) : (
            <div className="parcelNotesPaymentNotice" role="note">
              <span className="parcelNotesPaymentNoticeIcon" aria-hidden="true">
                <span>!</span>
              </span>

              <div className="parcelNotesPaymentNoticeContent">
                <h3 className="parcelNotesPaymentNoticeTitle">
                  Important: You remain responsible
                </h3>

                <p className="parcelNotesPaymentNoticeText">
                  If the receiver refuses or fails to pay, you, as the sender,
                  remain responsible for settling the outstanding delivery fee
                  with Atua.
                </p>

                <p className="parcelNotesPaymentNoticeText">
                  The receiver can pay in cash or electronically when the
                  courier arrives. Electronic payments must be verified before
                  they are treated as paid.
                </p>

                <p className="parcelNotesPaymentNoticeText">
                  You may also share a payment link in advance if the payment
                  option is made available for your order.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sender Details */}
        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Sender Name</label>

          <input
            type="text"
            value={senderName || ""}
            placeholder="e.g. John Doe"
            onChange={(e) => {
              setSenderName(e.target.value);
              setSenderNameError("");
            }}
            className={
              senderNameError
                ? "parcelNotesInputField parcelNotesInputError"
                : "parcelNotesInputField"
            }
          />

          {senderNameError && (
            <span className="parcelNotesErrorText">{senderNameError}</span>
          )}
        </div>

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Sender Phone Number</label>

          <input
            type="tel"
            value={senderNumber || ""}
            placeholder="e.g. 08012345678"
            onChange={(e) => {
              setSenderNumber(e.target.value);
              setSenderNumberError("");
            }}
            className={
              senderNumberError
                ? "parcelNotesInputField parcelNotesInputError"
                : "parcelNotesInputField"
            }
          />

          {senderNumberError && (
            <span className="parcelNotesErrorText">{senderNumberError}</span>
          )}
        </div>

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">
            Sender Backup Number (Optional)
          </label>

          <input
            type="tel"
            value={senderNumber2 || ""}
            placeholder="e.g. 07012345678"
            onChange={(e) => setSenderNumber2(e.target.value)}
            className="parcelNotesInputField"
          />
        </div>

        {/* Recipient Details */}
        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Recipient Name</label>

          <input
            type="text"
            value={recipientName || ""}
            placeholder="e.g. John Doe"
            onChange={(e) => setRecipientName(e.target.value)}
            className={
              recipientNameError
                ? "parcelNotesInputField parcelNotesInputError"
                : "parcelNotesInputField"
            }
          />

          {recipientNameError && (
            <span className="parcelNotesErrorText">{recipientNameError}</span>
          )}
        </div>

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Recipient Phone Number</label>

          <input
            type="tel"
            value={recipientNumber || ""}
            placeholder="e.g. 08012345678"
            onChange={(e) => setRecipientNumber(e.target.value)}
            className={
              recipientNumberError
                ? "parcelNotesInputField parcelNotesInputError"
                : "parcelNotesInputField"
            }
          />

          {recipientNumberError && (
            <span className="parcelNotesErrorText">{recipientNumberError}</span>
          )}
        </div>

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">
            Recipient Backup Number (Optional)
          </label>

          <input
            type="tel"
            value={recipientNumber2 || ""}
            placeholder="e.g. 07012345678"
            onChange={(e) => setRecipientNumber2(e.target.value)}
            className="parcelNotesInputField"
          />
        </div>

        {/* Package Details */}
        <div className="parcelNotesInputGroup parcelNotesPackageDetails">
          <textarea
            rows={5}
            value={orderDetails || ""}
            placeholder="Describe the package briefly (Letter, Food, Clothes, Breakable items, etc.)"
            onChange={(e) => setOrderDetails(e.target.value)}
            className="parcelNotesTextArea"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="parcelNotesFooter">
        <button
          type="button"
          className={`parcelNotesButton ${
            !isFormValid ? "parcelNotesButtonDisabled" : ""
          }`}
          onClick={goToReviewOrder}
          disabled={!isFormValid}
        >
          <span>Review Order</span>
          <IoArrowForward size={18} />
        </button>
      </div>
    </div>
  );
}

export default ParcelNotes;
