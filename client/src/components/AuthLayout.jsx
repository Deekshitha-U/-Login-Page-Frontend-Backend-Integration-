import ThemeToggle from "./ThemeToggle.jsx";

export function Logo({ small = false }) {
  return (
    <div className={`logo ${small ? "small" : ""}`}>
      <svg viewBox="0 0 40 40" width={small ? 28 : 34} height={small ? 28 : 34} aria-hidden>
        <polygon points="20,4 36,34 4,34" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" />
        <line x1="20" y1="16" x2="28" y2="30" stroke="var(--sage)" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="16" x2="12" y2="30" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>Prismora</span>
    </div>
  );
}

const FEATURES = [
  ["01", "Boards that think", "Arrange ideas visually and watch patterns appear."],
  ["02", "Palettes with intent", "Colour systems that stay consistent across every project."],
  ["03", "Calm collaboration", "Share, comment and ship without the noise."],
];

export default function AuthLayout({ children }) {
  return (
    <main className="stage">
      <div className="glow g1" />
      <div className="glow g2" />

      <div className="shell">
        {/* ---------- brand side ---------- */}
        <section className="brand-panel">
          <Logo />

          <svg className="art" viewBox="0 0 420 300" fill="none" aria-hidden>
            <g className="rings" style={{ transformOrigin: "230px 150px" }}>
              <circle cx="230" cy="150" r="70" />
              <circle cx="230" cy="150" r="115" />
              <circle cx="230" cy="150" r="160" />
            </g>
            <line className="ray in" pathLength="1" x1="6" y1="166" x2="191" y2="148" />
            <polygon className="glass" pathLength="1" points="230,70 300,210 160,210" />
            <line className="ray s1" pathLength="1" x1="270" y1="150" x2="412" y2="62" stroke="#d68f8a" />
            <line className="ray s2" pathLength="1" x1="270" y1="150" x2="412" y2="104" stroke="#d9ae62" />
            <line className="ray s3" pathLength="1" x1="270" y1="150" x2="412" y2="146" stroke="#b8c97a" />
            <line className="ray s4" pathLength="1" x1="270" y1="150" x2="412" y2="188" stroke="#7fb3a6" />
            <line className="ray s5" pathLength="1" x1="270" y1="150" x2="412" y2="230" stroke="#8a9ad6" />
          </svg>

          <div className="brand-copy">
            <h1>
              Where ideas <em>refract</em> into something clear.
            </h1>
            <ul className="features">
              {FEATURES.map(([n, t, d]) => (
                <li key={n}>
                  <span>{n}</span>
                  <div>
                    <b>{t}</b>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- form side ---------- */}
        <section className="form-panel">
          <div className="topbar">
            <ThemeToggle />
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
