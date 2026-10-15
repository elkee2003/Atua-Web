import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Banknote,
  Camera,
  Car,
  ChevronRight,
  FileText,
  Info,
  Layers,
  Minus,
  Navigation,
  Package,
  Phone,
  Play,
  Plus,
  UserRound,
  Video,
} from "lucide-react";

import "./MaxiReviewScreen.css";

import { freightPricingEngine } from "../../../../../../../../modules/freightPricingEngine";
import { useLocationContext } from "../../../../../../../../Providers/ClientProvider/LocationProvider";
import { useOrderContext } from "../../../../../../../../Providers/ClientProvider/OrderProvider";
import { getTransportLabel } from "../../../../../../../../utils/transportFormatter";

import CameraCapture from "./CameraCapture/CameraCapture";
import MediaPreviewModal from "./MediaPreviewModal/MediaPreviewModal";
import VideoThumbnail from "./VideoThumbnail";

export default function MaxiReviewScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    maxiReviewScreenRecipientName,
    recipientNumber,
    recipientNumber2,
    orderDetails,
    loadingFee,
    unloadingFee,
    pickupLoadingResponsibility,
    dropoffUnloadingResponsibility,
    pickupFloorLevel,
    pickupFloorLevelPrice,
    pickupHasElevator,
    dropoffFloorLevel,
    dropoffFloorLevelPrice,
    dropoffHasElevator,
    loadCategory,
    declaredWeightBracket,
    transportationType,
    vehicleClass,
    estimatedMinPrice,
    setEstimatedMinPrice,
    estimatedMaxPrice,
    setEstimatedMaxPrice,
    initialOfferPrice,
    setInitialOfferPrice,
    senderPreTransferPhotos,
    setSenderPreTransferPhotos,
    senderPreTransferVideo,
    setSenderPreTransferVideo,
    senderPreTransferRecordedAt,
    setSenderPreTransferRecordedAt,
  } = useOrderContext();

  const {
    originAddress,
    destinationAddress,
    originState,
    destinationState,
    totalKm,
    isInterState,
    tripType,
    setTripType,
  } = useLocationContext();

  const pickupSurcharge =
    pickupLoadingResponsibility === "Handle Myself"
      ? 0
      : pickupHasElevator
        ? 0
        : pickupFloorLevelPrice || 0;

  const dropoffSurcharge =
    dropoffUnloadingResponsibility === "Handle Myself"
      ? 0
      : dropoffHasElevator
        ? 0
        : dropoffFloorLevelPrice || 0;

  const floorSurcharge = pickupSurcharge + dropoffSurcharge;

  useEffect(() => {
    setTripType(isInterState ? "INTERSTATE" : "INTRASTATE");
  }, [isInterState, setTripType]);

  useEffect(() => {
    if (!vehicleClass || !totalKm) return;

    const result = freightPricingEngine({
      type: vehicleClass,
      distanceKm: Number(totalKm),
      loadCategory,
      isInterState,
      loadingFee,
      unloadingFee,
      floorSurcharge,
    });

    if (!result) return;

    setEstimatedMinPrice(result.minSuggested);
    setEstimatedMaxPrice(result.maxSuggested);

    const midpoint = Math.round(
      (result.minSuggested + result.maxSuggested) / 2,
    );

    setInitialOfferPrice(midpoint);
  }, [
    vehicleClass,
    totalKm,
    loadCategory,
    isInterState,
    loadingFee,
    unloadingFee,
    pickupFloorLevel,
    dropoffFloorLevel,
    pickupHasElevator,
    dropoffHasElevator,
    floorSurcharge,
  ]);

  const origin =
    originAddress?.data?.description ||
    originAddress?.details?.formatted_address ||
    "Not selected";

  const destination =
    destinationAddress?.data?.description ||
    destinationAddress?.details?.formatted_address ||
    "Not selected";

  const isOfferInvalid =
    initialOfferPrice < estimatedMinPrice ||
    initialOfferPrice > estimatedMaxPrice;

  const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString()}`;

  return (
    <main className="maxiReviewScreenContainer">
      <div className="maxiReviewScreenScrollContent">
        {/* HEADER */}
        <div className="maxiReviewScreenHeader">
          <div className="maxiReviewScreenHeaderIcon">
            <FileText size={20} color="#F97316" strokeWidth={2} />
          </div>

          <div className="maxiReviewScreenHeaderText">
            <span className="maxiReviewScreenEyebrow">ORDER REVIEW</span>
            <span className="maxiReviewScreenTitle">Review Freight Order</span>

            <span className="maxiReviewScreenSubtitle">
              Confirm the details of your shipment before continuing.
            </span>
          </div>
        </div>

        {/* TRIP OVERVIEW */}
        <div className="maxiReviewScreenCard">
          <div className="maxiReviewScreenCardHeader">
            <div className="maxiReviewScreenSectionIcon">
              <Navigation size={17} color="#F97316" strokeWidth={2} />
            </div>

            <div>
              <span className="maxiReviewScreenSectionTitle">
                Trip Overview
              </span>
              <span className="maxiReviewScreenSectionSubtitle">
                Route and journey information
              </span>
            </div>
          </div>

          <div className="maxiReviewScreenRouteContainer">
            <div className="maxiReviewScreenLocationRow">
              <div className="maxiReviewScreenLocationIndicator">
                <div className="maxiReviewScreenOriginDot" />
              </div>

              <div className="maxiReviewScreenLocationContent">
                <span className="maxiReviewScreenFieldLabel">PICKUP</span>
                <span className="maxiReviewScreenFieldValue">{origin}</span>

                <span className="maxiReviewScreenFieldMeta">
                  {originState || "State not selected"}
                </span>
              </div>
            </div>

            <div className="maxiReviewScreenRouteLine" />

            <div className="maxiReviewScreenLocationRow">
              <div className="maxiReviewScreenLocationIndicator">
                <div className="maxiReviewScreenDestinationDot" />
              </div>

              <div className="maxiReviewScreenLocationContent">
                <span className="maxiReviewScreenFieldLabel">DELIVERY</span>
                <span className="maxiReviewScreenFieldValue">
                  {destination}
                </span>

                <span className="maxiReviewScreenFieldMeta">
                  {destinationState || "State not selected"}
                </span>
              </div>
            </div>
          </div>

          <div className="maxiReviewScreenInfoGrid">
            <div className="maxiReviewScreenInfoItem">
              <span className="maxiReviewScreenFieldLabel">TRIP TYPE</span>
              <span className="maxiReviewScreenInfoValue">
                {tripType || "—"}
              </span>
            </div>

            <div className="maxiReviewScreenInfoItem">
              <span className="maxiReviewScreenFieldLabel">DISTANCE</span>

              <span className="maxiReviewScreenInfoValue">
                {totalKm ? `${totalKm} km` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* TRANSPORTATION */}
        <div className="maxiReviewScreenCard">
          <div className="maxiReviewScreenCardHeader">
            <div className="maxiReviewScreenSectionIcon">
              <Car size={17} color="#F97316" strokeWidth={2} />
            </div>

            <div>
              <span className="maxiReviewScreenSectionTitle">
                Transportation
              </span>
              <span className="maxiReviewScreenSectionSubtitle">
                Vehicle assigned to this shipment
              </span>
            </div>
          </div>

          <div className="maxiReviewScreenDetailRows">
            <div className="maxiReviewScreenDetailRow">
              <span className="maxiReviewScreenFieldLabel">TRANSPORT TYPE</span>
              <span className="maxiReviewScreenFieldValue">
                {transportationType || "—"}
              </span>
            </div>

            <div className="maxiReviewScreenRowDivider" />

            <div className="maxiReviewScreenDetailRow">
              <span className="maxiReviewScreenFieldLabel">VEHICLE CLASS</span>
              <span className="maxiReviewScreenFieldValue">
                {getTransportLabel(vehicleClass) || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* CARGO DETAILS */}
        <div className="maxiReviewScreenCard">
          <div className="maxiReviewScreenCardHeader">
            <div className="maxiReviewScreenSectionIcon">
              <Package size={17} color="#F97316" strokeWidth={2} />
            </div>

            <div>
              <span className="maxiReviewScreenSectionTitle">
                Cargo Details
              </span>
              <span className="maxiReviewScreenSectionSubtitle">
                Information about your shipment
              </span>
            </div>
          </div>

          <div className="maxiReviewScreenInfoGrid">
            <div className="maxiReviewScreenInfoItem">
              <span className="maxiReviewScreenFieldLabel">CATEGORY</span>
              <span className="maxiReviewScreenInfoValue">
                {loadCategory || "—"}
              </span>
            </div>

            <div className="maxiReviewScreenInfoItem">
              <span className="maxiReviewScreenFieldLabel">WEIGHT</span>
              <span className="maxiReviewScreenInfoValue">
                {declaredWeightBracket || "—"}
              </span>
            </div>
          </div>

          <div className="maxiReviewScreenDescriptionBox">
            <span className="maxiReviewScreenFieldLabel">DESCRIPTION</span>

            <span className="maxiReviewScreenDescriptionText">
              {orderDetails || "No description provided"}
            </span>
          </div>
        </div>

        {/* LOADING AND HANDLING */}
        <div className="maxiReviewScreenCard">
          <div className="maxiReviewScreenCardHeader">
            <div className="maxiReviewScreenSectionIcon">
              <Layers size={17} color="#F97316" strokeWidth={2} />
            </div>

            <div>
              <span className="maxiReviewScreenSectionTitle">
                Loading & Handling
              </span>
              <span className="maxiReviewScreenSectionSubtitle">
                Pickup, delivery and floor requirements
              </span>
            </div>
          </div>

          {/* PICKUP */}
          <div className="maxiReviewScreenHandlingBlock">
            <div className="maxiReviewScreenHandlingHeader">
              <div className="maxiReviewScreenHandlingIcon">
                <ArrowUp size={15} color="#F97316" strokeWidth={2} />
              </div>

              <span className="maxiReviewScreenHandlingTitle">Pickup</span>
            </div>

            <div className="maxiReviewScreenDetailRows">
              <div className="maxiReviewScreenDetailRow">
                <span className="maxiReviewScreenFieldLabel">
                  RESPONSIBILITY
                </span>

                <span className="maxiReviewScreenFieldValue">
                  {pickupLoadingResponsibility || "Not selected"}
                </span>
              </div>

              <div className="maxiReviewScreenRowDivider" />

              <div className="maxiReviewScreenDetailRow">
                <span className="maxiReviewScreenFieldLabel">LOADING FEE</span>
                <span className="maxiReviewScreenMoneyValue">
                  {formatCurrency(loadingFee)}
                </span>
              </div>

              <div className="maxiReviewScreenRowDivider" />

              <div className="maxiReviewScreenDetailRow">
                <span className="maxiReviewScreenFieldLabel">FLOOR</span>
                <span className="maxiReviewScreenFieldValue">
                  {pickupFloorLevel || "—"}
                </span>
              </div>

              <div className="maxiReviewScreenRowDivider" />

              <div className="maxiReviewScreenDetailRow">
                <span className="maxiReviewScreenFieldLabel">ELEVATOR</span>

                <span className="maxiReviewScreenFieldValue">
                  {pickupHasElevator ? "Available" : "None"}
                </span>
              </div>
            </div>
          </div>

          {/* DROP-OFF */}
          <div className="maxiReviewScreenHandlingBlock">
            <div className="maxiReviewScreenHandlingHeader">
              <div className="maxiReviewScreenHandlingIcon">
                <ArrowDown size={15} color="#F97316" strokeWidth={2} />
              </div>

              <span className="maxiReviewScreenHandlingTitle">Drop-off</span>
            </div>

            <div className="maxiReviewScreenDetailRows">
              <div className="maxiReviewScreenDetailRow">
                <span className="maxiReviewScreenFieldLabel">
                  RESPONSIBILITY
                </span>

                <span className="maxiReviewScreenFieldValue">
                  {dropoffUnloadingResponsibility || "Not selected"}
                </span>
              </div>

              <div className="maxiReviewScreenRowDivider" />

              <div className="maxiReviewScreenDetailRow">
                <span className="maxiReviewScreenFieldLabel">
                  UNLOADING FEE
                </span>

                <span className="maxiReviewScreenMoneyValue">
                  {formatCurrency(unloadingFee)}
                </span>
              </div>

              <div className="maxiReviewScreenRowDivider" />

              <div className="maxiReviewScreenDetailRow">
                <span className="maxiReviewScreenFieldLabel">FLOOR</span>

                <span className="maxiReviewScreenFieldValue">
                  {dropoffFloorLevel || "—"}
                </span>
              </div>

              <div className="maxiReviewScreenRowDivider" />

              <div className="maxiReviewScreenDetailRow">
                <span className="maxiReviewScreenFieldLabel">ELEVATOR</span>

                <span className="maxiReviewScreenFieldValue">
                  {dropoffHasElevator ? "Available" : "None"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RECIPIENT */}
        <div className="maxiReviewScreenCard">
          <div className="maxiReviewScreenCardHeader">
            <div className="maxiReviewScreenSectionIcon">
              <UserRound size={17} color="#F97316" strokeWidth={2} />
            </div>

            <div>
              <span className="maxiReviewScreenSectionTitle">Recipient</span>
              <span className="maxiReviewScreenSectionSubtitle">
                Delivery contact information
              </span>
            </div>
          </div>

          <div className="maxiReviewScreenRecipientCard">
            <div className="maxiReviewScreenAvatar">
              <span className="maxiReviewScreenAvatarText">
                {maxiReviewScreenRecipientName?.charAt(0)?.toUpperCase() || "R"}
              </span>
            </div>

            <div className="maxiReviewScreenRecipientInfo">
              <span className="maxiReviewScreenRecipientName">
                {maxiReviewScreenRecipientName || "Recipient"}
              </span>

              <div className="maxiReviewScreenPhoneRow">
                <Phone size={13} color="#64748B" strokeWidth={2} />

                <span className="maxiReviewScreenPhoneText">
                  {recipientNumber || "No phone number"}
                </span>
              </div>

              {recipientNumber2 && (
                <div className="maxiReviewScreenPhoneRow">
                  <Phone size={13} color="#64748B" strokeWidth={2} />
                  <span className="maxiReviewScreenPhoneText">
                    {recipientNumber2}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PRICE AND OFFER */}
        <div className="maxiReviewScreenPriceCard">
          <div className="maxiReviewScreenPriceHeader">
            <div>
              <span className="maxiReviewScreenPriceEyebrow">YOUR OFFER</span>
              <span className="maxiReviewScreenPriceTitle">
                Set your freight price
              </span>
            </div>

            <div className="maxiReviewScreenPriceIcon">
              <Banknote size={20} color="#F97316" strokeWidth={2} />
            </div>
          </div>

          <div className="maxiReviewScreenRangeContainer">
            <span className="maxiReviewScreenRangeLabel">
              SUGGESTED MARKET RANGE
            </span>

            <span className="maxiReviewScreenPriceRange">
              {formatCurrency(estimatedMinPrice)}
              {" — "}
              {formatCurrency(estimatedMaxPrice)}
            </span>
          </div>

          <span className="maxiReviewScreenOfferDescription">
            Choose the amount you want to offer. Couriers can review your offer
            and respond with their bids.
          </span>

          <div className="maxiReviewScreenOfferControl">
            <button
              type="button"
              className="maxiReviewScreenAdjustBtn"
              onClick={() =>
                setInitialOfferPrice((prev) =>
                  Math.max(estimatedMinPrice, Number(prev || 0) - 1000),
                )
              }
            >
              <Minus size={21} color="#FFFFFF" strokeWidth={2} />
            </button>

            <div
              className={`maxiReviewScreenOfferInputContainer ${
                isOfferInvalid ? "maxiReviewScreenOfferInputContainerError" : ""
              }`}
            >
              <span className="maxiReviewScreenCurrencyPrefix">₦</span>

              <input
                className="maxiReviewScreenOfferInput"
                type="number"
                value={initialOfferPrice ?? ""}
                onChange={(event) =>
                  setInitialOfferPrice(Number(event.target.value))
                }
              />
            </div>

            <button
              type="button"
              className="maxiReviewScreenAdjustBtn"
              onClick={() =>
                setInitialOfferPrice((prev) =>
                  Math.min(estimatedMaxPrice, Number(prev || 0) + 1000),
                )
              }
            >
              <Plus size={21} color="#FFFFFF" strokeWidth={2} />
            </button>
          </div>

          {isOfferInvalid && (
            <div className="maxiReviewScreenValidationContainer">
              <AlertCircle size={15} color="#F87171" strokeWidth={2} />

              <span className="maxiReviewScreenValidationText">
                Offer must be within the suggested range
              </span>
            </div>
          )}

          <div className="maxiReviewScreenHelperContainer">
            <Info size={14} color="#94A3B8" strokeWidth={2} />

            <span className="maxiReviewScreenHelperText">
              Couriers will bid around your offer.
            </span>
          </div>
        </div>

        {/* CARGO PHOTOS */}
        <div className="maxiReviewScreenCard">
          <div className="maxiReviewScreenCardHeader">
            <div className="maxiReviewScreenSectionIcon">
              <Camera size={17} color="#F97316" strokeWidth={2} />
            </div>

            <div className="maxiReviewScreenHeaderFlex">
              <span className="maxiReviewScreenSectionTitle">Cargo Photos</span>
              <span className="maxiReviewScreenSectionSubtitle">
                Capture the condition of the shipment
              </span>
            </div>

            {senderPreTransferPhotos?.length > 0 && (
              <div className="maxiReviewScreenCountBadge">
                <span className="maxiReviewScreenCountBadgeText">
                  {senderPreTransferPhotos.length}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="maxiReviewScreenUploadBtn"
            onClick={() => {
              setCameraMode("photo");
              setShowCamera(true);
            }}
          >
            <div className="maxiReviewScreenUploadIcon">
              <Camera size={18} color="#FFFFFF" strokeWidth={2} />
            </div>

            <div className="maxiReviewScreenUploadContent">
              <span className="maxiReviewScreenUploadText">Capture Photo</span>
              <span className="maxiReviewScreenUploadSubtext">
                Add clear photos of the cargo
              </span>
            </div>

            <ChevronRight size={17} color="#94A3B8" strokeWidth={2} />
          </button>

          {senderPreTransferPhotos?.length > 0 && (
            <div className="maxiReviewScreenMediaRow">
              {senderPreTransferPhotos.map((photo, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => {
                    setSelectedIndex(index);
                    setPreviewVisible(true);
                  }}
                  className="maxiReviewScreenPhotoWrapper"
                >
                  <img
                    src={photo.uri}
                    className="maxiReviewScreenPreviewImage"
                    alt={`Cargo ${index + 1}`}
                  />

                  <div className="maxiReviewScreenPhotoIndex">
                    <span className="maxiReviewScreenPhotoIndexText">
                      {index + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CARGO VIDEO */}
        <div className="maxiReviewScreenCard">
          <div className="maxiReviewScreenCardHeader">
            <div className="maxiReviewScreenSectionIcon">
              <Video size={17} color="#F97316" strokeWidth={2} />
            </div>

            <div className="maxiReviewScreenHeaderFlex">
              <span className="maxiReviewScreenSectionTitle">Cargo Video</span>
              <span className="maxiReviewScreenSectionSubtitle">
                Record a short video of the shipment
              </span>
            </div>

            {senderPreTransferVideo && (
              <div className="maxiReviewScreenStatusBadge">
                <div className="maxiReviewScreenStatusDot" />
                <span className="maxiReviewScreenStatusText">Added</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="maxiReviewScreenUploadBtn"
            onClick={() => {
              setCameraMode("video");
              setShowCamera(true);
            }}
          >
            <div className="maxiReviewScreenUploadIcon">
              <Video size={18} color="#FFFFFF" strokeWidth={2} />
            </div>

            <div className="maxiReviewScreenUploadContent">
              <span className="maxiReviewScreenUploadText">
                {senderPreTransferVideo ? "Re-record Video" : "Record Video"}
              </span>

              <span className="maxiReviewScreenUploadSubtext">
                {senderPreTransferVideo
                  ? "Replace the existing cargo video"
                  : "Show the condition and size of the cargo"}
              </span>
            </div>

            <ChevronRight size={17} color="#94A3B8" strokeWidth={2} />
          </button>

          {senderPreTransferVideo?.uri && (
            <button
              type="button"
              className="maxiReviewScreenVideoPreview"
              onClick={() => {
                const videoIndex = senderPreTransferPhotos?.length || 0;

                setSelectedIndex(videoIndex);
                setPreviewVisible(true);
              }}
            >
              <VideoThumbnail
                uri={senderPreTransferVideo.uri}
                className="maxiReviewScreenVideoThumbnail"
              />

              <div className="maxiReviewScreenPlayOverlay">
                <div className="maxiReviewScreenPlayButton">
                  <Play size={20} color="#FFFFFF" strokeWidth={2} />
                </div>

                <span className="maxiReviewScreenVideoPreviewLabel">
                  Tap to preview
                </span>
              </div>
            </button>
          )}
        </div>

        <div className="maxiReviewScreenBottomSpacer" />
      </div>

      {/* CAMERA MODAL */}
      {showCamera && (
        <div className="maxiReviewScreenCameraModal">
          <CameraCapture
            mode={cameraMode}
            onClose={() => setShowCamera(false)}
            onPhotoCaptured={(photo) => {
              setSenderPreTransferPhotos((prev) => [...(prev || []), photo]);

              setSenderPreTransferRecordedAt(photo.recordedAt);
            }}
            onVideoCaptured={(video) => {
              setSenderPreTransferVideo(video);
              setSenderPreTransferRecordedAt(video.recordedAt);
            }}
          />
        </div>
      )}

      {/* MEDIA PREVIEW */}
      <MediaPreviewModal
        visible={previewVisible}
        mediaList={[
          ...(senderPreTransferPhotos || []).map((photo) => ({
            ...photo,
            type: "photo",
          })),

          ...(senderPreTransferVideo
            ? [
                {
                  ...senderPreTransferVideo,
                  type: "video",
                },
              ]
            : []),
        ]}
        initialIndex={selectedIndex}
        onClose={() => setPreviewVisible(false)}
        onDelete={(index) => {
          const photos = [...(senderPreTransferPhotos || [])];

          if (index < photos.length) {
            photos.splice(index, 1);
            setSenderPreTransferPhotos(photos);
          } else {
            setSenderPreTransferVideo(null);
          }
        }}
      />
    </main>
  );
}
