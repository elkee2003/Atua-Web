import { useNavigate } from "react-router-dom";
import "./Unauthorized.css";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauth-container">
      <div className="unauth-card">
        {/* ICON */}
        <div className="unauth-iconWrapper">
          <div className="unauth-icon">🚫</div>
        </div>

        {/* TEXT */}
        <h1>Access Restricted</h1>
        <p>
          You don’t have permission to view this page.  
          If you believe this is a mistake, contact support.
        </p>

        {/* ACTIONS */}
        <div className="unauth-actions">
          <button
            className="unauth-primaryBtn"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>

          <button
            className="unauth-secondaryBtn"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;