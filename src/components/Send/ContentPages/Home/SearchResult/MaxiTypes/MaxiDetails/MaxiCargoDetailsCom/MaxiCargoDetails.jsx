import React from "react";
import { useNavigate } from "react-router-dom";
import { useOrderContext } from "../../../../../../../../../Providers/ClientProvider/OrderProvider";
import "./MaxiCargoDetails.css";

const LOAD_CATEGORIES = [
  "GENERAL_GOODS",
  "FRAGILE",
  "BUILDING_MATERIAL",
  "HEAVY_MACHINERY",
  "PERISHABLE",
];

const WEIGHT_BRACKETS = [
  "UNDER_500KG",
  "500KG_2T",
  "2T_5T",
  "5T_10T",
  "10T_PLUS",
];

const formatOption = (value) => value.replaceAll("_", " ");

export default function MaxiCargoDetails() {
  const navigate = useNavigate();

  const {
    loadCategory,
    setLoadCategory,
    orderDetails,
    setOrderDetails,
    declaredWeightBracket,
    setDeclaredWeightBracket,
    orderError,
    setOrderError,
  } = useOrderContext();

  const validateCargoDetails = () => {
    setOrderError("");

    if (!loadCategory) {
      setOrderError("Please select a load category");
      return false;
    }

    // Weight selection remains optional, matching the native screen.
    // if (!declaredWeightBracket) {
    //   setOrderError("Please select estimated weight");
    //   return false;
    // }

    if (!orderDetails || orderDetails.trim().length < 5) {
      setOrderError("Please enter cargo description");
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateCargoDetails()) return;

    navigate("/send/maxi_loading_details");
  };

  return (
    <main className="maxiCargoDetails">
      <div className="maxiCargoDetails__content">
        <h1 className="maxiCargoDetails__title">Cargo Details</h1>

        <section className="maxiCargoDetails__section">
          <h2 className="maxiCargoDetails__sectionTitle">
            Load Category <span>*</span>
          </h2>

          <div className="maxiCargoDetails__options">
            {LOAD_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={`maxiCargoDetails__option ${
                  loadCategory === item
                    ? "maxiCargoDetails__option--selected"
                    : ""
                }`}
                aria-pressed={loadCategory === item}
                onClick={() => {
                  setLoadCategory(item);
                  setOrderError("");
                }}
              >
                {formatOption(item)}
              </button>
            ))}
          </div>
        </section>

        <section className="maxiCargoDetails__section">
          <h2 className="maxiCargoDetails__sectionTitle">Estimated Weight</h2>

          <div className="maxiCargoDetails__options">
            {WEIGHT_BRACKETS.map((item) => (
              <button
                key={item}
                type="button"
                className={`maxiCargoDetails__option ${
                  declaredWeightBracket === item
                    ? "maxiCargoDetails__option--selected"
                    : ""
                }`}
                aria-pressed={declaredWeightBracket === item}
                onClick={() => setDeclaredWeightBracket(item)}
              >
                {formatOption(item)}
              </button>
            ))}
          </div>
        </section>

        <section className="maxiCargoDetails__section">
          <label
            className="maxiCargoDetails__sectionTitle"
            htmlFor="maxiCargoDescription"
          >
            Description <span>*</span>
          </label>

          <textarea
            id="maxiCargoDescription"
            className="maxiCargoDetails__textarea"
            placeholder="Describe your cargo..."
            value={orderDetails ?? ""}
            onChange={(event) => setOrderDetails(event.target.value)}
            rows={5}
          />
        </section>
      </div>

      {orderError && (
        <p className="maxiCargoDetails__error" role="alert">
          {orderError}
        </p>
      )}

      <div className="maxiCargoDetails__footer">
        <button
          type="button"
          className="maxiCargoDetails__continue"
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </main>
  );
}
