import React from "react";
import "../../SendStyles/PaymentAmountCard.css";

function PaymentAmountCard({ payment }) {
  const { order, formattedAmount } = payment;

  return (
    <div className="paymentAmountCard">
      <p className="paymentAmountLabel">Total to Pay</p>

      <h2 className="paymentAmountValue">₦{formattedAmount}</h2>

      <div className="paymentOrderReferenceContainer">
        <span className="paymentOrderReferenceLabel">Order</span>

        <span className="paymentOrderReference">#{order.id}</span>
      </div>
    </div>
  );
}

export default PaymentAmountCard;
