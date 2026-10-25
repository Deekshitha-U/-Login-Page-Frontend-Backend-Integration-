import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "users.json");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true }));
app.use(express.json());

/* ============================================================
   Tiny JSON-file "database" (users survive server restarts)
   Passwords are salted + hashed with scrypt, never stored raw.
   ============================================================ */
const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString("hex"),
});

const verifyPassword = (password, user) => {
  const a = Buffer.from(crypto.scryptSync(password, user.salt, 64).toString("hex"));
  const b = Buffer.from(user.hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const seedUser = (id, name, email, password, role) => ({
  id,
  name,
  email,
  role,
  ...hashPassword(password),
  createdAt: new Date().toISOString(),
  lastLogin: null,
  prevLogin: null,
});

function loadUsers() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const seeded = [
      seedUser(1, "Aria Sol", "demo@prismora.com", "Prism@123", "Creative Director"),
      seedUser(2, "Kian Vale", "admin@prismora.com", "Admin@123", "Workspace Admin"),
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
const saveUsers = () => fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));

let users = loadUsers();

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
  lastLogin: u.lastLogin,
  prevLogin: u.prevLogin,
});

const findByEmail = (email) =>
  users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());

/* ---------- sessions (in memory, expire after 2 hours) ---------- */
const SESSION_MS = 2 * 60 * 60 * 1000;
const sessions = new Map(); // token -> { userId, expiresAt }

function authUser(req) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const s = sessions.get(token);
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  const user = users.find((u) => u.id === s.userId);
  return user ? { user, token, expiresAt: s.expiresAt } : null;
}

/* ---------- brute-force protection: 5 fails => 30s lock ---------- */
const MAX_FAILS = 5;
const LOCK_SECONDS = 30;
const attempts = new Map(); // email -> { fails, lockUntil }

const lockLeft = (email) => {
  const a = attempts.get(email);
  if (!a || !a.lockUntil) return 0;
  const left = Math.ceil((a.lockUntil - Date.now()) / 1000);
  if (left <= 0) {
    attempts.delete(email);
    return 0;
  }
  return left;
};
const registerFail = (email) => {
  const a = attempts.get(email) || { fails: 0, lockUntil: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) {
    a.fails = 0;
    a.lockUntil = Date.now() + LOCK_SECONDS * 1000;
  }
  attempts.set(email, a);
  return MAX_FAILS - a.fails;
};

/* ---------- password reset codes (6 digits, valid 5 minutes) ---------- */
const resetCodes = new Map(); // email -> { code, expiresAt }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

/* ============================== ROUTES ============================== */
app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "Prismora API" }));

// ---- LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return fail(res, 400, "Email and password are required.");
  if (!EMAIL_RE.test(String(email).trim())) return fail(res, 400, "Please enter a valid email address.");

  const key = String(email).trim().toLowerCase();
  const left = lockLeft(key);
  if (left > 0) {
    return fail(res, 429, `Too many attempts. Try again in ${left}s.`, { retryAfter: left });
  }

  const user = findByEmail(key);
  if (!user) {
    registerFail(key);
    return fail(res, 404, "No Prismora account found for this email.");
  }
  if (!verifyPassword(password, user)) {
    const remaining = registerFail(key);
    const lockedNow = lockLeft(key);
    if (lockedNow > 0) {
      return fail(res, 429, `Too many attempts. Try again in ${lockedNow}s.`, { retryAfter: lockedNow });
    }
    return fail(res, 401, `Incorrect password. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`);
  }

  attempts.delete(key);
  user.prevLogin = user.lastLogin;
  user.lastLogin = new Date().toISOString();
  saveUsers();

  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_MS });

  setTimeout(() => {
    res.json({ success: true, message: "Welcome back!", token, user: publicUser(user) });
  }, 600);
});

// ---- SIGN UP
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || String(name).trim().length < 2) return fail(res, 400, "Please enter your name.");
  if (!email || !EMAIL_RE.test(String(email).trim())) return fail(res, 400, "Please enter a valid email address.");
  if (!password || String(password).length < 6) return fail(res, 400, "Password must be at least 6 characters.");
  if (findByEmail(email)) return fail(res, 409, "An account with this email already exists.");

  const user = {
    id: users.reduce((m, u) => Math.max(m, u.id), 0) + 1,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    role: "Member",
    ...hashPassword(password),
    createdAt: new Date().toISOString(),
    lastLogin: null,
    prevLogin: null,
  };
  users.push(user);
  saveUsers();
  res.status(201).json({ success: true, message: "Account created. You can sign in now." });
});

// ---- FORGOT PASSWORD (no real email service, so the code is returned for the demo)
app.post("/api/forgot", (req, res) => {
  const { email } = req.body || {};
  if (!email || !EMAIL_RE.test(String(email).trim())) return fail(res, 400, "Please enter a valid email address.");
  const user = findByEmail(email);
  if (!user) return fail(res, 404, "No Prismora account found for this email.");

  const code = String(crypto.randomInt(100000, 999999));
  resetCodes.set(user.email.toLowerCase(), { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  res.json({
    success: true,
    message: "Reset code generated. It is valid for 5 minutes.",
    demoCode: code, // a real app would email this instead of returning it
  });
});

// ---- RESET PASSWORD
app.post("/api/reset", (req, res) => {
  const { email, code, password } = req.body || {};
  if (!email || !code || !password) return fail(res, 400, "Email, code and new password are required.");
  if (String(password).length < 6) return fail(res, 400, "Password must be at least 6 characters.");

  const key = String(email).trim().toLowerCase();
  const entry = resetCodes.get(key);
  const user = findByEmail(key);
  if (!entry || !user || entry.expiresAt < Date.now()) return fail(res, 400, "That code has expired. Request a new one.");
  if (entry.code !== String(code).trim()) return fail(res, 400, "Incorrect code. Please check and try again.");

  Object.assign(user, hashPassword(password));
  saveUsers();
  resetCodes.delete(key);
  attempts.delete(key);
  res.json({ success: true, message: "Password updated. Please sign in." });
});

// ---- CURRENT USER (protected)
app.get("/api/me", (req, res) => {
  const auth = authUser(req);
  if (!auth) return fail(res, 401, "Session expired.");
  res.json({ success: true, user: publicUser(auth.user), expiresAt: auth.expiresAt });
});

// ---- LOGOUT
app.post("/api/logout", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  sessions.delete(token);
  res.json({ success: true });
});
const DIST = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(DIST, "index.html")));
}
app.listen(PORT, () => console.log(`Prismora API running on http://localhost:${PORT}`));
