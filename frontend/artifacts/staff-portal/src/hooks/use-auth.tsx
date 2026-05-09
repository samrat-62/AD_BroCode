import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Staff, StaffSession } from "@workspace/api-client-react";

interface AuthState {
  token: string | null;
  staff: Staff | null;
  login: (session: StaffSession) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      staff: null,
      login: (session) => set({ token: session.token, staff: session.staff }),
      logout: () => set({ token: null, staff: null }),
    }),
    {
      name: "staff_auth",
    }
  )
);
