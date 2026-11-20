// User is no longer going to generate url if he pleases, therefore this page is no more needed. It can be deleted.
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IoArrowBackOutline,
  IoCopyOutline,
  IoOpenOutline,
  IoShareSocialOutline,
  IoShieldCheckmarkOutline,
  IoLinkOutline,
  IoReceiptOutline,
  IoWalletOutline,
  IoCheckmarkCircleOutline,
  IoLockClosedOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import { DataStore } from "aws-amplify/datastore";
import { generateClient } from "aws-amplify/api";

import { Order } from "../../../../../../../src/models";
import "./ReceiverPayment.css";

const client = generateClient();

/**
 * Existing payment flow:
 * Payment before pickup using Paystack.
 */
const INITIALIZE_ATUA_PAYMENT = /* GraphQL */ `
  mutation InitializeAtuaPayment($orderId: ID!, $payerPhone: String) {
    initializeAtuaPayment(orderId: $orderId, payerPhone: $payerPhone) {
      success
      message
      orderId
      paymentId
      reference
      checkoutUrl
      amount
      currency
      paymentResponsibility
    }
  }
`;

/**
 * Separate payment flow:
 * Receiver pays electronically on delivery.
 *
 * Keep this mutation separate from initializeAtuaPayment.
 */
const INITIALIZE_DELIVERY_PAYMENT = /* GraphQL */ `
  mutation InitializeDeliveryPayment($orderId: ID!, $payerPhone: String) {
    initializeDeliveryPayment(orderId: $orderId, payerPhone: $payerPhone) {
      success
      message
      orderId
      paymentId
      reference
      checkoutUrl
      amount
    }
  }
`;

const formatCurrency = (amount, currency = "NGN") => {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

const ReceiverPayment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  /**
   * Load the order from Amplify DataStore.
   */
  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setError("The order ID is missing.");
      setLoadingOrder(false);
      return;
    }

    setLoadingOrder(true);
    setError("");
    setNotice("");
    setCheckoutUrl("");

    try {
      const result = await DataStore.query(Order, orderId);

      if (!result) {
        setOrder(null);
        setError("This order could not be found.");
        return;
      }

      setOrder(result);
    } catch (err) {
      console.error("Error loading receiver payment order:", err);

      setOrder(null);
      setError("Unable to load this order. Please try again.");
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  /**
   * Generate the appropriate payment link.
   *
   * BEFORE_PICKUP + PAYSTACK:
   *   initializeAtuaPayment
   *
   * RECEIVER + ON_DELIVERY + electronic payment:
   *   initializeDeliveryPayment
   *
   * CASH on delivery:
   *   No Paystack link is required.
   */
  const handleGeneratePaymentLink = async () => {
    setError("");
    setNotice("");

    if (!order) {
      setError("Order details are not available.");
      return;
    }

    if (generatingLink) {
      return;
    }

    const isBeforePickupPaystack =
      order.paymentTiming === "BEFORE_PICKUP" &&
      order.paymentMethod === "PAYSTACK";

    // For receiver-paid delivery orders, link generation is optional.
    // The sender can generate a link even when paymentMethod is null
    // or currently set to CASH.
    const isReceiverPayOnDelivery =
      order.paymentResponsibility === "RECEIVER" &&
      order.paymentTiming === "ON_DELIVERY";

    if (!isBeforePickupPaystack && !isReceiverPayOnDelivery) {
      setError("This order is not eligible for payment-link generation.");
      return;
    }

    /**
     * Do not generate a new link if the order is already paid.
     */
    if (
      order.paymentStatus === "PAID" ||
      order.paymentStatus === "SUCCESSFUL"
    ) {
      setError("This order has already been paid for.");
      return;
    }

    setGeneratingLink(true);

    try {
      const useDeliveryMutation = isReceiverPayOnDelivery;

      const response = await client.graphql({
        query: useDeliveryMutation
          ? INITIALIZE_DELIVERY_PAYMENT
          : INITIALIZE_ATUA_PAYMENT,

        variables: {
          orderId: order.id,
          payerPhone: order.recipientNumber || undefined,
        },

        authMode: "userPool",
      });

      /**
       * Read the result from the mutation that was actually
       * called. The two mutations have separate response
       * fields and remain independent.
       */
      const result = useDeliveryMutation
        ? response?.data?.initializeDeliveryPayment
        : response?.data?.initializeAtuaPayment;

      if (!result?.success) {
        throw new Error(
          result?.message || "Unable to generate the payment link.",
        );
      }

      if (!result?.checkoutUrl) {
        throw new Error(
          "The payment service did not return a checkout link. Please try again.",
        );
      }

      /**
       * Validate the returned checkout URL before displaying
       * it or allowing the user to open it.
       */
      let parsedUrl;

      try {
        parsedUrl = new URL(result.checkoutUrl);
      } catch {
        throw new Error("The payment link returned by the server is invalid.");
      }

      if (parsedUrl.protocol !== "https:") {
        throw new Error("The payment link must use a secure HTTPS connection.");
      }

      setCheckoutUrl(parsedUrl.href);

      setNotice("Payment link generated successfully.");
    } catch (err) {
      console.error("Payment link generation error:", err);

      setError(
        err?.errors?.[0]?.message ||
          err?.message ||
          "Could not generate the payment link. Please try again.",
      );
    } finally {
      setGeneratingLink(false);
    }
  };

  /**
   * Copy the generated payment link.
   */
  const handleCopyLink = async () => {
    if (!checkoutUrl) {
      return;
    }

    setError("");

    try {
      await navigator.clipboard.writeText(checkoutUrl);

      setNotice("Payment link copied. You can now share it.");
    } catch (err) {
      console.error("Copy payment link error:", err);

      setError(
        "Unable to copy automatically. Please select and copy the link manually.",
      );
    }
  };

  /**
   * Share the payment link through the device's native
   * sharing interface when available.
   */
  const handleShareLink = async () => {
    if (!checkoutUrl) {
      return;
    }

    setError("");

    const shareText =
      `Please complete payment for Atua order ${order?.id} ` +
      `using this link: ${checkoutUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Atua Order Payment",
          text: shareText,
          url: checkoutUrl,
        });
      } else {
        await handleCopyLink();
      }
    } catch (err) {
      /**
       * Closing the native share dialog is not an error.
       */
      if (err?.name !== "AbortError") {
        console.error("Share payment link error:", err);

        setError("Unable to share the payment link.");
      }
    }
  };

  /**
   * Open the Paystack checkout in a new tab.
   */
  const handleOpenPayment = () => {
    if (!checkoutUrl) {
      return;
    }

    try {
      const url = new URL(checkoutUrl);

      if (url.protocol !== "https:") {
        setError("This payment link is invalid.");
        return;
      }

      window.open(url.href, "_blank", "noopener,noreferrer");
    } catch {
      setError("This payment link is invalid.");
    }
  };

  /**
   * Loading state.
   */
  if (loadingOrder) {
    return (
      <div className="atua-receiver-payment">
        <header className="atua-receiver-payment-header">
          <button
            type="button"
            className="atua-receiver-payment-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <IoArrowBackOutline />
          </button>

          <h1>Receiver Payment</h1>

          <span className="atua-receiver-payment-header-spacer" />
        </header>

        <div className="atua-receiver-payment-state">
          <span className="atua-receiver-payment-spinner" />

          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  /**
   * Order not found or unable to load.
   */
  if (!order) {
    return (
      <div className="atua-receiver-payment">
        <header className="atua-receiver-payment-header">
          <button
            type="button"
            className="atua-receiver-payment-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <IoArrowBackOutline />
          </button>

          <h1>Receiver Payment</h1>

          <span className="atua-receiver-payment-header-spacer" />
        </header>

        <div className="atua-receiver-payment-state">
          <IoAlertCircleOutline className="atua-receiver-payment-state-icon" />

          <h2>Unable to Load Order</h2>

          <p>{error || "Order details could not be loaded."}</p>

          <button
            type="button"
            className="atua-receiver-payment-secondary"
            onClick={() => navigate(-1)}
          >
            <IoArrowBackOutline />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const amount = order.totalPrice;
  const currency = "NGN";

  const isPaid =
    order.paymentStatus === "PAID" || order.paymentStatus === "SUCCESSFUL";

  const isCashOnDelivery =
    order.paymentResponsibility === "RECEIVER" &&
    order.paymentTiming === "ON_DELIVERY" &&
    order.paymentMethod === "CASH";

  const paymentArrangementLabel =
    order.paymentTiming === "BEFORE_PICKUP"
      ? "Payment before pickup"
      : order.paymentTiming === "ON_DELIVERY"
        ? "Receiver pays on delivery"
        : order.paymentTiming === "AT_PICKUP"
          ? "Payment at pickup"
          : "Payment arrangement";

  return (
    <div className="atua-receiver-payment">
      <header className="atua-receiver-payment-header">
        <button
          type="button"
          className="atua-receiver-payment-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <IoArrowBackOutline />
        </button>

        <h1>Receiver Payment</h1>

        <span className="atua-receiver-payment-header-spacer" />
      </header>

      <div className="atua-receiver-payment-layout">
        <main className="atua-receiver-payment-main">
          {/* Error message */}
          {error && (
            <div
              className="atua-receiver-payment-alert atua-receiver-payment-alert-error"
              role="alert"
            >
              <IoAlertCircleOutline />

              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Success and status message */}
          {notice && (
            <div
              className="atua-receiver-payment-alert atua-receiver-payment-alert-success"
              role="status"
            >
              <IoCheckmarkCircleOutline />

              <span>{notice}</span>

              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}

          {/* Amount card */}
          <section className="atua-receiver-payment-amount-card">
            <span className="atua-receiver-payment-muted">Amount Due</span>

            <strong className="atua-receiver-payment-amount">
              {formatCurrency(amount, currency)}
            </strong>

            <div className="atua-receiver-payment-order-reference">
              <span>ORDER REFERENCE</span>

              <strong title={order.id}>{order.id}</strong>
            </div>

            <div className="atua-receiver-payment-amount-footer">
              <span className="atua-receiver-payment-badge">
                <span />

                {isPaid ? "Payment Completed" : "Payment Pending"}
              </span>

              <span className="atua-receiver-payment-amount-caption">
                Atua order
              </span>
            </div>
          </section>

          {/* Order summary */}
          <section className="atua-receiver-payment-card">
            <div className="atua-receiver-payment-card-heading">
              <IoReceiptOutline />

              <h2>Order Summary</h2>
            </div>

            <div className="atua-receiver-payment-detail-row">
              <span>Receiver</span>

              <strong>{order.recipientName || "Not provided"}</strong>
            </div>

            <div className="atua-receiver-payment-detail-row">
              <span>Receiver Phone</span>

              <strong>{order.recipientNumber || "Not provided"}</strong>
            </div>

            <div className="atua-receiver-payment-detail-row">
              <span>Pickup</span>

              <strong>{order.originAddress || "Not provided"}</strong>
            </div>

            <div className="atua-receiver-payment-detail-row">
              <span>Destination</span>

              <strong>{order.destinationAddress || "Not provided"}</strong>
            </div>

            {order.orderDetails && (
              <div className="atua-receiver-payment-detail-row">
                <span>Order Details</span>

                <strong>{order.orderDetails}</strong>
              </div>
            )}

            <div className="atua-receiver-payment-detail-row">
              <span>Payment Arrangement</span>

              <strong>{paymentArrangementLabel}</strong>
            </div>
          </section>

          {/* Payment link section */}
          <section className="atua-receiver-payment-card">
            <div className="atua-receiver-payment-card-heading">
              <IoLinkOutline />

              <h2>Payment Link</h2>
            </div>

            <p className="atua-receiver-payment-description">
              Generate a Paystack link for an eligible electronic payment and
              share it through WhatsApp, SMS, or another messaging channel. The
              order is not marked as paid until Atua verifies the transaction.
            </p>

            {isPaid ? (
              <div className="atua-receiver-payment-paid-notice">
                <IoCheckmarkCircleOutline />
                <span>This order is already marked as paid.</span>
              </div>
            ) : !checkoutUrl ? (
              <>
                <p className="atua-receiver-payment-description">
                  Generating a payment link is optional. If you want the
                  recipient to pay electronically before delivery, you can
                  generate a secure Paystack link and share it with them.
                </p>

                <p className="atua-receiver-payment-description">
                  You do not have to generate a link now. If payment has not
                  been made when the order arrives, the recipient will be
                  informed of the available payment options, including cash or
                  electronic payment through the courier.
                </p>

                <button
                  type="button"
                  className="atua-receiver-payment-primary"
                  onClick={handleGeneratePaymentLink}
                  disabled={generatingLink}
                >
                  {generatingLink ? (
                    <>
                      <span className="atua-receiver-payment-button-spinner" />
                      Generating Payment Link...
                    </>
                  ) : (
                    <>
                      <IoLinkOutline />
                      Generate Optional Payment Link
                    </>
                  )}
                </button>

                <p className="atua-receiver-payment-description">
                  Prefer to do this later? You can go to Order History and
                  return to this order whenever you need to.
                </p>
              </>
            ) : (
              <div className="atua-receiver-payment-link-section">
                <div className="atua-receiver-payment-link-ready">
                  <IoCheckmarkCircleOutline />
                  <span>Payment link generated</span>
                </div>

                <label
                  className="atua-receiver-payment-link-label"
                  htmlFor="atuaReceiverPaymentCheckoutUrl"
                >
                  Generated payment link
                </label>

                <input
                  id="atuaReceiverPaymentCheckoutUrl"
                  className="atua-receiver-payment-link-input"
                  type="url"
                  value={checkoutUrl}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />

                <div className="atua-receiver-payment-actions">
                  <button
                    type="button"
                    className="atua-receiver-payment-primary"
                    onClick={handleShareLink}
                  >
                    <IoShareSocialOutline />
                    Share Link
                  </button>

                  <button
                    type="button"
                    className="atua-receiver-payment-secondary"
                    onClick={handleCopyLink}
                  >
                    <IoCopyOutline />
                    Copy Link
                  </button>

                  <button
                    type="button"
                    className="atua-receiver-payment-secondary"
                    onClick={handleOpenPayment}
                  >
                    <IoOpenOutline />
                    Open Checkout
                  </button>
                </div>

                <p className="atua-receiver-payment-description">
                  Share this link with the recipient if you want them to pay
                  electronically. If they have not paid by delivery, the courier
                  will explain the available payment options.
                </p>
              </div>
            )}
          </section>

          {/* Order history navigation */}
          <button
            type="button"
            className="atua-receiver-payment-secondary"
            onClick={() =>
              navigate("/send/orders", {
                replace: true,
              })
            }
          >
            <IoReceiptOutline />
            Skip for now — Go to Order History
          </button>
        </main>

        {/* Sidebar */}
        <aside className="atua-receiver-payment-sidebar">
          <div className="atua-receiver-payment-sidebar-total">
            <span>Amount the receiver pays</span>

            <strong>{formatCurrency(amount, currency)}</strong>
          </div>

          <div className="atua-receiver-payment-sidebar-status">
            <span className="atua-receiver-payment-sidebar-status-icon">
              <IoWalletOutline />
            </span>

            <div>
              <strong>Receiver payment</strong>

              <p>
                The payment arrangement for this order is{" "}
                {paymentArrangementLabel.toLowerCase()}.
              </p>
            </div>
          </div>

          <div className="atua-receiver-payment-security">
            <IoShieldCheckmarkOutline />

            <div>
              <strong>Secure payment</strong>

              <p>
                Electronic payments are processed through Paystack. Generating a
                link does not mean the order has been paid.
              </p>
            </div>
          </div>

          <p className="atua-receiver-payment-powered">
            <IoLockClosedOutline />
            Secure payments powered by Paystack
          </p>

          <p className="atua-receiver-payment-disclaimer">
            Atua must verify an electronic transaction on the backend before
            marking this order as paid. For cash payments, the cash collection
            flow must confirm the collection.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default ReceiverPayment;
