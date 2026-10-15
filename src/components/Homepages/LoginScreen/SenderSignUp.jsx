import { signUp } from "aws-amplify/auth";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomInput from "./CustomInput";
import CustomButton from "./CustomButton";
import "./LoginScreen.css";

const SignUp = () => {
  const { control, handleSubmit, getValues } = useForm();
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const navigate = useNavigate();

  const onSignUp = async (data) => {
    if (loading) return;

    if (!agree) {
      alert("Please agree to terms");
      return;
    }

    const email = data.email?.trim().toLowerCase();

    if (!email) {
      alert("Email is required");
      return;
    }

    setLoading(true);

    // Save before the asynchronous signup request.
    localStorage.setItem("signupEmail", email);

    try {
      await signUp({
        username: email,
        password: data.password,
        options: {
          userAttributes: {
            email,
            "custom:role": "user",
          },
          autoSignIn: true,
        },
      });

      navigate(`/sender_confirm_email?username=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("Signup error:", error);
      alert(error?.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-section">
      <div className="login-wrapper login-reverse">
        <div className="login-left">
          <h1>Join Atua</h1>
          <p>Start sending packages with speed and confidence.</p>

          <div className="login-highlight">
            <span>📦 Easy delivery</span>
            <span>💰 Affordable pricing</span>
            <span>📍 Real-time tracking</span>
          </div>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit(onSignUp)}>
            <h2>Create Account</h2>

            <CustomInput
              control={control}
              name="email"
              label="Email"
              placeholder="Enter email"
              rules={{ required: "Email is required" }}
            />

            <CustomInput
              control={control}
              name="password"
              label="Password"
              placeholder="Create password"
              isPassword
              rules={{
                required: "Password required",
                minLength: {
                  value: 8,
                  message: "Minimum 8 characters",
                },
              }}
            />

            <CustomInput
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Repeat password"
              isPassword
              rules={{
                validate: (value) =>
                  value === getValues("password") || "Passwords do not match",
              }}
            />

            <div className="login-checkbox">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>I agree to Terms and Privacy Policy</span>
            </div>

            <CustomButton
              text="Create Account"
              type="submit"
              loading={loading}
            />

            <p className="login-switch" onClick={() => navigate("/")}>
              Already have an account? Sign In
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignUp;
