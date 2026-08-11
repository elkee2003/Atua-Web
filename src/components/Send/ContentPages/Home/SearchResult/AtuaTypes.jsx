import React from "react";
import { useNavigate } from "react-router-dom";
import { FaInfoCircle } from "react-icons/fa";

import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";

import { TRANSPORT_TYPES } from "../../../../../../constants/transportTypes";
import { pricingEngine } from "../../../../../../modules/pricingEngine";
import { formatCurrency } from "../../../../../../utils/formatCurrency";
import { getAvailableServices } from "../../../../../../utils/getAvailableServices";

import deliveryMediums from "../../../../../assets/data/types";

import "../SendStyles/AtuaTypes.css";

const AtuaTypes = ({ selectedType, setSelectedType }) => {
  const navigate = useNavigate();

  const {
    setOperationalFare,
    setTotalPrice,
    setCourierEarnings,
    setPlatformFee,
    setCommissionAmount,
    setPlatformServiceRevenue,
    setVatAmount,
    setPlatformNetRevenue,
    setTransportationType,
    resetOrderByTransportType,
  } = useOrderContext();

  const { totalKm, totalMins, isRouteReady } = useLocationContext();

  /*
  ========================================================
  CONTINUE STATE
  ========================================================
  */

  const canContinue =
    selectedType && isRouteReady && totalKm > 0 && totalMins > 0;

  /*
  ========================================================
  AVAILABLE SERVICES
  ========================================================
  */

  const availableServiceTypes = getAvailableServices(totalKm);

  const filteredDeliveryMediums = deliveryMediums.filter((medium) =>
    availableServiceTypes.includes(medium.type),
  );

  /*
  ========================================================
  SERVICE IMAGE
  ========================================================
  */

  const getImage = (type) => {
    switch (type) {
      case TRANSPORT_TYPES.MICRO_EXPRESS:
        return "/AtuaMicroX.png";

      case TRANSPORT_TYPES.MICRO_BATCH:
        return "/AtuaMicroBatch.png";

      case TRANSPORT_TYPES.MOTO_EXPRESS:
        return "/AtuaMotoX.png";

      case TRANSPORT_TYPES.MOTO_BATCH:
        return "/AtuaMotoBatch.png";

      case TRANSPORT_TYPES.MAXI:
        return "/AtuaMaxi.png";

      default:
        return "/AtuaMicroBatch.png";
    }
  };

  /*
  ========================================================
  INFO
  ========================================================
  */

  const showInfoAlert = (type) => {
    switch (type) {
      case TRANSPORT_TYPES.MOTO_EXPRESS:
        window.alert(
          "Moto Express\n\nFast delivery using motorcycles or cars. Ideal for medium-distance urgent deliveries.",
        );
        break;

      case TRANSPORT_TYPES.MICRO_EXPRESS:
        window.alert(
          "Micro Express\n\nEco-friendly delivery using bicycles or scooters. Best for short distances.",
        );
        break;

      case TRANSPORT_TYPES.MAXI:
        window.alert(
          "Freight / Van\n\nLarge-item delivery using trucks and heavy-duty vehicles. Drivers will bid for your delivery.",
        );
        break;

      case TRANSPORT_TYPES.MOTO_BATCH:
        window.alert(
          "Moto Batch\n\nCost-saving delivery using motorcycles or cars. Delivery is grouped with other orders.",
        );
        break;

      case TRANSPORT_TYPES.MICRO_BATCH:
        window.alert(
          "Micro Batch\n\nEco-friendly delivery using bicycles or scooters. Delivery is grouped with other orders.",
        );
        break;

      default:
        break;
    }
  };

  /*
  ========================================================
  CONFIRM
  ========================================================
  */
  return (
    <div className="atuaTypesContainer">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="atuaTypesHeader">
        <span className="distanceText">
          {totalKm} km • {totalMins} mins
        </span>
      </div>

      {/* ======================================
          SERVICES
      ====================================== */}

      <div className="atuaTypesList">
        {filteredDeliveryMediums.map((medium) => {
          const isMaxi = medium.type === TRANSPORT_TYPES.MAXI;

          const priceData = !isMaxi
            ? pricingEngine({
                type: medium.type,
                distanceKm: totalKm,
              })
            : null;

          const isSelected = selectedType === medium.type;

          return (
            <div
              key={medium.id}
              className={`atuaTypeCard ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedType(medium.type)}
            >
              {/* ==========================
                  IMAGE
              ========================== */}

              <img
                src={getImage(medium.type)}
                alt={medium.label}
                className="atuaTypeImage"
              />

              {/* ==========================
                  CONTENT
              ========================== */}

              <div className="atuaTypeContent">
                <div className="atuaTypeTitleRow">
                  <h3 className="atuaTypeTitle">{medium.label}</h3>

                  <button
                    className="infoButton"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      showInfoAlert(medium.type);
                    }}
                  >
                    <FaInfoCircle />
                  </button>
                </div>

                <p className="atuaTypeSubtitle">Fast • Reliable • Secure</p>
              </div>

              {/* ==========================
                  PRICE
              ========================== */}

              <div className="atuaTypePrice">
                <span className="price">
                  {priceData
                    ? formatCurrency(priceData.customerPrice)
                    : "Get Quotes"}
                </span>

                <span className="priceTag">est.</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AtuaTypes;
