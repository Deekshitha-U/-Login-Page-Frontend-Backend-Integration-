import { useState } from "react";

export default function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  password = false,
  inputMode,
  maxLength,
}) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);

  return (
    <div className={`field ${error ? "invalid" : ""}`}>
      <input
        id={id}
        name={id}
        type={password && show ? "text" : type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder=" "
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyUp={password ? (e) => setCaps(e.getModifierState("CapsLock")) : undefined}
      />
      <label htmlFor={id}>{label}</label>
      {password && (
        <button type="button" className="eye" onClick={() => setShow((s) => !s)}>
          {show ? "Hide" : "Show"}
        </button>
      )}
      {error && <small className="err">{error}</small>}
      {password && caps && !error && <small className="hint">Caps Lock is on</small>}
    </div>
  );
}
