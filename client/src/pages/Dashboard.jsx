import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meRequest, logoutRequest, getToken, getCachedUser, clearSession } from "../api.js";
import { Logo } from "../components/AuthLayout.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { formatDate } from "../utils.js";

const STATS = [
  { label: "Active projects", value: "24", delta: "+4 this week" },
  { label: "Saved palettes", value: "132", delta: "+18 this week" },
  { label: "Collaborators", value: "9", delta: "2 online now" },
  { label: "Inspirations", value: "4.8k", delta: "+12% growth" },
];
const BARS = [38, 62, 45, 80, 58, 92, 70];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACTIVITY = [
  ["Kian", "added a palette to", "Sunset Poster", "2m"],
  ["Mira", "commented on", "Brand Refresh", "18m"],
  ["You", "published", "Neon Moodboard", "1h"],
  ["Zed", "joined", "Studio Crew", "3h"],
];

const timeLeft = (ms) => {
  if (ms <= 0) return "expired";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCachedUser);
  const [expiresAt, setExpiresAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const kickOut = () => {
    clearSession();
    navigate("/", { replace: true, state: { notice: "Your session ended. Please sign in again." } });
  };

  useEffect(() => {
    meRequest(getToken())
      .then(({ data }) => {
        setUser(data.user);
        setExpiresAt(data.expiresAt);
      })
      .catch(kickOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const logout = async () => {
    try {
      await logoutRequest(getToken());
    } catch {
      /* ignore */
    }
    clearSession();
    navigate("/", { replace: true, state: { notice: "You've been signed out." } });
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = user?.name?.split(" ")[0] || "there";
  const leftMs = expiresAt ? expiresAt - now : null;
  const max = Math.max(...BARS);

  return (
    <main className="stage dash-stage">
      <div className="glow g1" />
      <div className="glow g2" />

      <div className="dash">
        <nav className="dash-nav">
          <Logo small />
          <div className="nav-right">
            <ThemeToggle />
            <div className="avatar">{user?.name?.[0] || "P"}</div>
            <div className="who">
              <b>{user?.name}</b>
              <small>{user?.role}</small>
            </div>
            <button className="logout" onClick={logout}>Sign out</button>
          </div>
        </nav>

        <header className="hero">
          <span className="eyebrow">Dashboard preview</span>
          <h1>{greet}, <em>{first}</em>.</h1>
          <p>Here's a quick look at how your studio is doing today.</p>
        </header>

        <section className="stats">
          {STATS.map((s, i) => (
            <article key={s.label} className="stat" style={{ animationDelay: `${i * 80}ms` }}>
              <small>{s.label}</small>
              <strong>{s.value}</strong>
              <em>{s.delta}</em>
            </article>
          ))}
        </section>

        <section className="grid">
          <article className="panel">
            <h3>Weekly creative flow</h3>
            <div className="chart">
              {BARS.map((h, i) => (
                <div key={DAYS[i]} className="col">
                  <div className={`bar ${h === max ? "peak" : ""}`} style={{ "--h": `${h}%`, "--d": `${i * 70}ms` }}>
                    <span>{h}</span>
                  </div>
                  <small>{DAYS[i]}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Your session</h3>
            <dl className="details">
              <div><dt>Email</dt><dd>{user?.email}</dd></div>
              <div><dt>Role</dt><dd>{user?.role}</dd></div>
              <div><dt>Member since</dt><dd>{formatDate(user?.createdAt)}</dd></div>
              <div><dt>Previous sign-in</dt><dd>{formatDate(user?.prevLogin, "First visit")}</dd></div>
              <div><dt>Session expires in</dt><dd className="mono">{leftMs === null ? "…" : timeLeft(leftMs)}</dd></div>
            </dl>
          </article>

          <article className="panel wide">
            <h3>Recent activity</h3>
            <ul className="feed">
              {ACTIVITY.map(([who, what, where, t]) => (
                <li key={where}>
                  <span className="dot" />
                  <p><b>{who}</b> {what} <u>{where}</u></p>
                  <time>{t}</time>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
