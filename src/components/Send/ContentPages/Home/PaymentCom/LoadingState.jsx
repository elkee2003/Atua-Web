import React from "react";
import "../SendStyles/LoadingState.css";

function LoadingState() {
  return (
    <div className="paymentLoadingContainer">
      <div className="paymentLoadingSpinner" />

      <p className="paymentLoadingText">Preparing secure payment...</p>
    </div>
  );
}

export default LoadingState;
