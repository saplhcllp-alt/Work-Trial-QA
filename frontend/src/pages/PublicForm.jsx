import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";

// Client-facing fields per engagement type.
const FIELDS = {
  Audit: [
    ["entity_overview", "Describe the entities to be audited"],
    ["prior_auditor", "Prior auditor (if any)"],
    ["key_risks", "Key risk areas / concerns"],
    ["timeline", "Expected timeline"],
  ],
  Tax: [
    ["business_overview", "Business overview"],
    ["jurisdictions", "Where do you operate / file?"],
    ["pain_points", "Current tax pain points"],
    ["timeline", "Expected timeline"],
  ],
  Accounting: [
    ["business_overview", "Business overview"],
    ["current_system", "Current accounting system"],
    ["volume", "Monthly transaction volume"],
    ["timeline", "Expected timeline"],
  ],
};

export default function PublicForm() {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);
  const [contact, setContact] = useState({ name: "", email: "" });
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .publicForm(token)
      .then(setMeta)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div className="card error">{error}</div>;
  if (!meta) return <div className="card muted">Loading…</div>;

  const fields = FIELDS[meta.project_type] || FIELDS.Audit;

  async function submit(e) {
    e.preventDefault();
    try {
      await api.submitForm(token, {
        contact_name: contact.name,
        contact_email: contact.email,
        answers,
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (done) {
    return (
      <div className="card narrow">
        <h1>Thank you</h1>
        <p>
          Your requirements for <b>{meta.title}</b> have been submitted to
          Harshwal &amp; Company LLP.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>{meta.title}</h1>
      <p className="muted">
        {meta.client_name} · {meta.project_type} engagement requirements
      </p>
      <form onSubmit={submit}>
        <div className="two-col">
          <label>
            Your name
            <input
              value={contact.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
          </label>
          <label>
            Your email
            <input
              value={contact.email}
              onChange={(e) =>
                setContact({ ...contact, email: e.target.value })
              }
            />
          </label>
        </div>
        {fields.map(([key, label]) => (
          <label key={key}>
            {label}
            <textarea
              rows={3}
              value={answers[key] || ""}
              onChange={(e) =>
                setAnswers({ ...answers, [key]: e.target.value })
              }
            />
          </label>
        ))}
        <button className="primary">Submit requirements</button>
      </form>
    </div>
  );
}
