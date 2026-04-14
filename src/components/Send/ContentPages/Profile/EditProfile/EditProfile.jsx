import { useProfileContext } from "../../../../../../Providers/ClientProvider/ProfileProvider";
import { useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import "./Styles.css";

const EditProfile = () => {
  const navigate = useNavigate();

  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phoneNumber,
    setPhoneNumber,
    profilePic,
    setProfilePic,
    errorMessage,
    onValidateInput,
  } = useProfileContext();

  // ✅ HANDLE IMAGE (FIXED)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);

    setProfilePic({
      file,      // for upload later
      preview,   // for display
    });
  };

  // ✅ REMOVE IMAGE (with cleanup)
  const handleRemoveImage = () => {
    if (profilePic?.preview) {
      URL.revokeObjectURL(profilePic.preview);
    }
    setProfilePic(null);
  };

  // ✅ NEXT
  const handleNext = () => {
    if (onValidateInput()) {
      navigate("/profile/address");
    }
  };

  // ✅ SIGN OUT
  const handleSignOut = async () => {
    const confirm = window.confirm("Are you sure you want to sign out?");
    if (!confirm) return;

    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="editProfile-container">
      {/* HEADER */}
      <div className="editProfile-header">
        <button onClick={() => navigate(-1)}>← Back</button>
        <h2>Edit Profile</h2>
        <button
          className="editProfile-signout"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>

      {/* AVATAR */}
      <div className="editProfile-avatarSection">
        <label className="editProfile-avatarWrapper">
          {profilePic?.preview ? (
            <img
              src={profilePic.preview}
              alt="profile"
              className="editProfile-avatar"
            />
          ) : (
            <div className="editProfile-placeholder">
              <span>Upload Photo</span>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
        </label>

        {profilePic && (
          <button
            className="editProfile-removeBtn"
            onClick={handleRemoveImage}
          >
            Remove
          </button>
        )}
      </div>

      {/* FORM */}
      <div className="editProfile-form">
        <label>First Name / Company</label>
        <input
          value={firstName || ""}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <label>Last Name</label>
        <input
          value={lastName || ""}
          onChange={(e) => setLastName(e.target.value)}
        />

        <label>Phone Number</label>
        <input
          value={phoneNumber || ""}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      {/* ERROR */}
      {errorMessage && (
        <p className="editProfile-error">{errorMessage}</p>
      )}

      {/* NEXT BUTTON */}
      <button
        className="editProfile-nextBtn"
        onClick={handleNext}
      >
        Next →
      </button>
    </div>
  );
};

export default EditProfile;