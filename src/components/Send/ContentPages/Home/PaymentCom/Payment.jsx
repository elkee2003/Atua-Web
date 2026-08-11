import "../SendStyles/Payment.css";
import PaymentHeader from "./components/PaymentHeader";
import PaymentAmountCard from "./components/PaymentAmountCard";
import PaymentSummary from "./components/PaymentSummary";
import PaymentSecurity from "./components/PaymentSecurity";
import PaymentFooter from "./components/PaymentFooter";

import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

import usePayment from "./usePayment";

function Payment() {
  const payment = usePayment();

  if (payment.loading) {
    return <LoadingState />;
  }

  if (!payment.order) {
    return <ErrorState payment={payment} />;
  }

  return (
    <div className="paymentContainer">
      <PaymentHeader payment={payment} />

      <div className="paymentContent">
        <PaymentAmountCard payment={payment} />

        <PaymentSummary payment={payment} />

        <PaymentSecurity />
      </div>

      <PaymentFooter payment={payment} />
    </div>
  );
}

export default Payment;
