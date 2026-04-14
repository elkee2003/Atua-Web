import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ConfirmEmail.css";

const ConfirmEmail = () => {
  const [loading, setLoading] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const username =
    searchParams.get("username") ||
    localStorage.getItem("signupEmail");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    if (!username) {
      alert("Session expired. Please sign up again.");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await confirmSignUp({
        username,
        confirmationCode: data.confirmationCode.trim(),
      });

      alert("Email verified successfully!");
      navigate("/signin");
    } catch (error) {
      alert(error?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!username) {
      alert("Session expired.");
      return;
    }

    if (loadingCode) return;
    setLoadingCode(true);

    try {
      await resendSignUpCode({ username });
      alert("A new code has been sent to your email.");
    } catch (error) {
      alert(error?.message || "Failed to resend code");
    } finally {
      setLoadingCode(false);
    }
  };

  return (
    <section className="confirm-email-section">
      <div className="confirm-email-card">

        <div className="confirm-email-header">
          <h1>Verify your email</h1>
          <p>
            Enter the 6-digit code sent to{" "}
            <strong>{username}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="confirm-email-inputWrapper">
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              {...register("confirmationCode", {
                required: "Code is required",
                minLength: {
                  value: 6,
                  message: "Enter a valid 6-digit code",
                },
              })}
            />

            {errors.confirmationCode && (
              <p className="confirm-email-error">
                {errors.confirmationCode.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="confirm-email-btn"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="confirm-email-secondary">
          <button
            onClick={handleResendCode}
            disabled={loadingCode}
            className="confirm-email-link"
          >
            {loadingCode ? "Resending..." : "Resend Code"}
          </button>

          <button
            onClick={() => navigate("/")}
            className="confirm-email-link"
          >
            Back to Sign In
          </button>
        </div>

      </div>
    </section>
  );
};

export default ConfirmEmail;