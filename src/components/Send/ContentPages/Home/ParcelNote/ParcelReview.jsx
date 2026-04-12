import React from "react";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import "../SendStyles/ReviewOrder.css";
import ReviewOrderGuidelines from "./ReviewOrderGuidelines";
import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";

function ReviewOrder() {
  const navigate = useNavigate();

  const { recipientName, recipientNumber, recipientNumber2, orderDetails } = useOrderContext();
  const { originPlace, destinationPlace } = useLocationContext();

  const goToSearchResults = () => {
    navigate("/send/search_results");
  };

  return (
    <div className="reviewContainer">
      <div className="scrollArea">
        {/* Pointer to guidelines */}
        <p className="pointer">Kindly read the guidelines below</p>

        {/* Recipient's Name */}
        <div className="textRow">
          <p className="textTitle">Recipient's Name:</p>
          <p className="textValue">{recipientName || "Not provided"}</p>
        </div>

        {/* Recipient's Number */}
        <div className="textRow">
          <p className="textTitle">Recipient's Phone Number:</p>
          <p className="textValue">{recipientNumber || "Not provided"}</p>
        </div>

        <div className="textRow">
          <p className="textTitle">Recipient's 2nd Phone Number:</p>
          <p className="textValue">{recipientNumber2 || "Not provided"}</p>
        </div>

        {/* Order Details */}
        {orderDetails && (
          <div className="textRow">
            <p className="textTitle">Details of Order:</p>
            <p className="textValue">{orderDetails}</p>
          </div>
        )}

        {/* Origin */}
        {originPlace && (
          <div className="textRow">
            <p className="textTitle">From:</p>
            <p className="textValue">
              {originPlace}
            </p>
          </div>
        )}

        {/* Destination */}
        {destinationPlace && (
          <div className="textRow">
            <p className="textTitle">To:</p>
            <p className="textValue">
              {destinationPlace}
            </p>
          </div>
        )}

        {/* Guidelines Section */}
        <ReviewOrderGuidelines />

        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="backButton">
          <IoArrowBack className="backIcon" />
        </button>
      </div>

      {/* Done Button */}
      <div className="buttonContainer">
        <button onClick={goToSearchResults} className="doneButton">
          Done
        </button>
      </div>
    </div>
  );
}

export default ReviewOrder;
