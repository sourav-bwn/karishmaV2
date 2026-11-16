import React, { useState } from "react";
import {
  Folder,
  FileText,
  FileCode,
  Image as ImageIcon,
  Database,
  Upload,
  Download,
  Trash2,
  Search,
  Sparkles,
  HardDrive,
  Eye,
  Check,
} from "lucide-react";
import { ButterflySwarm } from "./ButterflySwarm";
import { KarishmaMascot } from "./KarishmaMascot";
import filesImg from "../assets/images/files_panoramic_strip.jpg";

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: "doc" | "code" | "image" | "data";
  date: string;
  badgeColor: string;
}

const DEFAULT_FILES: FileItem[] = [
  {
    id: "f1",
    name: "karishma-system-instructions.md",
    size: "14.2 KB",
    type: "doc",
    date: "Today, 09:40",
    badgeColor: "var(--k0)",
  },
  {
    id: "f2",
    name: "supabase-postgres-schema.sql",
    size: "8.6 KB",
    type: "code",
    date: "Yesterday",
    badgeColor: "var(--k3)",
  },
  {
    id: "f3",
    name: "karishma-clockwork-atelier.png",
    size: "1.4 MB",
    type: "image",
    date: "Nov 8, 2026",
    badgeColor: "var(--k1)",
  },
  {
    id: "f4",
    name: "conversations-local-backup.json",
    size: "42.8 KB",
    type: "data",
    date: "Nov 7, 2026",
    badgeColor: "var(--k4)",
  },
  {
    id: "f5",
    name: "banglish-voice-lexicon.ts",
    size: "19.5 KB",
    type: "code",
    date: "Nov 6, 2026",
    badgeColor: "var(--k2)",
  },
  {
    id: "f6",
    name: "user-memory-preferences.yaml",
    size: "3.1 KB",
    type: "doc",
    date: "Nov 5, 2026",
    badgeColor: "var(--k5)",
  },
];

interface FilesPageProps {
  onSendToChat?: (prompt: string) => void;
  onToast?: (msg: string) => void;
}

export function FilesPage({ onSendToChat, onToast }: FilesPageProps) {
  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES);
  const [searchQ, setSearchQ] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = files.filter((f) => {
    const matchesFilter = filterType === "all" || f.type === filterType;
    const matchesSearch = !searchQ || f.name.toLowerCase().includes(searchQ.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
    onToast?.("File removed from local cache");
  };

  const handleSimulateUpload = () => {
    onToast?.("File storage is not included in this text-only MVP. The listed files are sample UI content."); return;
    const newFile: FileItem = {
      id: "f_" + Date.now(),
      name: `document-${Math.floor(Math.random() * 900 + 100)}.txt`,
      size: `${(Math.random() * 20 + 2).toFixed(1)} KB`,
      type: "doc",
      date: "Just now",
      badgeColor: `var(--k${Math.floor(Math.random() * 6)})`,
    };
    setFiles((prev) => [newFile, ...prev]);
    onToast?.(`Uploaded ${newFile.name}`);
  };

  const getFileIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "code":
        return <FileCode className="i" />;
      case "image":
        return <ImageIcon className="i" />;
      case "data":
        return <Database className="i" />;
      default:
        return <FileText className="i" />;
    }
  };

  return (
    <section className="mp tp">
      {/* Floating Cloud Backdrops */}
      <div className="cloud mp-cl mp-c1" />
      <div className="cloud mp-cl mp-c2" />

      {/* Header */}
      <header className="mp-h mp-rise flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="flex items-center gap-4">
          <div className="mp-tile" style={{ background: "linear-gradient(135deg,#38bdf8,#0284c7)" }}>
            <Folder className="i" />
          </div>
          <div>
            <h1>
              Files &amp; Knowledge Base <Sparkles className="i tp-sparkle-inline" />
            </h1>
            <p>Manage documents, code snippets, local archives and knowledge files accessible to Karishma.</p>
          </div>
        </div>
        <div className="self-center md:self-auto flex items-center pr-2">
          <KarishmaMascot size="compact" className="compact" greeting="Your files are safe! 📁💜" />
        </div>
      </header>

      {/* Control bar */}
      <div className="tp-controls-bar mp-rise" style={{ "--i": 1 } as React.CSSProperties}>
        <div className="tp-search-box">
          <Search className="i tp-search-icon" />
          <input
            type="text"
            placeholder="Search documents, code, logs and datasets..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="tp-search-input"
          />
        </div>
        <div className="tp-categories-scroll">
          {[
            ["all", "All Files"],
            ["doc", "Documents"],
            ["code", "Code & Schemas"],
            ["image", "Images"],
            ["data", "Data & Backups"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`tp-filter-btn ${filterType === id ? "active" : ""}`}
              onClick={() => setFilterType(id)}
            >
              {label}
            </button>
          ))}
          <button
            className="tp-filter-btn active"
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={handleSimulateUpload}
          >
            <Upload className="i" style={{ width: 14, height: 14 }} /> Upload File
          </button>
        </div>
      </div>

      {/* Section Header */}
      <h2 className="mp-sec mp-rise" style={{ "--i": 2 } as React.CSSProperties}>
        <HardDrive className="i" />
        Stored Knowledge ({filtered.length})
      </h2>

      {/* Grid of Files */}
      <div className="mp-g">
        {filtered.map((file, i) => (
          <button
            key={file.id}
            className="mp-c mp-rise"
            style={{ "--i": i + 3 } as React.CSSProperties}
            onClick={() => setSelectedFile(file)}
          >
            <span className="mp-ic" style={{ background: file.badgeColor }}>
              {getFileIcon(file.type)}
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span className="tp-card-tag">{file.type.toUpperCase()}</span>
                <span className="tp-card-highlight">{file.size}</span>
              </div>
              <b style={{ wordBreak: "break-all" }}>{file.name}</b>
              <span className="t">Modified {file.date}</span>
            </div>
            <div
              style={{ marginLeft: "auto", padding: 6, cursor: "pointer" }}
              onClick={(e) => handleDelete(file.id, e)}
              title="Delete file"
            >
              <Trash2 className="i" style={{ width: 16, height: 16, color: "var(--mute)" }} />
            </div>
          </button>
        ))}
      </div>

      {/* Panoramic Animated Landscape Art */}
      <div className="tp-land mp-rise" style={{ "--i": 9 } as React.CSSProperties}>
        <img
          src={filesImg}
          alt="Karishma's Grand Knowledge Sanctuary and Archive Library"
          draggable={false}
          className="tp-land-img"
        />
        <i className="tp-crescent-moon-glow" />
        <i className="tp-hologram-pulse" />
        <i className="tp-floating-gear g1" />
        <i className="tp-floating-gear g2" />
        <i className="tp-lantern-glow l1" />
        <i className="tp-lantern-glow l2" />
        <i className="tp-sparkle-star s1" />
        <i className="tp-sparkle-star s2" />
        <i className="tp-sparkle-star s3" />
      </div>

      <ButterflySwarm />

      {/* File Drawer Modal */}
      {selectedFile && (
        <div className="tp-modal-overlay" onClick={() => setSelectedFile(null)}>
          <div className="tp-modal-card card" onClick={(e) => e.stopPropagation()}>
            <div className="tp-modal-header">
              <div className="tp-modal-icon-wrap" style={{ background: selectedFile.badgeColor }}>
                {getFileIcon(selectedFile.type)}
              </div>
              <div>
                <h3 style={{ wordBreak: "break-all" }}>{selectedFile.name}</h3>
                <span className="tp-modal-cat-tag">
                  {selectedFile.size} • {selectedFile.date}
                </span>
              </div>
              <button className="tp-modal-close-btn" onClick={() => setSelectedFile(null)}>
                ✕
              </button>
            </div>
            <div className="tp-param-box">
              <label>Indexed Document Content Preview</label>
              <div className="tp-code-preview">
                {`// File: ${selectedFile.name}\n// Size: ${selectedFile.size}\n// Status: Fully indexed and searchable in Karishma RAG context\n\nThis knowledge file is safely cached locally and partitioned by user account security boundaries.`}
              </div>
            </div>
            <div className="tp-modal-footer">
              <button
                className="tp-handoff-btn"
                onClick={() => {
                  onSendToChat?.(
                    `Please analyze and answer questions based on the uploaded file "${selectedFile.name}".`
                  );
                  setSelectedFile(null);
                }}
              >
                <Eye className="i" /> Discuss with Karishma
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
