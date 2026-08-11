import React from "react";

import {
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaUniversity,
  FaSpinner,
  FaEye,
} from "react-icons/fa";

import "./CourierPayoutCard.css";

function CourierPayoutCard({ payout, onView }) {
  /*
    ==========================================================
    SAFETY
    ==========================================================
    */

  if (!payout) {
    return null;
  }

  /*
    ==========================================================
    PAYOUT DATA
    ==========================================================
    */

  const amount = Number(payout.amount ?? 0);

  const status = payout.status || "PENDING";

  const bankName = payout.bankName || "Bank not specified";

  const accountNumber = payout.accountNumber || "";

  const reference = payout.reference || payout.id || "No reference";

  /*
    ==========================================================
    FORMAT AMOUNT
    ==========================================================
    */

  const formatCurrency = (value) => {
    return `₦${value.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  /*
    ==========================================================
    MASK ACCOUNT NUMBER
    ==========================================================
    */

  const getMaskedAccountNumber = (account) => {
    if (!account) {
      return "Account not specified";
    }

    const cleaned = String(account).trim();

    if (cleaned.length <= 4) {
      return cleaned;
    }

    const lastFour = cleaned.slice(-4);

    return `•••• ${lastFour}`;
  };

  const maskedAccountNumber = getMaskedAccountNumber(accountNumber);

  /*
    ==========================================================
    STATUS INFORMATION
    ==========================================================
    */

  const getStatusConfig = () => {
    switch (status) {
      case "PAID":
        return {
          label: "Paid",
          className: "paid",
          icon: FaCheckCircle,
        };

      case "PROCESSING":
        return {
          label: "Processing",
          className: "processing",
          icon: FaSpinner,
        };

      case "FAILED":
        return {
          label: "Failed",
          className: "failed",
          icon: FaExclamationCircle,
        };

      case "PENDING":
      default:
        return {
          label: "Pending",
          className: "pending",
          icon: FaClock,
        };
    }
  };

  const statusConfig = getStatusConfig();

  const StatusIcon = statusConfig.icon;

  /*
    ==========================================================
    VIEW HANDLER
    ==========================================================
    */

  const handleView = () => {
    if (!onView) {
      return;
    }

    onView(payout);
  };

  /*
    ==========================================================
    COPY REFERENCE
    ==========================================================
    */

  const handleCopyReference = async () => {
    if (!reference) {
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(reference));
      }
    } catch (error) {
      console.error("Failed to copy payout reference:", error);
    }
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <article
      className={`
                courierPayoutCard
                courierPayoutCard-${statusConfig.className}
            `}
    >
      {/* ==================================================
                LEFT SIDE
            ================================================== */}

      <div className="courierPayoutCard-main">
        {/* ==================================================
                    PAYOUT ICON
                ================================================== */}

        <div className="courierPayoutCard-icon">
          <FaMoneyBillWave />
        </div>

        {/* ==================================================
                    PAYOUT INFORMATION
                ================================================== */}

        <div className="courierPayoutCard-information">
          {/* ==================================================
                        REFERENCE
                    ================================================== */}

          <div className="courierPayoutCard-referenceRow">
            <span className="courierPayoutCard-referenceLabel">
              Payout Reference
            </span>

            <span className="courierPayoutCard-reference">{reference}</span>

            {reference && (
              <button
                type="button"
                className="courierPayoutCard-copyButton"
                onClick={handleCopyReference}
                title="Copy payout reference"
                aria-label="Copy payout reference"
              >
                <FaCopy />
              </button>
            )}
          </div>

          {/* ==================================================
                        BANK INFORMATION
                    ================================================== */}

          <div className="courierPayoutCard-bank">
            <FaUniversity />

            <span>{bankName}</span>

            <span className="courierPayoutCard-account">
              {maskedAccountNumber}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================
                RIGHT SIDE
            ================================================== */}

      <div className="courierPayoutCard-side">
        {/* ==================================================
                    AMOUNT
                ================================================== */}

        <div className="courierPayoutCard-amount">{formatCurrency(amount)}</div>

        {/* ==================================================
                    STATUS
                ================================================== */}

        <div
          className={`
                        courierPayoutCard-status
                        courierPayoutCard-status-${statusConfig.className}
                    `}
        >
          <StatusIcon
            className={
              status === "PROCESSING" ? "courierPayoutCard-statusSpinner" : ""
            }
          />

          <span>{statusConfig.label}</span>
        </div>

        {/* ==================================================
                    VIEW BUTTON
                ================================================== */}

        {onView && (
          <button
            type="button"
            className="courierPayoutCard-viewButton"
            onClick={handleView}
          >
            <FaEye />

            <span>View</span>
          </button>
        )}
      </div>
    </article>
  );
}

export default CourierPayoutCard;
