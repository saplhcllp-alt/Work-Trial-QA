import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import TwoFactor from "./pages/TwoFactor.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BrdEditor from "./pages/BrdEditor.jsx";
import PublicForm from "./pages/PublicForm.jsx";
import { getToken, clearToken } from "./api.js";

function RequireAuth({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

function Shell({ children }) {
  const navigate = useNavigate();
  const authed = !!getToken();
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          Harshwal <span>BRD Portal</span>
        </Link>
        {authed && (
          <button
            className="link-btn"
            onClick={() => {
              clearToken();
              navigate("/login");
            }}
          >
            Sign out
          </button>
        )}
      </header>
      <main className="content">{children}</main>
      <footer className="foot">
        Internal tool · Harshwal &amp; Company LLP — QA Work Trial build
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/2fa" element={<TwoFactor />} />
        <Route path="/form/:token" element={<PublicForm />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/brd/:id"
          element={
            <RequireAuth>
              <BrdEditor />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
