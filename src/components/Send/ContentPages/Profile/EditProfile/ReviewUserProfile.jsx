import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaExclamationCircle,
  FaHome,
  FaImage,
  FaMap,
  FaMapMarkerAlt,
  FaPhone,
  FaShieldAlt,
  FaTrash,
  FaUser,
  FaSpinner,
  FaCompass,
} from "react-icons/fa";

import { DataStore } from "aws-amplify/datastore";
import { getUrl, remove, uploadData } from "aws-amplify/storage";

import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { useProfileContext } from "../../../../../../Providers/ClientProvider/ProfileProvider";
import { User } from "../../../../../../src/models";

import "./ReviewUserProfile.css";

const ReviewUserCom = () => {
  const navigate = useNavigate();

  // ============================================================
  // PROFILE CONTEXT
  // ============================================================

  const {
    firstName,
    lastName,
    setProfilePic,
    profilePic,
    exactAddress,
    address,
    lat,
    lng,
    phoneNumber,
  } = useProfileContext();

  // ============================================================
  // AUTH CONTEXT
  // ============================================================

  const { dbUser, setDbUser, sub, userMail } = useAuthContext();

  // ============================================================
  // LOCAL STATE
  // ============================================================

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resolvedProfilePic, setResolvedProfilePic] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // ============================================================
  // RESOLVE PROFILE IMAGE
  // ============================================================

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const resolveProfilePic = async () => {
      setImageLoadError(false);

      if (!profilePic) {
        setResolvedProfilePic(null);
        return;
      }

      // A new image selected from a browser file picker.
      if (profilePic instanceof File) {
        objectUrl = URL.createObjectURL(profilePic);

        if (!cancelled) {
          setResolvedProfilePic(objectUrl);
        }

        return;
      }

      if (typeof profilePic !== "string") {
        setResolvedProfilePic(null);
        return;
      }

      // Local image or data URL.
      if (profilePic.startsWith("blob:") || profilePic.startsWith("data:")) {
        setResolvedProfilePic(profilePic);
        return;
      }

      // Already a regular URL.
      if (
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
        console.error("Error fetching profile image:", error);

        if (!cancelled) {
          setResolvedProfilePic(null);
        }
      }
    };

    resolveProfilePic();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [profilePic]);

  // ============================================================
  // IMAGE COMPRESSION
  // ============================================================

  const compressImage = async (file) => {
    // Resize and compress the selected image in the browser.
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = new Image();

      image.src = imageUrl;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / image.width);

      const canvas = document.createElement("canvas");

      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to process the selected image.");
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Unable to compress the image."));
            }
          },
          "image/jpeg",
          0.7,
        );
      });

      return blob;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  // ============================================================
  // PROFILE IMAGE UPLOAD
  // ============================================================

  const uploadImage = async () => {
    // No new local image selected.
    // Preserve an existing S3 path, or null if the photo was removed.
    if (
      !profilePic ||
      (typeof profilePic === "string" &&
        (profilePic.startsWith("http://") || profilePic.startsWith("https://")))
    ) {
      return {
        path: profilePic || null,
        isNewUpload: false,
      };
    }

    // New browser-selected image.
    if (!(profilePic instanceof File)) {
      // Existing S3 object paths should not be uploaded again.
      if (typeof profilePic === "string") {
        return {
          path: profilePic,
          isNewUpload: false,
        };
      }

      throw new Error("The selected profile image is invalid.");
    }

    try {
      const blob = await compressImage(profilePic);

      const fileKey = `public/profilePhoto/${sub}/${crypto.randomUUID()}.jpg`;

      const result = await uploadData({
        path: fileKey,
        data: blob,
        options: {
          contentType: "image/jpeg",

          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              const progress = Math.round(
                (transferredBytes / totalBytes) * 100,
              );

              setUploadProgress(progress);
            }
          },
        },
      }).result;

      return {
        path: result.path,
        isNewUpload: true,
      };
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  };

  // ============================================================
  // DELETE PROFILE IMAGE
  // ============================================================

  const deleteProfilePic = async () => {
    if (uploading) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove your profile photo?",
    );

    if (!confirmed) return;

    // A new profile or unsaved photo has no existing database photo to delete.
    if (!dbUser?.profilePic) {
      setProfilePic(null);
      setResolvedProfilePic(null);
      setImageLoadError(false);
      return;
    }

    setUploading(true);

    try {
      const filePath = dbUser.profilePic;

      const updatedUser = await DataStore.save(
        User.copyOf(dbUser, (updated) => {
          updated.profilePic = null;
        }),
      );

      setDbUser(updatedUser);
      setProfilePic(null);
      setResolvedProfilePic(null);
      setImageLoadError(false);

      // Remove the S3 object only after the database update succeeds.
      try {
        await remove({ path: filePath });
      } catch (error) {
        console.error("Error deleting profile photo from S3:", error);
      }

      window.alert("Your profile photo has been removed successfully.");
    } catch (error) {
      console.error("Error removing profile photo:", error);

      window.alert(
        error?.message ||
          "Something went wrong while removing your profile photo. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // CREATE USER
  // ============================================================

  const createUser = async () => {
    if (uploading) return false;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Check whether the user already exists.
      let existingUsers = await DataStore.query(User, (user) =>
        user.sub.eq(sub),
      );

      // Preserve the original DataStore synchronization retry.
      if (existingUsers.length === 0) {
        console.log(
          "No local user found — retrying DataStore synchronization...",
        );

        await DataStore.clear();
        await DataStore.start();

        existingUsers = await DataStore.query(User, (user) => user.sub.eq(sub));
      }

      // Avoid creating duplicate user records.
      if (existingUsers.length > 0) {
        console.log("User already exists — skipping creation.");

        setDbUser(existingUsers[0]);

        return true;
      }

      // Upload the selected profile image if necessary.
      const uploadedImage = await uploadImage();

      // Create the user record.
      const user = await DataStore.save(
        new User({
          profilePic: uploadedImage.path,
          firstName,
          lastName,
          email: userMail,
          exactAddress,
          address,
          phoneNumber,
          lat: lat !== null && lat !== undefined ? parseFloat(lat) : null,
          lng: lng !== null && lng !== undefined ? parseFloat(lng) : null,
          sub,
        }),
      );

      setDbUser(user);

      return true;
    } catch (error) {
      console.error("Error creating user:", error);

      window.alert(
        error?.message || "Something went wrong while creating your profile.",
      );

      return false;
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // UPDATE USER
  // ============================================================

  const updateUser = async () => {
    if (uploading || !dbUser) {
      return false;
    }

    setUploading(true);
    setUploadProgress(0);

    let uploadedImage = null;
    const oldProfilePic = dbUser.profilePic;

    try {
      // Upload the new image first, if one was selected.
      uploadedImage = await uploadImage();

      const uploadedImagePath = uploadedImage.path;

      // Update the existing user record.
      const user = await DataStore.save(
        User.copyOf(dbUser, (updated) => {
          updated.firstName = firstName;
          updated.lastName = lastName;
          updated.email = userMail;
          updated.profilePic = uploadedImagePath;
          updated.exactAddress = exactAddress;
          updated.address = address;
          updated.phoneNumber = phoneNumber;

          updated.lat =
            lat !== null && lat !== undefined ? parseFloat(lat) : null;

          updated.lng =
            lng !== null && lng !== undefined ? parseFloat(lng) : null;
        }),
      );

      setDbUser(user);

      // Delete the previous S3 image only after saving succeeds.
      if (oldProfilePic && oldProfilePic !== uploadedImagePath) {
        try {
          await remove({
            path: oldProfilePic,
          });
        } catch (error) {
          console.error("Error deleting old profile image:", error);
        }
      }

      return true;
    } catch (error) {
      console.error("Error updating user:", error);

      // Remove a newly uploaded image if the database update failed.
      if (uploadedImage?.isNewUpload && uploadedImage.path) {
        try {
          await remove({
            path: uploadedImage.path,
          });
        } catch (cleanupError) {
          console.error(
            "Error cleaning up uploaded profile image:",
            cleanupError,
          );
        }
      }

      window.alert(
        error?.message || "Something went wrong while updating your profile.",
      );

      return false;
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSave = async () => {
    if (uploading) return;

    const success = dbUser ? await updateUser() : await createUser();

    if (!success) return;

    navigate("/send/profile", { replace: true });

    window.setTimeout(() => {
      navigate("/send/home", { replace: true });
    }, 1000);
  };

  // ============================================================
  // PROFILE INFORMATION ROW
  // ============================================================

  const ProfileRow = ({ icon: Icon, label, value, last = false }) => (
    <div
      className={`reviewUserCom-infoRow ${
        last ? "reviewUserCom-infoRowLast" : ""
      }`}
    >
      <div className="reviewUserCom-infoIconContainer">
        <Icon className="reviewUserCom-infoIcon" />
      </div>

      <div className="reviewUserCom-infoContent">
        <span className="reviewUserCom-infoLabel">{label}</span>

        <p className="reviewUserCom-infoValue">{value || "Not provided"}</p>
      </div>

      <FaCheckCircle className="reviewUserCom-infoCheck" />
    </div>
  );

  // ============================================================
  // SCREEN
  // ============================================================

  return (
    <div className="reviewUserCom-container">
      {/* Header */}
      <header className="reviewUserCom-header">
        <button
          type="button"
          className="reviewUserCom-headerIconButton"
          onClick={() => navigate(-1)}
          disabled={uploading}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>

        <div className="reviewUserCom-headerCenter">
          <h1 className="reviewUserCom-title">Review Profile</h1>
          <p className="reviewUserCom-headerSubtitle">Everything looks good?</p>
        </div>

        <div className="reviewUserCom-stepIndicator">
          <span className="reviewUserCom-stepNumber">3</span>
          <span className="reviewUserCom-stepTotal">/ 3</span>
        </div>
      </header>

      {/* Progress */}
      <section className="reviewUserCom-progressContainer">
        <div className="reviewUserCom-progressTrack">
          <div className="reviewUserCom-progressFillComplete" />
        </div>

        <div className="reviewUserCom-progressLabels">
          <span className="reviewUserCom-progressText">Profile</span>
          <span className="reviewUserCom-progressText">Address</span>
          <span className="reviewUserCom-progressTextActive">Review</span>
        </div>
      </section>

      {/* Main content */}
      <main className="reviewUserCom-content">
        {/* Completion card */}
        <section className="reviewUserCom-completionCard">
          <div className="reviewUserCom-completionIconContainer">
            <FaCheck className="reviewUserCom-completionIcon" />
          </div>

          <div className="reviewUserCom-completionContent">
            <h2 className="reviewUserCom-completionTitle">
              Profile almost ready
            </h2>

            <p className="reviewUserCom-completionText">
              Review your information below. You can save everything when you're
              happy with the details.
            </p>
          </div>
        </section>

        {/* Profile photo */}
        <section className="reviewUserCom-photoCard">
          <div className="reviewUserCom-photoCardHeader">
            <div>
              <h2 className="reviewUserCom-photoCardTitle">Profile photo</h2>

              <p className="reviewUserCom-photoCardSubtitle">
                Your profile picture
              </p>
            </div>

            {profilePic && (
              <button
                type="button"
                className="reviewUserCom-removePhotoButton"
                onClick={deleteProfilePic}
                disabled={uploading}
              >
                <FaTrash className="reviewUserCom-removePhotoIcon" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="reviewUserCom-photoCardBody">
            <div className="reviewUserCom-reviewProfilePicContainer">
              {resolvedProfilePic && !imageLoadError ? (
                <img
                  src={resolvedProfilePic}
                  alt="Profile"
                  className="reviewUserCom-img"
                  onError={() => setImageLoadError(true)}
                />
              ) : (
                <div className="reviewUserCom-reviewPlaceholder">
                  <div className="reviewUserCom-reviewPlaceholderIcon">
                    <FaUser className="reviewUserCom-reviewPlaceholderGlyph" />
                  </div>
                </div>
              )}
            </div>

            <div className="reviewUserCom-photoStatus">
              <span
                className={
                  profilePic
                    ? "reviewUserCom-statusDot"
                    : "reviewUserCom-statusDotMuted"
                }
              />

              <span
                className={
                  profilePic
                    ? "reviewUserCom-photoStatusText"
                    : "reviewUserCom-photoStatusTextMuted"
                }
              >
                {profilePic ? "Photo added" : "No photo added"}
              </span>
            </div>
          </div>
        </section>

        {/* Personal information */}
        <section className="reviewUserCom-infoCard">
          <div className="reviewUserCom-cardHeader">
            <div className="reviewUserCom-cardHeaderIcon">
              <FaUser className="reviewUserCom-cardHeaderIconGlyph" />
            </div>

            <div>
              <h2 className="reviewUserCom-cardTitle">Personal information</h2>
              <p className="reviewUserCom-cardSubtitle">
                Your basic profile details
              </p>
            </div>
          </div>

          <div className="reviewUserCom-infoList">
            <ProfileRow
              icon={FaUser}
              label="First name / Company"
              value={firstName}
            />

            <ProfileRow icon={FaUser} label="Last name" value={lastName} />

            <ProfileRow
              icon={FaPhone}
              label="Phone number"
              value={phoneNumber}
              last
            />
          </div>
        </section>

        {/* Address information */}
        <section className="reviewUserCom-infoCard">
          <div className="reviewUserCom-cardHeader">
            <div className="reviewUserCom-cardHeaderIcon">
              <FaMapMarkerAlt className="reviewUserCom-cardHeaderIconGlyph" />
            </div>

            <div>
              <h2 className="reviewUserCom-cardTitle">Location</h2>
              <p className="reviewUserCom-cardSubtitle">
                Your address and map location
              </p>
            </div>
          </div>

          <div className="reviewUserCom-infoList">
            <ProfileRow
              icon={FaHome}
              label="Exact address"
              value={exactAddress}
            />

            <ProfileRow
              icon={FaMap}
              label="Selected location"
              value={address}
              last
            />
          </div>
        </section>

        {/* Location confirmation */}
        {address && (
          <section className="reviewUserCom-locationConfirmation">
            <div className="reviewUserCom-locationConfirmationIcon">
              <FaCompass className="reviewUserCom-locationConfirmationGlyph" />
            </div>

            <div className="reviewUserCom-locationConfirmationContent">
              <h3 className="reviewUserCom-locationConfirmationTitle">
                Location confirmed
              </h3>

              <p className="reviewUserCom-locationConfirmationText">
                Your selected address and map coordinates will be saved with
                your profile.
              </p>
            </div>

            <FaCheckCircle className="reviewUserCom-locationConfirmationCheck" />
          </section>
        )}

        {/* Final message */}
        <section className="reviewUserCom-finalMessage">
          <FaShieldAlt className="reviewUserCom-finalMessageIcon" />

          <p className="reviewUserCom-finalMessageText">
            Your information is used to create and personalize your Atua
            profile.
          </p>
        </section>

        <div className="reviewUserCom-bottomSpacer" />
      </main>

      {/* Save footer */}
      <footer className="reviewUserCom-footer">
        <button
          type="button"
          className={`reviewUserCom-saveButton ${
            uploading ? "reviewUserCom-saveButtonDisabled" : ""
          }`}
          disabled={uploading}
          onClick={handleSave}
        >
          {uploading ? (
            <div className="reviewUserCom-savingState">
              <FaSpinner className="reviewUserCom-spinner" />

              <div className="reviewUserCom-savingTextContainer">
                <span className="reviewUserCom-saveButtonLabel">
                  Saving profile...
                </span>

                <span className="reviewUserCom-saveButtonSubLabel">
                  {uploadProgress > 0
                    ? `${uploadProgress}% uploaded`
                    : "Please wait"}
                </span>
              </div>
            </div>
          ) : (
            <>
              <span className="reviewUserCom-saveButtonTextContainer">
                <span className="reviewUserCom-saveButtonLabel">
                  Save Profile
                </span>

                <span className="reviewUserCom-saveButtonSubLabel">
                  Complete your profile
                </span>
              </span>

              <span className="reviewUserCom-saveButtonIconContainer">
                <FaCheck className="reviewUserCom-saveButtonIcon" />
              </span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default ReviewUserCom;
