import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "aws-amplify/auth";

import "./ForgotPassword.css";

function CourierProForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email ||
      localStorage.getItem("courierProSignupEmail") ||
      "",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const redirectTo =
    location.state?.redirectTo ||
    localStorage.getItem("courierProRedirectTo") ||
    "/courier-pro/register";

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword({
        username: normalizedEmail,
      });

      // Save the email and destination for the next step.
      localStorage.setItem("courierProResetEmail", normalizedEmail);

      localStorage.setItem("courierProRedirectTo", redirectTo);

      const deliveryDetails = result.nextStep?.codeDeliveryDetails;

      const destination = deliveryDetails?.destination || normalizedEmail;

      setSuccessMessage(
        `A password reset code has been sent to ${destination}.`,
      );

      navigate("/courier-pro/confirm-code", {
        state: {
          email: normalizedEmail,
          redirectTo,
        },
      });
    } catch (err) {
      console.error("Courier Pro forgot password error:", err);

      switch (err.name) {
        case "UserNotFoundException":
          setError("We couldn't find an account with that email address.");
          break;

        case "LimitExceededException":
        case "TooManyRequestsException":
          setError(
            "Too many password reset attempts. Please wait before trying again.",
          );
          break;

        case "InvalidParameterException":
          setError(
            "This account cannot be reset at the moment. Please contact support.",
          );
          break;

        case "NotAuthorizedException":
          setError(
            "Password reset is currently unavailable for this account. Please contact support.",
          );
          break;

        default:
          setError(
            err.message ||
              "Unable to start the password reset process. Please try again.",
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="courierProForgot">
      <div className="courierProForgot__background">
        <div className="courierProForgot__shape courierProForgot__shape--one" />
        <div className="courierProForgot__shape courierProForgot__shape--two" />
      </div>

      <div className="courierProForgot__container">
        <header className="courierProForgot__header">
          <Link
            to="/courier-pro"
            className="courierProForgot__brand"
            aria-label="Atua Courier Pro homepage"
          >
            <span className="courierProForgot__brandIcon">A</span>

            <span className="courierProForgot__brandText">
              <strong>ATUA</strong>
              <span>COURIER PRO</span>
            </span>
          </Link>

          <Link to="/courier-pro" className="courierProForgot__backLink">
            Back to website
          </Link>
        </header>

        <main className="courierProForgot__main">
          <section className="courierProForgot__card">
            <div className="courierProForgot__icon">
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

                <circle cx="12" cy="15" r="1.3" fill="currentColor" />

                <path
                  d="M12 16.3V18"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="courierProForgot__intro">
              <span className="courierProForgot__eyebrow">
                ACCOUNT RECOVERY
              </span>

              <h1>Forgot your password?</h1>

              <p>
                Don't worry. Enter the email address associated with your
                Courier Pro account and we'll send you a code to reset your
                password.
              </p>
            </div>

            {error && (
              <div
                className="courierProForgot__message courierProForgot__message--error"
                role="alert"
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div
                className="courierProForgot__message courierProForgot__message--success"
                role="status"
              >
                {successMessage}
              </div>
            )}

            <form className="courierProForgot__form" onSubmit={handleSubmit}>
              <div className="courierProForgot__field">
                <label htmlFor="courierProForgotEmail">Email address</label>

                <input
                  id="courierProForgotEmail"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="courierProForgot__submit"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <>
                    <span className="courierProForgot__spinner" />
                    Sending reset code...
                  </>
                ) : (
                  "Send reset code"
                )}
              </button>
            </form>

            <div className="courierProForgot__bottom">
              Remembered your password?
              <Link to="/courier-pro/login">Back to sign in</Link>
            </div>
          </section>

          <p className="courierProForgot__footer">
            © {new Date().getFullYear()} Atua Courier Pro. All rights reserved.
          </p>
        </main>
      </div>
    </div>
  );
}

export default CourierProForgotPassword;
