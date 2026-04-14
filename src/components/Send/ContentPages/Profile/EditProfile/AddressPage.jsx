import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete } from "@react-google-maps/api";
import { useProfileContext } from "@/providers/ProfileProvider";
import "./Styles.css";

const AddressPage = () => {
  const navigate = useNavigate();
  const autoRef = useRef(null);

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
    if (!autoRef.current) return;

    const place = autoRef.current.getPlace();
    if (!place?.geometry) return;

    const selectedAddress = place.formatted_address;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    setAddress(selectedAddress);
    setLat(lat);
    setLng(lng);
  };

  const handleNext = () => {
    if (onValidateAddressInput()) {
      navigate("/profile/reviewprofile");
    }
  };

  return (
    <div className="addressPage-container">
      <h2>Address</h2>

      {/* EXACT ADDRESS */}
      <input
        value={exactAddress}
        onChange={(e) => setExactAddress(e.target.value)}
        placeholder="Enter exact address"
        className="addressPage-input"
      />

      {/* GOOGLE AUTOCOMPLETE */}
      <div className="addressPage-autocomplete">
        <Autocomplete
          onLoad={(ref) => (autoRef.current = ref)}
          onPlaceChanged={handlePlaceChanged}
          options={{ componentRestrictions: { country: ["ng"] } }}
        >
          <input
            type="text"
            placeholder="Select address"
            className="addressPage-input"
          />
        </Autocomplete>
      </div>

      {/* ERROR */}
      <p className="addressPage-error">{errorMessage}</p>

      {/* NEXT */}
      <button
        className="addressPage-nextBtn"
        onClick={handleNext}
      >
        Next →
      </button>
    </div>
  );
};

export default AddressPage;