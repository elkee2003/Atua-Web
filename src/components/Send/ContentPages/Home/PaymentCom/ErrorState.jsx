import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import "../SendStyles/ErrorState.css";

function ErrorState({ payment }) {
  const { error, handleBack } = payment;

  return (
    <div className="paymentErrorContainer">
      <div className="paymentErrorCard">
        <div className="paymentErrorIcon">
          <FaExclamationTriangle />
        </div>

        <h2 className="paymentErrorTitle">Unable to Continue</h2>

        <p className="paymentErrorMessage">
          {error ||
            "We couldn't load this payment request. Please try again later."}
        </p>

        <button
          type="button"
          className="paymentErrorButton"
          onClick={handleBack}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default ErrorState;
