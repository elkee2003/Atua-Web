import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { remove, uploadData } from "aws-amplify/storage";
import { v4 as uuidv4 } from "uuid";
import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { useProfileContext } from "../../../../../../Providers/ClientProvider/ProfileProvider";
import { User } from "../../../../../models";
import "./Styles.css";

const ReviewProfile = () => {
  const navigate = useNavigate();

  const {
    firstName,
    lastName,
    profilePic,
    setProfilePic,
    exactAddress,
    address,
    lat,
    lng,
    phoneNumber,
  } = useProfileContext();

  const { dbUser, setDbUser, sub, userMail } = useAuthContext();

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ✅ Upload Image (WEB VERSION)
  const uploadImage = async () => {
    try {
      if (!profilePic) return null;

      // delete old
      if (dbUser?.profilePic) {
        await remove({ path: dbUser.profilePic });
      }

      const response = await fetch(profilePic);
      const blob = await response.blob();

      const fileKey = `public/profilePhoto/${sub}/${uuidv4()}.jpg`;

      const result = await uploadData({
        path: fileKey,
        data: blob,
        options: {
          contentType: "image/jpeg",
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              setUploadProgress(
                Math.round((transferredBytes / totalBytes) * 100)
              );
            }
          },
        },
      }).result;

      return result.path;
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteImage = async () => {
    if (!dbUser?.profilePic) return;

    const confirm = window.confirm("Remove profile picture?");
    if (!confirm) return;

    try {
      await remove({ path: dbUser.profilePic });

      const updated = await DataStore.save(
        User.copyOf(dbUser, (u) => {
          u.profilePic = null;
        })
      );

      setDbUser(updated);
      setProfilePic(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSave = async () => {
    if (uploading) return;
    setUploading(true);

    try {
      const uploadedImagePath = await uploadImage();

      let user;

      if (dbUser) {
        user = await DataStore.save(
          User.copyOf(dbUser, (u) => {
            u.firstName = firstName;
            u.lastName = lastName;
            u.email = userMail;
            u.profilePic = uploadedImagePath;
            u.exactAddress = exactAddress;
            u.address = address;
            u.phoneNumber = phoneNumber;
            u.lat = parseFloat(lat);
            u.lng = parseFloat(lng);
          })
        );
      } else {
        user = await DataStore.save(
          new User({
            profilePic: uploadedImagePath,
            firstName,
            lastName,
            email: userMail,
            exactAddress,
            address,
            phoneNumber,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            sub,
          })
        );
      }

      setDbUser(user);
      navigate("/profile");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="reviewProfile-container">
      {/* HEADER */}
      <div className="reviewProfile-header">
        <button onClick={() => navigate(-1)}>← Back</button>
        <h2>Review Profile</h2>
      </div>

      {/* CARD */}
      <div className="reviewProfile-card">
        {/* AVATAR */}
        <div className="reviewProfile-avatarSection">
          <div className="reviewProfile-avatarWrapper">
            {profilePic ? (
              <img src={profilePic} />
            ) : (
              <div className="reviewProfile-avatarFallback">
                {firstName?.[0]}
              </div>
            )}

            {profilePic && (
              <button
                className="reviewProfile-removeBtn"
                onClick={handleDeleteImage}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* DETAILS */}
        <div className="reviewProfile-details">
          <div className="reviewProfile-row">
            <span>First Name</span>
            <p>{firstName}</p>
          </div>

          <div className="reviewProfile-row">
            <span>Last Name</span>
            <p>{lastName}</p>
          </div>

          <div className="reviewProfile-row">
            <span>Exact Address</span>
            <p>{exactAddress}</p>
          </div>

          <div className="reviewProfile-row">
            <span>Selected Address</span>
            <p>{address}</p>
          </div>

          <div className="reviewProfile-row">
            <span>Phone Number</span>
            <p>{phoneNumber}</p>
          </div>
        </div>

        {/* SAVE */}
        <button
          className="reviewProfile-saveBtn"
          onClick={handleSave}
          disabled={uploading}
        >
          {uploading
            ? `Saving... ${uploadProgress}%`
            : "Save & Continue"}
        </button>
      </div>
    </div>
  );
};

export default ReviewProfile;