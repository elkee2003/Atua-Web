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

/* ============================================================
   INITIALIZE ATUA PAYMENT MUTATION

   This must match the InitializeAtuaPaymentResult fields
   exposed by your AppSync schema.
============================================================ */

const initializeAtuaPaymentMutation = /* GraphQL */ `
  mutation InitializeAtuaPayment(
    $orderId: ID!
    $payerEmail: AWSEmail
    $payerPhone: String
  ) {
    initializeAtuaPayment(
      orderId: $orderId
      payerEmail: $payerEmail
      payerPhone: $payerPhone
    ) {
      success
      message
      orderId
      paymentId
      reference
      checkoutUrl
      amount
      currency
      payerEmail
      paymentResponsibility
    }
  }
`;

/* ============================================================
   HELPERS
============================================================ */

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/* ============================================================
   PAYMENT COMPONENT
============================================================ */

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

  /* ============================================================
     NOTICE / MODAL
  ============================================================ */

  const showNotice = (title, message, onContinue = null) => {
    setNotice({
      title,
      message,
      onContinue,
    });
  };

  /* ============================================================
     COMPLETE PAYMENT FLOW
  ============================================================ */

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

  /* ============================================================
     LOAD AND VALIDATE ORDER
  ============================================================ */

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

        if (active) {
          setOrder(savedOrder);
        }
      } catch (err) {
        console.error("LOAD PAYMENT ORDER ERROR:", err);

        if (active) {
          setError(err?.message || "Unable to load this order.");
        }
      } finally {
        if (active) {
          setLoadingOrder(false);
        }
      }
    };

    fetchOrder();

    return () => {
      active = false;
    };
  }, [orderId, dbUser?.id]);

  /* ============================================================
     LOAD SAVED PAYSTACK CARDS

     This remains separate from the new-card checkout flow.
  ============================================================ */

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
        if (active) {
          setLoadingMethods(false);
        }
      }
    };

    loadMethods();

    return () => {
      active = false;
    };
  }, [dbUser?.id]);

  /* ============================================================
     CHECK WHETHER ORDER IS FULLY PAID

     This matches the payment confirmation fields currently
     used by this payment page.

     The webhook should update these fields.
  ============================================================ */

  const isOrderPaid = (item, id) =>
    item?.id === id &&
    item?.paymentStatus === "PAID" &&
    Boolean(item?.paymentID) &&
    item?.fundsStatus === "HELD";

  /* ============================================================
     WAIT FOR WEBHOOK / DATASTORE SYNCHRONIZATION

     IMPORTANT:
     - Webhook is the primary payment confirmation.
     - This function does not call verifyAtuaPayment.
     - It waits for the backend changes to reach DataStore.

     The initial query also handles a case where the webhook
     updated the order before the observer was established.
  ============================================================ */

  const waitForOrderSync = useCallback(
    (id, timeout = 60000) =>
      new Promise((resolve, reject) => {
        let finished = false;
        let subscription = null;
        let timer = null;

        const finish = (callback, value) => {
          if (finished) return;

          finished = true;

          if (subscription) {
            subscription.unsubscribe();
          }

          if (timer) {
            clearTimeout(timer);
          }

          callback(value);
        };

        const checkOrder = (item) => {
          if (isOrderPaid(item, id)) {
            finish(resolve, item);
          }
        };

        timer = setTimeout(() => {
          finish(reject, new Error("The order has not synchronized yet."));
        }, timeout);

        try {
          subscription = DataStore.observe(Order, id).subscribe({
            next: ({ element }) => {
              checkOrder(element);
            },

            error: (err) => {
              finish(reject, err);
            },
          });
        } catch (err) {
          finish(reject, err);
          return;
        }

        // Check the current DataStore record after subscribing.
        DataStore.query(Order, id)
          .then((current) => {
            checkOrder(current);
          })
          .catch((err) => {
            console.error("INITIAL ORDER SYNC CHECK ERROR:", err);
          });
      }),
    [],
  );

  /* ============================================================
     VERIFY PAYMENT - FALLBACK ONLY

     This function must receive the exact reference returned
     by initializeAtuaPayment.

     Never generate a local reference here.
  ============================================================ */

  const verifyPayment = async (reference) => {
    if (!reference) {
      throw new Error(
        "The transaction reference is missing. Do not attempt another payment until the transaction has been checked.",
      );
    }

    const result = await client.graphql({
      query: verifyAtuaPayment,

      authMode: "userPool",

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

  /* ============================================================
     SHOW CONFIRMED PAYMENT NOTICE
  ============================================================ */

  const showConfirmedPayment = (verification, syncedOrder = null) => {
    const verificationCode =
      verification?.deliveryVerificationCode ||
      syncedOrder?.deliveryVerificationCode;

    showNotice(
      "Payment Confirmed",
      verificationCode
        ? `Your payment has been confirmed.\n\nDelivery Verification Code: ${verificationCode}\n\nKeep this code safe.`
        : "Your payment has been confirmed. Your order is being updated.",
      () => completePaymentFlow(order.id),
    );
  };

  /* ============================================================
     NEW CARD PAYMENT

     CORRECT FLOW:

     1. Open a blank checkout tab immediately from the click.
        This avoids popup blockers after an asynchronous request.

     2. Call initializeAtuaPayment.

     3. Backend creates/reuses the Payment record and registers
        the reference against the Order.

     4. Open the exact checkoutUrl returned by the backend.

     5. Wait for paystackWebhook / DataStore synchronization.

     6. Only if synchronization times out, call
        verifyAtuaPayment using the exact backend reference.

     DO NOT:
     - Generate a reference in the frontend.
     - Call Paystack directly from the frontend.
     - Call verifyAtuaPayment immediately after checkout.
  ============================================================ */

  const handlePay = async () => {
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

    /*
     * Open the tab synchronously during the user's click.
     * Opening it only after awaiting the GraphQL request can
     * cause the browser to block the popup.
     */
    const checkoutWindow = window.open("about:blank", "_blank");

    if (!checkoutWindow) {
      showNotice(
        "Checkout Window Blocked",
        "Your browser blocked the Paystack checkout window. Please allow popups for this site and try again. No new payment has been initialized.",
      );

      return;
    }

    setPaymentLoading(true);

    let initializedReference = null;

    try {
      /* -----------------------------------------------
         STEP 1: INITIALIZE PAYMENT ON ATUA BACKEND
      ----------------------------------------------- */

      console.log("INITIALIZING ATUA PAYMENT:", {
        orderId: order.id,
        payerEmail: dbUser.email,
      });

      const initializationResponse = await client.graphql({
        query: initializeAtuaPaymentMutation,

        authMode: "userPool",

        variables: {
          orderId: order.id,
          payerEmail: dbUser.email.trim().toLowerCase(),
          payerPhone: dbUser.phoneNumber || null,
        },
      });

      const initialization =
        initializationResponse?.data?.initializeAtuaPayment;

      console.log("INITIALIZE ATUA PAYMENT RESPONSE:", initialization);

      if (!initialization?.success) {
        throw new Error(
          initialization?.message || "Atua could not initialize your payment.",
        );
      }

      /* -----------------------------------------------
         STEP 2: VALIDATE BACKEND RESPONSE
      ----------------------------------------------- */

      const reference = initialization.reference;
      const checkoutUrl = initialization.checkoutUrl;

      initializedReference = reference;

      if (!initialization.paymentId || !reference || !checkoutUrl) {
        throw new Error(
          "Atua returned incomplete checkout details. Please contact support before attempting another payment.",
        );
      }

      if (initialization.orderId && initialization.orderId !== order.id) {
        throw new Error(
          "The initialized payment does not belong to this order.",
        );
      }

      /*
       * The backend amount is authoritative.
       * Do not open checkout if it differs from the amount
       * currently shown on this order.
       */
      const backendAmount = Number(initialization.amount);

      if (
        !Number.isFinite(backendAmount) ||
        backendAmount <= 0 ||
        Math.round(backendAmount * 100) !== Math.round(amount * 100)
      ) {
        throw new Error(
          "The payment amount returned by Atua does not match the order total. Please contact support before paying.",
        );
      }

      /*
       * Only allow secure Paystack checkout URLs.
       */
      let parsedCheckoutUrl;

      try {
        parsedCheckoutUrl = new URL(checkoutUrl);
      } catch {
        throw new Error("Atua returned an invalid Paystack checkout URL.");
      }

      if (
        parsedCheckoutUrl.protocol !== "https:" ||
        parsedCheckoutUrl.hostname !== "checkout.paystack.com"
      ) {
        throw new Error(
          "Atua returned an unrecognized Paystack checkout address.",
        );
      }

      /* -----------------------------------------------
         STEP 3: OPEN BACKEND-GENERATED CHECKOUT URL
      ----------------------------------------------- */

      console.log("OPENING REGISTERED PAYSTACK CHECKOUT:", {
        orderId: order.id,
        paymentId: initialization.paymentId,
        reference,
        amount: backendAmount,
      });

      /*
       * The tab was opened synchronously above.
       * Now navigate it to the exact checkout URL returned
       * by initializeAtuaPayment.
       */
      checkoutWindow.location.replace(checkoutUrl);

      /*
       * Keep this page open. It is responsible for waiting
       * for the webhook/DataStore update.
       */

      /* -----------------------------------------------
         STEP 4: WAIT FOR WEBHOOK / DATASTORE
      ----------------------------------------------- */

      try {
        const syncedOrder = await waitForOrderSync(order.id, 60000);

        console.log("PAYMENT CONFIRMED THROUGH DATASTORE:", {
          orderId: syncedOrder.id,
          paymentID: syncedOrder.paymentID,
          paymentReference: syncedOrder.paymentReference,
        });

        showConfirmedPayment(null, syncedOrder);

        return;
      } catch (syncError) {
        console.warn(
          "WEBHOOK SYNC WAIT EXPIRED. USING VERIFICATION FALLBACK:",
          syncError?.message,
        );
      }

      /* -----------------------------------------------
         STEP 5: FALLBACK VERIFICATION

         Only reached if the webhook/DataStore update
         did not arrive within the waiting period.

         Uses the exact backend-generated reference.
      ----------------------------------------------- */

      console.log("RUNNING FALLBACK PAYMENT VERIFICATION:", {
        orderId: order.id,
        reference,
      });

      const verification = await verifyPayment(reference);

      console.log("FALLBACK PAYMENT VERIFICATION RESULT:", verification);

      /*
       * Verification has succeeded. Give DataStore another
       * short period to receive the corresponding Order update.
       */
      try {
        const syncedOrder = await waitForOrderSync(order.id, 15000);

        showConfirmedPayment(verification, syncedOrder);
      } catch (syncError) {
        console.warn(
          "PAYMENT VERIFIED BUT DATASTORE IS STILL SYNCHRONIZING:",
          syncError,
        );

        /*
         * Do not fabricate a paid Order object.
         * The backend verification result is the confirmation.
         * The user can continue without being asked to pay again.
         */
        showConfirmedPayment(verification, null);
      }
    } catch (err) {
      console.error("NEW CARD PAYMENT ERROR:", err);

      /*
       * Close the blank tab only when checkout was never
       * successfully initialized.
       *
       * If a reference was returned, the payment attempt may
       * exist. Do not create another transaction automatically.
       */
      if (!initializedReference && checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.close();
      }

      showNotice(
        "Payment Status",
        `${
          err?.errors?.[0]?.message ||
          err?.message ||
          "We could not complete payment processing."
        }\n\nIf you were charged or reached the Paystack checkout page, do not make another payment yet. Please allow us to check the existing transaction.`,
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  /* ============================================================
     SAVED CARD PAYMENT

     Preserve the existing saved-card Lambda.

     A successful charge request is not treated as final
     confirmation. We wait for the Order update.
  ============================================================ */

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

      /*
       * Do not assume that the charge request being accepted
       * means the order is already paid.
       */
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
        `${
          err?.errors?.[0]?.message ||
          err?.message ||
          "We could not confirm the saved-card payment."
        }\n\nIf you were charged, do not make another payment yet.`,
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  /* ============================================================
     LOADING STATE
  ============================================================ */

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

  /* ============================================================
     ORDER ERROR STATE
  ============================================================ */

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

  /* ============================================================
     MAIN PAYMENT PAGE
  ============================================================ */

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
          {/* TOTAL AMOUNT */}

          <div className="atua-payment-amount-card">
            <span className="atua-payment-muted">Total to Pay</span>

            <strong className="atua-payment-amount">₦{formattedAmount}</strong>

            <div className="atua-payment-order-reference">
              <span>Order</span>

              <strong title={order.id}>#{order.id}</strong>
            </div>
          </div>

          {/* PAYMENT SUMMARY */}

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

          {/* SAVED PAYMENT METHODS */}

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

            {/* NEW CARD CHECKOUT */}

            <button
              className="atua-payment-new-card"
              onClick={handlePay}
              disabled={paymentLoading}
            >
              <CreditCard size={19} />

              {paymentLoading ? "Processing payment..." : "Pay with a new card"}

              <ArrowRight size={18} />
            </button>
          </section>

          {/* SECURITY INFORMATION */}

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

        {/* PAYMENT SIDEBAR */}

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

      {/* NOTICE MODAL */}

      {notice && (
        <div
          className="atua-payment-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setNotice(null);
            }
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
