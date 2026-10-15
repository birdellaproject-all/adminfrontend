import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, Fingerprint, Network, LaptopMinimal,
  Mail, KeyRound, Eye, EyeOff, LogIn, Workflow,
} from "lucide-react";
import "./Login.css";

/* ---- HARDCODED API URL (no .env, no proxy) ---- */
const API_BASE_URL = "http://192.168.1.6:4000";

const STORAGE_KEYS = ["bmtAdminToken", "bmtEmployeeToken", "bmtRole", "bmtAuthUser"];

const features = [
  { icon: ShieldCheck, label: "Least-privilege access" },
  { icon: Fingerprint, label: "Multi-factor verification" },
  { icon: Network, label: "Assigned operations only" },
  { icon: LaptopMinimal, label: "Session & device controls" },
];

function savedEmployee() {
  if (
    localStorage.getItem("bmtRole") === "employee" &&
    localStorage.getItem("bmtEmployeeToken")
  ) {
    try {
      return JSON.parse(localStorage.getItem("bmtAuthUser") || "null");
    } catch {
      return null;
    }
  }
  return null;
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [employee, setEmployee] = useState(savedEmployee);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const url = `${API_BASE_URL}/auth/login`;
    console.log("[LOGIN] hitting:", url);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.error?.message ||
            result.message ||
            "Login failed. Please check your credentials."
        );
      }

      const { accessToken, user } = result.data || {};
      if (!accessToken || !user) {
        throw new Error("The server did not return a token and user profile.");
      }

      STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));

      const isAdmin = (user.roles || []).some((r) => r.name === "Admin");

      if (isAdmin) {
        localStorage.setItem("bmtAdminToken", accessToken);
        localStorage.setItem("bmtRole", "admin");
      } else {
        localStorage.setItem("bmtEmployeeToken", accessToken);
        localStorage.setItem("bmtRole", "employee");
      }
      localStorage.setItem("bmtAuthUser", JSON.stringify(user));

      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        setEmployee(user);
        setPassword("");
        setLoading(false);
      }
    } catch (err) {
      console.error("[LOGIN ERROR]", err);
      setError(err.message || "Unable to connect to the backend.");
      setLoading(false);
    }
  }

  async function handleEmployeeLogout() {
    const token = localStorage.getItem("bmtEmployeeToken");
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore */
    }
    STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    setEmployee(null);
    setEmail("");
    setError("");
    setNotice("");
  }

  function handleForgotPassword() {
    setError("");
    setNotice("Password recovery is not available yet. Please contact your administrator.");
  }

  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <div className="brand-mark">B</div>
            <div className="brand-name">
              <span>BirdMyTrip</span>
              <small>ADMINISTRATION</small>
            </div>
          </div>

          <div className="brand-message">
            <span className="enterprise-badge">ENTERPRISE OPERATIONS</span>
            <h1>
              Right employee.<br />
              Right work.<br />
              Right access.
            </h1>
            <p className="brand-description">
              Every session is scoped by department, operational assignment,
              vertical, market, branch, queue and approval authority.
            </p>
          </div>

          <div className="security-features">
            {features.map(({ icon: Icon, label }) => (
              <div className="security-feature" key={label}>
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <footer className="brand-footer">
            © 2026 Birdella International Private Limited · BirdMyTrip
          </footer>
        </div>
      </section>

      <section className="form-panel">
        {employee ? (
          <div className="login-form-container">
            <div className="form-heading">
              <p className="eyebrow">SECURE EMPLOYEE ACCESS</p>
              <h2>Welcome, {employee.name}</h2>
              <p className="form-description">
                You are signed in as an employee. Your employee workspace is not
                available yet.
              </p>
            </div>

            <div className="form-message success-message" role="status">
              Signed in as {employee.email}
            </div>

            <button className="submit-button" type="button" onClick={handleEmployeeLogout}>
              <LogIn size={17} />
              <span>Sign out</span>
            </button>
          </div>
        ) : (
          <div className="login-form-container">
            <div className="form-heading">
              <p className="eyebrow">SECURE EMPLOYEE ACCESS</p>
              <h2>Sign in to your operation</h2>
              <p className="form-description">
                Your dashboard and navigation are created from your live work assignment.
              </p>
            </div>

            <div className="return-notice">
              <Workflow size={16} strokeWidth={1.8} />
              <span>After sign-in, you go to your <strong>workspace</strong></span>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <label htmlFor="email">Work email</label>
              <div className="input-wrap">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@birdmytrip.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <button className="text-link" type="button" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>

              <div className="input-wrap">
                <KeyRound className="input-icon" size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {error && <div className="form-message error-message" role="alert">{error}</div>}
              {notice && <div className="form-message success-message" role="status">{notice}</div>}

              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? (
                  <span className="loading-indicator" />
                ) : (
                  <>
                    <LogIn size={17} />
                    <span>Continue securely</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}