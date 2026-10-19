import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const TYPES = ["Audit", "Tax", "Accounting"];

export default function Dashboard() {
  const [brds, setBrds] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    client_name: "",
    project_type: "Audit",
    title: "",
  });

  async function load() {
    try {
      setBrds(await api.listBrds());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createBrd({ ...form, sections: {} });
      setForm({ client_name: "", project_type: "Audit", title: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Client BRDs</h2>
        {error && <div className="error">{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Client</th>
              <th>Type</th>
              <th>Title</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {brds.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.client_name}</td>
                <td>
                  <span className={`tag tag-${b.project_type}`}>
                    {b.project_type}
                  </span>
                </td>
                <td>{b.title}</td>
                <td>{b.status}</td>
                <td>
                  <Link className="link-btn" to={`/brd/${b.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {brds.length === 0 && (
              <tr>
                <td colSpan="6" className="muted">
                  No BRDs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>New BRD</h2>
        <form onSubmit={create}>
          <label>
            Client name
            <input
              value={form.client_name}
              onChange={(e) =>
                setForm({ ...form, client_name: e.target.value })
              }
            />
          </label>
          <label>
            Project type
            <select
              value={form.project_type}
              onChange={(e) =>
                setForm({ ...form, project_type: e.target.value })
              }
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <button className="primary">Create BRD</button>
        </form>
      </section>
    </div>
  );
}
