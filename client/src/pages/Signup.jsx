import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/Field.jsx";
import { signupRequest } from "../api.js";
import { validateEmail, validatePassword, strength, STRENGTH_LABELS } from "../utils.js";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [shake, setShake] = useState(0);

  const errors = useMemo(() => {
    const e = {
      name: form.name.trim().length < 2 ? "Please enter your name." : "",
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: form.confirm !== form.password ? "Passwords don't match." : "",
    };
    if (!form.confirm) e.confirm = "Please confirm your password.";
    return e;
  }, [form]);
  const hasErrors = Object.values(errors).some(Boolean);
  const score = strength(form.password);

  const onChange = (e) => {
    setServerError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const onBlur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (hasErrors) return setShake((n) => n + 1);

    setLoading(true);
    try {
      await signupRequest(form.name.trim(), form.email.trim(), form.password);
      navigate("/", {
        state: { notice: "Account created. Sign in to continue.", email: form.email.trim() },
      });
    } catch (err) {
      setServerError(err.response?.data?.message || "Can't reach the server. Is the backend running?");
      setShake((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div key={shake} className={`card ${shake ? "shake" : ""}`}>
        <header>
          <span className="eyebrow">Join Prismora</span>
          <h2>Create your <em>account</em></h2>
          <p>It takes less than a minute.</p>
        </header>

        <form onSubmit={onSubmit} noValidate>
          <Field id="name" label="Full name" autoComplete="name" value={form.name} onChange={onChange} onBlur={onBlur} error={touched.name && errors.name} />
          <Field id="email" label="Email address" type="email" autoComplete="email" value={form.email} onChange={onChange} onBlur={onBlur} error={touched.email && errors.email} />
          <Field id="password" label="Password" password autoComplete="new-password" value={form.password} onChange={onChange} onBlur={onBlur} error={touched.password && errors.password} />

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

          <Field id="confirm" label="Confirm password" password autoComplete="new-password" value={form.confirm} onChange={onChange} onBlur={onBlur} error={touched.confirm && errors.confirm} />

          {serverError && <div className="alert" role="alert">{serverError}</div>}

          <button className="cta" type="submit" disabled={loading}>
            {loading ? (<><span className="spinner" /> Creating…</>) : "Create account"}
          </button>
        </form>

        <p className="foot">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
