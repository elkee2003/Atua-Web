import { useEffect, useState } from "react";
import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { useProfileContext } from "../../../../../../Providers/ClientProvider/ProfileProvider";
import { signOut } from "aws-amplify/auth";
import { DataStore } from "aws-amplify/datastore";
import { getUrl } from "aws-amplify/storage";
import { User } from "../../../../../models";
import { useNavigate } from "react-router-dom"; // ✅ added
import "./mainProfile.css";

const MainProfile = () => {
  const navigate = useNavigate(); // ✅ added

  const {
    firstName,
    lastName,
    address,
    phoneNumber,
    profilePic,
    setProfilePic,
  } = useProfileContext();

  const { dbUser, authUser } = useAuthContext();

  console.log("dbuser:", dbUser)

  const [loading, setLoading] = useState(true);

  const fetchImageUrl = async () => {
    setLoading(true);

    if (!dbUser?.profilePic) {
      setProfilePic(null);
      setLoading(false);
      return;
    }

    try {
      const result = await getUrl({
        path: dbUser.profilePic,
        options: {
          validateObjectExistence: true,
        },
      });

      if (result.url) {
        setProfilePic(result.url.toString());
      } else {
        setProfilePic(null);
      }
    } catch (err) {
      console.log("Error fetching image:", err);
      setProfilePic(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dbUser?.profilePic) return;

    fetchImageUrl();

    const sub = DataStore.observe(User).subscribe(() => {
      fetchImageUrl();
    });

    return () => sub.unsubscribe();
  }, [dbUser?.profilePic]);

  const handleSignOut = async () => {
    const confirm = window.confirm("Are you sure you want to sign out?");
    if (!confirm) return;

    try {
      await signOut();
      navigate("/"); // ✅ redirect after logout (optional but recommended)
    } catch (err) {
      console.log("Sign out error:", err);
    }
  };

  // If no authuser
  if (!authUser) {
    return (
      <div className="emptyProfile">
        <img src="/placeholder.png" className="emptyAvatar" />

        <h2>Welcome</h2>
        <p>Please sign in to view your profile</p>

        <button
          className="emptyBtn"
          onClick={() => navigate("/?section=signin")}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="mainProfile-container">
      {/* HEADER */}
      <div className="mainProfile-header">
        <button onClick={() => navigate(-1)}> {/* ✅ go back */}
          ← Back
        </button>

        <h2>Profile</h2>

        <button
          className="mainProfile-logout"
          onClick={handleSignOut}
        >
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="mainProfile-content">
        {/* AVATAR */}
        <div className="mainProfile-avatarSection">
          <div className="mainProfile-avatarWrapper">
            {loading || !profilePic ? (
              <img
                src="/placeholder.png"
                alt="avatar"
                className="mainProfile-avatar"
              />
            ) : (
              <img
                src={profilePic}
                alt="avatar"
                className="mainProfile-avatar"
                onError={() => setProfilePic(null)}
              />
            )}
          </div>

          <h3>
            {firstName} {lastName}
          </h3>
        </div>

        {/* INFO */}
        <div className="mainProfile-infoCard">
          <div className="mainProfile-infoRow">
            <span>📞</span>
            <p>{phoneNumber}</p>
          </div>

          <div className="mainProfile-infoRow">
            <span>📍</span>
            <p>{address}</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="mainProfile-buttons">
          <button
            className="mainProfile-primaryBtn"
            onClick={() => navigate("/send/edit_profile")}
          >
            Edit Profile
          </button>

          <button
            className="mainProfile-secondaryBtn"
            onClick={() => navigate("/profile/info")} // ✅ updated
          >
            View Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainProfile;