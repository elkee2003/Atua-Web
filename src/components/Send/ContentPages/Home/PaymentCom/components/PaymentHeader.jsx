import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import "../../SendStyles/PaymentHeader.css";

function PaymentHeader({ payment }) {
  return (
    <header className="paymentHeader">
      <button
        className="paymentHeaderButton"
        onClick={payment.handleBack}
        disabled={payment.paymentLoading}
        type="button"
      >
        <FaArrowLeft />
      </button>

      <h1 className="paymentHeaderTitle">Secure Payment</h1>

      {/* Empty element to keep the title centered */}
      <div className="paymentHeaderSpacer" />
    </header>
  );
}

export default PaymentHeader;
