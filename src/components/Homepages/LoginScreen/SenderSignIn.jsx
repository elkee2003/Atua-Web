import { signIn, fetchAuthSession, signOut } from "aws-amplify/auth";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomInput from "./CustomInput";
import CustomButton from "./CustomButton";
import "./LoginScreen.css";

const SignIn = () => {
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSignIn = async (data) => {
    if (loading) return;
    setLoading(true);

    try {
      const { isSignedIn } = await signIn({
        username: data.email,
        password: data.password,
      });

      if (isSignedIn) {
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken?.toString();

        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const userGroups = payload["cognito:groups"] || [];
        const userRole = payload["custom:role"] || "";

        const allowedRole = "user";

        if (
          userGroups.includes(allowedRole) ||
          userRole === allowedRole
        ) {
          navigate("/send/home");
        } else {
          alert("Wrong app for this account");
          await signOut();
        }
      }
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <section className="login-section">
      <div className="login-wrapper">

        <div className="login-left">
          <h1>Welcome Back</h1>
          <p>
            Manage deliveries, track packages, and grow with Atua Logistics.
          </p>

          <div className="login-highlight">
            <span>Fast deliveries</span>
            <span>Secure platform</span>
            <span>Nationwide coverage</span>
          </div>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit(onSignIn)}>
            <h2>Sign In</h2>

            <CustomInput
              control={control}
              name="email"
              label="Email"
              placeholder="Enter your email"
              rules={{ required: "Email is required" }}
            />

            <CustomInput
              control={control}
              name="password"
              label="Password"
              placeholder="Enter password"
              isPassword
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Minimum 8 characters",
                },
              }}
            />

            <CustomButton
              text="Sign In"
              onClick={handleSubmit(onSignIn)}
              loading={loading}
            />

            <div className="login-links">
              <span onClick={() => navigate("/sender_forgot_password")}>
                Forgot Password?
              </span>

              <span onClick={() => navigate("/sender_signup")}>
                Create Account
              </span>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
};

export default SignIn;