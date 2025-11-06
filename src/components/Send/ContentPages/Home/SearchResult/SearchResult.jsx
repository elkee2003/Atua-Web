import React, { useRef, useMemo, useState } from "react";
import '../SendStyles/SearchResult.css';
import ResultMap from "./ResultMap";
import AtuaTypes from "./AtuaTypes";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const SearchResultComponent = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [totalMins, setTotalMins] = useState(0);
  const [totalKm, setTotalKm] = useState(0);

  // Surcharges
  const [isPeakHour, setIsPeakHour] = useState(false);
  const [isWeekend, setIsWeekend] = useState(false);
  const [isNightTime, setIsNightTime] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);

  return (
    <div className="searchResultContainer">
      <ResultMap
        setTotalMins={setTotalMins}
        setTotalKm={setTotalKm}
        setIsPeakHour={setIsPeakHour}
        setIsWeekend={setIsWeekend}
        setIsNightTime={setIsNightTime}
        setIsHoliday={setIsHoliday}
      />

      <button className="backBtn" onClick={() => navigate(-1)}>
        <IoArrowBack  className="backBtnIcon" />
      </button>

      <div className="bottom-sheet">
        <AtuaTypes
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          calculatedPrice={calculatedPrice}
          setCalculatedPrice={setCalculatedPrice}
          totalMins={totalMins}
          totalKm={totalKm}
          isPeakHour={isPeakHour}
          isWeekend={isWeekend}
          isNightTime={isNightTime}
          isHoliday={isHoliday}
        />
      </div>
    </div>
  );
};

export default SearchResultComponent;
