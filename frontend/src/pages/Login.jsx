import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@sample.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.login(email, password);
      // Carry the dev OTP forward so the trial is easy to demo.
      sessionStorage.setItem("pending_user", res.user_id);
      sessionStorage.setItem("dev_otp", res.dev_otp || "");
      navigate("/2fa");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card narrow">
      <h1>Sign in</h1>
      <p className="muted">Access the client BRD workspace.</p>
      <form onSubmit={onSubmit}>
        <label>
          Work email
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={busy}>
          {busy ? "Checking…" : "Continue"}
        </button>
      </form>
      <div className="hint">
        Demo users: <code>admin@sample.com / Sample@123</code> ·{" "}
        <code>consultant@sample.com / Welcome@1</code>
      </div>
    </div>
  );
}
