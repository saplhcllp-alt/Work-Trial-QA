import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api.js";

export default function TwoFactor() {
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("pending_user");
  const devOtp = sessionStorage.getItem("dev_otp");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  if (!userId) {
    navigate("/login");
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.verify2fa(userId, otp);
      setToken(res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      sessionStorage.removeItem("pending_user");
      sessionStorage.removeItem("dev_otp");
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card narrow">
      <h1>Two-factor verification</h1>
      <p className="muted">Enter the 6-digit code we sent to your device.</p>
      <form onSubmit={onSubmit}>
        <label>
          One-time code
          <input
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="______"
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="primary">Verify</button>
      </form>
      {devOtp && (
        <div className="hint">
          Demo code (dev build): <code>{devOtp}</code>
        </div>
      )}
    </div>
  );
}
