import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCamera,
  FaUser,
  FaPhone,
  FaExclamationCircle,
  FaSignOutAlt,
  FaTimes,
  FaImage,
  FaTrash,
} from "react-icons/fa";

import { useProfileContext } from "../../../../../../Providers/ClientProvider/ProfileProvider";
import "./EditProfile.css";

const EditProfile = () => {
  const navigate = useNavigate();

  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    profilePic,
    setProfilePic,
    phoneNumber,
    setPhoneNumber,
    errorMessage,
    onValidateInput,
  } = useProfileContext();

  const [resolvedProfilePic, setResolvedProfilePic] = useState(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  // Resolve the selected image or retrieve an existing image from S3.
  useEffect(() => {
    let cancelled = false;

    const resolveProfilePic = async () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setImageError("");

      if (!profilePic) {
        setResolvedProfilePic(null);
        return;
      }

      // A new image selected through the browser file picker.
      if (profilePic instanceof File) {
        const objectUrl = URL.createObjectURL(profilePic);
        objectUrlRef.current = objectUrl;

        if (!cancelled) {
          setResolvedProfilePic(objectUrl);
        }
        return;
      }

      if (typeof profilePic !== "string") {
        setResolvedProfilePic(null);
        return;
      }

      // Local image URI or an image already available by URL.
      if (
        profilePic.startsWith("blob:") ||
        profilePic.startsWith("data:") ||
        profilePic.startsWith("http://") ||
        profilePic.startsWith("https://")
      ) {
        setResolvedProfilePic(profilePic);
        return;
      }

      // Existing image stored in S3.
      try {
        const result = await getUrl({
          path: profilePic,
          options: {
            validateObjectExistence: true,
          },
        });

        if (!cancelled) {
          setResolvedProfilePic(result.url.toString());
        }
      } catch (error) {
        console.error("Error fetching profile image from storage:", error);

        if (!cancelled) {
          setResolvedProfilePic(null);
        }
      }
    };

    resolveProfilePic();

    return () => {
      cancelled = true;

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [profilePic]);

  // Open the browser's image picker.
  const openGallery = () => {
    setShowPhotoOptions(false);
    setImageError("");
    galleryInputRef.current?.click();
  };

  // Open a camera-capable file picker on supported devices.
  const openCamera = () => {
    setShowPhotoOptions(false);
    setImageError("");
    cameraInputRef.current?.click();
  };

  const handleImageSelected = (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again later.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image.");
      return;
    }

    setImageError("");
    setProfilePic(file);
  };

  const handleRemovePhoto = () => {
    setProfilePic(null);
    setResolvedProfilePic(null);
    setImageError("");
    setShowPhotoOptions(false);

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const goToAddressPage = () => {
    if (onValidateInput()) {
      navigate("/send/address_page");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out of your account?",
    );

    if (!confirmed || isSigningOut) return;

    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      window.alert("We couldn't sign you out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="editProfile-container">
      {/* Header */}
      <header className="editProfile-header">
        <button
          type="button"
          className="editProfile-headerIconButton"
          onClick={handleBack}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>

        <div className="editProfile-headerCenter">
          <h1 className="editProfile-title">Edit Profile</h1>
          <p className="editProfile-headerSubtitle">
            Keep your information up to date
          </p>
        </div>

        <button
          type="button"
          className="editProfile-signoutButton"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <FaSignOutAlt />
        </button>
      </header>

      {/* Main content */}
      <main className="editProfile-content">
        {/* Profile photo */}
        <section className="editProfile-photoSection">
          <button
            type="button"
            className="editProfile-profilePicContainer"
            onClick={() => setShowPhotoOptions(true)}
            aria-label="Change profile photo"
          >
            {resolvedProfilePic ? (
              <img
                src={resolvedProfilePic}
                alt="Profile"
                className="editProfile-img"
                onError={() => setResolvedProfilePic(null)}
              />
            ) : (
              <div className="editProfile-placeholderContainer">
                <div className="editProfile-placeholderIconCircle">
                  <FaUser className="editProfile-placeholderIcon" />
                </div>

                <span className="editProfile-addPhotoText">Add photo</span>
              </div>
            )}

            <span className="editProfile-cameraIconContainer">
              <FaCamera className="editProfile-cameraIcon" />
            </span>
          </button>

          <h2 className="editProfile-photoTitle">Profile photo</h2>
          <p className="editProfile-photoHint">Use a clear photo of yourself</p>

          {imageError && (
            <p className="editProfile-imageError" role="alert">
              {imageError}
            </p>
          )}

          {/* Hidden browser file inputs */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="editProfile-hiddenFileInput"
            onChange={handleImageSelected}
            tabIndex={-1}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="editProfile-hiddenFileInput"
            onChange={handleImageSelected}
            tabIndex={-1}
          />
        </section>

        {/* Personal information */}
        <section className="editProfile-section">
          <div className="editProfile-sectionHeader">
            <div className="editProfile-sectionIcon">
              <FaUser className="editProfile-sectionIconGlyph" />
            </div>

            <div>
              <h2 className="editProfile-sectionTitle">Personal information</h2>
              <p className="editProfile-sectionSubtitle">
                Tell us a little about you
              </p>
            </div>
          </div>

          <div className="editProfile-field">
            <label
              className="editProfile-fieldLabel"
              htmlFor="editProfile-firstName"
            >
              First name / Company name
            </label>

            <div className="editProfile-inputWrapper">
              <FaUser className="editProfile-inputIcon" />

              <input
                id="editProfile-firstName"
                type="text"
                className="editProfile-input"
                value={firstName ?? ""}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Enter your first or company name"
                autoComplete="given-name"
                autoCapitalize="words"
              />
            </div>
          </div>

          <div className="editProfile-field">
            <label
              className="editProfile-fieldLabel"
              htmlFor="editProfile-lastName"
            >
              Last name
            </label>

            <div className="editProfile-inputWrapper">
              <FaUser className="editProfile-inputIcon" />

              <input
                id="editProfile-lastName"
                type="text"
                className="editProfile-input"
                value={lastName ?? ""}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Enter your last name"
                autoComplete="family-name"
                autoCapitalize="words"
              />
            </div>
          </div>

          <div className="editProfile-field">
            <label
              className="editProfile-fieldLabel"
              htmlFor="editProfile-phoneNumber"
            >
              Phone number
            </label>

            <div className="editProfile-inputWrapper">
              <FaPhone className="editProfile-inputIcon" />

              <input
                id="editProfile-phoneNumber"
                type="tel"
                inputMode="tel"
                className="editProfile-input"
                value={phoneNumber ?? ""}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Enter your phone number"
                autoComplete="tel"
              />
            </div>
          </div>
        </section>

        {/* Validation error */}
        {!!errorMessage && (
          <div className="editProfile-errorContainer" role="alert">
            <FaExclamationCircle className="editProfile-errorIcon" />
            <p className="editProfile-error">{errorMessage}</p>
          </div>
        )}

        <div className="editProfile-bottomSpacer" />
      </main>

      {/* Continue button */}
      <footer className="editProfile-footer">
        <button
          type="button"
          className="editProfile-nextButton"
          onClick={goToAddressPage}
        >
          <span className="editProfile-nextButtonTextContainer">
            <span className="editProfile-nextButtonLabel">Continue</span>
            <span className="editProfile-nextButtonSubLabel">
              Address details
            </span>
          </span>

          <span className="editProfile-nextButtonIconContainer">
            <FaArrowRight className="editProfile-nextButtonIcon" />
          </span>
        </button>
      </footer>

      {/* Photo options modal */}
      {showPhotoOptions && (
        <div
          className="editProfile-photoModalOverlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowPhotoOptions(false);
            }
          }}
        >
          <section
            className="editProfile-photoModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editProfile-photoModalTitle"
          >
            <div className="editProfile-photoModalHeader">
              <div>
                <h2
                  id="editProfile-photoModalTitle"
                  className="editProfile-photoModalTitle"
                >
                  Profile Photo
                </h2>

                <p className="editProfile-photoModalSubtitle">
                  Choose how you want to update your profile photo.
                </p>
              </div>

              <button
                type="button"
                className="editProfile-photoModalClose"
                onClick={() => setShowPhotoOptions(false)}
                aria-label="Close photo options"
              >
                <FaTimes />
              </button>
            </div>

            <div className="editProfile-photoModalOptions">
              <button
                type="button"
                className="editProfile-photoOption"
                onClick={openCamera}
              >
                <span className="editProfile-photoOptionIcon">
                  <FaCamera />
                </span>
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                className="editProfile-photoOption"
                onClick={openGallery}
              >
                <span className="editProfile-photoOptionIcon">
                  <FaImage />
                </span>
                <span>Choose from Gallery</span>
              </button>

              {profilePic && (
                <button
                  type="button"
                  className="editProfile-photoOption editProfile-removePhotoOption"
                  onClick={handleRemovePhoto}
                >
                  <span className="editProfile-photoOptionIcon">
                    <FaTrash />
                  </span>
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className="editProfile-photoCancelButton"
              onClick={() => setShowPhotoOptions(false)}
            >
              Cancel
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default EditProfile;
