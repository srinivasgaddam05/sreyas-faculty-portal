"use client";

import { ChangeEvent, DragEvent, FormEvent, ReactNode, useMemo, useState } from "react";
import {
  Activity,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudUpload,
  FileText,
  FolderUp,
  LayoutDashboard,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

type View = "dashboard" | "chat" | "settings";
type DocumentStatus = "indexed" | "processing" | "queued";
type DocumentRow = { name: string; pages: string; chunks: string; status: DocumentStatus; updated: string };
type Source = { file: string; page: string; score: number; text: string };

const documents: DocumentRow[] = [
  { name: "Academic Regulations 2024-25.pdf", pages: "142 p", chunks: "318 chunks", status: "indexed", updated: "Jul 14, 2026" },
  { name: "Exam Postponement Circular - June.pdf", pages: "8 p", chunks: "24 chunks", status: "indexed", updated: "Jul 12, 2026" },
  { name: "Faculty Grievance Handbook v3.pdf", pages: "56 p", chunks: "104 chunks", status: "indexed", updated: "Jul 10, 2026" },
  { name: "Semester Calendar & Holidays.xlsx", pages: "4 p", chunks: "17 chunks", status: "indexed", updated: "Jul 09, 2026" },
  { name: "Lab Assessment Norms 2026.pdf", pages: "22 p", chunks: "-", status: "processing", updated: "Jul 16, 2026" },
  { name: "Research Ethics Policy.pdf", pages: "34 p", chunks: "-", status: "queued", updated: "-" },
];

const defaultSources: Source[] = [
  { file: "Exam Postponement Circular - June.pdf", page: "p. 3", score: 97, text: "...postponement may be declared by the Controller of Examinations with prior approval from the Academic Council. A minimum notice period of 72 hours must be maintained..." },
  { file: "Academic Regulations 2024-25.pdf", page: "p. 88", score: 91, text: "...rescheduled examinations shall be conducted within fourteen (14) working days of the original scheduled date..." },
  { file: "Academic Regulations 2024-25.pdf", page: "p. 89", score: 84, text: "...natural calamities affecting thirty percent or more of the enrolled student population qualify as force majeure events..." },
];

const acceptedFiles = ".pdf,.docx,.xlsx,.txt";

export function SreyasPortal() {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>SREYAS</strong>
            <small>FACULTY KNOWLEDGE PORTAL</small>
          </div>
        </div>
        <div className="side-label">Workspace</div>
        <nav className="nav" aria-label="Main navigation">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><LayoutDashboard /> Dashboard</button>
          <button className={view === "chat" ? "active" : ""} onClick={() => setView("chat")}><MessageSquare /> Chat Assistant</button>
          <button onClick={() => setView("dashboard")}><FolderUp /> Document Upload</button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}><Settings /> Settings</button>
        </nav>
        <div className="side-spacer" />
        <div className="db-widget">
          <div className="widget-title"><span className="live-dot" /> Knowledge base <Activity size={12} /></div>
          <div className="db-stats"><div><strong>463</strong><span>chunks</span></div><div><strong>5</strong><span>documents indexed</span></div></div>
        </div>
        <div className="profile"><div className="avatar">PS</div><div><strong>Dr. Priya Sharma</strong><small>CSE Department</small></div><ChevronRight size={15} color="#92aea1" /></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span className="crumb">SREYAS / Faculty workspace</span>
          <div className="top-status"><span className="top-live-dot" /> System operational</div>
          <div className="top-tabs">
            <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>01 Dashboard</button>
            <button className={view === "chat" ? "active" : ""} onClick={() => setView("chat")}>02 Chat</button>
          </div>
        </header>
        {view === "dashboard" ? <Dashboard onOpenChat={() => setView("chat")} /> : view === "chat" ? <Chat /> : <SettingsPanel />}
      </main>
    </div>
  );
}

function Dashboard({ onOpenChat }: { onOpenChat: () => void }) {
  const [filter, setFilter] = useState("");
  const [progress, setProgress] = useState(68);
  const [uploadName, setUploadName] = useState("Lab Assessment Norms 2026.pdf");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("PDF, DOCX, XLSX or TXT up to 50 MB");
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [notice, setNotice] = useState("");
  const filteredDocuments = useMemo(() => documents.filter((document) => document.name.toLowerCase().includes(filter.toLowerCase())), [filter]);

  const processFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setNotice("This file is larger than 50 MB."); return; }
    if (!acceptedFiles.split(",").some((extension) => file.name.toLowerCase().endsWith(extension))) { setNotice("Choose a PDF, DOCX, XLSX, or TXT file."); return; }
    setUploadName(file.name);
    setUploadNotice(`${file.name} added to the ingestion queue`);
    setProgress(18);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/ingest", { method: "POST", body: formData });
      if (response.ok) window.setTimeout(() => setProgress(68), 500);
      else setNotice("We could not queue that file. Please try again.");
    } catch { setNotice("The upload service is unavailable. Please try again."); }
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => processFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); setIsDragging(false); processFile(event.dataTransfer.files?.[0]); };
  const rebuildIndex = () => { setIsRebuilding(true); setNotice("Index rebuild started."); window.setTimeout(() => { setIsRebuilding(false); setNotice("Index is up to date."); }, 1400); };

  return (
    <div className="content">
      <div className="page-intro">
        <div><p className="eyebrow"><Sparkles size={12} /> SREYAS knowledge base</p><h1>Institutional documents</h1><p className="intro-copy">One trusted home for the policies and knowledge behind every faculty answer.</p></div>
        <div className="actions"><button className="btn" onClick={rebuildIndex} disabled={isRebuilding}><RefreshCw className={isRebuilding ? "spin" : ""} size={15} /> {isRebuilding ? "Rebuilding..." : "Rebuild index"}</button><label className="btn btn-primary"><Upload size={15} /> Upload files<input type="file" hidden accept={acceptedFiles} onChange={handleUpload} /></label></div>
      </div>

      <div className="metrics">
        <Metric icon={<FileText />} label="Total documents" value="6" sub="4 PDF  •  1 XLSX  •  1 DOCX" />
        <Metric icon={<Activity />} label="Indexed chunks" value="463" sub="vector embeddings" />
        <Metric icon={<Clock3 />} label="Avg. query time" value="340ms" sub="last 7 days" />
        <Metric icon={<MessageSquare />} label="Queries served" value="1,284" sub="this month" />
      </div>

      <label className={`upload-box ${isDragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
        <div className="upload-icon"><CloudUpload /></div>
        <div className="upload-copy"><strong>{isDragging ? "Drop your document here" : "Add to the SREYAS knowledge base"}</strong><span>Drag and drop institutional files here, or browse from your computer.</span><small><ShieldCheck size={13} /> Files are processed securely within your workspace</small></div>
        <span className="btn upload-browse">Browse files<input type="file" hidden accept={acceptedFiles} onChange={handleUpload} /></span>
        <span className="upload-format">{uploadNotice}</span>
      </label>

      <div className="progress-section">
        <div className="progress-top"><div className="progress-file"><span className="file-icon-box"><FileText size={15} /></span><span><strong>{uploadName}</strong><small>Added today  •  22 pages</small></span></div><span className="progress-status">{progress}% <span>processing</span></span></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        <div className="progress-meta"><span>Step 3 of 4  •  generating embeddings</span><span>~45s remaining</span></div>
      </div>

      <div className="section-heading"><div><p className="section-kicker">Knowledge library</p><h2>Indexed sources <span className="muted">({filteredDocuments.length})</span></h2></div><label className="search"><Search /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter documents..." aria-label="Filter documents" /></label></div>
      <div className="table-wrap"><table><thead><tr><th>Document</th><th>Pages</th><th>Chunks</th><th>Status</th><th>Updated</th></tr></thead><tbody>{filteredDocuments.map((document) => <tr key={document.name}><td><span className="doc-name"><FileText className="file-icon" />{document.name}</span></td><td className="muted">{document.pages}</td><td className="muted">{document.chunks}</td><td><span className={`status ${document.status}`}>{document.status}</span></td><td className="muted">{document.updated}</td></tr>)}</tbody></table></div>
      <div className="dashboard-footnote"><span><Check size={14} /> Knowledge base ready for questions</span><button className="text-button" onClick={onOpenChat}>Open chat assistant <ChevronRight size={14} /></button></div>
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
    </div>
  );
}

function Metric({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return <div className="metric"><div className="metric-top"><span className="metric-icon">{icon}</span><div className="metric-label">{label}</div><CheckCircle2 className="metric-check" /></div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div>;
}

function SettingsPanel() {
  const [grounding, setGrounding] = useState(true);
  const [strictAnswers, setStrictAnswers] = useState(true);
  const [autoIndex, setAutoIndex] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveSettings = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); };

  return (
    <div className="content settings-content">
      <div className="page-intro"><div><p className="eyebrow"><Settings size={12} /> Workspace settings</p><h1>Make SREYAS yours</h1><p className="intro-copy">Control how your knowledge base is indexed and how the assistant responds.</p></div><button className="btn btn-primary" onClick={saveSettings}><Check size={15} /> Save changes</button></div>
      <div className="settings-grid">
        <section className="settings-card"><div className="settings-card-heading"><div><p className="section-kicker">Assistant behavior</p><h2>Answer preferences</h2></div><div className="settings-card-icon"><Sparkles size={17} /></div></div><SettingToggle label="Ground answers in documents" description="Only use passages retrieved from the SREYAS knowledge base." checked={grounding} onChange={setGrounding} /><SettingToggle label="Strict source matching" description="Say when a question cannot be answered from indexed material." checked={strictAnswers} onChange={setStrictAnswers} /><SettingToggle label="Auto-index new uploads" description="Start processing accepted files as soon as they arrive." checked={autoIndex} onChange={setAutoIndex} /></section>
        <section className="settings-card"><div className="settings-card-heading"><div><p className="section-kicker">Knowledge base</p><h2>Index configuration</h2></div><div className="settings-card-icon"><Activity size={17} /></div></div><label className="select-field"><span>Retrieval depth</span><select defaultValue="3"><option value="3">Top 3 source passages</option><option value="5">Top 5 source passages</option><option value="8">Top 8 source passages</option></select></label><label className="select-field"><span>Chunk size</span><select defaultValue="500"><option value="500">500 characters</option><option value="750">750 characters</option><option value="1000">1,000 characters</option></select></label><div className="settings-note"><ShieldCheck size={15} /><span><strong>Workspace protected</strong><small>Your settings apply to this faculty workspace only.</small></span></div></section>
      </div>
      {saved && <div className="toast" role="status">Settings saved <Check size={14} /></div>}
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="setting-row"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="toggle-track"><span className="toggle-thumb" /></span></label>;
}

function Chat() {
  const [selectedSource, setSelectedSource] = useState(0);
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("What are the exam postponement guidelines for this semester?");
  const [liveSources, setLiveSources] = useState(defaultSources);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion) return;
    setAskedQuestion(nextQuestion);
    setQuestion("");
    setIsSending(true);
    setChatError("");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: nextQuestion }) });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json() as { sources?: Array<{ document: string; page: number; similarity: number; snippet: string }> };
      if (data.sources) setLiveSources(data.sources.map((source) => ({ file: source.document, page: `p. ${source.page}`, score: Math.round(source.similarity * 100), text: source.snippet })));
    } catch { setChatError("The assistant could not connect. Your question is ready to resend."); }
    finally { setIsSending(false); }
  };

  return (
    <div className="content">
      <div className="page-intro"><div><p className="eyebrow"><Sparkles size={12} /> SREYAS assistant</p><h1>Ask the institution</h1><p className="intro-copy">Search across indexed SREYAS policies and academic documents.</p></div><button className="btn" onClick={() => setShowHelp(true)}><CircleHelp size={15} /> Help</button></div>
      <div className="chat-layout">
        <section className="chat-panel"><div className="chat-header"><div><h2>Chat Assistant</h2><p>RAG  •  5 documents  •  463 chunks</p></div><span className="model-badge">● Model active</span></div><div className="chat-stream"><div className="message user"><div className="bubble">{askedQuestion}</div><div className="message-time">10:42 AM</div></div><div className="message"><div className="ai-card"><p>Based on the indexed institutional regulations, an exam may be postponed under these circumstances:</p><ol><li>Natural calamities or declared public emergencies affecting 30% or more of enrolled students.</li><li>Faculty union-declared academic disruptions approved by the Academic Council.</li><li>Administrative exigencies approved by the Controller of Examinations with at least 72 hours notice.</li></ol><p className="ai-footnote">Rescheduled exams must be conducted within 14 working days. Departments must notify students through the official portal within 6 hours of a postponement decision.</p><div className="message-time">10:42 AM  •  2 sources retrieved</div></div></div></div><div className="chat-composer"><form className="composer-form" onSubmit={submit}><span className="composer-attachment"><Paperclip size={15} /></span><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about regulations, circulars, exam schedules..." aria-label="Ask a question" disabled={isSending} /><button className="send-btn" aria-label="Send question" disabled={isSending}>{isSending ? <span className="send-spinner" /> : <Send />}</button></form><div className="grounding-note">Answers grounded in indexed institutional documents only</div>{chatError && <div className="chat-error" role="alert">{chatError}</div>}</div></section>
        <aside className="sources-panel"><div className="sources-header"><h2>Retrieved context & sources</h2><p>Vector similarity  •  top-3 chunks</p></div><div className="source-list">{liveSources.map((source, index) => <article key={source.file + source.page} className={`source-card ${selectedSource === index ? "selected" : ""}`} onClick={() => setSelectedSource(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedSource(index); }} role="button" tabIndex={0}><div className="source-file">{source.file}</div><div className="source-meta"><span>{source.page}</span><span className="similarity">{source.score}% match</span></div><div className="similarity-track"><div className="similarity-fill" style={{ width: `${source.score}%` }} /></div><p className="source-snippet">{source.text}</p></article>)}</div><div className="legend"><div className="legend-title">Confidence legend</div><div className="legend-row"><span className="legend-line" /> &gt; 90% High relevance</div><div className="legend-row"><span className="legend-line" style={{ opacity: .65 }} /> 80-90% Supporting context</div></div></aside>
      </div>
      {showHelp && <div className="modal-backdrop" role="presentation" onClick={() => setShowHelp(false)}><div className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="section-kicker">SREYAS assistant</p><h2 id="help-title">How to get a grounded answer</h2></div><button className="icon-button" onClick={() => setShowHelp(false)} aria-label="Close help">×</button></div><p>Ask about policies, regulations, circulars, schedules, and faculty procedures. Answers are generated from indexed institutional documents and include the source passages used.</p><button className="btn btn-primary" onClick={() => setShowHelp(false)}>Got it</button></div></div>}
    </div>
  );
}
