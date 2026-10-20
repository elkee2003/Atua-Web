import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";

import "../SendStyles/ParcelNotes.css";

import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";
import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";

function ParcelNotes() {
  const navigate = useNavigate();

  const {
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

  // useEffect to autofill sender details

  useEffect(() => {
    if (!dbUser) return;

    const fullName = [dbUser.firstName, dbUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    // Populate sender details only when the fields are empty.
    if (!senderName?.trim() && fullName) {
      setSenderName(fullName);
    }

    if (!senderNumber?.trim() && dbUser.phoneNumber) {
      setSenderNumber(dbUser.phoneNumber);
    }
  }, [dbUser, senderName, senderNumber, setSenderName, setSenderNumber]);

  /* ==========================================================
      VALIDATION
  ========================================================== */

  const validate = () => {
    let hasError = false;

    // Sender name
    if (!senderName?.trim() || senderName.trim().length < 2) {
      setSenderNameError("Sender name must be at least 2 characters.");
      hasError = true;
    } else {
      setSenderNameError("");
    }

    // Sender phone number
    if (!senderNumber?.trim() || senderNumber.trim().length < 11) {
      setSenderNumberError(
        "Sender phone number must be at least 11 characters.",
      );
      hasError = true;
    } else {
      setSenderNumberError("");
    }

    // Recipient name
    if (!recipientName?.trim() || recipientName.trim().length < 2) {
      setRecipientNameError("Recipient name must be at least 2 characters.");
      hasError = true;
    } else {
      setRecipientNameError("");
    }

    // Recipient phone number
    if (!recipientNumber?.trim() || recipientNumber.trim().length < 11) {
      setRecipientNumberError("Phone number must be at least 11 characters.");
      hasError = true;
    } else {
      setRecipientNumberError("");
    }

    return !hasError;
  };

  /* ==========================================================
      NEXT PAGE
  ========================================================== */

  const goToReviewOrder = () => {
    if (validate()) {
      navigate("/send/checkout");
    }
  };

  const isFormValid =
    senderName.trim().length >= 2 &&
    senderNumber.trim().length >= 11 &&
    recipientName.trim().length >= 2 &&
    recipientNumber.trim().length >= 11;

  return (
    <div className="parcelNotesPage">
      {/* ================= Header ================= */}

      <div className="parcelNotesHeader">
        <button className="parcelNotesBackButton" onClick={() => navigate(-1)}>
          <IoArrowBack />
        </button>

        <div>
          <h1 className="parcelNotesTitle">New Delivery</h1>

          <p className="parcelNotesSubtitle">Enter Package Details</p>
        </div>
      </div>

      {/* ================= Form Card ================= */}

      <div className="parcelNotesCard">
        {/* ================= Sender Details ================= */}

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Sender Name</label>

          <input
            type="text"
            value={senderName}
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
            value={senderNumber}
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
            value={senderNumber2}
            placeholder="e.g. 07012345678"
            onChange={(e) => setSenderNumber2(e.target.value)}
            className="parcelNotesInputField"
          />
        </div>

        {/* Recipient Name */}

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Recipient Name</label>

          <input
            type="text"
            value={recipientName}
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

        {/* Phone Number */}

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Phone Number</label>

          <input
            type="tel"
            value={recipientNumber}
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

        {/* Backup Number */}

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Backup Number (Optional)</label>

          <input
            type="tel"
            value={recipientNumber2}
            placeholder="e.g. 07012345678"
            onChange={(e) => setRecipientNumber2(e.target.value)}
            className="parcelNotesInputField"
          />
        </div>

        {/* Package Details */}

        <div className="parcelNotesInputGroup">
          <label className="parcelNotesLabel">Package Details</label>

          <textarea
            rows={5}
            value={orderDetails}
            placeholder="Describe the package briefly (Letter, Food, Clothes, Breakable items, etc.)"
            onChange={(e) => setOrderDetails(e.target.value)}
            className="parcelNotesTextArea"
          />
        </div>
      </div>

      {/* ================= Footer ================= */}

      <div className="parcelNotesFooter">
        <button
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
