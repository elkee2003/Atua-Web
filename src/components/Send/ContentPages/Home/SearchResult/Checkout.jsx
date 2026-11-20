import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";

import { DataStore } from "aws-amplify/datastore";

import { Order } from "../../../../../models";

import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";

import { getTransportLabel } from "../../../../../../utils/transportFormatter";

import "../SendStyles/Checkout.css";

/**
 * Generates a six-digit delivery verification code.
 *
 * Uses the browser's cryptographically secure random generator.
 * Rejection sampling avoids modulo bias.
 */
const generateVerificationCode = () => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      "Secure verification-code generation is unavailable in this browser.",
    );
  }

  const range = 900000;
  const maxValue = 0x100000000; // 2^32
  const limit = Math.floor(maxValue / range) * range;
  const randomValues = new Uint32Array(1);

  while (true) {
    globalThis.crypto.getRandomValues(randomValues);

    const randomValue = randomValues[0];

    if (randomValue < limit) {
      return String(100000 + (randomValue % range));
    }
  }
};

function Checkout() {
  const navigate = useNavigate();

  /* ==========================================================
      CONTEXT
  ========================================================== */

  const { dbUser } = useAuthContext();

  const {
    originAddress,
    destinationAddress,
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    originState,
    destinationState,
    isInterState,
    tripType,
    setTripType,
    totalKm,
  } = useLocationContext();

  const {
    paymentResponsibility,
    paymentTiming,
    paymentMethod,
    senderName,
    senderNumber,
    senderNumber2,
    recipientName,
    recipientNumber,
    recipientNumber2,
    orderDetails,
    transportationType,
    operationalFare,
    totalPrice,
    courierEarnings,
    commissionAmount,
    platformFee,
    platformServiceRevenue,
    vatAmount,
    platformNetRevenue,
  } = useOrderContext();

  console.log("Payment Method in checkout:", paymentMethod);
  /* ==========================================================
      STATE
  ========================================================== */

  const [loading, setLoading] = useState(false);

  /* ==========================================================
      SET TRIP TYPE
  ========================================================== */

  useEffect(() => {
    setTripType(isInterState ? "INTERSTATE" : "INTRASTATE");
  }, [isInterState, setTripType]);

  /* ==========================================================
      VALIDATE ORDER
  ========================================================== */

  const validateOrder = () => {
    if (!dbUser?.id) {
      window.alert("We could not identify your account. Please try again.");
      return false;
    }

    if (!senderName?.trim()) {
      window.alert("Please enter the sender's name.");
      return false;
    }

    if (!senderNumber?.trim()) {
      window.alert("Please enter the sender's phone number.");
      return false;
    }

    if (!recipientName?.trim()) {
      window.alert("Please enter the recipient's name.");
      return false;
    }

    if (!recipientNumber?.trim()) {
      window.alert("Please enter the recipient's phone number.");
      return false;
    }

    if (!originAddress?.data?.description) {
      window.alert("Please select a valid pickup location.");
      return false;
    }

    if (!destinationAddress?.data?.description) {
      window.alert("Please select a valid delivery destination.");
      return false;
    }

    if (!transportationType) {
      window.alert("Please select a transportation type.");
      return false;
    }

    const validPaymentArrangements = [
      {
        responsibility: "SENDER",
        timing: "BEFORE_PICKUP",
        method: "PAYSTACK",
      },
      {
        responsibility: "SENDER",
        timing: "AT_PICKUP",
        method: "CASH",
      },
      {
        responsibility: "RECEIVER",
        timing: "BEFORE_PICKUP",
        method: "PAYSTACK",
      },
      {
        responsibility: "RECEIVER",
        timing: "ON_DELIVERY",
        method: "PAYSTACK",
      },
      {
        responsibility: "RECEIVER",
        timing: "ON_DELIVERY",
        method: "CASH",
      },
      {
        responsibility: "RECEIVER",
        timing: "ON_DELIVERY",
        method: null,
      },
    ];

    const validPaymentArrangement = validPaymentArrangements.some(
      (option) =>
        option.responsibility === paymentResponsibility &&
        option.timing === paymentTiming &&
        option.method === paymentMethod,
    );

    if (!validPaymentArrangement) {
      window.alert(
        "Please return to the sender and recipient details screen and select a valid payment arrangement.",
      );
      return false;
    }

    const amount = Number(totalPrice);

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("We could not determine the delivery price.");
      return false;
    }

    return true;
  };

  /* ==========================================================
      CREATE ORDER
  ========================================================== */

  const handleOrder = async () => {
    if (loading) return;

    if (!validateOrder()) return;

    try {
      setLoading(true);

      // Generate a delivery verification code when:
      // 1. The sender will pay cash, or
      // 2. The receiver is responsible for payment.
      //
      // For receiver-paid orders, generate the code now even if
      // the receiver has not yet chosen cash or electronic payment.
      const shouldGenerateVerificationCode =
        paymentMethod === "CASH" || paymentResponsibility === "RECEIVER";

      const deliveryVerificationCode = shouldGenerateVerificationCode
        ? generateVerificationCode()
        : undefined;

      const order = await DataStore.save(
        new Order({
          /* Environment */

          // REAL customer orders must be PRODUCTION.
          // TEST orders should explicitly use TEST.
          orderEnvironment: "PRODUCTION",
          // orderEnvironment: "TEST",

          // Booking source
          bookingSource: "WEBSITE",

          // Payment arrangement
          paymentResponsibility,
          paymentTiming,
          paymentMethod,

          // Sender
          senderName: senderName?.trim() || null,
          senderNumber: senderNumber?.trim() || null,
          senderNumber2: senderNumber2?.trim() || null,

          // Recipient
          recipientName: recipientName.trim(),
          recipientNumber: recipientNumber.trim(),
          recipientNumber2: recipientNumber2?.trim() || null,

          orderDetails: orderDetails?.trim() || null,

          /* Transport */

          transportationType,

          /* Pricing */

          operationalFare: Number(operationalFare),

          totalPrice: Number(totalPrice),

          courierEarnings: Number(courierEarnings),

          commissionAmount: Number(commissionAmount),

          platformFee: Number(platformFee),

          platformServiceRevenue: Number(platformServiceRevenue),

          vatAmount: Number(vatAmount),

          platformNetRevenue: Number(platformNetRevenue),

          // Delivery verification code
          deliveryVerificationCode,

          /* Pickup */

          originAddress: originAddress?.data?.description,

          originState,

          originLat: Number(originLat),

          originLng: Number(originLng),

          /* Destination */

          destinationAddress: destinationAddress?.data?.description,

          destinationState,

          destinationLat: Number(destinationLat),

          destinationLng: Number(destinationLng),

          /* Trip */

          tripType,

          isInterState,

          distance: `${totalKm} km`,

          /* User */

          userID: dbUser.id,

          /* Order Status */

          status: "AWAITING_PAYMENT",

          /* Payment */

          paymentStatus: "PENDING",

          payoutStatus: "NOT_PAID",

          fundsStatus: "HELD",
        }),
      );

      //-------------------------------------
      // Navigate After Order Creation
      //-------------------------------------

      if (paymentTiming === "BEFORE_PICKUP" && paymentMethod === "PAYSTACK") {
        // Payment is required before pickup.
        // Only the sender's payment flow is initiated here.
        navigate(`/send/payment/${order.id}`);
      } else {
        // Pay on Delivery and Cash at Pickup
        // go directly to Order History.
        navigate("/send/orders");
      }
    } catch (error) {
      console.error("CREATE ORDER ERROR:", error);

      window.alert(error?.message || "Unable to prepare your delivery.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkoutPage">
      {/* ======================================================
            HEADER
      ====================================================== */}

      <div className="checkoutHeader">
        <button
          className="checkoutBackButton"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          <IoArrowBack />
        </button>

        <div>
          <h1 className="checkoutTitle">Review Order</h1>

          <p className="checkoutSubtitle">
            Confirm your delivery details before payment.
          </p>
        </div>
      </div>

      {/* ======================================================
            CONTENT
      ====================================================== */}

      <div className="checkoutContent">
        {/* Sender */}

        <div className="checkoutCard">
          <h2 className="checkoutSectionTitle">Sender</h2>

          <div className="checkoutRow">
            <span className="checkoutLabel">Name</span>
            <span className="checkoutValue">{senderName}</span>
          </div>

          <div className="checkoutRow">
            <span className="checkoutLabel">Phone</span>
            <span className="checkoutValue">{senderNumber}</span>
          </div>

          {senderNumber2 && (
            <div className="checkoutRow">
              <span className="checkoutLabel">Backup</span>
              <span className="checkoutValue">{senderNumber2}</span>
            </div>
          )}
        </div>

        {/* Recipient */}

        <div className="checkoutCard">
          <h2 className="checkoutSectionTitle">Recipient</h2>

          <div className="checkoutRow">
            <span className="checkoutLabel">Name</span>

            <span className="checkoutValue">{recipientName}</span>
          </div>

          <div className="checkoutRow">
            <span className="checkoutLabel">Phone</span>

            <span className="checkoutValue">{recipientNumber}</span>
          </div>

          {recipientNumber2 && (
            <div className="checkoutRow">
              <span className="checkoutLabel">Backup</span>

              <span className="checkoutValue">{recipientNumber2}</span>
            </div>
          )}
        </div>

        {/* Route */}

        <div className="checkoutCard">
          <h2 className="checkoutSectionTitle">Delivery Route</h2>

          <div className="checkoutLocationRow">
            <div className="checkoutLocationDot pickup" />

            <span className="checkoutLocationText">
              {originAddress?.data?.description}
            </span>
          </div>

          <div className="checkoutVerticalLine" />

          <div className="checkoutLocationRow">
            <div className="checkoutLocationDot destination" />

            <span className="checkoutLocationText">
              {destinationAddress?.data?.description}
            </span>
          </div>
        </div>

        {/* Package Details */}

        {orderDetails && (
          <div className="checkoutCard">
            <h2 className="checkoutSectionTitle">Package Details</h2>

            <p className="checkoutDetailsText">{orderDetails}</p>
          </div>
        )}

        {/* Payment Arrangement */}

        <div className="checkoutCard checkoutPaymentResponsibility">
          <h2 className="checkoutSectionTitle">Payment Arrangement</h2>

          <div className="checkoutPaymentResponsibilityRow">
            <div className="checkoutPaymentResponsibilityIcon">
              <span>{paymentResponsibility === "RECEIVER" ? "↗" : "↙"}</span>
            </div>

            <div className="checkoutPaymentResponsibilityContent">
              <span className="checkoutPaymentResponsibilityLabel">
                Who will pay?
              </span>

              <span className="checkoutPaymentResponsibilityValue">
                {paymentResponsibility === "RECEIVER"
                  ? "Receiver will pay"
                  : "Sender will pay"}
              </span>
            </div>
          </div>

          <div className="checkoutDivider" />

          <div className="checkoutPaymentResponsibilityRow">
            <div className="checkoutPaymentResponsibilityIcon">
              <span>
                {paymentMethod === "CASH"
                  ? "₦"
                  : paymentMethod === "PAYSTACK"
                    ? "₱"
                    : "?"}
              </span>
            </div>

            <div className="checkoutPaymentResponsibilityContent">
              <span className="checkoutPaymentResponsibilityLabel">
                Payment method
              </span>

              <span className="checkoutPaymentResponsibilityValue">
                {paymentMethod === "CASH"
                  ? "Cash"
                  : paymentMethod === "PAYSTACK"
                    ? "Paystack"
                    : "Receiver chooses on delivery"}
              </span>
            </div>
          </div>

          <div className="checkoutDivider" />

          <div className="checkoutPaymentResponsibilityRow">
            <div className="checkoutPaymentResponsibilityIcon">
              <span>◷</span>
            </div>

            <div className="checkoutPaymentResponsibilityContent">
              <span className="checkoutPaymentResponsibilityLabel">
                When will payment be made?
              </span>

              <span className="checkoutPaymentResponsibilityValue">
                {paymentTiming === "BEFORE_PICKUP"
                  ? "Before pickup"
                  : paymentTiming === "AT_PICKUP"
                    ? "At pickup"
                    : "On delivery"}
              </span>
            </div>
          </div>

          <p className="checkoutPaymentResponsibilityDescription">
            {paymentResponsibility === "SENDER" &&
              paymentTiming === "BEFORE_PICKUP" &&
              paymentMethod === "PAYSTACK" &&
              "You will complete electronic payment before the courier picks up your item."}

            {paymentResponsibility === "SENDER" &&
              paymentTiming === "AT_PICKUP" &&
              paymentMethod === "CASH" &&
              "You will pay the courier in cash when your item is picked up."}

            {paymentResponsibility === "RECEIVER" &&
              paymentTiming === "BEFORE_PICKUP" &&
              paymentMethod === "PAYSTACK" &&
              "The receiver must complete electronic payment before pickup."}

            {paymentResponsibility === "RECEIVER" &&
              paymentTiming === "ON_DELIVERY" &&
              paymentMethod === "PAYSTACK" &&
              "The receiver will pay electronically when the item is delivered."}

            {paymentResponsibility === "RECEIVER" &&
              paymentTiming === "ON_DELIVERY" &&
              paymentMethod === "CASH" &&
              "The receiver will pay the courier in cash on delivery."}

            {paymentResponsibility === "RECEIVER" &&
              paymentTiming === "ON_DELIVERY" &&
              paymentMethod == null &&
              "The receiver can choose to pay in cash or electronically when the courier arrives. Electronic payments must be verified before the delivery is treated as paid. If the receiver refuses or fails to pay, you, as the sender, remain responsible for the outstanding delivery fee."}
          </p>
        </div>

        {/* Payment Summary */}

        <div className="checkoutCard">
          <h2 className="checkoutSectionTitle">Payment Summary</h2>

          <div className="checkoutRow">
            <span className="checkoutLabel">Transportation</span>

            <span className="checkoutValue">
              {getTransportLabel(transportationType)}
            </span>
          </div>

          <div className="checkoutRow">
            <span className="checkoutLabel">Operational Fee</span>

            <span className="checkoutValue">
              ₦{Number(operationalFare || 0).toLocaleString()}
            </span>
          </div>

          <div className="checkoutRow">
            <span className="checkoutLabel">Platform Fee</span>

            <span className="checkoutValue">
              ₦{Number(platformFee || 0).toLocaleString()}
            </span>
          </div>

          <div className="checkoutRow">
            <span className="checkoutLabel">VAT</span>

            <span className="checkoutValue">
              ₦{Number(vatAmount || 0).toLocaleString()}
            </span>
          </div>

          <div className="checkoutDivider" />

          <div className="checkoutRow">
            <span className="checkoutTotalLabel">Total</span>

            <span className="checkoutTotalValue">
              ₦{Number(totalPrice || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
            FOOTER
      ====================================================== */}

      <div className="checkoutFooter">
        <button
          className="checkoutButton"
          onClick={handleOrder}
          disabled={loading}
        >
          {loading ? (
            "Preparing Order..."
          ) : (
            <>
              <span>
                {paymentTiming === "BEFORE_PICKUP" &&
                paymentMethod === "PAYSTACK" &&
                paymentResponsibility === "SENDER"
                  ? "Proceed to Payment"
                  : "Confirm Delivery Order"}
              </span>

              <IoArrowForward size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Checkout;
