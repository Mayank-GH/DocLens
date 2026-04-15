// Expandable citation list shown under assistant answers.
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

export default function CitationPanel({ citations }) {
  // Keeps track of which citation row is expanded.
  const [expanded, setExpanded] = useState(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs text-muted flex items-center gap-1.5 mb-2">
        <BookOpen size={11} />
        Sources used ({citations.length})
      </p>
      {citations.map((c, i) => (
        <div
          key={i}
          className={clsx("citation-card cursor-pointer transition-all", expanded === i && "border-accent")}
          onClick={() => setExpanded(expanded === i ? null : i)}
        >
          <div className="flex items-center justify-between">
            <span className="text-accent font-mono">
              [Source {c.source_num}] — Page {c.page}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted">
                relevance {(c.score * 100).toFixed(0)}%
              </span>
              {expanded === i ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </div>
          </div>
          {expanded === i && (
            <p className="mt-2 text-[11px] text-muted leading-relaxed border-t border-border pt-2">
              {c.text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
