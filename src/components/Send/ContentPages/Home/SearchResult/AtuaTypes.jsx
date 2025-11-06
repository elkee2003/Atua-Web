import React from "react";
import "../SendStyles/AtuaTypes.css";
import deliveryMediums from "../../../../../assets/types";
import { IoInformationCircleOutline, IoPricetag } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

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

  // --- Price Calculation Logic ---
  const calculatePrice = (type, distance) => {
    const serviceFee = 300;
    let baseCharge = 0;
    let pricePerKm = 0;

    if (distance <= 5) {
      baseCharge = 50;
      if (type === "Micro X") pricePerKm = 185;
      if (type === "Moto X") pricePerKm = 220;
    } else if (distance > 5 && distance <= 10) {
      baseCharge = 75;
      if (type === "Micro X") pricePerKm = 180;
      if (type === "Moto X") pricePerKm = 210;
    }

    let estimatedPrice = baseCharge + distance * pricePerKm + serviceFee;

    if (isPeakHour) estimatedPrice *= 1.2;
    if (isNightTime) estimatedPrice += 150;
    if (isWeekend) estimatedPrice += 100;
    if (isHoliday) estimatedPrice += 200;

    return estimatedPrice.toFixed(2);
  };

  // --- On Confirm ---
  const onConfirm = (medium) => {
    setSelectedType(medium.type);
    const calculated = calculatePrice(medium.type, totalKm);

    if (totalKm > 0) {
      if (medium.type === "Maxi") {
        alert("Coming soon!");
      } else {
        alert(`Confirmed ${medium.type} - est. ₦${calculated}`);
        navigate("/checkout");
      }
    } else {
      alert("Calculating Price...");
    }
  };

  // --- Render UI ---
  return (
    <div className="atuaTypeContainerWrapper">
      {deliveryMediums.map((medium) => {
        const calculatedCost = calculatePrice(medium.type, totalKm);
        const isSelected = selectedType === medium.type;

        return (
          <div
            key={medium.id}
            className={`atuaTypeContainer ${isSelected ? "selected" : ""}`}
            onClick={() => setSelectedType(medium?.type)}
          >
            {/* Left: Image */}
            <img
              src={medium?.image}
              alt={medium?.type}
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
                    alert(`${medium?.type} info:\n${medium?.description}`);
                  }}
                />
              </div>
              <p className="atuaTypeTime">{totalKm ? Number(totalKm).toFixed(2) : "0.00"} km • {totalMins} mins</p>
            </div>

            {/* Right: Price */}
            <div className="atuaTypeRight">
              <IoPricetag className="atuaTypeInfoIcon" />
              <span className="atuaTypePrice">₦{calculatedCost}</span>
            </div>
          </div>
        );
      })}

      {/* Confirm Button */}
      {selectedType && (
        <div className="confirmBtn" onClick={() => {
          const medium = deliveryMediums.find(m => m.type === selectedType);
          if (medium) onConfirm(medium);
        }}>
          <span className="confirmBtnText">Confirm {selectedType}</span>
        </div>
      )}
    </div>
  );
};

export default AtuaTypes;
