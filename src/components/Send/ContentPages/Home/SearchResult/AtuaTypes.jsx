import React, {useState} from "react";
import "../SendStyles/AtuaTypes.css";
import { IoInformationCircleOutline, IoPricetag } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import deliveryMediums from "../../../../../assets/types";
import { useOrderContext } from "../../../../../../Provider/OrderProvider";

const AtuaTypes = ({
  selectedType,
  setSelectedType,
  totalKm,
  totalMins,
  isPeakHour,
  isWeekend,
  isNightTime,
  isHoliday,
}) => {
  const navigate = useNavigate();

  const {setPrice, setCourierFee, setTransportationType} = useOrderContext()

  // Format time
  const formatDuration = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min${minutes > 1 ? "s" : ""}` : ""}`;
    }
    return `${minutes} min${minutes > 1 ? "s" : ""}`;
  };

  // Format distance
  const formatDistance = (km) => {
    if (km < 1) {
      const meters = Math.round(km * 1000);
      return `${meters} m`;
    }
    return `${km.toFixed(2)} km`;
  };

  // Function for display of AtuaTypes
  const getImage=(medium)=>{
      if (medium?.type === 'Micro X'){
          return '/Walk.png'
      }
      if (medium?.type === 'Moto X'){
          return '/Bike.jpg'
      }
      if (medium?.type === 'Maxi'){
          return '/UberXL.jpeg'
      }
      if (medium?.type === 'GROUP'){
          return '/Deliverybicycle.png'
      }
      return '/UberXL.jpeg';
  }

  // --- Info Alert ---
  const showInfoAlert = (type) => {
    if (type === "Moto X") {
      alert(
        "Moto X\n\nMoto Express. This transportation method is suitable for faster, mid-sized deliveries that require speed and distance. Includes Motorcycles, Mopeds, Cars."
      );
    } else if (type === "Micro X") {
      alert(
        "Micro X\n\nMicro Express. Eco-friendly transport methods like Bicycles, Scooters, or Skates for quick, short-distance deliveries."
      );
    } else if (type === "Maxi") {
      alert(
        "Maxi\n\nBest for large or bulky items that need spacious transport. Includes Vans, Trucks, and Cargo vehicles."
      );
    } else if (type === "Moto Batch") {
      alert(
        "Moto Batch\n\nSuitable for faster, mid-sized deliveries requiring speed and distance. Includes Motorcycles, Mopeds, Cars."
      );
    } else if (type === "Micro Batch") {
      alert(
        "Micro Batch\n\nEco-friendly transport like Bicycles or Scooters for quick, short deliveries."
      );
    }
  };

  // --- Price Calculation ---
  const calculatePrice = (type, distance) => {
    const serviceFee = 300;
    let baseCharge = 0;
    let pricePerKm = 0;

    // Flat rate for short distances
    if (distance <= 2.7) {
      if (type === "Micro X") return 300 + serviceFee;
      if (type === "Moto X") return 500 + serviceFee;
      if (type === "GROUP") return 250 + serviceFee;
    }

    // Distance-based pricing
    if (distance <= 5) {
      baseCharge = 50;
      if (type === "Micro X") pricePerKm = 185;
      if (type === "Moto X") pricePerKm = 220;
      if (type === "GROUP") pricePerKm = 170;
    } else if (distance <= 10) {
      baseCharge = 75;
      if (type === "Micro X") pricePerKm = 180;
      if (type === "Moto X") pricePerKm = 210;
      if (type === "GROUP") pricePerKm = 150;
    } else if (distance <= 15) {
      baseCharge = 100;
      if (type === "Micro X") pricePerKm = 175;
      if (type === "Moto X") pricePerKm = 200;
      if (type === "GROUP") pricePerKm = 140;
    } else if (distance <= 20) {
      baseCharge = 125;
      if (type === "Micro X") pricePerKm = 170;
      if (type === "Moto X") pricePerKm = 190;
      if (type === "GROUP") pricePerKm = 130;
    } else if (distance <= 25) {
      baseCharge = 150;
      if (type === "Micro X") pricePerKm = 165;
      if (type === "Moto X") pricePerKm = 185;
      if (type === "GROUP") pricePerKm = 125;
    } else if (distance <= 30) {
      baseCharge = 175;
      if (type === "Micro X") pricePerKm = 160;
      if (type === "Moto X") pricePerKm = 180;
      if (type === "GROUP") pricePerKm = 120;
    } else if (distance > 30) {
      baseCharge = 250;
      if (type === "Micro X") pricePerKm = 150;
      if (type === "Moto X") pricePerKm = 175;
      if (type === "GROUP") pricePerKm = 110;
    }

    let estimatedPrice = baseCharge + distance * pricePerKm + serviceFee;

    // --- Apply surcharges ---
    if (isPeakHour) estimatedPrice *= 1.2; // 20% peak hour
    if (isNightTime) estimatedPrice += 150; // ₦150 night surcharge
    if (isWeekend) estimatedPrice += 100; // ₦100 weekend
    if (isHoliday) estimatedPrice += 200; // ₦200 holiday
    if (distance > 45) estimatedPrice += 250; // long distance

    return estimatedPrice.toFixed(2);
  };

  // --- Confirm Selection ---
  const onConfirm = (medium) => {
    const calculatedCost = calculatePrice(medium.type, totalKm);
    setSelectedType(medium.type);
    
    // ✅ Set global context values
    setTransportationType(medium.type);
    setPrice(calculatedCost);

    if (totalKm > 0) {
      // Compute courier fee (same logic)
      let courierFeeValue;
      if (calculatedCost === 600) {
        courierFeeValue = (calculatedCost - 300).toFixed(2);
      } else {
        const baseAmount = calculatedCost - 300;
        courierFeeValue = (baseAmount * 0.85).toFixed(2);
      }
      
      // ✅ Set globally accessible courier fee
      setCourierFee(courierFeeValue);

      if (medium.type === "Maxi") {
        alert("Coming soon!");
      } else {
        alert(
          `Confirmed ${medium.type}\nDistance: ${totalKm} km\nEstimated Price: ₦${calculatedCost}\nCourier Fee: ₦${courierFeeValue}`
        );
        navigate("/send/checkout");
      }
    } else {
      alert("Calculating Price...");
    }
  };

  // --- Filter delivery mediums ---
  const filteredDeliveryMediums = deliveryMediums.filter(
    (medium) =>
      !(
        (medium.type === "Micro X" || medium.type === "Micro Batch") &&
        totalKm > 13
      )
  );

  return (
    <div className="atuaTypeContainerWrapper">
      {filteredDeliveryMediums.map((medium) => {
        const calculatedCost = calculatePrice(medium.type, totalKm);
        const isSelected = selectedType === medium.type;

        return (
          <div
            key={medium.id}
            className={`atuaTypeContainer ${isSelected ? "selected" : ""}`}
            onClick={() => setSelectedType(medium.type)}
          >
            {/* Left: Image */}
            <img
              src={getImage(medium)}
              alt={medium.type}
              className="atuaTypeImage"
            />

            {/* Middle: Info */}
            <div className="atuaTypeMiddle">
              <div className="atuaTypeInfoRow">
                <h3 className="atuaTypeLabel">{medium.type}</h3>
                <IoInformationCircleOutline
                  className="atuaTypeInfoIcon"
                  title="More Info"
                  onClick={(e) => {
                    e.stopPropagation();
                    showInfoAlert(medium.type);
                  }}
                />
              </div>
              <p className="atuaTypeTime">
                {formatDistance(totalKm)} • {formatDuration(totalMins)}
              </p>
            </div>

            {/* Right: Price */}
            <div className="atuaTypeRight">
              <IoPricetag className="atuaTypeInfoIcon" />
              {totalKm > 0 ? (
                medium.type !== "Maxi" ? (
                  <span className="atuaTypePrice">₦{calculatedCost}</span>
                ) : (
                  <span className="atuaTypePrice">Coming soon</span>
                )
              ) : (
                <span className="atuaTypePrice">...</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Confirm Button */}
      {selectedType && (
        <div
          className="confirmBtn"
          onClick={() => {
            const medium = filteredDeliveryMediums.find(
              (m) => m.type === selectedType
            );
            if (medium) onConfirm(medium);
          }}
        >
          <span className="confirmBtnText">Confirm {selectedType}</span>
        </div>
      )}
    </div>
  );
};

export default AtuaTypes;
