import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  name: string;
  email: string;
  avatar: string;
  role: string;
  provider: "email" | "google";
  biography?: string;
  memberSince?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, biography: string) => Promise<void>;
  updateAvatar: (dataUrl: string) => Promise<void>;
  resetAvatar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const deriveDisplayName = (email: string): string => {
  if (!email) return "Member";
  const part = email.split("@")[0];
  const nameParts = part.replace(/[._-]/g, " ").split(" ");
  const derived = nameParts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  return derived || "Member";
};

// SVG data URI for a premium monogram avatar (gold letter on dark background)
const createDefaultAvatar = (name: string) => {
  const initial = name.charAt(0).toUpperCase() || "M";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="#0D1626"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="#C9A227" stroke-width="1.5" opacity="0.4"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Cinzel, serif" font-size="36" font-weight="bold" fill="#C9A227">${initial}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("avelis_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("avelis_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const derivedName = deriveDisplayName(email);
    const now = new Date();
    const mockUser: User = {
      name: derivedName,
      email: email.toLowerCase(),
      avatar: createDefaultAvatar(derivedName),
      role: "member",
      provider: "email",
      biography: "",
      memberSince: now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      lastLogin: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    localStorage.setItem("avelis_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const name = "Demo User";
    const now = new Date();
    const mockUser: User = {
      name,
      email: "demo@avelis.app",
      avatar: createDefaultAvatar(name),
      role: "member",
      provider: "google",
      biography: "Avid reader. Seeker of ancient philosophy and modern sci-fi.",
      memberSince: now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      lastLogin: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    localStorage.setItem("avelis_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("avelis_user");
    setUser(null);
  };

  const updateProfile = async (name: string, biography: string) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      name,
      biography
    };
    localStorage.setItem("avelis_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const updateAvatar = async (dataUrl: string) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      avatar: dataUrl
    };
    localStorage.setItem("avelis_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const resetAvatar = async () => {
    if (!user) return;
    const updatedUser = {
      ...user,
      avatar: createDefaultAvatar(user.name)
    };
    localStorage.setItem("avelis_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithGoogle,
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
