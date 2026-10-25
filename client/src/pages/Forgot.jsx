import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import Field from "../components/Field.jsx";
import { forgotRequest, resetRequest } from "../api.js";
import { validateEmail, validatePassword } from "../utils.js";

export default function Forgot() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = ask email, 2 = enter code + new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [shake, setShake] = useState(0);

  const emailErr = validateEmail(email);
  const codeErr = /^\d{6}$/.test(code) ? "" : "Enter the 6-digit code.";
  const pwErr = validatePassword(password);

  const bad = (err) => {
    setServerError(err.response?.data?.message || "Can't reach the server. Is the backend running?");
    setShake((n) => n + 1);
  };

  const sendCode = async (e) => {
    e.preventDefault();
    setTouched(true);
    setServerError("");
    if (emailErr) return setShake((n) => n + 1);
    setLoading(true);
    try {
      const { data } = await forgotRequest(email.trim());
      setDemoCode(data.demoCode);
      setTouched(false);
      setStep(2);
    } catch (err) {
      bad(err);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setTouched(true);
    setServerError("");
    if (codeErr || pwErr) return setShake((n) => n + 1);
    setLoading(true);
    try {
      await resetRequest(email.trim(), code, password);
      navigate("/", { state: { notice: "Password updated. Sign in with your new password.", email: email.trim() } });
    } catch (err) {
      bad(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div key={shake} className={`card ${shake ? "shake" : ""}`}>
        <header>
          <span className="eyebrow">Step {step} of 2</span>
          <h2>{step === 1 ? <>Forgot your <em>password?</em></> : <>Set a <em>new password</em></>}</h2>
          <p>
            {step === 1
              ? "Enter your email and we'll generate a reset code."
              : "Enter the code below and choose a new password."}
          </p>
        </header>

        {step === 1 ? (
          <form onSubmit={sendCode} noValidate>
            <Field id="email" label="Email address" type="email" autoComplete="email" value={email}
              onChange={(e) => { setServerError(""); setEmail(e.target.value); }}
              onBlur={() => setTouched(true)} error={touched && emailErr} />
            {serverError && <div className="alert" role="alert">{serverError}</div>}
            <button className="cta" type="submit" disabled={loading}>
              {loading ? (<><span className="spinner" /> Sending…</>) : "Send reset code"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} noValidate>
            <div className="demo-inbox">
              <small>Demo inbox · no real email is sent</small>
              <strong>{demoCode}</strong>
            </div>
            <Field id="code" label="6-digit code" inputMode="numeric" maxLength={6} value={code}
              onChange={(e) => { setServerError(""); setCode(e.target.value.replace(/\D/g, "")); }}
              onBlur={() => setTouched(true)} error={touched && codeErr} />
            <Field id="password" label="New password" password autoComplete="new-password" value={password}
              onChange={(e) => { setServerError(""); setPassword(e.target.value); }}
              onBlur={() => setTouched(true)} error={touched && pwErr} />
            {serverError && <div className="alert" role="alert">{serverError}</div>}
            <button className="cta" type="submit" disabled={loading}>
              {loading ? (<><span className="spinner" /> Updating…</>) : "Update password"}
            </button>
          </form>
        )}

        <p className="foot">
          Remembered it? <Link to="/">Back to sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
