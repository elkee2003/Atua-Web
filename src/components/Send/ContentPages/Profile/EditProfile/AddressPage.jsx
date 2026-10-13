import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete } from "@react-google-maps/api";
import {
  FaArrowLeft,
  FaArrowRight,
  FaHome,
  FaMapMarkerAlt,
  FaCheck,
  FaMap,
  FaInfoCircle,
  FaExclamationCircle,
  FaTimesCircle,
} from "react-icons/fa";

import { useProfileContext } from "../../../../../../Providers/ClientProvider/ProfileProvider";
import "./AddressPage.css";

const AddressPage = () => {
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  const [autocompleteReady, setAutocompleteReady] = useState(false);

  const {
    exactAddress,
    setExactAddress,
    address,
    setAddress,
    setLat,
    setLng,
    errorMessage,
    onValidateAddressInput,
  } = useProfileContext();

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();

    if (!place?.geometry?.location) {
      return;
    }

    const selectedAddress = place.formatted_address || place.name || "";

    if (!selectedAddress) {
      return;
    }

    setAddress(selectedAddress);
    setLat(String(place.geometry.location.lat()));
    setLng(String(place.geometry.location.lng()));
    setAutocompleteReady(false);
  };

  const handleClearAddress = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setAddress(null);
    setLat(null);
    setLng(null);
    setAutocompleteReady(false);
  };

  const handleNextPage = () => {
    if (onValidateAddressInput()) {
      navigate("/send/review_edit");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <main className="addressPage-container">
      {/* Header */}
      <header className="addressPage-header">
        <button
          type="button"
          className="addressPage-backButton"
          onClick={handleBack}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>

        <div className="addressPage-headerCenter">
          <h1 className="addressPage-title">Your Address</h1>
          <p className="addressPage-headerSubtitle">
            Where should we associate your profile?
          </p>
        </div>

        <div className="addressPage-stepIndicator">
          <span className="addressPage-stepNumber">2</span>
          <span className="addressPage-stepTotal">/ 3</span>
        </div>
      </header>

      {/* Progress */}
      <section
        className="addressPage-progressContainer"
        aria-label="Profile setup progress"
      >
        <div className="addressPage-progressTrack">
          <div className="addressPage-progressFill" />
        </div>

        <div className="addressPage-progressLabels">
          <span className="addressPage-progressText">Profile</span>
          <span className="addressPage-progressTextActive">Address</span>
          <span className="addressPage-progressText">Review</span>
        </div>
      </section>

      {/* Main content */}
      <div className="addressPage-content">
        {/* Exact address */}
        <section className="addressPage-section">
          <div className="addressPage-fieldHeader">
            <div className="addressPage-fieldNumber">01</div>

            <div className="addressPage-fieldHeaderText">
              <h2 className="addressPage-fieldTitle">Exact address</h2>
              <p className="addressPage-fieldSubtitle">
                Enter the address as you know it
              </p>
            </div>
          </div>

          <div className="addressPage-inputWrapper">
            <FaHome className="addressPage-inputIcon" />

            <input
              type="text"
              value={exactAddress ?? ""}
              onChange={(event) => setExactAddress(event.target.value)}
              placeholder="Enter your exact address"
              className="addressPage-input"
              autoComplete="street-address"
              aria-label="Exact address"
            />
          </div>

          <p className="addressPage-fieldHint">
            Include your house number, street and any useful identifying
            details.
          </p>
        </section>

        {/* Confirm Google Maps location */}
        <section className="addressPage-section">
          <div className="addressPage-fieldHeader">
            <div className="addressPage-fieldNumber">02</div>

            <div className="addressPage-fieldHeaderText">
              <h2 className="addressPage-fieldTitle">Confirm location</h2>
              <p className="addressPage-fieldSubtitle">
                Select your address from Google Maps
              </p>
            </div>
          </div>

          <div className="addressPage-googleContainer">
            <FaMapMarkerAlt className="addressPage-googleInputIcon" />

            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={handlePlaceChanged}
              options={{
                componentRestrictions: { country: "ng" },
                fields: ["formatted_address", "geometry", "name"],
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for your address"
                className="addressPage-googleInput"
                aria-label="Search for your address on Google Maps"
                autoComplete="off"
              />
            </Autocomplete>

            <button
              type="button"
              onClick={handleClearAddress}
              className="addressPage-clearButton"
              aria-label="Clear selected location"
            >
              <FaTimesCircle />
            </button>
          </div>

          <div className="addressPage-locationHint">
            <FaInfoCircle className="addressPage-locationHintIcon" />
            <p className="addressPage-locationHintText">
              Selecting a result helps us save the correct map coordinates for
              your location.
            </p>
          </div>
        </section>

        {/* Selected location */}
        {address ? (
          <section className="addressPage-selectedAddressCard">
            <div className="addressPage-selectedAddressHeader">
              <div className="addressPage-selectedAddressIcon">
                <FaCheck />
              </div>

              <div className="addressPage-selectedAddressHeaderText">
                <h2 className="addressPage-selectedAddressTitle">
                  Location selected
                </h2>
                <p className="addressPage-selectedAddressSubtitle">
                  Google Maps location confirmed
                </p>
              </div>
            </div>

            <div className="addressPage-selectedAddressDivider" />

            <div className="addressPage-selectedAddressBody">
              <FaMapMarkerAlt className="addressPage-selectedAddressLocationIcon" />
              <p className="addressPage-selectedAddressText">{address}</p>
            </div>
          </section>
        ) : (
          <section className="addressPage-locationEmptyCard">
            <div className="addressPage-emptyLocationIcon">
              <FaMap />
            </div>

            <div className="addressPage-emptyLocationText">
              <h2 className="addressPage-emptyLocationTitle">
                Location not selected yet
              </h2>
              <p className="addressPage-emptyLocationSubtitle">
                Search above and choose the correct address.
              </p>
            </div>
          </section>
        )}

        {/* Validation error */}
        {errorMessage && (
          <div className="addressPage-errorContainer" role="alert">
            <FaExclamationCircle className="addressPage-errorIcon" />
            <p className="addressPage-error">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Continue footer */}
      <footer className="addressPage-footer">
        <button
          type="button"
          onClick={handleNextPage}
          className="addressPage-nextButton"
        >
          <span className="addressPage-nextButtonTextContainer">
            <span className="addressPage-nextButtonLabel">Continue</span>
            <span className="addressPage-nextButtonSubLabel">
              Review your profile
            </span>
          </span>

          <span className="addressPage-nextButtonIconContainer">
            <FaArrowRight />
          </span>
        </button>
      </footer>
    </main>
  );
};

export default AddressPage;
