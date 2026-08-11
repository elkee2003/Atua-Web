import React, { useMemo, useState } from "react";
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

const SearchResultComponent = () => {
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState(null);

  const { totalKm, totalMins, isRouteReady, originLat } = useLocationContext();
  console.log("Origin Lat:", originLat);

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

  const availableServiceTypes = useMemo(() => {
    return getAvailableServices(totalKm);
  }, [totalKm]);

  const filteredDeliveryMediums = useMemo(() => {
    return deliveryMediums.filter((medium) =>
      availableServiceTypes.includes(medium.type),
    );
  }, [availableServiceTypes]);

  const canContinue =
    selectedType && isRouteReady && totalKm > 0 && totalMins > 0;

  const handleContinue = () => {
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
      distanceKm: totalKm,
    });

    if (!priceData) {
      alert("Unable to calculate price.");
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

  return (
    <div className="searchResultContainer">
      {/* Back Button */}

      <button className="searchResultBackButton" onClick={() => navigate(-1)}>
        <IoArrowBack className="searchResultBackButtonIcon" />
      </button>

      {/* Main Layout */}

      <div className="searchResultLayout">
        {/* ================= MAP ================= */}

        <section className="searchResultMapSection">
          <ResultMap />
        </section>

        {/* ================= SIDEBAR ================= */}

        <aside className="searchResultSidebar">
          <div className="searchResultSidebarContent">
            <AtuaTypes
              selectedType={selectedType}
              setSelectedType={setSelectedType}
            />
          </div>

          <div className="searchResultBottomBar">
            <button
              className={`searchResultContinueButton ${
                !canContinue ? "searchResultContinueButtonDisabled" : ""
              }`}
              disabled={!canContinue}
              onClick={handleContinue}
            >
              {!isRouteReady
                ? "Calculating Route..."
                : !selectedType
                  ? "Select a Service"
                  : "Continue"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SearchResultComponent;
