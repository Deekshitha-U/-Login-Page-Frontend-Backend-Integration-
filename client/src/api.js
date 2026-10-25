import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 8000,
});

/* ---------- API calls ---------- */
export const loginRequest = (email, password) => api.post("/login", { email, password });
export const signupRequest = (name, email, password) => api.post("/signup", { name, email, password });
export const forgotRequest = (email) => api.post("/forgot", { email });
export const resetRequest = (email, code, password) => api.post("/reset", { email, code, password });

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
export const meRequest = (token) => api.get("/me", authHeader(token));
export const logoutRequest = (token) => api.post("/logout", {}, authHeader(token));

/* ---------- session helpers ----------
   "Keep me signed in" -> localStorage (survives closing the browser)
   otherwise            -> sessionStorage (cleared when the tab closes) */
const TOKEN = "prismora_token";
const USER = "prismora_user";

export const getToken = () => localStorage.getItem(TOKEN) || sessionStorage.getItem(TOKEN);

export const getCachedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER) || sessionStorage.getItem(USER));
  } catch {
    return null;
  }
};

export const clearSession = () => {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN);
    s.removeItem(USER);
  });
};

export const saveSession = (token, user, remember) => {
  clearSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN, token);
  store.setItem(USER, JSON.stringify(user));
};

export default api;
