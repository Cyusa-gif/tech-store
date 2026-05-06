import { defineStore } from "pinia";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  registered: Record<string, { password: string; name: string }>;
}

const STORAGE_KEY = "kts.auth.v1";
const REG_KEY = "kts.users.v1";

function loadState(): AuthState {
  let user: User | null = null;
  let token: string | null = null;
  let registered: Record<string, { password: string; name: string }> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      user = parsed.user ?? null;
      token = parsed.token ?? null;
    }
  } catch {}
  try {
    const raw = localStorage.getItem(REG_KEY);
    if (raw) registered = JSON.parse(raw);
  } catch {}
  return { user, token, registered };
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => loadState(),
  getters: {
    isAuthenticated: (s): boolean => !!s.token && !!s.user,
    isAdmin: (s): boolean => s.user?.email === "demo@kigali.rw",
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: this.user, token: this.token }),
        );
        localStorage.setItem(REG_KEY, JSON.stringify(this.registered));
      } catch {}
    },
    register(email: string, password: string, name: string): { ok: boolean; error?: string } {
      const key = email.trim().toLowerCase();
      if (!key || !password) return { ok: false, error: "Email and password are required" };
      if (this.registered[key]) return { ok: false, error: "An account with this email already exists" };
      this.registered[key] = { password, name: name || key.split("@")[0] };
      this.persist();
      return this.login(email, password);
    },
    login(email: string, password: string): { ok: boolean; error?: string } {
      const key = email.trim().toLowerCase();
      // Demo account auto-provisioned
      if (key === "demo@kigali.rw" && password === "demo1234" && !this.registered[key]) {
        this.registered[key] = { password: "demo1234", name: "Demo User" };
      }
      const rec = this.registered[key];
      if (!rec) return { ok: false, error: "No account found for that email" };
      if (rec.password !== password) return { ok: false, error: "Incorrect password" };
      this.user = { id: btoa(key).slice(0, 12), email: key, name: rec.name };
      this.token = "kts-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      this.persist();
      return { ok: true };
    },
    logout() {
      this.user = null;
      this.token = null;
      this.persist();
    },
  },
});
