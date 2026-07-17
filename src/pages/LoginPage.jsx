import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { PasswordInput } from "../components/auth/PasswordInput";
import { AuthButton } from "../components/auth/AuthButton";
import { AuthDivider } from "../components/auth/AuthDivider";
const GoogleIcon = () => (<svg className="w-4 h-4 mr-3 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>);
export const LoginPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, login, register, loginWithGoogle } = useAuth();
    const [mode, setMode] = useState("login");
    const [emailLoading, setEmailLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    // Form Fields State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    // Error States
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    // Route Guard: Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, navigate]);
    const validateEmail = (val) => {
        return /\S+@\S+\.\S+/.test(val);
    };
    const handleModeChange = (newMode) => {
        setMode(newMode);
        setErrors({});
        setSuccessMessage("");
        // Clear sensitive fields on switch
        setPassword("");
        setConfirmPassword("");
    };
    const handleGoogleLogin = async () => {
        setErrors({});
        setSuccessMessage("");
        setGoogleLoading(true);
        try {
            await loginWithGoogle();
            // AuthContext will update, triggering the redirect in useEffect
        }
        catch (err) {
            setErrors({ form: "Google authentication failed. Please try again." });
            setGoogleLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage("");
        const newErrors = {};
        if (mode === "register" && !name.trim()) {
            newErrors.name = "Full name is required";
        }
        if (!email.trim()) {
            newErrors.email = "Email address is required";
        }
        else if (!validateEmail(email)) {
            newErrors.email = "Please enter a valid email address";
        }
        if (mode !== "forgot") {
            if (!password) {
                newErrors.password = "Password is required";
            }
            else if (password.length < 6) {
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
        setEmailLoading(true);
        try {
            if (mode === "login") {
                await login(email, password);
            }
            else if (mode === "register") {
                await register(name, email, password);
            }
            else if (mode === "forgot") {
                await new Promise((resolve) => setTimeout(resolve, 1500));
                setSuccessMessage("A restoration link has been sent to your email address.");
                setEmailLoading(false);
            }
            else if (mode === "reset") {
                await new Promise((resolve) => setTimeout(resolve, 1500));
                setSuccessMessage("Password reset successfully! Redirecting to login...");
                setTimeout(() => {
                    handleModeChange("login");
                }, 1500);
                setEmailLoading(false);
            }
        }
        catch (err) {
            if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
                setErrors(err.fieldErrors);
            } else {
                setErrors({ form: err.message || "An unexpected error occurred. Please try again." });
            }
            setEmailLoading(false);
        }
    };
    const anyLoading = emailLoading || googleLoading;
    return (<AuthLayout>
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
        {successMessage && (<div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded font-body text-center" role="alert">
            {successMessage}
          </div>)}
        {errors.form && (<div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded font-body text-center" role="alert">
            {errors.form}
          </div>)}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          {mode === "register" && (<AuthInput id="name" label="Full Name" type="text" placeholder="Alexander Mercer" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} disabled={anyLoading} autoComplete="name"/>)}

          <AuthInput id="email" label="Email Address" type="email" placeholder="name@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={anyLoading} autoComplete="email"/>

          {mode !== "forgot" && (<PasswordInput id="password" label={mode === "reset" ? "New Password" : "Password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={anyLoading} autoComplete={mode === "register" ? "new-password" : "current-password"}/>)}

          {(mode === "register" || mode === "reset") && (<PasswordInput id="confirm-password" label="Confirm Password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} disabled={anyLoading} autoComplete="new-password"/>)}

          {/* Remember Me & Forgot Password link */}
          {mode === "login" && (<div className="flex justify-between items-center w-full text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#F7F5EE]/60 hover:text-[#F7F5EE] transition-colors font-body">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-[rgba(201,162,39,0.3)] bg-[rgba(255,255,255,0.03)] checked:bg-[#C9A227] checked:border-[#C9A227] focus:ring-0 focus:ring-offset-0 accent-[#C9A227] transition-all" disabled={anyLoading}/>
                <span>Remember me</span>
              </label>
              <button type="button" onClick={() => handleModeChange("forgot")} className="text-[#C9A227] hover:text-[#E5C16B] transition-colors focus:outline-none focus:underline font-display text-[10px] tracking-[0.1em] uppercase cursor-pointer" disabled={anyLoading}>
                Forgot Password?
              </button>
            </div>)}

          {/* Terms checkbox for Registration */}
          {mode === "register" && (<div className="flex flex-col gap-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#F7F5EE]/60 hover:text-[#F7F5EE] transition-colors font-body leading-normal">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-[rgba(201,162,39,0.3)] bg-[rgba(255,255,255,0.03)] checked:bg-[#C9A227] checked:border-[#C9A227] focus:ring-0 focus:ring-offset-0 accent-[#C9A227] transition-all" disabled={anyLoading}/>
                <span>
                  I accept the{" "}
                  <a href="#terms" className="text-[#C9A227] hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#privacy" className="text-[#C9A227] hover:underline">Privacy Policy</a>
                </span>
              </label>
              {errors.terms && (<span className="text-red-400 text-xs mt-1 font-body" role="alert">
                  {errors.terms}
                </span>)}
            </div>)}

          {/* Action Buttons */}
          <div className="mt-2 space-y-4">
            <AuthButton type="submit" loading={emailLoading} disabled={anyLoading}>
              {mode === "login" && "Access Archives"}
              {mode === "register" && "Initiate Access"}
              {mode === "forgot" && "Send Recovery Link"}
              {mode === "reset" && "Update Password"}
            </AuthButton>

            {/* Alternates only for Login/Register */}
            {(mode === "login" || mode === "register") && (<>
                <AuthDivider>Or continue with</AuthDivider>
                <AuthButton type="button" variant="secondary" onClick={handleGoogleLogin} loading={googleLoading} disabled={anyLoading}>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </AuthButton>
              </>)}
          </div>
        </form>

        {/* Form Mode Swapping Footer */}
        <div className="text-center text-xs mt-4">
          {mode === "login" && (<p className="text-[#F7F5EE]/55 font-body">
              Don't have an account?{" "}
              <button type="button" onClick={() => handleModeChange("register")} className="text-[#C9A227] hover:text-[#E5C16B] font-semibold transition-colors focus:outline-none focus:underline cursor-pointer" disabled={anyLoading}>
                Join the Circle
              </button>
            </p>)}
          {mode === "register" && (<p className="text-[#F7F5EE]/55 font-body">
              Already a member?{" "}
              <button type="button" onClick={() => handleModeChange("login")} className="text-[#C9A227] hover:text-[#E5C16B] font-semibold transition-colors focus:outline-none focus:underline cursor-pointer" disabled={anyLoading}>
                Sign In
              </button>
            </p>)}
          {(mode === "forgot" || mode === "reset") && (<button type="button" onClick={() => handleModeChange("login")} className="text-[#C9A227] hover:text-[#E5C16B] font-semibold transition-colors focus:outline-none focus:underline font-body cursor-pointer" disabled={anyLoading}>
              Back to Sign In
            </button>)}
        </div>
      </AuthCard>
    </AuthLayout>);
};
