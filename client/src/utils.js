export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email) {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(email.trim())) return "That email doesn't look right.";
  return "";
}

export function validatePassword(pw) {
  if (!pw) return "Password is required.";
  if (pw.length < 6) return "Use at least 6 characters.";
  return "";
}

export function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 9) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}

export const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Excellent"];

export const formatDate = (iso, fallback = "—") =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : fallback;
