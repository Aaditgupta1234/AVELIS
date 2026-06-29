import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { PasswordInput } from "../components/auth/PasswordInput";
import { AuthButton } from "../components/auth/AuthButton";
import { AuthDivider } from "../components/auth/AuthDivider";

type AuthMode = "login" | "register" | "forgot" | "reset";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setSuccessMessage("");
    // Clear sensitive fields on switch
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    const newErrors: Record<string, string> = {};

    // Validate based on mode
    if (mode === "register" && !name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (mode !== "forgot") {
      if (!password) {
        newErrors.password = "Password is required";
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    if (mode === "register" || mode === "reset") {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (mode === "register" && !termsAccepted) {
      newErrors.terms = "You must accept the terms & conditions";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Mock API Submission
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (mode === "login") {
        // Redirect to homepage on successful login
        navigate("/");
      } else if (mode === "register") {
        setSuccessMessage("Account created successfully! Redirecting to sanctuary...");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else if (mode === "forgot") {
        setSuccessMessage("A restoration link has been sent to your email address.");
      } else if (mode === "reset") {
        setSuccessMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          handleModeChange("login");
        }, 1500);
      }
    } catch (err) {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        {/* Form Title & Subtitle */}
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl tracking-[0.1em] text-[#F7F5EE] uppercase">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Join the Circle"}
            {mode === "forgot" && "Restore Access"}
            {mode === "reset" && "Reset Password"}
          </h2>
          <p className="font-body text-xs text-[#F7F5EE]/60">
            {mode === "login" && "Enter your credentials to access the archives"}
            {mode === "register" && "Create an account to begin your literary journey"}
            {mode === "forgot" && "Enter your email to receive a recovery link"}
            {mode === "reset" && "Establish your new credentials below"}
          </p>
        </div>

        {/* Global Messages */}
        {successMessage && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded font-body text-center" role="alert">
            {successMessage}
          </div>
        )}
        {errors.form && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded font-body text-center" role="alert">
            {errors.form}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          {mode === "register" && (
            <AuthInput
              id="name"
              label="Full Name"
              type="text"
              placeholder="Alexander Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              disabled={loading}
              autoComplete="name"
            />
          )}

          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={loading}
            autoComplete="email"
          />

          {mode !== "forgot" && (
            <PasswordInput
              id="password"
              label={mode === "reset" ? "New Password" : "Password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={loading}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          )}

          {(mode === "register" || mode === "reset") && (
            <PasswordInput
              id="confirm-password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              disabled={loading}
              autoComplete="new-password"
            />
          )}

          {/* Remember Me & Forgot Password link */}
          {mode === "login" && (
            <div className="flex justify-between items-center w-full text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#F7F5EE]/60 hover:text-[#F7F5EE] transition-colors font-body">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[rgba(201,162,39,0.3)] bg-[rgba(255,255,255,0.03)] checked:bg-[#C9A227] checked:border-[#C9A227] focus:ring-0 focus:ring-offset-0 accent-[#C9A227] transition-all"
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => handleModeChange("forgot")}
                className="text-[#C9A227] hover:text-[#E5C16B] transition-colors focus:outline-none focus:underline font-display text-[10px] tracking-[0.1em] uppercase"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Terms checkbox for Registration */}
          {mode === "register" && (
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#F7F5EE]/60 hover:text-[#F7F5EE] transition-colors font-body leading-normal">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[rgba(201,162,39,0.3)] bg-[rgba(255,255,255,0.03)] checked:bg-[#C9A227] checked:border-[#C9A227] focus:ring-0 focus:ring-offset-0 accent-[#C9A227] transition-all"
                  disabled={loading}
                />
                <span>
                  I accept the{" "}
                  <a href="#terms" className="text-[#C9A227] hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#privacy" className="text-[#C9A227] hover:underline">Privacy Policy</a>
                </span>
              </label>
              {errors.terms && (
                <span className="text-red-400 text-xs mt-1 font-body" role="alert">
                  {errors.terms}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-2 space-y-4">
            <AuthButton type="submit" loading={loading}>
              {mode === "login" && "Access Archives"}
              {mode === "register" && "Initiate Access"}
              {mode === "forgot" && "Send Recovery Link"}
              {mode === "reset" && "Update Password"}
            </AuthButton>

            {/* Alternates only for Login/Register */}
            {(mode === "login" || mode === "register") && (
              <>
                <AuthDivider>Or continue with</AuthDivider>
                <div className="grid grid-cols-2 gap-4">
                  <AuthButton
                    type="button"
                    variant="secondary"
                    onClick={() => {}}
                    disabled={loading}
                    className="h-11"
                  >
                    Google
                  </AuthButton>
                  <AuthButton
                    type="button"
                    variant="secondary"
                    onClick={() => {}}
                    disabled={loading}
                    className="h-11"
                  >
                    Apple
                  </AuthButton>
                </div>
              </>
            )}
          </div>
        </form>

        {/* Form Mode Swapping Footer */}
        <div className="text-center text-xs mt-4">
          {mode === "login" && (
            <p className="text-[#F7F5EE]/55 font-body">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => handleModeChange("register")}
                className="text-[#C9A227] hover:text-[#E5C16B] font-semibold transition-colors focus:outline-none focus:underline"
                disabled={loading}
              >
                Join the Circle
              </button>
            </p>
          )}
          {mode === "register" && (
            <p className="text-[#F7F5EE]/55 font-body">
              Already a member?{" "}
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className="text-[#C9A227] hover:text-[#E5C16B] font-semibold transition-colors focus:outline-none focus:underline"
                disabled={loading}
              >
                Sign In
              </button>
            </p>
          )}
          {(mode === "forgot" || mode === "reset") && (
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              className="text-[#C9A227] hover:text-[#E5C16B] font-semibold transition-colors focus:outline-none focus:underline font-body"
              disabled={loading}
            >
              Back to Sign In
            </button>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
};
