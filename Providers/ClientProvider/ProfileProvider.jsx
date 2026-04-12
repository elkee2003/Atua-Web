import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthContext } from "./AuthProvider";

// This is converted already to be compatible to web app

const ProfileContext = createContext({});

const initialState = {
  profilePic: null,
  firstName: "",
  lastName: "",
  exactAddress: "",
  address: "",
  lat: "0",
  lng: "0",
  phoneNumber: "",
  errorMessage: "",
};

const ProfileProvider = ({ children }) => {
  const { dbUser } = useAuthContext();

  const [profile, setProfile] = useState(initialState);

  // ---------------- UPDATE FIELD ----------------
  const updateProfileField = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ---------------- VALIDATION ----------------
  const validateInput = () => {
    if (!profile.firstName) {
      return "First Name is required";
    }

    if (!profile.phoneNumber || profile.phoneNumber.length < 10) {
      return "Valid phone number required";
    }

    return null;
  };

  const validateAddressInput = () => {
    if (!profile.exactAddress) {
      return "Exact address is required";
    }

    if (!profile.address) {
      return "Address is required";
    }

    return null;
  };

  // ---------------- WRAPPERS ----------------
  const onValidateInput = () => {
    const error = validateInput();
    setProfile((prev) => ({ ...prev, errorMessage: error || "" }));
    return !error;
  };

  const onValidateAddressInput = () => {
    const error = validateAddressInput();
    setProfile((prev) => ({ ...prev, errorMessage: error || "" }));
    return !error;
  };

  // ---------------- LOAD FROM DB ----------------
  useEffect(() => {
    if (!dbUser) return;

    setProfile((prev) => ({
      ...prev,
      profilePic: dbUser.profilePic || null,
      firstName: dbUser.firstName || "",
      lastName: dbUser.lastName || "",
      exactAddress: dbUser.exactAddress || "",
      address: dbUser.address || "",
      phoneNumber: dbUser.phoneNumber || "",
      lat: dbUser.lat?.toString() || "0",
      lng: dbUser.lng?.toString() || "0",
    }));
  }, [dbUser]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfileField,
        onValidateInput,
        onValidateAddressInput,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;
export const useProfileContext = () => useContext(ProfileContext);