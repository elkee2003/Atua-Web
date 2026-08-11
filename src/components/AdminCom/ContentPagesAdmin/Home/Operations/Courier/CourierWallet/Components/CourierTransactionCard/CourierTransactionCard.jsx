import React, { useMemo } from "react";

import {
  FaArrowDown,
  FaArrowUp,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaExchangeAlt,
  FaHashtag,
  FaReceipt,
} from "react-icons/fa";

import "./CourierTransactionCard.css";

function CourierTransactionCard({ transaction, onClick }) {
  /*
  ==========================================================
  SAFE VALUES
  ==========================================================
  */

  const type = transaction?.type || "CREDIT";

  const status = transaction?.status || "PENDING";

  const amount = Number(transaction?.amount) || 0;

  /*
  ==========================================================
  TRANSACTION TYPE
  ==========================================================
  */

  const isCredit = type === "CREDIT";

  const isDebit = type === "DEBIT";

  /*
  ==========================================================
  DISPLAY INFORMATION
  ==========================================================
  */

  const transactionIcon = isCredit ? (
    <FaArrowDown />
  ) : isDebit ? (
    <FaArrowUp />
  ) : (
    <FaExchangeAlt />
  );

  const transactionLabel = isCredit ? "Credit" : isDebit ? "Debit" : type;

  /*
  ==========================================================
  STATUS
  ==========================================================
  */

  const statusInfo = useMemo(() => {
    switch (status) {
      case "COMPLETED":
        return {
          label: "Completed",
          className: "completed",
          icon: <FaCheckCircle />,
        };

      case "PENDING":
        return {
          label: "Pending",
          className: "pending",
          icon: <FaClock />,
        };

      default:
        return {
          label:
            status
              ?.replaceAll("_", " ")
              ?.toLowerCase()
              ?.replace(/\b\w/g, (char) => char.toUpperCase()) || "Unknown",
          className: "unknown",
          icon: <FaExclamationCircle />,
        };
    }
  }, [status]);

  /*
  ==========================================================
  DESCRIPTION
  ==========================================================
  */

  const description =
    transaction?.description || (isCredit ? "Wallet credit" : "Wallet debit");

  /*
  ==========================================================
  CURRENCY FORMATTER
  ==========================================================
  */

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  /*
  ==========================================================
  DATE FORMATTER
  ==========================================================
  */

  const formattedDate = transaction?.createdAt
    ? new Date(transaction.createdAt)
    : null;

  const validDate = formattedDate && !Number.isNaN(formattedDate.getTime());

  const dateLabel = validDate
    ? formattedDate.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";

  const timeLabel = validDate
    ? formattedDate.toLocaleTimeString("en-NG", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  /*
  ==========================================================
  REFERENCE
  ==========================================================
  */

  const reference = transaction?.id || "Unavailable";

  /*
  ==========================================================
  ORDER REFERENCE
  ==========================================================
  */

  const orderReference = transaction?.orderID || null;

  /*
  ==========================================================
  PAYMENT REFERENCE
  ==========================================================
  */

  const paymentReference = transaction?.paymentID || null;

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <article
      className={`
        courierTransactionCard
        ${isCredit ? "credit" : ""}
        ${isDebit ? "debit" : ""}
        ${onClick ? "clickable" : ""}
      `}
      onClick={onClick ? () => onClick(transaction) : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                onClick(transaction);
              }
            }
          : undefined
      }
    >
      {/* ==================================================
          LEFT
      ================================================== */}

      <div className="courierTransactionCard-left">
        {/* TRANSACTION ICON */}

        <div className="courierTransactionCard-icon">{transactionIcon}</div>

        {/* TRANSACTION INFORMATION */}

        <div className="courierTransactionCard-main">
          <div className="courierTransactionCard-titleRow">
            <h3>{description}</h3>

            <span
              className={`
                courierTransactionCard-type
                ${isCredit ? "credit" : "debit"}
              `}
            >
              {transactionLabel}
            </span>
          </div>

          <div className="courierTransactionCard-meta">
            <span>{dateLabel}</span>

            {timeLabel && (
              <>
                <span className="metaDivider">•</span>

                <span>{timeLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          MIDDLE
      ================================================== */}

      <div className="courierTransactionCard-references">
        {/* TRANSACTION ID */}

        <div className="courierTransactionCard-reference">
          <FaHashtag />

          <span title={reference}>{reference}</span>
        </div>

        {/* ORDER ID */}

        {orderReference && (
          <div className="courierTransactionCard-reference">
            <FaReceipt />

            <span title={orderReference}>Order: {orderReference}</span>
          </div>
        )}

        {/* PAYMENT ID */}

        {paymentReference && (
          <div className="courierTransactionCard-reference">
            <FaExchangeAlt />

            <span title={paymentReference}>Payment: {paymentReference}</span>
          </div>
        )}
      </div>

      {/* ==================================================
          RIGHT
      ================================================== */}

      <div className="courierTransactionCard-right">
        {/* STATUS */}

        <span
          className={`
            courierTransactionCard-status
            ${statusInfo.className}
          `}
        >
          {statusInfo.icon}

          {statusInfo.label}
        </span>

        {/* AMOUNT */}

        <strong
          className={`
            courierTransactionCard-amount
            ${isCredit ? "credit" : "debit"}
          `}
        >
          {isCredit ? "+" : "-"}

          {formatCurrency(amount)}
        </strong>
      </div>
    </article>
  );
}

export default CourierTransactionCard;
