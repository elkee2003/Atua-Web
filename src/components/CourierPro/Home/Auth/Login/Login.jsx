import React, { useState } from "react";
import { signIn } from "aws-amplify/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";

import "./Login.css";

const CourierProLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Preserve the page the user originally wanted to access.
  const redirectTo = location.state?.redirectTo || "/courier-pro/register";

  // Update form fields.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // Sign in using the existing Atua Cognito User Pool.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const email = formData.email.trim().toLowerCase();

    if (!email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn({
        username: email,
        password: formData.password,
      });

      if (result.isSignedIn) {
        navigate(redirectTo, {
          replace: true,
        });

        return;
      }

      // Handle additional Cognito authentication challenges.
      const nextStep = result.nextStep?.signInStep;

      if (nextStep === "CONFIRM_SIGN_IN_WITH_SMS_CODE") {
        setError(
          "A verification code is required. Please complete the additional sign-in verification.",
        );
      } else if (nextStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
        setError("Please complete your authenticator app verification.");
      } else if (nextStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setError("You need to create a new password before continuing.");
      } else if (nextStep === "RESET_PASSWORD") {
        setError("Your password needs to be reset before you can continue.");
      } else {
        setError(
          "Additional authentication is required. Please try again or contact support.",
        );
      }
    } catch (err) {
      console.error("Courier Pro login error:", err);

      setError(
        err?.message ||
          "Unable to sign in. Please check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="courierProLoginPage">
      <div className="courierProLoginContainer">
        {/* Brand */}
        <div className="courierProLoginBrand">
          <Link to="/courier-pro" className="courierProLoginBrandLink">
            <span>ATUA</span>
            <span>COURIER PRO</span>
          </Link>
        </div>

        {/* Login content */}
        <div className="courierProLoginCard">
          <div className="courierProLoginHeading">
            <span className="courierProLoginEyebrow">
              FLEET MANAGEMENT PORTAL
            </span>

            <h1>Welcome back</h1>

            <p>
              Sign in to manage your fleet, riders, vehicles and delivery
              operations.
            </p>
          </div>

          <form className="courierProLoginForm" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="courierProLoginField">
              <label htmlFor="courierProEmail">Email address</label>

              <input
                id="courierProEmail"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="courierProLoginField">
              <div className="courierProLoginPasswordLabel">
                <label htmlFor="courierProPassword">Password</label>

                <Link to="/courier-pro/forgot-password">Forgot password?</Link>
              </div>

              <div className="courierProLoginPasswordInput">
                <input
                  id="courierProPassword"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="courierProLoginError" role="alert">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="courierProLoginSubmit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Signup */}
          <div className="courierProLoginFooter">
            <p>Don't have an Atua account?</p>

            <Link to="/courier-pro/signup" state={{ redirectTo }}>
              Create an account
            </Link>
          </div>
        </div>

        {/* Bottom text */}
        <div className="courierProLoginBottom">
          <p>Secure fleet management powered by Atua.</p>

          <Link to="/courier-pro">Back to Courier Pro</Link>
        </div>
      </div>
    </div>
  );
};

export default CourierProLogin;
