import { useEffect, useRef, useState } from "react";
import {
  Search, ArrowRight, FlaskConical, Users, CalendarDays, Eye, Pencil, Lock, Trash2,
  CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";

/* ---------------- API ---------------- */

const API = "/api"; // proxied to FastAPI by vite.config.js

async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(API + path, { headers: { "Content-Type": "application/json" }, ...options });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const d = body?.detail;
    throw new Error(
      typeof d === "string" ? d
      : Array.isArray(d) ? d.map((e) => e.msg).join(", ")
      : res.status >= 500 ? "Server error. Is the backend running?"
      : `Request failed (${res.status})`
    );
  }
  return body;
}

// The backend returns keys like "Research Area " or "Opportunity ID  " - normalise them
const normalise = (raw) => {
  const o = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k.trim().toLowerCase().replace(/\s+/g, "_"), v])
  );
  return { ...o, id: o.id ?? o.opportunity_id };
};

/* ---------------- Helpers ---------------- */

const FIELDS = {
  title: "Title",
  description: "Description",
  research_area: "Research area",
  faculty_name: "Faculty member",
  department: "Department",
  required_skills: "Required skills",
  available_positions: "Available positions",
  application_deadline: "Application deadline",
};
const EMPTY = {
  title: "", description: "", research_area: "", faculty_name: "", department: "",
  required_skills: "", available_positions: "1", application_deadline: "",
};

const deadlineText = (d) => {
  const days = Math.ceil((new Date(d) - new Date()) / 864e5);
  return days < 0 ? "Deadline passed" : days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} left`;
};

/* ---------------- Small components ---------------- */

const Badge = ({ status }) => (
  <span className={`badge ${status === "Open" ? "badge-open" : "badge-closed"}`}>{status}</span>
);

const Chip = ({ icon: Icon, children }) => (
  <span className="chip"><Icon className="size-3.5" />{children}</span>
);

function Modal({ open, onClose, wide, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fade fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`fade w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl border border-white/20 bg-[#12423c]/85 p-7 shadow-2xl backdrop-blur-xl`}
      >
        {children}
      </div>
    </div>
  );
}

function OpportunityForm({ initial, saving, onSubmit, onCancel, submitLabel = "Save" }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const n = {};
    for (const k of Object.keys(FIELDS)) if (!String(v[k]).trim()) n[k] = `${FIELDS[k]} is required`;
    if (!n.available_positions && !(Number.isInteger(Number(v.available_positions)) && Number(v.available_positions) >= 1))
      n.available_positions = "Enter a whole number, 1 or more";
    setErrors(n);
    if (!Object.keys(n).length) onSubmit(v);
  }

  const field = (k, props = {}) => (
    <label key={k} className="block text-sm font-medium text-white/90">
      {FIELDS[k]}
      {k === "description" ? (
        <textarea rows={4} value={v[k]} onChange={set(k)} className={`input mt-1.5 ${errors[k] ? "input-bad" : ""}`} />
      ) : (
        <input value={v[k]} onChange={set(k)} className={`input mt-1.5 ${errors[k] ? "input-bad" : ""}`} {...props} />
      )}
      {errors[k] && <span className="mt-1 block text-xs font-normal text-[#ffb4ab]">{errors[k]}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {field("title", { maxLength: 200 })}
      {field("description")}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("research_area", { maxLength: 100 })}
        {field("faculty_name", { maxLength: 100 })}
        {field("department", { maxLength: 100 })}
        {field("required_skills", { maxLength: 300 })}
        {field("available_positions", { type: "number", min: 1 })}
        {field("application_deadline", { type: "date" })}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}{submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ---------------- App ---------------- */

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("home");
  const [searchId, setSearchId] = useState("");
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ open: false, editing: null });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const notify = (type, text) => {
    setToast({ type, text });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  };

  async function load() {
    setLoading(true);
    try {
      const body = await api("/opportunities");
      const key = Object.keys(body).find((k) => k.trim() === "Opportunities");
      setItems(key ? body[key] : []);
    } catch (e) {
      notify("error", e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (page === "all") load(); }, [page]);

  async function openById(id) {
    try {
      setViewing(normalise(await api(`/opportunities/${id}`)));
    } catch (e) {
      notify("error", /not found/i.test(e.message) ? `No opportunity found with ID ${id}` : e.message);
    }
  }

  function findById(e) {
    e.preventDefault();
    const id = searchId.trim();
    if (!/^\d+$/.test(id) || Number(id) < 1) return notify("error", "Enter a valid numeric ID");
    openById(id);
  }

  async function save(values) {
    const { editing } = form;
    const payload = {
      ...Object.fromEntries(Object.entries(values).map(([k, x]) => [k, String(x).trim()])),
      available_positions: Number(values.available_positions),
      status: editing ? editing.status : "Open",
    };
    setBusy(true);
    try {
      if (editing) {
        await api(`/opportunity/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        notify("success", "Opportunity updated successfully");
      } else {
        await api("/opportunities", { method: "POST", body: JSON.stringify(payload) });
        notify("success", "Opportunity created successfully");
      }
      setForm({ open: false, editing: null });
      if (editing) { await load(); } else { setPage("all"); }
    } catch (e) {
      notify("error", `${editing ? "Failed to update" : "Failed to create"}: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  // PUT needs every field, so send the full record with a new status
  async function closeOpportunity(o) {
    const rest = Object.fromEntries(Object.keys(FIELDS).map((k) => [k, o[k]]));
    try {
      await api(`/opportunity/${o.id}`, { method: "PUT", body: JSON.stringify({ ...rest, status: "Closed" }) });
      notify("success", "Opportunity closed");
      setViewing(null);
      await load();
    } catch (e) {
      notify("error", `Failed to close: ${e.message}`);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/opportunity/${deleting.id}`, { method: "DELETE" });
      notify("success", "Opportunity deleted");
      setDeleting(null);
      setViewing(null);
      await load();
    } catch (e) {
      notify("error", `Failed to delete: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  const editing = form.editing;
  const initial = editing
    ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, String(editing[k] ?? "").slice(0, k === "application_deadline" ? 10 : undefined)])) }
    : EMPTY;

  const go = (p) => { setPage(p); window.scrollTo(0, 0); };

  return (
    <>
      <div className="px-4 pt-5">
        <nav className="glass mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:px-6">
          <button onClick={() => go("home")} className="flex items-center gap-2.5 text-lg font-bold tracking-tight sm:text-xl">
            <span className="grid size-8 place-items-center rounded-full border border-white/30 bg-white/10">
              <Search className="size-4" />
            </span>
            YourResearch
          </button>
          <div className="flex rounded-full bg-white/10 p-1">
            {[["create", "Create Opportunities"], ["all", "Show all opportunities"]].map(([p, label]) => (
              <button key={p} className={`pill ${page === p ? "pill-on" : ""}`} onClick={() => go(p)}>{label}</button>
            ))}
          </div>
        </nav>
      </div>

      {page === "home" && (
        <main className="fade mx-auto flex max-w-4xl flex-col items-center px-6 pb-16 pt-12 text-center sm:pt-16">
          <p className="text-xs font-medium uppercase tracking-[.2em] text-white/70 sm:text-sm">YourResearch · Admin Panel</p>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            The admin panel for
            <span className="block italic">research opportunities.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-white/80">
            Create, find, update and delete research positions. Look anything up instantly by its ID.
          </p>
          <form onSubmit={findById} className="glass mt-7 flex w-full max-w-xl items-center gap-2 rounded-full p-2 pl-5">
            <Search className="size-5 shrink-0 text-white/70" />
            <input
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-white outline-none"
              placeholder="Search an opportunity by ID, e.g. 12"
              inputMode="numeric"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button className="btn btn-primary">Find<ArrowRight className="size-4" /></button>
          </form>
        </main>
      )}

      {page === "create" && (
        <main className="fade mx-auto max-w-2xl px-6 py-12">
          <h1 className="font-display text-5xl tracking-tight">Create <span className="italic">opportunity</span></h1>
          <p className="mb-8 mt-2 text-white/70">All fields are required.</p>
          <div className="glass rounded-2xl p-7">
            <OpportunityForm
              key="create"
              initial={EMPTY}
              saving={busy}
              submitLabel="Create opportunity"
              onSubmit={save}
              onCancel={() => go("home")}
            />
          </div>
        </main>
      )}

      {page === "all" && (
        <main className="fade mx-auto max-w-5xl px-6 py-12">
          <h1 className="font-display text-5xl tracking-tight">All <span className="italic">opportunities</span></h1>
          <p className="mb-8 mt-2 text-white/70">{items.length} total · each one has an ID you can search for on the home page.</p>
          {loading && !items.length ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-white/70">No opportunities yet. Create the first one.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {items.map((o) => (
                <article key={o.id} className="card fade">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium tracking-wide text-white/60">ID {o.id}</span>
                      <h2 className="text-lg font-semibold leading-snug tracking-tight">{o.title}</h2>
                    </div>
                    <Badge status={o.status} />
                  </div>
                  <p className="mt-1 text-sm text-white/65">{o.faculty_name} · {o.department}</p>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/85">{o.description}</p>
                  <div className="mb-5 mt-4 flex flex-wrap gap-2">
                    <Chip icon={FlaskConical}>{o.research_area}</Chip>
                    <Chip icon={Users}>{o.available_positions} {o.available_positions === 1 ? "position" : "positions"}</Chip>
                    <Chip icon={CalendarDays}>{o.status === "Open" ? deadlineText(o.application_deadline) : o.application_deadline}</Chip>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-white/15 pt-4">
                    <button className="btn btn-sm" onClick={() => openById(o.id)}><Eye className="size-4" />View</button>
                    <button className="btn btn-sm" onClick={() => setForm({ open: true, editing: o })}><Pencil className="size-4" />Update</button>
                    {o.status === "Open" && (
                      <button className="btn btn-sm" onClick={() => closeOpportunity(o)}><Lock className="size-4" />Close</button>
                    )}
                    <button className="btn btn-sm btn-danger ml-auto" onClick={() => setDeleting(o)}><Trash2 className="size-4" />Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Details */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} wide>
        {viewing && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-medium tracking-wide text-white/60">ID {viewing.id}</span>
                <h2 className="text-2xl font-semibold tracking-tight">{viewing.title}</h2>
              </div>
              <Badge status={viewing.status} />
            </div>
            <p className="mt-4 whitespace-pre-line leading-relaxed">{viewing.description}</p>
            <dl className="mt-6 grid gap-x-8 gap-y-5 border-t border-white/15 pt-6 text-sm sm:grid-cols-2">
              {[
                ["Research area", viewing.research_area],
                ["Faculty member", viewing.faculty_name],
                ["Department", viewing.department],
                ["Required skills", viewing.required_skills],
                ["Available positions", viewing.available_positions],
                ["Application deadline", viewing.application_deadline],
              ].map(([k, val]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wide text-white/55">{k}</dt>
                  <dd className="mt-0.5">{val ?? "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 flex flex-wrap gap-2">
              <button className="btn" onClick={() => { setForm({ open: true, editing: viewing }); setViewing(null); }}>
                <Pencil className="size-4" />Update
              </button>
              {viewing.status === "Open" && (
                <button className="btn" onClick={() => closeOpportunity(viewing)}><Lock className="size-4" />Close</button>
              )}
              <button className="btn btn-danger ml-auto" onClick={() => setDeleting(viewing)}><Trash2 className="size-4" />Delete</button>
            </div>
          </>
        )}
      </Modal>

      {/* Create / edit */}
      <Modal open={form.open} onClose={() => setForm({ open: false, editing: null })} wide>
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">
          Update opportunity {editing ? `#${editing.id}` : ""}
        </h2>
        <OpportunityForm
          key={editing?.id}
          initial={initial}
          saving={busy}
          onSubmit={save}
          onCancel={() => setForm({ open: false, editing: null })}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)}>
        <h2 className="text-lg font-semibold">Delete opportunity?</h2>
        <p className="mt-1.5 text-sm text-white/70">“{deleting?.title}” will be permanently deleted.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn btn-danger" disabled={busy} onClick={remove}>
            {busy && <Loader2 className="size-4 animate-spin" />}Delete
          </button>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fade fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success" ? "border-white/30 bg-white/15 text-white backdrop-blur-md" : "border-white bg-white text-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
          {toast.text}
        </div>
      )}
    </>
  );
}
