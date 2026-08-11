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

      const order = await DataStore.save(
        new Order({
          /* Recipient */

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

          /* Payment */

          paymentStatus: "PENDING",

          payoutStatus: "NOT_PAID",

          fundsStatus: "HELD",
        }),
      );

      navigate(`/send/payment/${order.id}`);
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
              <span>Continue to Payment</span>

              <IoArrowForward size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Checkout;
