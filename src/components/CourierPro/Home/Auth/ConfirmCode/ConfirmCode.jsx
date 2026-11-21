import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmResetPassword } from "aws-amplify/auth";

import "./ConfirmCode.css";

function CourierProResetPasswordConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email || localStorage.getItem("courierProResetEmail") || "";

  const redirectTo =
    location.state?.redirectTo ||
    localStorage.getItem("courierProRedirectTo") ||
    "/courier-pro/register";

  const [formData, setFormData] = useState({
    confirmationCode: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "confirmationCode" ? value.replace(/\s/g, "") : value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    if (!email) {
      setError(
        "Your email address is missing. Please restart the password reset process.",
      );
      return false;
    }

    if (!formData.confirmationCode.trim()) {
      setError("Please enter the password reset code.");
      return false;
    }

    if (!formData.newPassword) {
      setError("Please enter your new password.");
      return false;
    }

    // Password must contain at least 8 characters.
    if (formData.newPassword.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return false;
    }

    // Password must contain at least one number.
    if (!/[0-9]/.test(formData.newPassword)) {
      setError("Your password must contain at least one number.");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: formData.confirmationCode.trim(),
        newPassword: formData.newPassword,
      });

      localStorage.removeItem("courierProResetEmail");
      localStorage.removeItem("courierProSignupEmail");

      // Keep the intended destination for the next login.
      localStorage.setItem("courierProRedirectTo", redirectTo);

      navigate("/courier-pro/login", {
        replace: true,
        state: {
          email: email.trim().toLowerCase(),
          redirectTo,
          passwordReset: true,
        },
      });
    } catch (err) {
      console.error("Courier Pro password reset error:", err);

      switch (err.name) {
        case "CodeMismatchException":
          setError(
            "The password reset code is incorrect. Please check it and try again.",
          );
          break;

        case "ExpiredCodeException":
          setError(
            "Your password reset code has expired. Please request a new code.",
          );
          break;

        case "InvalidPasswordException":
          setError(
            "Your new password does not meet the password requirements for this account.",
          );
          break;

        case "LimitExceededException":
        case "TooManyRequestsException":
          setError(
            "Too many attempts. Please wait a little while before trying again.",
          );
          break;

        case "UserNotFoundException":
          setError(
            "We couldn't find an account associated with this email address.",
          );
          break;

        case "NotAuthorizedException":
          setError(
            "This password reset request is no longer valid. Please request a new code.",
          );
          break;

        default:
          setError(
            err.message || "Unable to reset your password. Please try again.",
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="courierProReset">
      <div className="courierProReset__background">
        <div className="courierProReset__shape courierProReset__shape--one" />
        <div className="courierProReset__shape courierProReset__shape--two" />
      </div>

      <div className="courierProReset__container">
        <header className="courierProReset__header">
          <Link
            to="/courier-pro"
            className="courierProReset__brand"
            aria-label="Atua Courier Pro homepage"
          >
            <span className="courierProReset__brandIcon">A</span>

            <span className="courierProReset__brandText">
              <strong>ATUA</strong>
              <span>COURIER PRO</span>
            </span>
          </Link>

          <Link to="/courier-pro" className="courierProReset__backLink">
            Back to website
          </Link>
        </header>

        <main className="courierProReset__main">
          <section className="courierProReset__card">
            <div className="courierProReset__icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="4"
                  y="10"
                  width="16"
                  height="11"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />

                <path
                  d="M12 14v3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />

                <circle cx="12" cy="14" r="1" fill="currentColor" />
              </svg>
            </div>

            <div className="courierProReset__intro">
              <span className="courierProReset__eyebrow">
                PASSWORD RECOVERY
              </span>

              <h1>Reset your password</h1>

              <p>
                Enter the verification code sent to your email and choose a new
                password for your Courier Pro account.
              </p>

              {email && <div className="courierProReset__email">{email}</div>}
            </div>

            {!email ? (
              <div className="courierProReset__noEmail">
                <p>
                  We couldn't find the email address associated with your
                  password reset request.
                </p>

                <Link to="/courier-pro/forgot-password">
                  Request a new reset code
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    className="courierProReset__message courierProReset__message--error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div
                    className="courierProReset__message courierProReset__message--success"
                    role="status"
                  >
                    {successMessage}
                  </div>
                )}

                <form className="courierProReset__form" onSubmit={handleSubmit}>
                  <div className="courierProReset__field">
                    <label htmlFor="courierProResetCode">
                      Verification code
                    </label>

                    <input
                      id="courierProResetCode"
                      type="text"
                      name="confirmationCode"
                      placeholder="Enter your reset code"
                      value={formData.confirmationCode}
                      onChange={handleChange}
                      autoComplete="one-time-code"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="courierProReset__field">
                    <label htmlFor="courierProNewPassword">New password</label>

                    <div className="courierProReset__passwordWrapper">
                      <input
                        id="courierProNewPassword"
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="Enter your new password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                        disabled={loading}
                      />

                      <button
                        type="button"
                        className="courierProReset__showPassword"
                        onClick={() => setShowPassword((previous) => !previous)}
                        disabled={loading}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="courierProReset__field">
                    <label htmlFor="courierProConfirmPassword">
                      Confirm new password
                    </label>

                    <div className="courierProReset__passwordWrapper">
                      <input
                        id="courierProConfirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm your new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                        disabled={loading}
                      />

                      <button
                        type="button"
                        className="courierProReset__showPassword"
                        onClick={() =>
                          setShowConfirmPassword((previous) => !previous)
                        }
                        disabled={loading}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="courierProReset__requirements">
                    Your password must contain:
                    <ul>
                      <li>At least 8 characters</li>

                      <li>At least one number</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    className="courierProReset__submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="courierProReset__spinner" />
                        Resetting password...
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="courierProReset__bottom">
              Remembered your password?
              <Link to="/courier-pro/login">Back to sign in</Link>
            </div>
          </section>

          <p className="courierProReset__footer">
            © {new Date().getFullYear()} Atua Courier Pro. All rights reserved.
          </p>
        </main>
      </div>
    </div>
  );
}

export default CourierProResetPasswordConfirmation;
