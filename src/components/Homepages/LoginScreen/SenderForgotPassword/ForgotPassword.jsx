import { resetPassword } from "aws-amplify/auth";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomInput from "../CustomInput";
import CustomButton from "../CustomButton";
import "./ResetAuth.css";

const ForgotPassword = () => {
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async ({ email }) => {
    if (loading) return;
    setLoading(true);

    try {
      await resetPassword({ username: email });

      localStorage.setItem("resetEmail", email);

      alert("Code sent to your email");
      navigate(`/sender_confirm_code?email=${email}`);
    } catch (e) {
      alert(e.message);
    }

    setLoading(false);
  };

  return (
    <section className="reset-section">
      <div className="reset-container">

        <div className="reset-card">
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset code</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CustomInput
              name="email"
              control={control}
              label="Email"
              placeholder="Enter your email"
              rules={{
                required: "Email is required",
                pattern: {
                  value:
                    /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                  message: "Invalid email format",
                },
              }}
            />

            <CustomButton
              text="Send Code"
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

export default ForgotPassword;