import React, { useCallback, useMemo, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import ResultMap from "./ResultMap";
import AtuaTypes from "./AtuaTypes";

import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";

import deliveryMediums from "../../../../../assets/data/types";

import { TRANSPORT_TYPES } from "../../../../../../constants/transportTypes";
import { pricingEngine } from "../../../../../../modules/pricingEngine";
import { getAvailableServices } from "../../../../../../utils/getAvailableServices";

import "../SendStyles/SearchResult.css";

const getPickupCoordinates = (originAddress) => {
  const location = originAddress?.details?.geometry?.location;

  if (!location) return null;

  const read = (value) => (typeof value === "function" ? value() : value);

  const lat = Number(read(location.lat));
  const lng = Number(read(location.lng));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
};

const SearchResultComponent = () => {
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState(null);

  // null means courier availability is still loading.
  const [nearbyCouriers, setNearbyCouriers] = useState(null);

  const { originAddress, totalKm, totalMins, isRouteReady } =
    useLocationContext();

  const {
    resetOrderByTransportType,
    setTransportationType,
    setOperationalFare,
    setTotalPrice,
    setCourierEarnings,
    setPlatformFee,
    setCommissionAmount,
    setPlatformServiceRevenue,
    setVatAmount,
    setPlatformNetRevenue,
  } = useOrderContext();

  const pickupCoordinates = useMemo(
    () => getPickupCoordinates(originAddress),
    [originAddress],
  );

  const availableServiceTypes = useMemo(
    () => getAvailableServices(totalKm),
    [totalKm],
  );

  const filteredDeliveryMediums = useMemo(
    () =>
      deliveryMediums.filter((medium) =>
        availableServiceTypes.includes(medium.type),
      ),
    [availableServiceTypes],
  );

  const isMicroService = useCallback(
    (type) =>
      type === TRANSPORT_TYPES.MICRO_EXPRESS ||
      type === TRANSPORT_TYPES.MICRO_BATCH,
    [],
  );

  const canContinue = Boolean(
    selectedType &&
    isRouteReady &&
    Number(totalKm) > 0 &&
    Number(totalMins) > 0 &&
    (!isMicroService(selectedType) ||
      (pickupCoordinates !== null && nearbyCouriers !== null)),
  );

  const handleContinue = () => {
    if (!canContinue) return;

    const medium = filteredDeliveryMediums.find(
      (item) => item.type === selectedType,
    );

    if (!medium) return;

    resetOrderByTransportType(medium.type);
    setTransportationType(medium.type);

    if (medium.type === TRANSPORT_TYPES.MAXI) {
      navigate("/send/maxitypes");
      return;
    }

    const priceData = pricingEngine({
      type: medium.type,
      distanceKm: Number(totalKm),
    });

    if (!priceData) {
      window.alert("Unable to calculate price.");
      return;
    }

    setOperationalFare(priceData.operationalFare);
    setTotalPrice(priceData.customerPrice);
    setCourierEarnings(priceData.courierEarnings);
    setPlatformFee(priceData.platformFee);
    setCommissionAmount(priceData.commissionAmount);
    setPlatformServiceRevenue(priceData.platformServiceRevenue);
    setVatAmount(priceData.vatAmount);
    setPlatformNetRevenue(priceData.platformNetRevenue);

    navigate("/send/parcel_notes");
  };

  const continueLabel = !isRouteReady
    ? "Calculating Route..."
    : !selectedType
      ? "Select a Service"
      : isMicroService(selectedType) && !pickupCoordinates
        ? "Choose a Pickup Location"
        : isMicroService(selectedType) && nearbyCouriers === null
          ? "Checking Nearby Couriers..."
          : "Continue";

  return (
    <div className="searchResultContainer">
      <button
        type="button"
        className="searchResultBackButton"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <IoArrowBack className="searchResultBackButtonIcon" />
      </button>

      <div className="searchResultLayout">
        <section className="searchResultMapSection">
          <ResultMap onCouriersChange={setNearbyCouriers} />
        </section>

        <aside className="searchResultSidebar">
          <div className="searchResultSidebarContent">
            <AtuaTypes
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              nearbyCouriers={nearbyCouriers ?? []}
              courierAvailabilityReady={nearbyCouriers !== null}
              pickupCoordinates={pickupCoordinates}
            />
          </div>

          <div className="searchResultBottomBar">
            <button
              type="button"
              className={`searchResultContinueButton ${
                !canContinue ? "searchResultContinueButtonDisabled" : ""
              }`}
              disabled={!canContinue}
              onClick={handleContinue}
            >
              {continueLabel}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SearchResultComponent;
