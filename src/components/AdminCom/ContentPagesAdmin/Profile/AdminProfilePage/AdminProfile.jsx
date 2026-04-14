import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";
import "./AdminProfile.css";

const AdminProfile = () => {
  const { dbUser } = useAuthContext();
  const navigate = useNavigate();

  const [profileUrl, setProfileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile image from S3
  useEffect(() => {
    const fetchImage = async () => {
      if (!dbUser?.profilePic) {
        setLoading(false);
        return;
      }

      try {
        const res = await getUrl({
          path: dbUser.profilePic,
        });

        setProfileUrl(res.url.toString());
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [dbUser]);

  const handleLogout = async () => {
    const confirm = window.confirm("Sign out?");
    if (!confirm) return;

    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="adminProfile-container">
      {/* HEADER */}
      <div className="adminProfile-header">
        <h2>Admin Profile</h2>
        <button
          className="adminProfile-logoutBtn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* MAIN CARD */}
      <div className="adminProfile-card">
        {/* LEFT SIDE */}
        <div className="adminProfile-left">
          <div className="adminProfile-avatarWrapper">
            {loading ? (
              <div className="adminProfile-avatarSkeleton" />
            ) : profileUrl ? (
              <img
                src={profileUrl}
                alt="profile"
                className="adminProfile-avatar"
              />
            ) : (
              <div className="adminProfile-avatarFallback">
                {dbUser?.firstName?.[0]}
              </div>
            )}
          </div>

          <h3>
            {dbUser?.firstName} {dbUser?.lastName}
          </h3>

          <p className="adminProfile-role">Administrator</p>
        </div>

        {/* RIGHT SIDE */}
        <div className="adminProfile-right">
          <div className="adminProfile-infoBlock">
            <span>Email</span>
            <p>{dbUser?.email || "—"}</p>
          </div>

          <div className="adminProfile-infoBlock">
            <span>Phone</span>
            <p>{dbUser?.phoneNumber || "—"}</p>
          </div>

          <div className="adminProfile-infoBlock">
            <span>Address</span>
            <p>{dbUser?.address || "—"}</p>
          </div>

          <div className="adminProfile-actions">
            <button
              className="adminProfile-primaryBtn"
              onClick={() => navigate("/admin/edit-profile")}
            >
              Edit Profile
            </button>

            <button
              className="adminProfile-secondaryBtn"
              onClick={() => navigate("/admin/settings")}
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;