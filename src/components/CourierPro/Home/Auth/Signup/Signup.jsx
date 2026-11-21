import React, { useState } from "react";
import { signUp } from "aws-amplify/auth";
import { useForm } from "react-hook-form";
import { useNavigate, Link, useLocation } from "react-router-dom";

import "./Signup.css";

const CourierProSignup = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  // Preserve the intended destination throughout signup.
  const redirectTo = location.state?.redirectTo || "/courier-pro/register";

  const onSignUp = async (data) => {
    if (loading) return;

    setError("");

    if (!agree) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    const email = data.email?.trim().toLowerCase();

    if (!email) {
      setError("Email address is required.");
      return;
    }

    setLoading(true);

    // Keep Courier Pro signup details separate from Atua customer signup.
    localStorage.setItem("courierProSignupEmail", email);
    localStorage.setItem("courierProRedirectTo", redirectTo);

    try {
      const result = await signUp({
        username: email,
        password: data.password,
        options: {
          userAttributes: {
            email,
          },
          // We handle email verification in our separate Courier Pro page.
          autoSignIn: false,
        },
      });

      const nextStep = result.nextStep?.signUpStep;

      if (nextStep === "CONFIRM_SIGN_UP" || result.isSignUpComplete === false) {
        navigate("/courier-pro/verify-email", {
          replace: true,
          state: {
            email,
            redirectTo,
          },
        });

        return;
      }

      if (result.isSignUpComplete) {
        navigate("/courier-pro/login", {
          replace: true,
          state: {
            redirectTo,
          },
        });

        return;
      }

      setError(
        "Your account was created, but an additional verification step is required. Please contact support if this continues.",
      );
    } catch (err) {
      console.error("Courier Pro signup error:", err);

      if (err.name === "UsernameExistsException") {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
      } else {
        setError(
          err?.message || "Unable to create your account. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="courierProSignupPage">
      <div className="courierProSignupContainer">
        {/* Brand */}
        <div className="courierProSignupBrand">
          <Link to="/courier-pro">
            <span>ATUA</span>
            <span>COURIER PRO</span>
          </Link>
        </div>

        {/* Signup card */}
        <div className="courierProSignupCard">
          <div className="courierProSignupHeading">
            <span className="courierProSignupEyebrow">
              FLEET MANAGEMENT PORTAL
            </span>

            <h1>Create your account</h1>

            <p>
              Create an Atua account to get started with Courier Pro fleet
              management.
            </p>
          </div>

          <form
            className="courierProSignupForm"
            onSubmit={handleSubmit(onSignUp)}
          >
            {/* Email */}
            <div className="courierProSignupField">
              <label htmlFor="courierProSignupEmail">Email address</label>

              <input
                id="courierProSignupEmail"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                {...register("email", {
                  required: "Email address is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />

              {errors.email && (
                <p className="courierProSignupFieldError">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="courierProSignupField">
              <label htmlFor="courierProSignupPassword">Password</label>

              <div className="courierProSignupPasswordInput">
                <input
                  id="courierProSignupPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Password is required",

                    minLength: {
                      value: 8,
                      message: "Password must contain at least 8 characters",
                    },

                    pattern: {
                      value: /^(?=.*[0-9]).+$/,
                      message: "Password must contain at least one number",
                    },
                  })}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password && (
                <p className="courierProSignupFieldError">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="courierProSignupField">
              <label htmlFor="courierProSignupConfirmPassword">
                Confirm password
              </label>

              <div className="courierProSignupPasswordInput">
                <input
                  id="courierProSignupConfirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === getValues("password") ||
                      "Passwords do not match",
                  })}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="courierProSignupFieldError">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="courierProSignupTerms">
              <input
                id="courierProSignupTerms"
                type="checkbox"
                checked={agree}
                onChange={(event) => setAgree(event.target.checked)}
              />

              <label htmlFor="courierProSignupTerms">
                I agree to the Terms and Conditions and Privacy Policy.
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="courierProSignupError" role="alert">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="courierProSignupSubmit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Existing account */}
          <div className="courierProSignupFooter">
            <p>Already have an account?</p>

            <Link to="/courier-pro/login" state={{ redirectTo }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="courierProSignupBottom">
          <p>Secure fleet management powered by Atua.</p>

          <Link to="/courier-pro">Back to Courier Pro</Link>
        </div>
      </div>
    </div>
  );
};

export default CourierProSignup;
