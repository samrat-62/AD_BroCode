import { useEffect, useState } from "react";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

const AUTH_STORAGE_KEY = "autoparts_auth_session";
const AUTH_EVENT = "autoparts-auth-change";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5217";

type AuthSession = {
  token: string;
  fullName: string;
  email: string;
  role: string;
  expiresAtUtc: string;
};

type AuthResponse = AuthSession & {
  id: string;
  isActive: boolean;
  sessionId: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignUpInput = LoginInput & {
  fullName: string;
  phone: string;
};

setBaseUrl(API_BASE_URL);
setAuthTokenGetter(() => getAuthToken());

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as AuthSession;
    if (!session.token || session.role !== "Customer") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    if (Date.parse(session.expiresAtUtc) <= Date.now()) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function saveSession(response: AuthResponse) {
  if (response.role !== "Customer") {
    throw new Error("Customer access is required.");
  }

  const session: AuthSession = {
    token: response.token,
    fullName: response.fullName,
    email: response.email,
    role: response.role,
    expiresAtUtc: response.expiresAtUtc,
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notifyAuthChange();
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.title === "string") return data.title;
  } catch {
    // Fall through to the status-based message.
  }

  return `Request failed with status ${response.status}.`;
}

async function authRequest(path: string, body: LoginInput | SignUpInput): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<AuthResponse>;
}

export async function loginCustomer(input: LoginInput): Promise<void> {
  const response = await authRequest("/api/auth/login", input);
  saveSession(response);
}

export async function signUpCustomer(input: SignUpInput): Promise<void> {
  const response = await authRequest("/api/auth/signup", input);
  saveSession(response);
}

export function getAuthToken(): string | null {
  return readSession()?.token ?? null;
}

export function signOut() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthChange();
}

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => readSession() !== null);

  useEffect(() => {
    const syncAuthState = () => setIsAuthenticated(readSession() !== null);

    window.addEventListener(AUTH_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(AUTH_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  return isAuthenticated;
}
