import React, { createContext, useState, useContext, useEffect } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  logout: () => void;

  // 🔑 New (non-breaking) additions
  token: string | null;
  setToken: (value: string | null) => void;
  blacklistToken: (token: string) => void;
  isTokenBlacklisted: (token: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [blacklist, setBlacklist] = useState<string[]>([]);

  // ✅ Load login state from localStorage on first render
  useEffect(() => {
    const storedLogin = localStorage.getItem("isLoggedIn");
    const storedToken = localStorage.getItem("token");
    const storedBlacklist = localStorage.getItem("blacklist");

    if (storedLogin === "true") setIsLoggedIn(true);
    if (storedToken) setToken(storedToken);
    if (storedBlacklist) setBlacklist(JSON.parse(storedBlacklist));
  }, []);

  // ✅ Save login state
  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn.toString());
  }, [isLoggedIn]);

  // ✅ Save token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // ✅ Save blacklist
  useEffect(() => {
    localStorage.setItem("blacklist", JSON.stringify(blacklist));
  }, [blacklist]);

  // ✅ Logout helper (backward compatible)
  const logout = () => {
    if (token) {
      setBlacklist((prev) => [...prev, token]); // blacklist token
    }
    setToken(null);
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
  };

  // ✅ Extra helpers (new, optional)
  const blacklistToken = (badToken: string) => {
    setBlacklist((prev) => [...prev, badToken]);
  };

  const isTokenBlacklisted = (checkToken: string) => {
    return blacklist.includes(checkToken);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        logout,
        token,
        setToken,
        blacklistToken,
        isTokenBlacklisted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
