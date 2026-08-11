import React from "react";
import { FaLock, FaArrowRight } from "react-icons/fa";
import "../../SendStyles/PaymentFooter.css";

function PaymentFooter({ payment }) {
  const { formattedAmount, paymentLoading, handlePay } = payment;

  return (
    <div className="paymentFooterContainer">
      <button
        type="button"
        className={`paymentFooterButton ${
          paymentLoading ? "paymentFooterButtonDisabled" : ""
        }`}
        onClick={handlePay}
        disabled={paymentLoading}
      >
        {paymentLoading ? (
          <div className="paymentFooterLoading">
            <div className="paymentFooterSpinner"></div>

            <span className="paymentFooterLoadingText">Processing...</span>
          </div>
        ) : (
          <>
            <FaLock className="paymentFooterLeftIcon" />

            <span className="paymentFooterButtonText">
              Pay ₦{formattedAmount}
            </span>

            <FaArrowRight className="paymentFooterRightIcon" />
          </>
        )}
      </button>

      <p className="paymentFooterDisclaimer">
        By continuing, you authorize this payment for your Atua delivery.
      </p>
    </div>
  );
}

export default PaymentFooter;
