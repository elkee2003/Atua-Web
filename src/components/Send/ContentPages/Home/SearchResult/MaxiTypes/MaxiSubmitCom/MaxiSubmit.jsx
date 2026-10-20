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
    senderName,
    senderNumber,
    senderNumber2,

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

      // Validate sender details.
      if (!senderName?.trim() || senderName.trim().length < 2) {
        window.alert("Sender Required: Please enter the sender's name.");
        return;
      }

      if (!senderNumber || senderNumber.replace(/\D/g, "").length < 11) {
        window.alert(
          "Sender Phone Required: Please enter a valid sender phone number with at least 11 digits.",
        );
        return;
      }

      // Validate recipient details.
      if (!recipientName?.trim() || recipientName.trim().length < 2) {
        window.alert("Recipient Required: Please enter the recipient's name.");
        return;
      }

      if (!recipientNumber || recipientNumber.replace(/\D/g, "").length < 11) {
        window.alert(
          "Recipient Phone Required: Please enter a valid recipient phone number with at least 11 digits.",
        );
        return;
      }

      // Calculate freight pricing.
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

      // Capture media before resetting context.
      const mediaPhotos = [...(senderPreTransferPhotos || [])];
      const mediaVideo = senderPreTransferVideo;

      const hasSenderMedia = mediaPhotos.length > 0 || Boolean(mediaVideo?.uri);

      const mediaStatus = hasSenderMedia ? MediaUploadStatus.PENDING : null;

      // Create the Maxi order.
      const newOrder = await DataStore.save(
        new Order({
          orderEnvironment: "PRODUCTION",

          // Sender details.
          senderName: senderName.trim(),
          senderNumber: senderNumber.trim(),
          senderNumber2: senderNumber2?.trim() || null,

          // Recipient details.
          recipientName: recipientName.trim(),
          recipientNumber: recipientNumber.trim(),
          recipientNumber2: recipientNumber2?.trim() || null,

          orderDetails,

          // Pickup location.
          originAddress: originAddress?.data?.description,
          originState,
          originLat: parseFloat(originLat),
          originLng: parseFloat(originLng),

          // Destination.
          destinationAddress: destinationAddress?.data?.description,
          destinationState,
          destinationLat: parseFloat(destinationLat),
          destinationLng: parseFloat(destinationLng),

          tripType,
          distance: `${totalKm} km`,

          transportationType,
          vehicleClass,

          // Order status.
          status: "BIDDING",
          paymentStatus: "PENDING",
          payoutStatus: "NOT_PAID",
          fundsStatus: "HELD",

          // Pricing.
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

          // Weight.
          declaredWeightBracket,

          // Pickup loading.
          pickupLoadingResponsibility,
          pickupFloorLevel,
          pickupFloorLevelPrice,
          pickupHasElevator,

          // Dropoff unloading.
          dropoffUnloadingResponsibility,
          dropoffFloorLevel,
          dropoffFloorLevelPrice,
          dropoffHasElevator,

          // Sender custody evidence.
          mediaUploadStatus: mediaStatus,
          senderPreTransferLocalPhotos: mediaPhotos.map((photo) => photo.uri),
          senderPreTransferLocalVideo: mediaVideo?.uri || null,
          senderPreTransferRecordedAt:
            senderPreTransferRecordedAt?.toISOString?.() ||
            new Date().toISOString(),

          // Authenticated user.
          userID: dbUser.id,
        }),
      );

      // Create the initial offer.
      await DataStore.save(
        new Offer({
          orderID: newOrder.id,
          senderType: "USER",
          amount: parseFloat(initialOfferPrice),
          status: "ACTIVE",
        }),
      );

      // Update order context.
      setOrders(newOrder);

      // Upload evidence in the background.
      if (hasSenderMedia) {
        setTimeout(() => {
          uploadEvidence(newOrder, mediaPhotos, mediaVideo);
        }, 0);
      }

      // Reset form and location contexts.
      resetAllOrderFields();
      resetAllLocationFields();

      // Navigate to order tracking.
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
