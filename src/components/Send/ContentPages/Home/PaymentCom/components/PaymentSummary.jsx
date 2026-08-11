import React from "react";
import "../../SendStyles/PaymentSummary.css";

function PaymentSummary({ payment }) {
  const { order, formattedAmount, formatMoney } = payment;

  return (
    <div className="paymentSummaryCard">
      <h3 className="paymentSummaryTitle">Payment Summary</h3>

      {/* Delivery Fare */}

      <div className="paymentSummaryRow">
        <span className="paymentSummaryLabel">Delivery fare</span>

        <span className="paymentSummaryValue">
          ₦{formatMoney(order.operationalFare)}
        </span>
      </div>

      {/* Platform Fee */}

      <div className="paymentSummaryRow">
        <span className="paymentSummaryLabel">Platform fee</span>

        <span className="paymentSummaryValue">
          ₦{formatMoney(order.platformFee)}
        </span>
      </div>

      {/* VAT */}

      <div className="paymentSummaryRow">
        <span className="paymentSummaryLabel">VAT</span>

        <span className="paymentSummaryValue">
          ₦{formatMoney(order.vatAmount)}
        </span>
      </div>

      <div className="paymentSummaryDivider" />

      {/* Total */}

      <div className="paymentSummaryRow">
        <span className="paymentSummaryTotalLabel">Total</span>

        <span className="paymentSummaryTotalValue">₦{formattedAmount}</span>
      </div>
    </div>
  );
}

export default PaymentSummary;
