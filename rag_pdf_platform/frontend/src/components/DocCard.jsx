// Reusable card UI for showing one document in library/compare grids.
import { FileText, MessageSquare, Trash2, Clock, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const statusColor = {
  ready: "text-emerald bg-emerald/10 border-emerald/20",
  processing: "text-amber bg-amber/10 border-amber/20",
  error: "text-rose bg-rose/10 border-rose/20",
};

function formatSize(bytes) {
  // Human-readable byte formatting for card metadata.
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(isoStr) {
  // Relative age label for document creation timestamp.
  const d = new Date(isoStr);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DocCard({ doc, onDelete, onSelect, selected }) {
  // Supports three modes: open chat, selection mode, and delete action.
  const navigate = useNavigate();

  return (
    <div
      className={clsx(
        "doc-card card cursor-pointer relative group",
        selected && "glow-border"
      )}
      onClick={() => onSelect ? onSelect(doc) : navigate(`/chat/${doc.id}`)}
    >
      {/* Status badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-subtle border border-border flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-accent" />
        </div>
        <span className={clsx("status-badge border", statusColor[doc.status] || statusColor.processing)}>
          {doc.status}
        </span>
      </div>

      {/* Filename */}
      <h3 className="font-display font-500 text-ink text-sm leading-tight mb-3 line-clamp-2">
        {doc.filename}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted mb-4">
        <span className="flex items-center gap-1">
          <Layers size={11} />
          {doc.pages || 0} pages
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {timeAgo(doc.created_at)}
        </span>
        <span>{formatSize(doc.size)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {doc.status === "ready" && !onSelect && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/chat/${doc.id}`); }}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <MessageSquare size={12} />
            Chat
          </button>
        )}
        {onSelect && doc.status === "ready" && (
          <div className={clsx(
            "text-xs px-3 py-1.5 rounded-lg border font-mono",
            selected
              ? "border-accent text-accent bg-accent/10"
              : "border-border text-muted"
          )}>
            {selected ? "✓ Selected" : "Select"}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(doc.id); }}
          className="ml-auto p-1.5 rounded-lg text-muted hover:text-rose hover:bg-rose/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
