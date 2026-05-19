import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { setAuthTokenGetter } from "@workspace/api-client-react";

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

type JwtPayload = {
  exp?: number;
  role?: string | string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[];
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function isJwtExpired(token: string): boolean {
  const decoded = decodeJwtPayload(token);
  if (!decoded?.exp) {
    return true;
  }

  return decoded.exp * 1000 <= Date.now();
}

function hasAdminRole(token: string): boolean {
  const decoded = decodeJwtPayload(token);
  if (!decoded) {
    return false;
  }

  const role = decoded.role ?? decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  if (Array.isArray(role)) {
    return role.includes("Admin");
  }

  return role === "Admin";
}

function removeStoredAdminToken(): void {
  localStorage.removeItem("admin_token");
}

export function isValidAdminToken(token: string): boolean {
  if (isJwtExpired(token)) {
    return false;
  }

  return hasAdminRole(token);
}

function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("admin_token");
  if (!token) {
    return null;
  }

  if (!isValidAdminToken(token)) {
    removeStoredAdminToken();
    return null;
  }

  return token;
}

setAuthTokenGetter(getStoredAdminToken);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getStoredAdminToken);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(getStoredAdminToken);
  }, []);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("admin_token", newToken);
    } else {
      removeStoredAdminToken();
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
    setLocation("/admin/login");
  };

  return <AuthContext.Provider value={{ token, setToken, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
