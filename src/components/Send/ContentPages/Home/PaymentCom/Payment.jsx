import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { generateClient } from "aws-amplify/api";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
  AlertCircle,
  CreditCard,
  RefreshCw,
} from "lucide-react";

import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";
import { Order, PaymentMethod } from "../../../../../../src/models";
import {
  verifyAtuaPayment,
  chargeAtuaPaymentMethod,
} from "../../../../../../src/graphql/mutations";

import "./Payment.css";

const client = generateClient();

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getPaymentReference = (response) =>
  response?.reference ||
  response?.transactionRef?.reference ||
  response?.transactionRef ||
  response?.data?.reference ||
  response?.trxref ||
  null;

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { dbUser } = useAuthContext();
  const { resetAllOrderFields } = useOrderContext();
  const { resetAllLocationFields } = useLocationContext();

  const [order, setOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const amount = Number(order?.totalPrice || 0);
  const formattedAmount = formatMoney(amount);
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const showNotice = (title, message, onContinue = null) => {
    setNotice({ title, message, onContinue });
  };

  const completePaymentFlow = useCallback(
    (paidOrderId) => {
      if (!paidOrderId) return;

      resetAllOrderFields();
      resetAllLocationFields();

      navigate(`/send/order_tracking/${paidOrderId}`, {
        replace: true,
      });
    },
    [navigate, resetAllOrderFields, resetAllLocationFields],
  );

  // Load and validate the order.
  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      if (!dbUser?.id) return;

      setLoadingOrder(true);
      setError("");

      try {
        if (!orderId) {
          throw new Error("Order ID was not provided.");
        }

        const savedOrder = await DataStore.query(Order, orderId);

        if (!savedOrder) {
          throw new Error("Order could not be found.");
        }

        if (savedOrder.userID !== dbUser.id) {
          throw new Error(
            "You are not authorized to make payment for this order.",
          );
        }

        if (active) setOrder(savedOrder);
      } catch (err) {
        if (active) {
          setError(err?.message || "Unable to load this order.");
        }
      } finally {
        if (active) setLoadingOrder(false);
      }
    };

    fetchOrder();

    return () => {
      active = false;
    };
  }, [orderId, dbUser?.id]);

  // Load reusable saved Paystack cards.
  useEffect(() => {
    let active = true;

    const loadMethods = async () => {
      if (!dbUser?.id) return;

      setLoadingMethods(true);

      try {
        const methods = await DataStore.query(PaymentMethod);

        const usable = methods
          .filter(
            (method) =>
              method.status === "ACTIVE" &&
              method.reusable === true &&
              (!method.provider || method.provider === "PAYSTACK"),
          )
          .sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;

            return (
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
            );
          });

        if (active) {
          setPaymentMethods(usable);

          const preferred =
            usable.find((method) => method.isDefault) || usable[0];

          setSelectedMethodId((current) =>
            current && usable.some((method) => method.id === current)
              ? current
              : preferred?.id || "",
          );
        }
      } catch (err) {
        console.error("LOAD PAYMENT METHODS ERROR:", err);
      } finally {
        if (active) setLoadingMethods(false);
      }
    };

    loadMethods();

    return () => {
      active = false;
    };
  }, [dbUser?.id]);

  // Wait for the server/webhook changes to synchronize into DataStore.
  const waitForOrderSync = (id, timeout = 30000) =>
    new Promise((resolve, reject) => {
      let finished = false;
      let subscription;
      let timer;

      const finish = (callback, value) => {
        if (finished) return;
        finished = true;
        subscription?.unsubscribe();
        clearTimeout(timer);
        callback(value);
      };

      const isPaid = (item) =>
        item?.id === id &&
        item?.paymentStatus === "PAID" &&
        Boolean(item?.paymentID) &&
        item?.fundsStatus === "HELD";

      subscription = DataStore.observe(Order, id).subscribe({
        next: ({ element }) => {
          if (isPaid(element)) finish(resolve, element);
        },
        error: (err) => finish(reject, err),
      });

      timer = setTimeout(
        () => finish(reject, new Error("Order synchronization timed out.")),
        timeout,
      );

      DataStore.query(Order, id)
        .then((current) => {
          if (isPaid(current)) finish(resolve, current);
        })
        .catch((err) => console.error("ORDER SYNC CHECK:", err));
    });

  const verifyPayment = async (reference) => {
    if (!reference) {
      throw new Error(
        "The transaction reference is missing. Do not attempt another payment until you have checked the transaction.",
      );
    }

    const result = await client.graphql({
      query: verifyAtuaPayment,
      variables: {
        orderId: order.id,
        reference,
      },
    });

    const verification = result?.data?.verifyAtuaPayment;

    if (!verification?.success || !verification?.verified) {
      throw new Error(
        verification?.message || "Your payment could not be verified.",
      );
    }

    if (verification.orderId && verification.orderId !== order.id) {
      throw new Error("The verified payment does not match this order.");
    }

    return verification;
  };

  const confirmAndContinue = async (reference) => {
    setPaymentLoading(true);

    try {
      const verification = await verifyPayment(reference);

      const verificationCode = verification.deliveryVerificationCode;

      try {
        const synced = await waitForOrderSync(order.id, 15000);

        showNotice(
          verification.alreadyPaid ? "Payment Confirmed" : "Payment Successful",
          `Your payment has been confirmed.\n\n${
            verificationCode || synced.deliveryVerificationCode
              ? `Delivery Verification Code: ${
                  verificationCode || synced.deliveryVerificationCode
                }\n\nKeep this code safe.`
              : "Your order is being prepared."
          }`,
          () => completePaymentFlow(order.id),
        );
      } catch (syncError) {
        console.error("PAYMENT SYNC:", syncError);

        // Verification already succeeded. Never prompt another payment.
        showNotice(
          "Payment Confirmed",
          "Your payment was verified successfully. Your order is still synchronizing. Please continue to your order; do not pay again.",
          () => completePaymentFlow(order.id),
        );
      }
    } catch (err) {
      console.error("PAYMENT VERIFICATION ERROR:", err);

      showNotice(
        "Payment Verification",
        `${err?.errors?.[0]?.message || err?.message || "We could not confirm your payment."}\n\nIf you were charged, do not make another payment yet.`,
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePay = () => {
    if (paymentLoading) return;

    if (!order?.id) {
      showNotice("Order Unavailable", "We could not find this order.");
      return;
    }

    if (!dbUser?.email) {
      showNotice("Email Required", "An email address is required for payment.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showNotice("Invalid Amount", "The payment amount is invalid.");
      return;
    }

    if (order.paymentStatus === "PAID") {
      showNotice(
        "Payment Already Confirmed",
        order.deliveryVerificationCode
          ? `This order has already been paid.\n\nDelivery Verification Code: ${order.deliveryVerificationCode}`
          : "This order has already been paid. You can continue to your order.",
        () => completePaymentFlow(order.id),
      );
      return;
    }

    if (!publicKey) {
      showNotice(
        "Payment Configuration",
        "The Paystack public key is missing. Configure VITE_PAYSTACK_PUBLIC_KEY in your Vite environment.",
      );
      return;
    }

    if (!window.PaystackPop) {
      showNotice(
        "Payment Unavailable",
        "The Paystack checkout script has not loaded. Refresh the page and try again.",
      );
      return;
    }

    setPaymentLoading(true);

    try {
      const reference = `atua_${order.id}_${Date.now()}`;

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: dbUser.email,
        amount: Math.round(amount * 100),
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Atua Order ID",
              variable_name: "order_id",
              value: order.id,
            },
          ],
        },
        callback: (response) => {
          const paymentReference = getPaymentReference(response);

          if (!paymentReference) {
            setPaymentLoading(false);
            showNotice(
              "Payment Verification",
              "Paystack returned without a transaction reference. If you were charged, do not pay again until the transaction is checked.",
            );
            return;
          }

          confirmAndContinue(paymentReference);
        },
        onClose: () => {
          setPaymentLoading(false);
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error("START PAYSTACK ERROR:", err);
      setPaymentLoading(false);

      showNotice(
        "Unable to Start Payment",
        err?.message || "The payment page could not be opened.",
      );
    }
  };

  const handlePayWithSavedCard = async () => {
    if (paymentLoading) return;

    if (!order?.id || !selectedMethodId) {
      showNotice(
        "Select a Saved Card",
        "Please select an available saved payment method.",
      );
      return;
    }

    if (order.paymentStatus === "PAID") {
      showNotice(
        "Payment Already Confirmed",
        "This order has already been paid.",
        () => completePaymentFlow(order.id),
      );
      return;
    }

    setPaymentLoading(true);

    try {
      const result = await client.graphql({
        query: chargeAtuaPaymentMethod,
        authMode: "userPool",
        variables: {
          orderId: order.id,
          paymentMethodId: selectedMethodId,
        },
      });

      const charge = result?.data?.chargeAtuaPaymentMethod;

      if (!charge?.success) {
        throw new Error(
          charge?.message || "The saved card could not be charged.",
        );
      }

      // A charge request being accepted is not final payment confirmation.
      const syncedOrder = await waitForOrderSync(order.id, 30000);

      showNotice(
        "Payment Successful",
        syncedOrder.deliveryVerificationCode
          ? `Your payment has been confirmed.\n\nDelivery Verification Code: ${syncedOrder.deliveryVerificationCode}\n\nKeep this code safe.`
          : "Your payment has been confirmed. Continue to your order.",
        () => completePaymentFlow(order.id),
      );
    } catch (err) {
      console.error("SAVED CARD PAYMENT ERROR:", err);

      showNotice(
        "Saved Card Payment",
        `${err?.errors?.[0]?.message || err?.message || "We could not confirm the saved-card payment."}\n\nIf you were charged, do not make another payment yet.`,
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loadingOrder) {
    return (
      <main className="atua-payment">
        <div className="atua-payment-state">
          <span className="atua-payment-spinner" />
          <p>Preparing secure payment...</p>
        </div>
      </main>
    );
  }

  if (!order || error) {
    return (
      <main className="atua-payment">
        <div className="atua-payment-state">
          <AlertCircle size={42} />
          <h2>Order unavailable</h2>
          <p>
            {error || "We could not load the order you are trying to pay for."}
          </p>
          <button
            className="atua-payment-secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="atua-payment">
      <header className="atua-payment-header">
        <button
          className="atua-payment-back"
          onClick={() => navigate(-1)}
          disabled={paymentLoading}
          aria-label="Go back"
        >
          <ArrowLeft size={21} />
        </button>
        <h1>Secure Payment</h1>
        <span className="atua-payment-header-spacer" />
      </header>

      <div className="atua-payment-layout">
        <section className="atua-payment-main">
          <div className="atua-payment-amount-card">
            <span className="atua-payment-muted">Total to Pay</span>
            <strong className="atua-payment-amount">₦{formattedAmount}</strong>
            <div className="atua-payment-order-reference">
              <span>Order</span>
              <strong title={order.id}>#{order.id}</strong>
            </div>
          </div>

          <section className="atua-payment-card">
            <h2>Payment Summary</h2>

            <div className="atua-payment-summary-row">
              <span>Delivery fare</span>
              <strong>₦{formatMoney(order.operationalFare)}</strong>
            </div>
            <div className="atua-payment-summary-row">
              <span>Platform fee</span>
              <strong>₦{formatMoney(order.platformFee)}</strong>
            </div>
            <div className="atua-payment-summary-row">
              <span>VAT</span>
              <strong>₦{formatMoney(order.vatAmount)}</strong>
            </div>

            <div className="atua-payment-divider" />

            <div className="atua-payment-summary-row atua-payment-total-row">
              <strong>Total</strong>
              <strong>₦{formattedAmount}</strong>
            </div>
          </section>

          <section className="atua-payment-card">
            <div className="atua-payment-method-heading">
              <h2>Saved Payment Methods</h2>
              {loadingMethods && (
                <RefreshCw className="atua-payment-spin" size={17} />
              )}
            </div>

            {!loadingMethods && paymentMethods.length === 0 && (
              <p className="atua-payment-muted">
                No saved cards are available. You can pay securely with a new
                card.
              </p>
            )}

            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`atua-payment-method ${
                  selectedMethodId === method.id ? "is-selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="atua-saved-payment-method"
                  value={method.id}
                  checked={selectedMethodId === method.id}
                  onChange={() => setSelectedMethodId(method.id)}
                  disabled={paymentLoading}
                />
                <CreditCard size={22} />
                <span className="atua-payment-method-details">
                  <strong>
                    {method.cardType || method.brand || "Card"}{" "}
                    {method.last4 ? `•••• ${method.last4}` : ""}
                  </strong>
                  <small>
                    {method.isDefault ? "Default payment method" : "Saved card"}
                    {method.expiryMonth && method.expiryYear
                      ? ` · Expires ${method.expiryMonth}/${method.expiryYear}`
                      : ""}
                  </small>
                </span>
                {selectedMethodId === method.id && (
                  <span className="atua-payment-selected">Selected</span>
                )}
              </label>
            ))}

            {paymentMethods.length > 0 && (
              <button
                className="atua-payment-secondary atua-payment-saved-button"
                onClick={handlePayWithSavedCard}
                disabled={paymentLoading || !selectedMethodId}
              >
                {paymentLoading
                  ? "Processing..."
                  : `Pay ₦${formattedAmount} with saved card`}
              </button>
            )}

            <button
              className="atua-payment-new-card"
              onClick={handlePay}
              disabled={paymentLoading}
            >
              <CreditCard size={19} />
              Pay with a new card
              <ArrowRight size={18} />
            </button>
          </section>

          <section className="atua-payment-security">
            <ShieldCheck size={25} />
            <div>
              <strong>Secure checkout</strong>
              <p>
                Your payment is securely processed by Paystack. Atua does not
                store your card details.
              </p>
            </div>
          </section>

          <p className="atua-payment-powered">
            <LockKeyhole size={14} />
            Secure payment powered by Paystack
          </p>
        </section>

        <aside className="atua-payment-sidebar">
          <div className="atua-payment-sidebar-total">
            <span>Total due</span>
            <strong>₦{formattedAmount}</strong>
          </div>

          <button
            className="atua-payment-pay-button"
            onClick={handlePay}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <>
                <span className="atua-payment-button-spinner" />
                Processing...
              </>
            ) : (
              <>
                <LockKeyhole size={17} />
                Pay ₦{formattedAmount}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="atua-payment-disclaimer">
            By continuing, you authorize this payment for your Atua delivery.
          </p>
        </aside>
      </div>

      {notice && (
        <div
          className="atua-payment-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setNotice(null);
          }}
        >
          <section
            className="atua-payment-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="atua-payment-modal-title"
          >
            <div className="atua-payment-modal-icon">
              <AlertCircle size={25} />
            </div>
            <h2 id="atua-payment-modal-title">{notice.title}</h2>
            <p>{notice.message}</p>
            <button
              className="atua-payment-pay-button"
              onClick={() => {
                const callback = notice.onContinue;
                setNotice(null);
                callback?.();
              }}
            >
              {notice.onContinue ? "Continue to order" : "OK"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
};

export default Payment;
