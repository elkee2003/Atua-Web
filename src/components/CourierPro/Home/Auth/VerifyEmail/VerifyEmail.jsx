import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";

import "./VerifyEmail.css";

function CourierProVerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // Recover the email and redirect destination from signup.
  const email =
    location.state?.email ||
    localStorage.getItem("courierProSignupEmail") ||
    "";

  const redirectTo =
    location.state?.redirectTo ||
    localStorage.getItem("courierProRedirectTo") ||
    "/courier-pro/register";

  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleCodeChange = (event) => {
    // Keep only digits in the verification code.
    const value = event.target.value.replace(/\D/g, "");

    setConfirmationCode(value);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!email) {
      setError(
        "We couldn't find your signup email address. Please return to signup and try again.",
      );
      return;
    }

    if (!confirmationCode.trim()) {
      setError("Please enter the verification code sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const result = await confirmSignUp({
        username: email,
        confirmationCode: confirmationCode.trim(),
      });

      if (result.isSignUpComplete) {
        // Remove the temporary signup email.
        localStorage.removeItem("courierProSignupEmail");

        // Preserve the destination for the login page.
        localStorage.setItem("courierProRedirectTo", redirectTo);

        setSuccessMessage(
          "Your email has been verified successfully. Redirecting you to sign in...",
        );

        navigate("/courier-pro/login", {
          replace: true,
          state: {
            redirectTo,
            email,
            verified: true,
          },
        });

        return;
      }

      setError(
        "Your verification requires an additional step. Please contact support.",
      );
    } catch (err) {
      console.error("Courier Pro email verification error:", err);

      switch (err.name) {
        case "CodeMismatchException":
          setError(
            "The verification code is incorrect. Please check the code and try again.",
          );
          break;

        case "ExpiredCodeException":
          setError(
            "This verification code has expired. Please request a new code.",
          );
          break;

        case "LimitExceededException":
        case "TooManyRequestsException":
          setError("Too many attempts. Please wait before trying again.");
          break;

        case "UserNotFoundException":
          setError(
            "We couldn't find an account with this email address. Please sign up again.",
          );
          break;

        case "NotAuthorizedException":
          setError(
            "This account may already be verified. Please try signing in.",
          );
          break;

        default:
          setError(
            err.message || "Unable to verify your email. Please try again.",
          );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError("We couldn't find your email address. Please return to signup.");
      return;
    }

    setResending(true);

    try {
      await resendSignUpCode({
        username: email,
      });

      setSuccessMessage(
        "A new verification code has been sent to your email address.",
      );

      setConfirmationCode("");
    } catch (err) {
      console.error("Courier Pro resend verification error:", err);

      switch (err.name) {
        case "LimitExceededException":
        case "TooManyRequestsException":
          setError(
            "You have requested too many codes. Please wait before trying again.",
          );
          break;

        case "UserNotFoundException":
          setError("We couldn't find an account with this email address.");
          break;

        case "InvalidParameterException":
          setError(
            "This account may already be verified. Please try signing in.",
          );
          break;

        default:
          setError(
            err.message ||
              "Unable to resend the verification code. Please try again.",
          );
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="courierProVerify">
      <div className="courierProVerify__background">
        <div className="courierProVerify__shape courierProVerify__shape--one" />
        <div className="courierProVerify__shape courierProVerify__shape--two" />
      </div>

      <div className="courierProVerify__container">
        <header className="courierProVerify__header">
          <Link to="/courier-pro" className="courierProVerify__brand">
            <span className="courierProVerify__brandIcon">A</span>

            <span className="courierProVerify__brandText">
              <strong>ATUA</strong>
              <span>COURIER PRO</span>
            </span>
          </Link>

          <Link to="/courier-pro" className="courierProVerify__backLink">
            Back to website
          </Link>
        </header>

        <main className="courierProVerify__main">
          <section className="courierProVerify__card">
            <div className="courierProVerify__icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M4 7L12 13L20 7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="18"
                  cy="17"
                  r="4"
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M16.5 17L17.5 18L19.5 16"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="courierProVerify__intro">
              <span className="courierProVerify__eyebrow">
                ACCOUNT VERIFICATION
              </span>

              <h1>Verify your email</h1>

              <p>
                We've sent a verification code to the email address below. Enter
                the code to activate your Courier Pro account.
              </p>

              {email && <div className="courierProVerify__email">{email}</div>}
            </div>

            {!email ? (
              <div className="courierProVerify__noEmail">
                <p>
                  Your signup email address is missing. Please return to the
                  signup page and create your account again.
                </p>

                <Link to="/courier-pro/signup">Return to signup</Link>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    className="courierProVerify__message courierProVerify__message--error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div
                    className="courierProVerify__message courierProVerify__message--success"
                    role="status"
                  >
                    {successMessage}
                  </div>
                )}

                <form
                  className="courierProVerify__form"
                  onSubmit={handleSubmit}
                >
                  <div className="courierProVerify__field">
                    <label htmlFor="courierProVerificationCode">
                      Verification code
                    </label>

                    <input
                      id="courierProVerificationCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter your code"
                      value={confirmationCode}
                      onChange={handleCodeChange}
                      maxLength={8}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="courierProVerify__submit"
                    disabled={loading || !confirmationCode.trim()}
                  >
                    {loading ? (
                      <>
                        <span className="courierProVerify__spinner" />
                        Verifying...
                      </>
                    ) : (
                      "Verify email"
                    )}
                  </button>
                </form>

                <div className="courierProVerify__resend">
                  <p>Didn't receive the code?</p>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resending || loading}
                  >
                    {resending ? "Sending..." : "Resend code"}
                  </button>
                </div>
              </>
            )}

            <div className="courierProVerify__bottom">
              Already verified?
              <Link to="/courier-pro/login">Sign in</Link>
            </div>
          </section>

          <p className="courierProVerify__footer">
            © {new Date().getFullYear()} Atua Courier Pro. All rights reserved.
          </p>
        </main>
      </div>
    </div>
  );
}

export default CourierProVerifyEmail;
