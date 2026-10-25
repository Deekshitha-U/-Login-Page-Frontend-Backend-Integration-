import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/Field.jsx";
import { loginRequest, saveSession } from "../api.js";
import { validateEmail, validatePassword, strength, STRENGTH_LABELS } from "../utils.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice || "";

  const [form, setForm] = useState({ email: location.state?.email || "", password: "" });
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [lock, setLock] = useState(0); // seconds left after too many attempts
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(0);

  const errors = useMemo(
    () => ({ email: validateEmail(form.email), password: validatePassword(form.password) }),
    [form]
  );
  const hasErrors = Boolean(errors.email || errors.password);
  const score = strength(form.password);

  // lockout countdown
  useEffect(() => {
    if (lock <= 0) return;
    const t = setTimeout(() => setLock((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [lock]);

  const onChange = (e) => {
    setServerError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const fillDemo = () => {
    setServerError("");
    setForm({ email: "demo@prismora.com", password: "Prism@123" });
    setTouched({});
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setServerError("");
    if (hasErrors) return setShake((n) => n + 1);

    setLoading(true);
    try {
      const { data } = await loginRequest(form.email.trim(), form.password);
      saveSession(data.token, data.user, remember);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1300);
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 429) setLock(data.retryAfter || 30);
      else
        setServerError(data?.message || "Can't reach the server. Is the backend running on port 5000?");
      setShake((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div key={shake} className={`card ${shake ? "shake" : ""}`}>
        {success ? (
          <div className="success">
            <svg viewBox="0 0 52 52" width="72" height="72">
              <circle className="c" cx="26" cy="26" r="23" fill="none" />
              <path className="t" fill="none" d="M14 27l8 8 16-17" />
            </svg>
            <h2>Signed in</h2>
            <p>Preparing your workspace…</p>
            <div className="progress"><i /></div>
          </div>
        ) : (
          <>
            <header>
              <span className="eyebrow">Welcome back</span>
              <h2>Sign in to <em>Prismora</em></h2>
              <p>Pick up right where you left off.</p>
            </header>

            {notice && <div className="notice">{notice}</div>}

            <form onSubmit={onSubmit} noValidate>
              <Field
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={onChange}
                onBlur={onBlur}
                error={touched.email && errors.email}
              />
              <Field
                id="password"
                label="Password"
                password
                autoComplete="current-password"
                value={form.password}
                onChange={onChange}
                onBlur={onBlur}
                error={touched.password && errors.password}
              />

              {form.password && (
                <div className="meter" data-score={score}>
                  <div className="segs">
                    {[0, 1, 2, 3].map((i) => (
                      <i key={i} className={i < score ? "on" : ""} />
                    ))}
                  </div>
                  <span>{STRENGTH_LABELS[score]}</span>
                </div>
              )}

              <div className="row">
                <label className="check">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="box" />
                  Keep me signed in
                </label>
                <Link to="/forgot">Forgot password?</Link>
              </div>

              {lock > 0 && (
                <div className="alert" role="alert">
                  Too many attempts. Try again in <b>{lock}s</b>.
                </div>
              )}
              {serverError && !lock && (
                <div className="alert" role="alert">
                  {serverError}
                </div>
              )}

              <button className="cta" type="submit" disabled={loading || lock > 0}>
                {loading ? (
                  <>
                    <span className="spinner" /> Signing in…
                  </>
                ) : lock > 0 ? (
                  `Locked · ${lock}s`
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <button type="button" className="ghost" onClick={fillDemo}>
              Use demo credentials
            </button>

            <p className="foot">
              New to Prismora? <Link to="/signup">Create an account</Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
