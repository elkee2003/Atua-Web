import React from "react";
import '../SendStyles/Checkout.css';
import { useNavigate } from "react-router-dom";
import { DataStore } from 'aws-amplify/datastore';
import {Order} from  '../../../../../models';
import ReviewOrderGuidelines from "../ParcelNote/ReviewOrderGuidelines";
import { useOrderContext } from "../../../../../../Provider/OrderProvider";
import { useLocationContext } from "../../../../../../Provider/LocationProvider";
import { useAuthContext } from "../../../../../../Provider/AuthProvider";


const Checkout = () => {
  const navigate = useNavigate();

  const { dbUser } = useAuthContext();

  const {
    recipientName,
    recipientNumber,
    recipientNumber2,
    orderDetails,
    setRecipientName,
    setRecipientNumber,
    setRecipientNumber2,
    setOrderDetails,
    transportationType,
    setTransportationType,
    orders,
    setOrders,
    price,
    setPrice,
    courierFee,
    setCourierFee,
  } = useOrderContext();

  const {
    originPlace,
    setOriginPlace,
    destinationPlace,
    setDestinationPlace,
    originPlaceLat,
    setOriginPlaceLat,
    originPlaceLng,
    setOriginPlaceLng,
    destinationPlaceLat,
    setDestinationPlaceLat,
    destinationPlaceLng,
    setDestinationPlaceLng,
  } = useLocationContext();

  const handleOrder = async () => {
    try {
      const order = await DataStore.save(
        new Order({
          recipientName,
          recipientNumber,
          recipientNumber2,
          orderDetails,
          transportationType,
          price: parseFloat(price),
          courierFee: parseFloat(courierFee),
          parcelOrigin: originPlace || "",
          parcelOriginLat: parseFloat(originPlaceLat),
          parcelOriginLng: parseFloat(originPlaceLng),
          parcelDestination: destinationPlace || "",
          parcelDestinationLat: parseFloat(destinationPlaceLat),
          parcelDestinationLng: parseFloat(destinationPlaceLng),
          userID: dbUser.id,
          status: "READY_FOR_PICKUP",
        })
      );

      setOrders(order);
      alert("✅ Successful!\nOrder was placed successfully.");

      // Clear all fields
      setRecipientName("");
      setRecipientNumber("");
      setRecipientNumber2("");
      setOrderDetails("");
      setTransportationType("");
      setPrice("");
      setCourierFee("");
      setOriginPlace(null);
      setOriginPlaceLat("");
      setOriginPlaceLng("");
      setDestinationPlace(null);
      setDestinationPlaceLat("");
      setDestinationPlaceLng("");

      navigate("/home");
    } catch (e) {
      alert(`❌ Error: ${e.message}`);
    }
  };

  return (
    <div className="checkoutContainer">
      <h2 className="checkoutTitle">Order Summary</h2>

      <div className="checkoutScroll">
        {/* Recipient's Name */}
        <div className="checkoutRow">
          <strong>Recipient's Name:</strong>
          <span>{recipientName}</span>
        </div>

        {/* Recipient's Number */}
        <div className="checkoutRow">
          <strong>Recipient's Phone Number:</strong>
          <span>{recipientNumber}</span>
        </div>

        {/* Second Number */}
        {recipientNumber2 && (
          <div className="checkoutRow">
            <strong>Alt. Phone Number:</strong>
            <span>{recipientNumber2}</span>
          </div>
        )}

        {/* Order Details */}
        {orderDetails && (
          <div className="checkoutRow">
            <strong>Details of Order:</strong>
            <span>{orderDetails}</span>
          </div>
        )}

        {/* Origin */}
        <div className="checkoutRow">
          <strong>From:</strong>
          <span>{originPlace}</span>
        </div>

        {/* Destination */}
        <div className="checkoutRow">
          <strong>To:</strong>
          <span>{destinationPlace}</span>
        </div>

        {/* Transportation Type */}
        <div className="checkoutRow">
          <strong>Transportation Type:</strong>
          <span>{transportationType}</span>
        </div>

        {/* Price */}
        <div className="checkoutRow">
          <strong>Price:</strong>
          <span>₦{price}</span>
        </div>

        {/* Courier Fee */}
        {/* <div className="checkoutRow">
          <strong>Courier Fee:</strong>
          <span>₦{courierFee}</span>
        </div> */}
      </div>

      <ReviewOrderGuidelines/>

      <button className="checkoutBtn" onClick={handleOrder}>
        Place Order
      </button>
    </div>
  );
};

export default Checkout;
