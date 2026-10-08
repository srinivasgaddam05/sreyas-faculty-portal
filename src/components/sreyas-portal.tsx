"use client";

import { ChangeEvent, DragEvent, FormEvent, ReactNode, useEffect, useMemo, useState, useRef } from "react";
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
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { DocumentRecord, DashboardMetrics, WorkspaceSettings, FacultyProfile } from "@/lib/types";

type View = "dashboard" | "chat" | "settings";
type Source = { file: string; page: string; score: number; text: string };
type MessageItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  sourcesCount?: number;
};

const acceptedFiles = ".pdf,.docx,.xlsx,.txt";

export function SreyasPortal() {
  const [view, setView] = useState<View>("dashboard");
  const [user, setUser] = useState<FacultyProfile>({
    uid: "rj9ALAIuApg8MhSedHdc1wm5CZn1",
    name: "Esvin Joshua",
    email: "joshua.esvin312@gmail.com",
    department: "Computer Science & Engineering",
    designation: "Professor & Lead Investigator",
    empId: "EMP-CSE-001",
    avatar: "EJ",
  });
  const [availableProfiles, setAvailableProfiles] = useState<FacultyProfile[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDocuments: 0,
    fileTypeBreakdown: { pdf: 0, xlsx: 0, docx: 0, txt: 0 },
    totalChunks: 0,
    avgQueryTimeMs: 0,
    queriesServedThisMonth: 0,
    lastUpdated: new Date().toISOString(),
  });

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.warn("Metrics fetch note:", err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/auth");
      if (res.ok) {
        const data = await res.json();
        if (data.profiles && data.profiles.length > 0) {
          setAvailableProfiles(data.profiles);
          const storedUid = typeof window !== "undefined" ? localStorage.getItem("sreyas_user_uid") : null;
          const matched = data.profiles.find((p: FacultyProfile) => p.uid === storedUid) || data.profiles[0];
          setUser(matched);
        }
      }
    } catch (err) {
      console.warn("Auth profiles fetch note:", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchProfiles();
  }, []);

  const switchProfile = (profile: FacultyProfile) => {
    setUser(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem("sreyas_user_uid", profile.uid);
    }
    setShowAuthModal(false);
  };

  const handleCustomLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customEmail.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          switchProfile(data.user);
          setCustomEmail("");
        }
      }
    } catch (err) {
      console.warn("Login error:", err);
    }
  };

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
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => setView("dashboard")}
          >
            <LayoutDashboard /> Dashboard
          </button>
          <button
            className={view === "chat" ? "active" : ""}
            onClick={() => setView("chat")}
          >
            <MessageSquare /> Chat Assistant
          </button>
          <button onClick={() => setView("dashboard")}>
            <FolderUp /> Document Upload
          </button>
          <button
            className={view === "settings" ? "active" : ""}
            onClick={() => setView("settings")}
          >
            <Settings /> Settings
          </button>
        </nav>
        <div className="side-spacer" />
        <div className="db-widget">
          <div className="widget-title">
            <span className="live-dot" /> Firestore Live <Activity size={12} />
          </div>
          <div className="db-stats">
            <div>
              <strong>{metrics.totalChunks}</strong>
              <span>chunks</span>
            </div>
            <div>
              <strong>{metrics.totalDocuments}</strong>
              <span>documents</span>
            </div>
          </div>
        </div>

        {/* Profile Card / Auth Trigger */}
        <div
          className="profile profile-clickable"
          onClick={() => setShowAuthModal(true)}
          role="button"
          tabIndex={0}
          title="Click to switch faculty account"
        >
          <div className="avatar">{user.avatar || "FA"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </strong>
            <small style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
              {user.empId} • {user.department.replace("Engineering", "Engg")}
            </small>
          </div>
          <ChevronRight size={15} color="#92aea1" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span className="crumb">
            SREYAS / {user.department} / {user.name}
          </span>
          <div className="top-status">
            <span className="top-live-dot" /> Authenticated ({user.empId})
          </div>
          <div className="top-tabs">
            <button
              className={view === "dashboard" ? "active" : ""}
              onClick={() => setView("dashboard")}
            >
              01 Dashboard
            </button>
            <button
              className={view === "chat" ? "active" : ""}
              onClick={() => setView("chat")}
            >
              02 Chat
            </button>
          </div>
        </header>

        {view === "dashboard" ? (
          <Dashboard
            metrics={metrics}
            onOpenChat={() => setView("chat")}
            onRefreshMetrics={fetchMetrics}
          />
        ) : view === "chat" ? (
          <Chat onRefreshMetrics={fetchMetrics} />
        ) : (
          <SettingsPanel />
        )}
      </main>

      {/* Faculty Authentication Modal */}
      {showAuthModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="section-kicker">Faculty Authentication</p>
                <h2 id="auth-title">Switch Faculty Account</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowAuthModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <p style={{ color: "#6d7d76", fontSize: 13, margin: "10px 0 16px" }}>
              Select a verified faculty member from the SREYAS Firestore directory:
            </p>

            <div className="auth-profiles-list">
              {availableProfiles.map((p) => (
                <div
                  key={p.uid}
                  className={`auth-profile-item ${user.uid === p.uid ? "active" : ""}`}
                  onClick={() => switchProfile(p)}
                >
                  <div className="avatar">{p.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>{p.name}</strong>
                      {user.uid === p.uid && <UserCheck size={14} color="#17845b" />}
                    </div>
                    <div style={{ color: "#748680", fontSize: 11, marginTop: 2 }}>
                      {p.designation} • {p.department}
                    </div>
                    <div style={{ color: "#8a9792", fontSize: 10, marginTop: 1 }}>
                      {p.email} • {p.empId}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="auth-divider">or sign in with another institutional email</div>

            <form onSubmit={handleCustomLogin}>
              <div className="auth-input-group">
                <label>Faculty Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. name@sreyas.ac.in"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Sign In as Faculty
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({
  metrics,
  onOpenChat,
  onRefreshMetrics,
}: {
  metrics: DashboardMetrics;
  onOpenChat: () => void;
  onRefreshMetrics: () => void;
}) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [filter, setFilter] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadStep, setUploadStep] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("PDF, DOCX, XLSX or TXT up to 50 MB");
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [notice, setNotice] = useState("");

  const fetchDocs = async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.warn("Docs fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) =>
        doc.name.toLowerCase().includes(filter.toLowerCase())
      ),
    [documents, filter]
  );

  const processFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setNotice("This file is larger than 50 MB.");
      return;
    }
    if (
      !acceptedFiles
        .split(",")
        .some((extension) => file.name.toLowerCase().endsWith(extension))
    ) {
      setNotice("Choose a PDF, DOCX, XLSX, or TXT file.");
      return;
    }

    setUploadName(file.name);
    setUploadNotice(`${file.name} uploading to Firebase Storage`);
    setIsUploading(true);
    setProgress(20);
    setUploadStep("Step 1 of 4  •  uploading file to Firebase Storage");

    const formData = new FormData();
    formData.append("file", file);

    const stepTimer1 = window.setTimeout(() => {
      setProgress(50);
      setUploadStep("Step 2 of 4  •  extracting text and structure");
    }, 400);

    const stepTimer2 = window.setTimeout(() => {
      setProgress(80);
      setUploadStep("Step 3 of 4  •  generating Gemini embeddings & chunking");
    }, 900);

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (response.ok) {
        setProgress(100);
        setUploadStep("Step 4 of 4  •  saved in Firestore");
        setNotice(`${file.name} successfully indexed.`);
        await fetchDocs();
        onRefreshMetrics();
        window.setTimeout(() => setIsUploading(false), 2000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setNotice(errData.error || "Failed to process file.");
        setIsUploading(false);
      }
    } catch {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setNotice("The upload service is unavailable. Please try again.");
      setIsUploading(false);
    }
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its chunks from Firestore & Storage?`)) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotice(`Deleted "${name}".`);
        await fetchDocs();
        onRefreshMetrics();
      }
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  const rebuildIndex = async () => {
    setIsRebuilding(true);
    setNotice("Index rebuild started...");
    try {
      const res = await fetch("/api/index/rebuild", { method: "POST" });
      if (res.ok) {
        await fetchDocs();
        onRefreshMetrics();
        setNotice("Index rebuilt successfully.");
      } else {
        setNotice("Failed to rebuild index.");
      }
    } catch {
      setNotice("Rebuild service unavailable.");
    } finally {
      setIsRebuilding(false);
    }
  };

  const subBreakdown = `${metrics.fileTypeBreakdown.pdf} PDF  •  ${metrics.fileTypeBreakdown.xlsx} XLSX  •  ${metrics.fileTypeBreakdown.docx} DOCX`;

  return (
    <div className="content">
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            <Sparkles size={12} /> SREYAS knowledge base
          </p>
          <h1>Institutional documents</h1>
          <p className="intro-copy">
            One trusted home for the policies and knowledge behind every faculty answer.
          </p>
        </div>
        <div className="actions">
          <button className="btn" onClick={rebuildIndex} disabled={isRebuilding}>
            <RefreshCw className={isRebuilding ? "spin" : ""} size={15} />{" "}
            {isRebuilding ? "Rebuilding..." : "Rebuild index"}
          </button>
          <label className="btn btn-primary">
            <Upload size={15} /> Upload files
            <input type="file" hidden accept={acceptedFiles} onChange={handleUpload} />
          </label>
        </div>
      </div>

      <div className="metrics">
        <Metric
          icon={<FileText />}
          label="Total documents"
          value={String(metrics.totalDocuments)}
          sub={subBreakdown}
        />
        <Metric
          icon={<Activity />}
          label="Indexed chunks"
          value={String(metrics.totalChunks)}
          sub="vector embeddings"
        />
        <Metric
          icon={<Clock3 />}
          label="Avg. query time"
          value={metrics.avgQueryTimeMs > 0 ? `${metrics.avgQueryTimeMs}ms` : "-"}
          sub="last 7 days"
        />
        <Metric
          icon={<MessageSquare />}
          label="Queries served"
          value={String(metrics.queriesServedThisMonth)}
          sub="this month"
        />
      </div>

      <label
        className={`upload-box ${isDragging ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">
          <CloudUpload />
        </div>
        <div className="upload-copy">
          <strong>
            {isDragging ? "Drop your document here" : "Add to the SREYAS knowledge base"}
          </strong>
          <span>
            Drag and drop institutional files here, or browse from your computer.
          </span>
          <small>
            <ShieldCheck size={13} /> Files are uploaded directly to Firebase Storage and indexed with Gemini
          </small>
        </div>
        <span className="btn upload-browse">
          Browse files
          <input type="file" hidden accept={acceptedFiles} onChange={handleUpload} />
        </span>
        <span className="upload-format">{uploadNotice}</span>
      </label>

      {isUploading && (
        <div className="progress-section">
          <div className="progress-top">
            <div className="progress-file">
              <span className="file-icon-box">
                <FileText size={15} />
              </span>
              <span>
                <strong>{uploadName}</strong>
                <small>Processing institutional document</small>
              </span>
            </div>
            <span className="progress-status">
              {progress}% <span>processing</span>
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-meta">
            <span>{uploadStep}</span>
            <span>~10s remaining</span>
          </div>
        </div>
      )}

      <div className="section-heading">
        <div>
          <p className="section-kicker">Knowledge library</p>
          <h2>
            Indexed sources <span className="muted">({filteredDocuments.length})</span>
          </h2>
        </div>
        <label className="search">
          <Search />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter documents..."
            aria-label="Filter documents"
          />
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Pages</th>
              <th>Chunks</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "#8a9491" }}>
                  No institutional documents uploaded yet. Upload your first PDF, DOCX, XLSX, or TXT file above.
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr key={doc.id || doc.name}>
                  <td>
                    <span className="doc-name">
                      <FileText className="file-icon" />
                      {doc.name}
                    </span>
                  </td>
                  <td className="muted">{doc.pagesCount ? `${doc.pagesCount} p` : "-"}</td>
                  <td className="muted">
                    {doc.chunksCount ? `${doc.chunksCount} chunks` : "-"}
                  </td>
                  <td>
                    <span className={`status ${doc.status}`}>{doc.status}</span>
                  </td>
                  <td className="muted">{doc.updatedAt || doc.createdAt}</td>
                  <td>
                    <button
                      className="del-btn"
                      onClick={() => handleDelete(doc.id, doc.name)}
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="dashboard-footnote">
        <span>
          <Check size={14} /> Knowledge base ready for questions
        </span>
        <button className="text-button" onClick={onOpenChat}>
          Open chat assistant <ChevronRight size={14} />
        </button>
      </div>

      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span className="metric-icon">{icon}</span>
        <div className="metric-label">{label}</div>
        <CheckCircle2 className="metric-check" />
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState<WorkspaceSettings>({
    grounding: true,
    strictAnswers: true,
    autoIndex: true,
    retrievalDepth: 3,
    chunkSize: 500,
    updatedAt: "",
  });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.grounding !== undefined) setSettings(data);
      })
      .catch(console.warn);
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
      }
    } catch (err) {
      console.warn("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="content settings-content">
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            <Settings size={12} /> Workspace settings
          </p>
          <h1>Make SREYAS yours</h1>
          <p className="intro-copy">
            Control how your knowledge base is indexed and how the assistant responds.
          </p>
        </div>
        <button className="btn btn-primary" onClick={saveSettings} disabled={isSaving}>
          <Check size={15} /> {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-heading">
            <div>
              <p className="section-kicker">Assistant behavior</p>
              <h2>Answer preferences</h2>
            </div>
            <div className="settings-card-icon">
              <Sparkles size={17} />
            </div>
          </div>
          <SettingToggle
            label="Ground answers in documents"
            description="Only use passages retrieved from the SREYAS knowledge base."
            checked={settings.grounding}
            onChange={(val) => setSettings({ ...settings, grounding: val })}
          />
          <SettingToggle
            label="Strict source matching"
            description="Say when a question cannot be answered from indexed material."
            checked={settings.strictAnswers}
            onChange={(val) => setSettings({ ...settings, strictAnswers: val })}
          />
          <SettingToggle
            label="Auto-index new uploads"
            description="Start processing accepted files as soon as they arrive."
            checked={settings.autoIndex}
            onChange={(val) => setSettings({ ...settings, autoIndex: val })}
          />
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div>
              <p className="section-kicker">Knowledge base</p>
              <h2>Index configuration</h2>
            </div>
            <div className="settings-card-icon">
              <Activity size={17} />
            </div>
          </div>
          <label className="select-field">
            <span>Retrieval depth</span>
            <select
              value={String(settings.retrievalDepth)}
              onChange={(e) =>
                setSettings({ ...settings, retrievalDepth: Number(e.target.value) })
              }
            >
              <option value="3">Top 3 source passages</option>
              <option value="5">Top 5 source passages</option>
              <option value="8">Top 8 source passages</option>
            </select>
          </label>
          <label className="select-field">
            <span>Chunk size</span>
            <select
              value={String(settings.chunkSize)}
              onChange={(e) =>
                setSettings({ ...settings, chunkSize: Number(e.target.value) })
              }
            >
              <option value="500">500 characters</option>
              <option value="750">750 characters</option>
              <option value="1000">1,000 characters</option>
            </select>
          </label>
          <div className="settings-note">
            <ShieldCheck size={15} />
            <span>
              <strong>Workspace protected</strong>
              <small>Your settings apply to this faculty workspace only.</small>
            </span>
          </div>
        </section>
      </div>

      {saved && (
        <div className="toast" role="status">
          Settings saved <Check size={14} />
        </div>
      )}
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
    </label>
  );
}

function Chat({ onRefreshMetrics }: { onRefreshMetrics: () => void }) {
  const chatStreamRef = useRef<HTMLDivElement>(null);
  const [selectedSource, setSelectedSource] = useState(0);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "m_welcome",
      role: "assistant",
      content:
        "Welcome to the SREYAS Faculty Knowledge Assistant.\n\nUpload institutional documents in the Dashboard to begin. When you ask questions here, the assistant will search your uploaded documents and generate grounded answers using Gemini AI.",
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [liveSources, setLiveSources] = useState<Source[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("chatMessages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) setMessages(parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [messages, isSending]);


  const formatCurrentTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSend = async (queryText: string) => {
    const nextQuestion = queryText.trim();
    if (!nextQuestion || isSending) return;

    const timeStr = formatCurrentTime();
    const userMsg: MessageItem = {
      id: `u_${Date.now()}`,
      role: "user",
      content: nextQuestion,
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setIsSending(true);
    setChatError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: nextQuestion }),
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      const sources: Source[] = (data.sources || []).map((s: any) => ({
        file: s.document,
        page: typeof s.page === "number" ? `p. ${s.page}` : String(s.page),
        score: Math.round((s.similarity || 0) * 100),
        text: s.snippet,
      }));

      setLiveSources(sources);
      setSelectedSource(0);

      const aiMsg: MessageItem = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: data.answer || "No response could be generated.",
        time: formatCurrentTime(),
        sourcesCount: sources.length,
      };

      setMessages((prev) => [...prev, aiMsg]);
      onRefreshMetrics();
    } catch {
      setChatError("The assistant could not connect. Your question is ready to resend.");
    } finally {
      setIsSending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    handleSend(question);
  };

  return (
    <div className="content chat-view-content">
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            <Sparkles size={12} /> SREYAS assistant
          </p>
          <h1>Ask the institution</h1>
          <p className="intro-copy">
            Search across indexed SREYAS policies, handbooks, and academic documents.
          </p>
        </div>
        <button className="btn" onClick={() => setShowHelp(true)}>
          <CircleHelp size={15} /> Help
        </button>
      </div>

      <div className="chat-layout">
        <section className="chat-panel">
          <div className="chat-header">
            <div>
              <h2>Chat Assistant</h2>
              <p>RAG • Firestore Vector Retrieval • Gemini 3.8 Flash</p>
            </div>
            <span className="model-badge">● Model active</span>
          </div>

          <div className="chat-stream" ref={chatStreamRef}>
            {messages.map((msg) =>
              msg.role === "user" ? (
                <div key={msg.id} className="message user">
                  <div className="bubble">{msg.content}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              ) : (
                <div key={msg.id} className="message">
                  <div className="ai-card">
                    {msg.content.split("\n\n").map((para, pIdx) => {
                      if (para.match(/^\d\./m)) {
                        const items = para.split("\n");
                        return (
                          <ol key={pIdx}>
                            {items.map((item, iIdx) => (
                              <li key={iIdx}>{item.replace(/^\d+\.\s*/, "")}</li>
                            ))}
                          </ol>
                        );
                      }
                      return <p key={pIdx}>{para}</p>;
                    })}
                    <div className="message-time">
                      {msg.time}
                      {msg.sourcesCount !== undefined &&
                        ` • ${msg.sourcesCount} sources retrieved from Firestore`}
                    </div>
                  </div>
                </div>
              )
            )}
            {isSending && (
              <div className="message">
                <div className="ai-card">
                  <p>Searching Firestore knowledge base and generating grounded answer with Gemini...</p>
                </div>
              </div>
            )}
          </div>

          <div className="chat-composer">
            <form className="composer-form" onSubmit={submit}>
              <span className="composer-attachment">
                <Paperclip size={15} />
              </span>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about regulations, circulars, exam schedules, leaves..."
                aria-label="Ask a question"
                disabled={isSending}
              />
              <button className="send-btn" aria-label="Send question" disabled={isSending}>
                {isSending ? <span className="send-spinner" /> : <Send />}
              </button>
            </form>
            <div className="grounding-note">
              Answers grounded in indexed institutional documents only
            </div>
            {chatError && (
              <div className="chat-error" role="alert">
                {chatError}
              </div>
            )}
          </div>
        </section>

        <aside className="sources-panel">
          <div className="sources-header">
            <h2>Retrieved context & sources</h2>
            <p>
              {liveSources.length > 0
                ? `Vector similarity • top-${liveSources.length} chunks`
                : "No sources retrieved yet"}
            </p>
          </div>
          <div className="source-list">
            {liveSources.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#8a9491", fontSize: 12 }}>
                Upload documents in the Dashboard and ask a question to see matching source excerpts and similarity scores here.
              </div>
            ) : (
              liveSources.map((source, index) => (
                <article
                  key={source.file + source.page + index}
                  className={`source-card ${selectedSource === index ? "selected" : ""}`}
                  onClick={() => setSelectedSource(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setSelectedSource(index);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="source-file">{source.file}</div>
                  <div className="source-meta">
                    <span>{source.page}</span>
                    <span className="similarity">{source.score}% match</span>
                  </div>
                  <div className="similarity-track">
                    <div
                      className="similarity-fill"
                      style={{ width: `${Math.min(100, Math.max(10, source.score))}%` }}
                    />
                  </div>
                  <p className="source-snippet">{source.text}</p>
                </article>
              ))
            )}
          </div>
          <div className="legend">
            <div className="legend-title">Confidence legend</div>
            <div className="legend-row">
              <span className="legend-line" /> &gt; 90% High relevance
            </div>
            <div className="legend-row">
              <span className="legend-line" style={{ opacity: 0.65 }} /> 80-90% Supporting
              context
            </div>
          </div>
        </aside>
      </div>

      {showHelp && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="section-kicker">SREYAS assistant</p>
                <h2 id="help-title">How to get a grounded answer</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowHelp(false)}
                aria-label="Close help"
              >
                ×
              </button>
            </div>
            <p>
              Ask about policies, regulations, circulars, schedules, leaves, and faculty procedures.
              Answers are generated strictly from your uploaded institutional documents and include the
              source passages used.
            </p>
            <button className="btn btn-primary" onClick={() => setShowHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
