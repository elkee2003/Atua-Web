import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderContext } from "../../../../../../../../../Providers/ClientProvider/OrderProvider";
import "./MaxiLoadingDetails.css";

const HELPER_OPTIONS = [
  {
    label: "Handle Myself",
    value: 0,
    responsibility: "Handle Myself",
  },
  {
    label: "Driver Assists",
    value: 5000,
    responsibility: "Driver Assists",
  },
  {
    label: "Driver +1 Helper",
    value: 10000,
    responsibility: "Driver +1 Helper",
  },
  {
    label: "Full Loading Crew",
    value: 20000,
    responsibility: "Full Loading Crew",
  },
];

const FLOOR_OPTIONS = [
  { label: "Ground Floor", surcharge: 0 },
  { label: "1-2 Floors", surcharge: 3000 },
  { label: "3+ Floors", surcharge: 6000 },
];

const formatNaira = (amount) =>
  `₦${(Number(amount) || 0).toLocaleString("en-NG")}`;

export default function MaxiLoadingDetails() {
  const navigate = useNavigate();

  const {
    loadingFee,
    setLoadingFee,
    unloadingFee,
    setUnloadingFee,
    floorSurcharge,
    setFloorSurcharge,
    fragileSurcharge,
    extrasTotal,
    setExtrasTotal,
    pickupLoadingResponsibility,
    setPickupLoadingResponsibility,
    dropoffUnloadingResponsibility,
    setDropoffUnloadingResponsibility,
    pickupFloorLevel,
    setPickupFloorLevel,
    pickupFloorLevelPrice,
    setPickupFloorLevelPrice,
    pickupHasElevator,
    setPickupHasElevator,
    dropoffFloorLevel,
    setDropoffFloorLevel,
    dropoffFloorLevelPrice,
    setDropoffFloorLevelPrice,
    dropoffHasElevator,
    setDropoffHasElevator,
    orderError,
    setOrderError,
  } = useOrderContext();

  const computedFloorSurcharge = useMemo(() => {
    const pickupCharge =
      pickupLoadingResponsibility === "Handle Myself"
        ? 0
        : pickupHasElevator
          ? 0
          : Number(pickupFloorLevelPrice) || 0;

    const dropoffCharge =
      dropoffUnloadingResponsibility === "Handle Myself"
        ? 0
        : dropoffHasElevator
          ? 0
          : Number(dropoffFloorLevelPrice) || 0;

    return pickupCharge + dropoffCharge;
  }, [
    pickupFloorLevelPrice,
    dropoffFloorLevelPrice,
    pickupHasElevator,
    dropoffHasElevator,
    pickupLoadingResponsibility,
    dropoffUnloadingResponsibility,
  ]);

  const computedExtrasTotal =
    (Number(loadingFee) || 0) +
    (Number(unloadingFee) || 0) +
    (Number(computedFloorSurcharge) || 0) +
    (Number(fragileSurcharge) || 0);

  useEffect(() => {
    setFloorSurcharge(computedFloorSurcharge);
  }, [computedFloorSurcharge, setFloorSurcharge]);

  useEffect(() => {
    setExtrasTotal(computedExtrasTotal);
  }, [computedExtrasTotal, setExtrasTotal]);

  const validateLoadingDetails = () => {
    setOrderError("");

    if (!pickupLoadingResponsibility) {
      setOrderError("Select pickup loading responsibility");
      return false;
    }

    if (!pickupFloorLevel) {
      setOrderError("Select pickup floor level");
      return false;
    }

    if (!dropoffUnloadingResponsibility) {
      setOrderError("Select dropoff unloading responsibility");
      return false;
    }

    if (!dropoffFloorLevel) {
      setOrderError("Select dropoff floor level");
      return false;
    }

    return true;
  };

  const handlePickupResponsibility = (option) => {
    setPickupLoadingResponsibility(option.responsibility);
    setLoadingFee(option.value);
    setOrderError("");

    if (option.responsibility === "Handle Myself") {
      setPickupFloorLevelPrice(0);
    } else {
      const selectedFloor = FLOOR_OPTIONS.find(
        (floor) => floor.label === pickupFloorLevel,
      );

      if (selectedFloor) {
        setPickupFloorLevelPrice(selectedFloor.surcharge);
      }
    }
  };

  const handleDropoffResponsibility = (option) => {
    setDropoffUnloadingResponsibility(option.responsibility);
    setUnloadingFee(option.value);
    setOrderError("");

    if (option.responsibility === "Handle Myself") {
      setDropoffFloorLevelPrice(0);
    } else {
      const selectedFloor = FLOOR_OPTIONS.find(
        (floor) => floor.label === dropoffFloorLevel,
      );

      if (selectedFloor) {
        setDropoffFloorLevelPrice(selectedFloor.surcharge);
      }
    }
  };

  const handlePickupFloor = (option) => {
    setPickupFloorLevel(option.label);
    setPickupFloorLevelPrice(
      pickupLoadingResponsibility === "Handle Myself" ? 0 : option.surcharge,
    );
    setOrderError("");
  };

  const handleDropoffFloor = (option) => {
    setDropoffFloorLevel(option.label);
    setDropoffFloorLevelPrice(
      dropoffUnloadingResponsibility === "Handle Myself" ? 0 : option.surcharge,
    );
    setOrderError("");
  };

  const handleContinue = () => {
    if (!validateLoadingDetails()) return;

    navigate("/send/maxi_recipient_details");
  };

  return (
    <main className="maxiLoadingDetails">
      <div className="maxiLoadingDetails__content">
        <h1 className="maxiLoadingDetails__title">Loading &amp; Unloading</h1>

        {/* PICKUP LOADING */}
        <section className="maxiLoadingDetails__section">
          <h2 className="maxiLoadingDetails__sectionTitle">
            Pickup Loading <span>*</span>
          </h2>

          <div className="maxiLoadingDetails__options">
            {HELPER_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`maxiLoadingDetails__option ${
                  pickupLoadingResponsibility === option.responsibility
                    ? "maxiLoadingDetails__option--selected"
                    : ""
                }`}
                aria-pressed={
                  pickupLoadingResponsibility === option.responsibility
                }
                onClick={() => handlePickupResponsibility(option)}
              >
                {option.label} — {formatNaira(option.value)}
              </button>
            ))}
          </div>
        </section>

        {/* PICKUP FLOOR */}
        <section className="maxiLoadingDetails__section">
          <h2 className="maxiLoadingDetails__sectionTitle">
            Pickup Floor <span>*</span>
          </h2>

          <div className="maxiLoadingDetails__options">
            {FLOOR_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`maxiLoadingDetails__option ${
                  pickupFloorLevel === option.label
                    ? "maxiLoadingDetails__option--selected"
                    : ""
                }`}
                aria-pressed={pickupFloorLevel === option.label}
                onClick={() => handlePickupFloor(option)}
              >
                {option.label}
                {pickupLoadingResponsibility !== "Handle Myself" &&
                  ` — ${formatNaira(option.surcharge)}`}
              </button>
            ))}
          </div>

          <label className="maxiLoadingDetails__switchRow">
            <span>Elevator Available</span>
            <input
              className="maxiLoadingDetails__switch"
              type="checkbox"
              checked={Boolean(pickupHasElevator)}
              onChange={(event) => setPickupHasElevator(event.target.checked)}
              aria-label="Pickup elevator available"
            />
          </label>
        </section>

        {/* DROPOFF UNLOADING */}
        <section className="maxiLoadingDetails__section">
          <h2 className="maxiLoadingDetails__sectionTitle">
            Dropoff Unloading <span>*</span>
          </h2>

          <div className="maxiLoadingDetails__options">
            {HELPER_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`maxiLoadingDetails__option ${
                  dropoffUnloadingResponsibility === option.responsibility
                    ? "maxiLoadingDetails__option--selected"
                    : ""
                }`}
                aria-pressed={
                  dropoffUnloadingResponsibility === option.responsibility
                }
                onClick={() => handleDropoffResponsibility(option)}
              >
                {option.label} — {formatNaira(option.value)}
              </button>
            ))}
          </div>
        </section>

        {/* DROPOFF FLOOR */}
        <section className="maxiLoadingDetails__section">
          <h2 className="maxiLoadingDetails__sectionTitle">
            Dropoff Floor <span>*</span>
          </h2>

          <div className="maxiLoadingDetails__options">
            {FLOOR_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`maxiLoadingDetails__option ${
                  dropoffFloorLevel === option.label
                    ? "maxiLoadingDetails__option--selected"
                    : ""
                }`}
                aria-pressed={dropoffFloorLevel === option.label}
                onClick={() => handleDropoffFloor(option)}
              >
                {option.label}
                {dropoffUnloadingResponsibility !== "Handle Myself" &&
                  ` — ${formatNaira(option.surcharge)}`}
              </button>
            ))}
          </div>

          <label className="maxiLoadingDetails__switchRow">
            <span>Elevator Available</span>
            <input
              className="maxiLoadingDetails__switch"
              type="checkbox"
              checked={Boolean(dropoffHasElevator)}
              onChange={(event) => setDropoffHasElevator(event.target.checked)}
              aria-label="Dropoff elevator available"
            />
          </label>
        </section>

        {/* SUMMARY */}
        <section className="maxiLoadingDetails__summary">
          <p className="maxiLoadingDetails__summaryText">
            Extras Total: {formatNaira(computedExtrasTotal)}
          </p>
        </section>
      </div>

      {orderError && (
        <p className="maxiLoadingDetails__error" role="alert">
          {orderError}
        </p>
      )}

      <footer className="maxiLoadingDetails__footer">
        <button
          type="button"
          className="maxiLoadingDetails__continue"
          onClick={handleContinue}
        >
          Continue
        </button>
      </footer>
    </main>
  );
}
