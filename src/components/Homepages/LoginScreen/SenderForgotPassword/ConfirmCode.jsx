import { confirmResetPassword } from "aws-amplify/auth";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import CustomInput from "../CustomInput";
import CustomButton from "../CustomButton";
import "./ResetAuth.css";

const ConfirmCode = () => {
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email =
    searchParams.get("email") ||
    localStorage.getItem("resetEmail");

  const onSubmit = async ({ code, newPassword }) => {
    if (loading) return;
    setLoading(true);

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });

      alert("Password reset successful");
      navigate("/");
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <section className="reset-section">
      <div className="reset-container">

        <div className="reset-card">
          <h1>Enter Code</h1>
          <p>
            Enter the confirmation code sent to <strong>{email}</strong>
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CustomInput
              name="code"
              control={control}
              label="Confirmation Code"
              placeholder="Enter code"
              rules={{ required: "Code is required" }}
            />

            <CustomInput
              name="newPassword"
              control={control}
              label="New Password"
              placeholder="Enter new password"
              isPassword
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "At least 8 characters",
                },
                validate: (value) =>
                  /\d/.test(value) ||
                  "Must include at least one number",
              }}
            />

            <CustomButton
              text="Reset Password"
              onClick={handleSubmit(onSubmit)}
              loading={loading}
            />

            <p
              className="reset-link"
              onClick={() => navigate("/")}
            >
              Back to Sign In
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ConfirmCode;