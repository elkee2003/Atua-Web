import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";
import { freightPricingEngine } from "../../../../../../../../modules/freightPricingEngine";
import { useAuthContext } from "../../../../../../../../Providers/ClientProvider/AuthProvider";
import { useLocationContext } from "../../../../../../../../Providers/ClientProvider/LocationProvider";
import { useOrderContext } from "../../../../../../../../Providers/ClientProvider/OrderProvider";
import { MediaUploadStatus, Offer, Order } from "../../../../../../../models";
import { uploadEvidence } from "../../../../../../../../utils/uploadEvidence";

import MaxiReviewScreen from "../MaxiReviewCom/MaxiReviewScreen";
import "./MaxiSubmit.css";

const MaxiSubmit = () => {
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { dbUser } = useAuthContext();

  const {
    originAddress,
    originLat,
    originLng,
    destinationAddress,
    destinationLat,
    destinationLng,
    originState,
    destinationState,
    isInterState,
    tripType,
    totalKm,
    resetAllLocationFields,
  } = useLocationContext();

  const {
    recipientName,
    recipientNumber,
    recipientNumber2,
    orderDetails,
    transportationType,
    vehicleClass,
    setOrders,
    estimatedMinPrice,
    estimatedMaxPrice,
    initialOfferPrice,
    loadingFee,
    unloadingFee,
    floorSurcharge,
    fragileSurcharge,
    loadCategory,
    declaredWeightBracket,
    senderPreTransferPhotos,
    senderPreTransferVideo,
    senderPreTransferRecordedAt,
    pickupLoadingResponsibility,
    pickupFloorLevel,
    pickupFloorLevelPrice,
    pickupHasElevator,
    dropoffUnloadingResponsibility,
    dropoffFloorLevel,
    dropoffFloorLevelPrice,
    dropoffHasElevator,
    resetAllOrderFields,
  } = useOrderContext();

  // ======================================================
  // SUBMIT MAXI REQUEST
  // ======================================================

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);

    try {
      // Ensure the user is authenticated.
      if (!dbUser?.id) {
        window.alert("Error: User not authenticated.");
        return;
      }

      // Calculate the freight pricing.
      const pricing = freightPricingEngine({
        type: vehicleClass,
        distanceKm: totalKm,
        loadCategory,
        isInterState,
        loadingFee,
        unloadingFee,
        floorSurcharge,
        fragileSurcharge,
      });

      if (!pricing) {
        window.alert("Error: Unable to calculate pricing. Please try again.");
        return;
      }

      // Validate the customer's offer.
      if (
        Number(initialOfferPrice) < Number(estimatedMinPrice) ||
        Number(initialOfferPrice) > Number(estimatedMaxPrice)
      ) {
        window.alert(
          "Invalid Offer: Your offer must be within the suggested range.",
        );
        return;
      }

      // ======================================================
      // CAPTURE MEDIA BEFORE RESETTING CONTEXT
      // ======================================================

      const mediaPhotos = [...(senderPreTransferPhotos || [])];
      const mediaVideo = senderPreTransferVideo;

      const hasSenderMedia = mediaPhotos.length > 0 || Boolean(mediaVideo?.uri);

      const mediaStatus = hasSenderMedia ? MediaUploadStatus.PENDING : null;

      // ======================================================
      // CREATE ORDER
      // ======================================================

      const newOrder = await DataStore.save(
        new Order({
          //   orderEnvironment: "TEST",
          orderEnvironment: "PRODUCTION",

          // For test orders, use:
          // orderEnvironment: "TEST",

          // BASIC INFORMATION
          recipientName,
          recipientNumber,
          recipientNumber2,
          orderDetails,

          // PICKUP LOCATION
          originAddress: originAddress?.data?.description,
          originState,
          originLat: parseFloat(originLat),
          originLng: parseFloat(originLng),

          // DESTINATION
          destinationAddress: destinationAddress?.data?.description,
          destinationState,
          destinationLat: parseFloat(destinationLat),
          destinationLng: parseFloat(destinationLng),

          tripType,
          distance: `${totalKm} km`,

          transportationType,
          vehicleClass,

          // ORDER STATUS
          status: "BIDDING",
          paymentStatus: "PENDING",
          payoutStatus: "NOT_PAID",
          fundsStatus: "HELD",

          // PRICING
          loadCategory,
          isInterState,

          estimatedMinPrice: parseFloat(estimatedMinPrice),
          estimatedMaxPrice: parseFloat(estimatedMaxPrice),
          initialOfferPrice: parseFloat(initialOfferPrice),

          loadingFee: pricing.extras.loadingFee,
          unloadingFee: pricing.extras.unloadingFee,
          floorSurcharge: pricing.extras.floorSurcharge,
          fragileSurcharge: pricing.extras.fragileSurcharge,
          extrasTotal: pricing.extrasTotal,

          // WEIGHT
          declaredWeightBracket,

          // PICKUP LOADING
          pickupLoadingResponsibility,
          pickupFloorLevel,
          pickupFloorLevelPrice,
          pickupHasElevator,

          // DROPOFF UNLOADING
          dropoffUnloadingResponsibility,
          dropoffFloorLevel,
          dropoffFloorLevelPrice,
          dropoffHasElevator,

          // SENDER CUSTODY EVIDENCE
          mediaUploadStatus: mediaStatus,

          senderPreTransferLocalPhotos: mediaPhotos.map((photo) => photo.uri),

          senderPreTransferLocalVideo: mediaVideo?.uri || null,

          senderPreTransferRecordedAt:
            senderPreTransferRecordedAt?.toISOString?.() ||
            new Date().toISOString(),

          // USER RELATION
          userID: dbUser.id,
        }),
      );

      // ======================================================
      // CREATE INITIAL OFFER
      // ======================================================

      await DataStore.save(
        new Offer({
          orderID: newOrder.id,
          senderType: "USER",
          amount: parseFloat(initialOfferPrice),
          status: "ACTIVE",
        }),
      );

      // ======================================================
      // UPDATE ORDER CONTEXT
      // ======================================================

      setOrders(newOrder);

      // ======================================================
      // UPLOAD EVIDENCE IN THE BACKGROUND
      // ======================================================

      if (hasSenderMedia) {
        setTimeout(() => {
          uploadEvidence(newOrder, mediaPhotos, mediaVideo);
        }, 0);
      }

      // ======================================================
      // RESET FORM AND LOCATION CONTEXTS
      // ======================================================

      resetAllOrderFields();
      resetAllLocationFields();

      // ======================================================
      // SUCCESS AND NAVIGATION
      // ======================================================

      navigate(`/send/order_tracking/${newOrder.id}`, {
        replace: true,
      });
    } catch (error) {
      console.error("Maxi order submission failed:", error);

      window.alert(
        `Error: ${error?.message || "Unable to submit your request."}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="maxiSubmitContainer">
      <MaxiReviewScreen />

      <button
        type="button"
        className="maxiSubmitButton"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Maxi Request"}
      </button>
    </div>
  );
};

export default MaxiSubmit;
