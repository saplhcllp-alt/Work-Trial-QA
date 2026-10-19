import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, API_BASE } from "../api.js";

// Section templates per engagement type — this is the "multiple form sections".
const SECTION_TEMPLATES = {
  Audit: [
    ["scope", "Audit scope & entities"],
    ["standards", "Applicable standards (GAAS / ISA)"],
    ["period", "Reporting period"],
    ["stakeholders", "Key stakeholders"],
    ["risks", "Known risk areas"],
  ],
  Tax: [
    ["jurisdictions", "Tax jurisdictions"],
    ["entities", "Entities in scope"],
    ["filings", "Required filings"],
    ["stakeholders", "Key stakeholders"],
    ["deadlines", "Statutory deadlines"],
  ],
  Accounting: [
    ["scope", "Accounting scope"],
    ["systems", "Source systems / ERP"],
    ["frequency", "Close frequency"],
    ["stakeholders", "Key stakeholders"],
    ["deliverables", "Deliverables"],
  ],
};

export default function BrdEditor() {
  const { id } = useParams();
  const [brd, setBrd] = useState(null);
  const [sections, setSections] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [shareToken, setShareToken] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.getBrd(id);
      setBrd(data);
      setSections(data.sections || {});
      setSubmissions(await api.listSubmissions(id));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (error) return <div className="error card">{error}</div>;
  if (!brd) return <div className="card muted">Loading…</div>;

  const template = SECTION_TEMPLATES[brd.project_type] || SECTION_TEMPLATES.Audit;

  async function save() {
    setMsg("");
    try {
      await api.updateBrd(id, {
        title: brd.title,
        status: brd.status,
        sections,
      });
      setMsg("Saved.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function makeShareLink() {
    const res = await api.createShare(id);
    setShareToken(res.token);
  }

  const shareUrl = shareToken
    ? `${window.location.origin}/form/${shareToken}`
    : "";

  return (
    <div className="grid">
      <section className="card">
        <div className="row-between">
          <h2>
            {brd.client_name}{" "}
            <span className={`tag tag-${brd.project_type}`}>
              {brd.project_type}
            </span>
          </h2>
          <a className="link-btn" href={api.pdfUrl(id)}>
            Download PDF
          </a>
        </div>

        <label>
          Title
          <input
            value={brd.title}
            onChange={(e) => setBrd({ ...brd, title: e.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={brd.status}
            onChange={(e) => setBrd({ ...brd, status: e.target.value })}
          >
            <option>draft</option>
            <option>in_review</option>
            <option>final</option>
          </select>
        </label>

        <h3>Requirement sections</h3>
        {template.map(([key, label]) => (
          <label key={key}>
            {label}
            <textarea
              rows={2}
              value={sections[key] || ""}
              onChange={(e) =>
                setSections({ ...sections, [key]: e.target.value })
              }
            />
          </label>
        ))}

        {msg && <div className="ok">{msg}</div>}
        <button className="primary" onClick={save}>
          Save BRD
        </button>
      </section>

      <section className="card">
        <h2>Share with client</h2>
        <p className="muted">
          Generate a link and email it to the client. They fill in the business
          requirements for their {brd.project_type} engagement.
        </p>
        <button className="primary" onClick={makeShareLink}>
          Generate shareable link
        </button>
        {shareUrl && (
          <div className="share-box">
            <code>{shareUrl}</code>
          </div>
        )}

        <h3>Client submissions ({submissions.length})</h3>
        {submissions.map((s) => (
          <div className="submission" key={s.id}>
            <div className="sub-head">
              {/* VULNERABLE: client-supplied values rendered as raw HTML
                  (stored XSS sink). */}
              <strong
                dangerouslySetInnerHTML={{ __html: s.contact_name }}
              />{" "}
              <span className="muted">{s.contact_email}</span>
            </div>
            <ul>
              {Object.entries(s.answers || {}).map(([k, v]) => (
                <li key={k}>
                  <b>{k}:</b>{" "}
                  <span dangerouslySetInnerHTML={{ __html: String(v) }} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        {submissions.length === 0 && (
          <div className="muted">No submissions yet.</div>
        )}
      </section>
    </div>
  );
}
