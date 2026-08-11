import React from "react";
import { FaShieldAlt, FaLock } from "react-icons/fa";
import "../../SendStyles/PaymentSecurity.css";

function PaymentSecurity() {
  return (
    <>
      {/* =====================================
                SECURITY CARD
            ===================================== */}

      <div className="paymentSecurityCard">
        <div className="paymentSecurityIcon">
          <FaShieldAlt />
        </div>

        <div className="paymentSecurityContent">
          <h3 className="paymentSecurityTitle">Secure checkout</h3>

          <p className="paymentSecurityText">
            Your payment is securely processed by Paystack. Atua does not store
            your card details.
          </p>
        </div>
      </div>

      {/* =====================================
                POWERED BY
            ===================================== */}

      <div className="paymentPoweredBy">
        <FaLock />

        <span className="paymentPoweredByText">
          Secure payment powered by Paystack
        </span>
      </div>
    </>
  );
}

export default PaymentSecurity;
