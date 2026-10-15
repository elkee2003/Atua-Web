import React, { useMemo } from "react";

import { useNavigate } from "react-router-dom";
import { FaInfoCircle } from "react-icons/fa";

import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";

import { TRANSPORT_TYPES } from "../../../../../../constants/transportTypes";
import { pricingEngine } from "../../../../../../modules/pricingEngine";
import { formatCurrency } from "../../../../../../utils/formatCurrency";
import { getAvailableServices } from "../../../../../../utils/getAvailableServices";
import { SERVICE_RULES } from "../../../../../../config/serviceRules";

import deliveryMediums from "../../../../../assets/data/types";
import "../SendStyles/AtuaTypes.css";

// Maximum age of a courier's live location.
const MAX_LOCATION_AGE_MS = 3 * 60 * 1000;

const MICRO_SERVICE_TYPES = new Set([
  TRANSPORT_TYPES.MICRO_EXPRESS,
  TRANSPORT_TYPES.MICRO_BATCH,
]);

const VEHICLE_IMAGES = {
  [TRANSPORT_TYPES.MICRO_EXPRESS]: "/AtuaMicroX.png",
  [TRANSPORT_TYPES.MICRO_BATCH]: "/AtuaMicroBatch.png",
  [TRANSPORT_TYPES.MOTO_EXPRESS]: "/AtuaMotoX.png",
  [TRANSPORT_TYPES.MOTO_BATCH]: "/AtuaMotoBatch.png",
  [TRANSPORT_TYPES.MAXI]: "/AtuaMaxi.png",
};

const SERVICE_NAMES = {
  [TRANSPORT_TYPES.MICRO_EXPRESS]: "Micro Express",
  [TRANSPORT_TYPES.MICRO_BATCH]: "Micro Batch",
  [TRANSPORT_TYPES.MOTO_EXPRESS]: "Moto Express",
  [TRANSPORT_TYPES.MOTO_BATCH]: "Moto Batch",
  [TRANSPORT_TYPES.MAXI]: "Maxi",
};

const getCoordinate = (value) => {
  if (typeof value === "function") {
    try {
      return Number(value());
    } catch {
      return NaN;
    }
  }

  if (value !== undefined && value !== null) {
    return Number(value);
  }

  return NaN;
};

const getCourierCoordinates = (courier) => {
  const liveLocation = courier?.liveLocation ?? courier;

  const latitude = getCoordinate(liveLocation?.latitude ?? liveLocation?.lat);

  const longitude = getCoordinate(liveLocation?.longitude ?? liveLocation?.lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
};

const isFreshLocation = (courier) => {
  const liveLocation = courier?.liveLocation ?? courier;

  if (liveLocation?.isTracking !== true) {
    return false;
  }

  const timestamp = liveLocation?.lastSeenAt;

  if (!timestamp) {
    return false;
  }

  const parsedTimestamp =
    typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();

  if (!Number.isFinite(parsedTimestamp)) {
    return false;
  }

  const age = Date.now() - parsedTimestamp;

  return age >= 0 && age <= MAX_LOCATION_AGE_MS;
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const getDistanceKm = (pointA, pointB) => {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(pointB.latitude - pointA.latitude);

  const longitudeDifference = toRadians(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(pointA.latitude)) *
      Math.cos(toRadians(pointB.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(Math.min(1, a)));
};

const getServiceName = (type) =>
  SERVICE_NAMES[type] ?? String(type ?? "").replaceAll("_", " ");

const isMicroService = (type) => MICRO_SERVICE_TYPES.has(type);

const getPickupDistanceLimit = (type) => {
  const limit = Number(SERVICE_RULES?.[type]?.maxCourierPickupDistanceKm);

  return Number.isFinite(limit) && limit >= 0 ? limit : null;
};

const getServiceAvailability = ({
  type,
  nearbyCouriers,
  courierAvailabilityReady,
  pickupCoordinates,
}) => {
  // Preserve existing Moto and Maxi behaviour.
  if (!isMicroService(type)) {
    return { available: true, reason: "" };
  }

  if (!pickupCoordinates) {
    return {
      available: false,
      reason: "Choose a pickup location",
    };
  }

  if (!courierAvailabilityReady) {
    return {
      available: false,
      reason: "Checking nearby couriers...",
    };
  }

  const maxDistance = SERVICE_RULES[type]?.maxCourierPickupDistanceKm;

  if (typeof maxDistance !== "number" || !Number.isFinite(maxDistance)) {
    return {
      available: false,
      reason: "Availability unavailable",
    };
  }

  const now = Date.now();

  const available = nearbyCouriers.some(({ courier, liveLocation }) => {
    if (!courier || !liveLocation) {
      return false;
    }

    if (
      courier.isOnline !== true ||
      courier.isApproved !== true ||
      courier.isBlocked === true ||
      liveLocation.isTracking !== true ||
      courier.transportationType !== "MICRO"
    ) {
      return false;
    }

    const { latitude, longitude, lastSeenAt } = liveLocation;

    if (
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      !lastSeenAt
    ) {
      return false;
    }

    const timestamp = new Date(lastSeenAt).getTime();

    if (!Number.isFinite(timestamp)) {
      return false;
    }

    const age = now - timestamp;

    if (age < 0 || age > MAX_LOCATION_AGE_MS) {
      return false;
    }

    const distanceKm = getDistanceKm(
      {
        latitude: Number(pickupCoordinates.latitude),
        longitude: Number(pickupCoordinates.longitude),
      },
      { latitude, longitude },
    );

    return distanceKm <= maxDistance;
  });

  return {
    available,
    reason: available ? "" : "No courier nearby",
  };
};

const AtuaTypes = ({
  selectedType,
  setSelectedType,
  nearbyCouriers = [],
  courierAvailabilityReady = false,
  pickupCoordinates = null,
}) => {
  const { totalKm, totalMins } = useLocationContext();

  const {
    setTransportationType,
    setPrice,
    setPricePerKm,
    setPricePerMin,
    setBaseFare,
    setDistanceCost,
    setTimeCost,
  } = useOrderContext();

  const availableServices = useMemo(
    () => getAvailableServices(totalKm),
    [totalKm],
  );

  const filteredDeliveryMediums = useMemo(
    () =>
      deliveryMediums.filter((medium) =>
        availableServices.includes(medium.type),
      ),
    [availableServices],
  );

  const getPricing = (type) => {
    if (type === TRANSPORT_TYPES.MAXI) {
      return null;
    }

    if (!(Number(totalKm) > 0)) {
      return null;
    }

    try {
      return pricingEngine({
        type,
        distanceKm: Number(totalKm),
      });
    } catch (error) {
      console.error("Unable to calculate service pricing:", error);
      return null;
    }
  };

  const handleSelect = (type) => {
    const availability = getServiceAvailability({
      type,
      nearbyCouriers,
      courierAvailabilityReady,
      pickupCoordinates,
    });

    if (!availability.available) {
      window.alert(availability.reason);
      return;
    }

    setSelectedType(type);
  };

  const handleInfo = (event, medium) => {
    event.stopPropagation();

    const availability = getServiceAvailability({
      type: medium.type,
      nearbyCouriers,
      courierAvailabilityReady,
      pickupCoordinates,
    });

    const pricing = getPricing(medium.type);

    let message = `${getServiceName(medium.type)}`;

    if (medium.description) {
      message += `\n\n${medium.description}`;
    }

    if (!availability.available) {
      message += `\n\nAvailability: ${availability.reason}`;
    } else if (pricing) {
      message += `\n\nEstimated fare: ${formatCurrency(pricing.customerPrice)}`;
    }

    window.alert(message);
  };

  return (
    <div className="atuaTypesContainer">
      <div className="atuaTypesHeader">
        <p className="distanceText">
          {Number(totalKm) > 0 && Number(totalMins) > 0
            ? `${totalKm} km · ${totalMins} mins`
            : "Calculating route..."}
        </p>
      </div>

      <div className="atuaTypesList">
        {filteredDeliveryMediums.map((medium) => {
          const type = medium.type;

          const availability = getServiceAvailability({
            type,
            nearbyCouriers,
            courierAvailabilityReady,
            pickupCoordinates,
          });

          const isSelected = selectedType === type;
          const isDisabled = !availability.available;
          const pricing = getPricing(type);

          return (
            <div
              key={type}
              className={[
                "atuaTypeCard",
                isSelected ? "selected" : "",
                isDisabled ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSelect(type)}
              aria-disabled={isDisabled}
              aria-pressed={isSelected}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(event) => {
                if (
                  !isDisabled &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  handleSelect(type);
                }
              }}
            >
              <div className="atuaTypeCardInfo">
                <img
                  className="atuaTypeImage"
                  src={VEHICLE_IMAGES[type] ?? "/AtuaMicroX.png"}
                  alt={getServiceName(type)}
                />

                <div className="atuaTypeText">
                  <h3>{getServiceName(type)}</h3>

                  {medium.description && <p>{medium.description}</p>}

                  {isDisabled && (
                    <p className="serviceAvailabilityMessage">
                      {availability.reason}
                    </p>
                  )}

                  {!isDisabled && pricing && (
                    <p className="servicePrice">
                      {formatCurrency(pricing.customerPrice)}
                    </p>
                  )}

                  {type === TRANSPORT_TYPES.MAXI && (
                    <p className="servicePrice">Get Quotes</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="atuaTypeInfoButton"
                aria-label={`Information about ${getServiceName(type)}`}
                onClick={(event) => handleInfo(event, medium)}
              >
                <FaInfoCircle />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AtuaTypes;
