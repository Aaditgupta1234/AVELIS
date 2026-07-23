import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../constants/storage.js";
import { loginUser, registerUser, getMe, oauthUser } from "../services/auth.service.js";
import { apiClient } from "../api/client.js";
import { normalizeError } from "../utils/error.js";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(undefined);

// SVG monogram fallback generator matching the premium brand design
const createDefaultAvatar = (name) => {
  const initial = name ? name.charAt(0).toUpperCase() : "M";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="#0D1626"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="#C9A227" stroke-width="1.5" opacity="0.4"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Cinzel, serif" font-size="36" font-weight="bold" fill="#C9A227">${initial}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: true,
    isLoading: false,
    error: null,
  });

  // Race-free logout utility (clears Supabase session first, then application state & storage)
  // useCallback([]) — closes over: supabase (module-level), localStorage (global), setAuthState (stable setter)
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}

    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem("avelis_custom_avatar");
    localStorage.removeItem("avelis_biography");

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Restores user session on reload (source of truth check)
  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
      setAuthState((prev) => ({ ...prev, isInitializing: false }));
      return;
    }

    const restoreSession = async () => {
      try {
        const backendUser = await getMe({ signal: controller.signal });
        
        // Merge DB profile with local avatar/bio fallbacks
        const mergedUser = {
          ...backendUser,
          avatar: backendUser.avatarUrl || localStorage.getItem("avelis_custom_avatar") || createDefaultAvatar(backendUser.name),
          biography: localStorage.getItem("avelis_biography") || "",
          memberSince: new Date(backendUser.createdAt || Date.now()).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
          }),
        };

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mergedUser));

        setAuthState({
          user: mergedUser,
          token,
          isAuthenticated: true,
          isInitializing: false,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }
        logout();
      }
    };

    restoreSession();

    return () => {
      controller.abort();
    };
  }, []);

  // Multi-tab logout synchronization listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.TOKEN && !e.newValue) {
        logout();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // useCallback([]) — closes over: setAuthState (stable setter), loginUser (imported), normalizeError (imported), localStorage (global)
  const login = useCallback(async (email, password) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await loginUser({ email, password });
      
      const token = data.token;
      const backendUser = data.user;

      const mergedUser = {
        ...backendUser,
        avatar: backendUser.avatarUrl || localStorage.getItem("avelis_custom_avatar") || createDefaultAvatar(backendUser.name),
        biography: localStorage.getItem("avelis_biography") || "",
        memberSince: new Date(backendUser.createdAt || Date.now()).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        }),
      };

      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mergedUser));

      setAuthState({
        user: mergedUser,
        token,
        isAuthenticated: true,
        isInitializing: false,
        isLoading: false,
        error: null,
      });

      return { user: mergedUser, token };
    } catch (err) {
      const normalized = normalizeError(err);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, []);

  // useCallback([]) — closes over: supabase (module-level), setAuthState (stable setter), normalizeError (imported)
  const loginWithGoogle = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const redirectUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } catch (err) {
      const normalized = normalizeError(err);
      setAuthState((prev) => ({ ...prev, isLoading: false, error: normalized }));
      throw normalized;
    }
  }, []);

  // useCallback([]) — closes over: setAuthState (stable setter), oauthUser (imported), normalizeError (imported), localStorage (global)
  const loginWithOAuthToken = useCallback(async (supabaseAccessToken) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await oauthUser({ token: supabaseAccessToken });
      const token = data.token;
      const backendUser = data.user;

      const mergedUser = {
        ...backendUser,
        avatar: backendUser.avatarUrl || localStorage.getItem("avelis_custom_avatar") || createDefaultAvatar(backendUser.name),
        biography: localStorage.getItem("avelis_biography") || "",
        memberSince: new Date(backendUser.createdAt || Date.now()).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        }),
      };

      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mergedUser));

      setAuthState({
        user: mergedUser,
        token,
        isAuthenticated: true,
        isInitializing: false,
        isLoading: false,
        error: null,
      });

      return { user: mergedUser, token };
    } catch (err) {
      const normalized = normalizeError(err);
      setAuthState((prev) => ({ ...prev, isLoading: false, error: normalized }));
      throw normalized;
    }
  }, []);

  // useCallback([login]) — closes over: setAuthState (stable setter), registerUser (imported), normalizeError (imported), login (stable via useCallback)
  const register = useCallback(async (name, email, password) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await registerUser({ name, email, password });
      return await login(email, password);
    } catch (err) {
      const normalized = normalizeError(err);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: normalized,
      }));
      throw normalized;
    }
  }, [login]);

  const updateProfile = async (name, biography) => {
    if (!authState.user) return;
    try {
      const response = await apiClient.patch("/users/me", { username: name });
      const updatedBackendUser = response.data.data;

      localStorage.setItem("avelis_biography", biography || "");

      const updatedUser = {
        ...authState.user,
        name: updatedBackendUser.username,
        biography: biography || "",
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setAuthState((prev) => ({ ...prev, user: updatedUser }));
    } catch (err) {
      throw normalizeError(err);
    }
  };

  const updateAvatar = async (dataUrl) => {
    if (!authState.user) return;
    localStorage.setItem("avelis_custom_avatar", dataUrl);
    const updatedUser = {
      ...authState.user,
      avatar: dataUrl,
      avatarUrl: dataUrl,
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  const resetAvatar = async () => {
    if (!authState.user) return;
    localStorage.removeItem("avelis_custom_avatar");
    const updatedUser = {
      ...authState.user,
      avatar: createDefaultAvatar(authState.user.name),
      avatarUrl: null,
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        isInitializing: authState.isInitializing,
        isLoading: authState.isLoading,
        error: authState.error,
        login,
        loginWithGoogle,
        loginWithOAuthToken,
        register,
        logout,
        updateProfile,
        updateAvatar,
        resetAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
