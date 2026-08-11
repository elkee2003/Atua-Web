import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";

import "../SendStyles/ParcelNotes.css";

import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";
import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";

function ParcelNotes() {
  const navigate = useNavigate();

  const {
    recipientName,
    recipientNumber,
    recipientNumber2,
    orderDetails,
    setRecipientName,
    setRecipientNumber,
    setRecipientNumber2,
    setOrderDetails,
  } = useOrderContext();

  useAuthContext();

  const [recipientNameError, setRecipientNameError] = useState("");
  const [recipientNumberError, setRecipientNumberError] = useState("");

  /* ==========================================================
      VALIDATION
  ========================================================== */

  const validate = () => {
    let hasError = false;

    if (!recipientName.trim() || recipientName.trim().length < 2) {
      setRecipientNameError("Recipient name must be at least 2 characters.");
      hasError = true;
    } else {
      setRecipientNameError("");
    }

    if (!recipientNumber || recipientNumber.length < 11) {
      setRecipientNumberError("Phone number must be at least 11 digits.");
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
    recipientName.trim().length >= 2 && recipientNumber.length >= 11;

  return (
    <div className="parcelNotesPage">
      {/* ================= Header ================= */}

      <div className="parcelNotesHeader">
        <button className="parcelNotesBackButton" onClick={() => navigate(-1)}>
          <IoArrowBack />
        </button>

        <div>
          <h1 className="parcelNotesTitle">New Delivery</h1>

          <p className="parcelNotesSubtitle">
            Enter recipient and package details
          </p>
        </div>
      </div>

      {/* ================= Form Card ================= */}

      <div className="parcelNotesCard">
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
