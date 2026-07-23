import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { loginWithOAuthToken } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  // Per-mount idempotency guard.
  // Ensures loginWithOAuthToken is called exactly once within this mounted instance,
  // regardless of whether getSession() or onAuthStateChange fires first (or both).
  // Note: useRef does not survive a StrictMode remount — it is recreated with the component.
  const processedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Single choke-point for the OAuth token exchange.
    // Both the getSession() path and the onAuthStateChange path call this function.
    // processedRef guarantees only the first call proceeds within this mount.
    const processSession = async (session) => {
      if (processedRef.current) return;
      processedRef.current = true;

      try {
        await loginWithOAuthToken(session.access_token);
        if (isMounted) {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        if (!isMounted) return;

        // Only clear the Supabase session if the backend explicitly rejected authentication.
        // Wrapped in its own try/catch so a signOut failure doesn't hide the original error.
        if (err.response?.status === 401 || err.response?.status === 403) {
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error("Failed to clear Supabase session:", signOutError);
          }
        }

        setErrorMsg(err.message || "Failed to complete Google authentication.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    };

    // Always register the listener so that cleanup always unsubscribes it.
    // This prevents listener leaks on unmount (e.g. StrictMode, early navigation).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, sessionState) => {
        if (sessionState?.access_token && isMounted) {
          await processSession(sessionState);
        }
      }
    );

    // Attempt immediate session retrieval. If a session is already present
    // (e.g. the OAuth redirect has been processed), processSession runs immediately.
    // If not, the onAuthStateChange listener above will catch it when it arrives.
    const processOAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session?.access_token && isMounted) {
          await processSession(data.session);
        }
        // If no session yet, the onAuthStateChange listener above will handle it.
      } catch (err) {
        // getSession() itself failed (network error, storage error, etc.)
        // processedRef may or may not be set — surface the error if not yet processed.
        if (!isMounted || processedRef.current) return;
        processedRef.current = true;

        setErrorMsg(err.message || "Failed to retrieve authentication session.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    };

    processOAuthCallback();

    // Cleanup: always unsubscribe the auth listener on unmount.
    // This runs regardless of which path was taken above.
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loginWithOAuthToken, navigate]);

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F7F5EE] flex flex-col justify-center items-center p-6 text-center">
      <div className="w-12 h-12 border-2 border-[#C9A227]/20 border-t-[#C9A227] rounded-full animate-spin mb-6" />
      <h2 className="font-display text-xl tracking-[0.2em] uppercase text-[#F7F5EE]">
        {errorMsg ? "Authentication Error" : "Synchronizing Sanctuary Session"}
      </h2>
      <p className="font-body text-xs text-[#F7F5EE]/60 mt-2 max-w-sm">
        {errorMsg ? errorMsg : "Please wait while we verify your Google credentials with the AVELIS digital codex..."}
      </p>
    </div>
  );
};

export default AuthCallbackPage;
