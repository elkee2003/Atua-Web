import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFleetContext } from "../../../../../Providers/CourierProProvider/FleetProvider";
import "./FleetRegistration.css";

const initialFormData = {
  name: "",
  businessName: "",
  organisationType: "",
  legalStatus: "",

  registrationNumber: "",
  registrationCountry: "",
  registrationAuthority: "",

  phoneNumber: "",
  email: "",

  address: "",
  state: "",
  city: "",
  landmark: "",

  isRecognisedBrand: false,
  brandWebsite: "",
};

const FleetRegistration = () => {
  const navigate = useNavigate();

  const { registerFleet, registeringFleet, fleetError, clearFleetError } =
    useFleetContext();

  const [formData, setFormData] = useState(initialFormData);
  const [validationError, setValidationError] = useState("");
  const [registeredFleet, setRegisteredFleet] = useState(null);

  // Update individual form fields.
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setValidationError("");

    if (clearFleetError) {
      clearFleetError();
    }
  };

  // Basic client-side validation before calling the backend.
  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Please enter your fleet name.";
    }

    if (!formData.organisationType) {
      return "Please select your organisation type.";
    }

    if (!formData.legalStatus) {
      return "Please select your legal status.";
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      return "Please enter a valid email address.";
    }

    if (
      formData.brandWebsite.trim() &&
      !/^https?:\/\/.+/i.test(formData.brandWebsite.trim())
    ) {
      return "Please enter a valid website URL beginning with https:// or http://.";
    }

    return "";
  };

  // Remove empty optional values before submitting.
  const preparePayload = () => {
    const payload = {
      name: formData.name.trim(),
      organisationType: formData.organisationType,
      legalStatus: formData.legalStatus,
      isRecognisedBrand: formData.isRecognisedBrand,
    };

    const optionalFields = [
      "businessName",
      "registrationNumber",
      "registrationCountry",
      "registrationAuthority",
      "phoneNumber",
      "email",
      "address",
      "state",
      "city",
      "landmark",
      "brandWebsite",
    ];

    optionalFields.forEach((field) => {
      const value = formData[field];

      if (typeof value === "string" && value.trim()) {
        payload[field] = value.trim();
      }
    });

    // A website is only relevant when the fleet identifies as a recognised brand.
    if (!formData.isRecognisedBrand) {
      delete payload.brandWebsite;
    }

    return payload;
  };

  // Submit fleet registration.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setValidationError("");

    const error = validateForm();

    if (error) {
      setValidationError(error);
      return;
    }

    try {
      const payload = preparePayload();

      const fleet = await registerFleet(payload);

      setRegisteredFleet(fleet);
    } catch (error) {
      console.error("Fleet registration failed:", error);
    }
  };

  // Show a confirmation screen after successful registration.
  if (registeredFleet) {
    return (
      <div className="fleetRegistrationPage">
        <div className="fleetRegistrationSuccess">
          <div className="fleetRegistrationSuccessIcon">✓</div>

          <h1>Your fleet has been registered!</h1>

          <p>
            Your fleet profile has been created successfully. You can now
            proceed with the next steps in setting up your fleet on Atua Courier
            Pro.
          </p>

          <div className="fleetRegistrationSuccessDetails">
            <div>
              <span>Fleet name</span>
              <strong>{registeredFleet.name}</strong>
            </div>

            <div>
              <span>Fleet ID</span>
              <strong>{registeredFleet.id}</strong>
            </div>

            <div>
              <span>Verification status</span>
              <strong>
                {registeredFleet.verificationStatus || "UNVERIFIED"}
              </strong>
            </div>

            <div>
              <span>Fleet status</span>
              <strong>{registeredFleet.status || "PENDING"}</strong>
            </div>
          </div>

          <button
            type="button"
            className="fleetRegistrationPrimaryButton"
            onClick={() => navigate("/courier-pro")}
          >
            Return to Courier Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fleetRegistrationPage">
      <div className="fleetRegistrationContainer">
        {/* Page heading */}
        <div className="fleetRegistrationHeader">
          <button
            type="button"
            className="fleetRegistrationBackButton"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="fleetRegistrationBrand">
            <span>ATUA</span>
            <span>COURIER PRO</span>
          </div>

          <h1>Register your fleet</h1>

          <p>
            Create your fleet profile to start managing your riders, vehicles
            and delivery operations with Atua Courier Pro.
          </p>
        </div>

        <form className="fleetRegistrationForm" onSubmit={handleSubmit}>
          {/* Section 1: Fleet information */}
          <section className="fleetRegistrationSection">
            <div className="fleetRegistrationSectionHeading">
              <span className="fleetRegistrationStep">01</span>

              <div>
                <h2>Fleet information</h2>
                <p>Tell us about your fleet or organisation.</p>
              </div>
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="name">
                Fleet name <span>*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. ABC Logistics"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="businessName">Business or company name</label>

              <input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="Enter your registered business name"
                value={formData.businessName}
                onChange={handleChange}
              />

              <small>
                Leave this blank if your fleet does not operate under a separate
                business name.
              </small>
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="organisationType">
                Organisation type <span>*</span>
              </label>

              <select
                id="organisationType"
                name="organisationType"
                value={formData.organisationType}
                onChange={handleChange}
                required
              >
                <option value="">Select organisation type</option>

                <option value="CORPORATE">Corporate organisation</option>

                <option value="REGISTERED_BUSINESS">Registered business</option>

                <option value="INFORMAL_FLEET">
                  Informal fleet / Independent operator
                </option>
              </select>
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="legalStatus">
                Legal status <span>*</span>
              </label>

              <select
                id="legalStatus"
                name="legalStatus"
                value={formData.legalStatus}
                onChange={handleChange}
                required
              >
                <option value="">Select legal status</option>

                <option value="REGISTERED">Registered</option>

                <option value="UNREGISTERED">Unregistered</option>

                <option value="REGISTRATION_IN_PROGRESS">
                  Registration in progress
                </option>
              </select>
            </div>
          </section>

          {/* Section 2: Business registration */}
          <section className="fleetRegistrationSection">
            <div className="fleetRegistrationSectionHeading">
              <span className="fleetRegistrationStep">02</span>

              <div>
                <h2>Registration details</h2>
                <p>
                  Provide your business registration details where applicable.
                </p>
              </div>
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="registrationNumber">Registration number</label>

              <input
                id="registrationNumber"
                name="registrationNumber"
                type="text"
                placeholder="e.g. RC123456"
                value={formData.registrationNumber}
                onChange={handleChange}
              />
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="registrationCountry">
                Country of registration
              </label>

              <input
                id="registrationCountry"
                name="registrationCountry"
                type="text"
                placeholder="e.g. Nigeria"
                value={formData.registrationCountry}
                onChange={handleChange}
              />
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="registrationAuthority">
                Registration authority
              </label>

              <input
                id="registrationAuthority"
                name="registrationAuthority"
                type="text"
                placeholder="e.g. Corporate Affairs Commission"
                value={formData.registrationAuthority}
                onChange={handleChange}
              />
            </div>

            <div className="fleetRegistrationCheckbox">
              <input
                id="isRecognisedBrand"
                name="isRecognisedBrand"
                type="checkbox"
                checked={formData.isRecognisedBrand}
                onChange={handleChange}
              />

              <label htmlFor="isRecognisedBrand">
                My fleet operates under an established or recognised brand.
              </label>
            </div>

            {formData.isRecognisedBrand && (
              <div className="fleetRegistrationField">
                <label htmlFor="brandWebsite">Brand website</label>

                <input
                  id="brandWebsite"
                  name="brandWebsite"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.brandWebsite}
                  onChange={handleChange}
                />
              </div>
            )}
          </section>

          {/* Section 3: Contact information */}
          <section className="fleetRegistrationSection">
            <div className="fleetRegistrationSectionHeading">
              <span className="fleetRegistrationStep">03</span>

              <div>
                <h2>Contact information</h2>
                <p>How can we contact your organisation?</p>
              </div>
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="phoneNumber">Phone number</label>

              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="e.g. 08012345678"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="email">Business email</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. operations@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Section 4: Business address */}
          <section className="fleetRegistrationSection">
            <div className="fleetRegistrationSectionHeading">
              <span className="fleetRegistrationStep">04</span>

              <div>
                <h2>Business address</h2>
                <p>Where is your fleet primarily based?</p>
              </div>
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="address">Street address</label>

              <input
                id="address"
                name="address"
                type="text"
                placeholder="Enter your business address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="state">State</label>

              <input
                id="state"
                name="state"
                type="text"
                placeholder="e.g. Rivers State"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="city">City</label>

              <input
                id="city"
                name="city"
                type="text"
                placeholder="e.g. Port Harcourt"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="fleetRegistrationField">
              <label htmlFor="landmark">Nearby landmark</label>

              <input
                id="landmark"
                name="landmark"
                type="text"
                placeholder="Optional nearby landmark"
                value={formData.landmark}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* Form errors */}
          {(validationError || fleetError) && (
            <div className="fleetRegistrationError" role="alert">
              {validationError || fleetError}
            </div>
          )}

          {/* Submit */}
          <div className="fleetRegistrationSubmit">
            <p>
              By registering, you confirm that the information provided is
              accurate.
            </p>

            <button
              type="submit"
              className="fleetRegistrationPrimaryButton"
              disabled={registeringFleet}
            >
              {registeringFleet ? "Creating your fleet..." : "Create fleet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FleetRegistration;
