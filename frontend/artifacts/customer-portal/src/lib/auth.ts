import { useEffect, useState } from "react";

const AUTH_STORAGE_KEY = "autoparts_auth_session";
const AUTH_EVENT = "autoparts-auth-change";

function readAuthState(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY) === "active";
  } catch {
    return false;
  }
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function signIn() {
  window.localStorage.setItem(AUTH_STORAGE_KEY, "active");
  notifyAuthChange();
}

export function signOut() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthChange();
}

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(readAuthState);

  useEffect(() => {
    const syncAuthState = () => setIsAuthenticated(readAuthState());

    window.addEventListener(AUTH_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(AUTH_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  return isAuthenticated;
}
