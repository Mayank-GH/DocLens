// Compare page: choose two docs, generate analysis, and ask follow-up questions.
import { useEffect, useState } from "react";
import { GitCompare, Loader, Send, AlertTriangle, Minus, Plus, BookOpen, Lightbulb } from "lucide-react";
import { listDocuments, analyzeDocuments, compareQuery } from "../utils/api";
import DocCard from "../components/DocCard";
import ReactMarkdown from "react-markdown";

export default function Compare() {
  const [docs, setDocs] = useState([]);
  const [docA, setDocA] = useState(null);
  const [docB, setDocB] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [querying, setQuerying] = useState(false);
  const [step, setStep] = useState("select"); // select | result

  useEffect(() => {
    listDocuments().then(({ data }) =>
      setDocs((data.documents || []).filter((d) => d.status === "ready"))
    );
  }, []);

  const handleSelect = (doc) => {
    if (docA?.id === doc.id) { setDocA(null); return; }
    if (docB?.id === doc.id) { setDocB(null); return; }
    if (!docA) { setDocA(doc); return; }
    if (!docB) { setDocB(doc); return; }
  };

  const handleAnalyze = async () => {
    // Request structured comparison output for the selected pair.
    if (!docA || !docB) return;
    setAnalyzing(true);
    setAnalysis(null);
    setQueryResult(null);
    try {
      const { data } = await analyzeDocuments(docA.id, docB.id);
      setAnalysis(data);
      setStep("result");
    } catch (e) {
      alert(e.response?.data?.detail || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleQuery = async () => {
    // Ask a free-form question across both selected documents.
    if (!query.trim() || !docA || !docB) return;
    setQuerying(true);
    try {
      const { data } = await compareQuery(docA.id, docB.id, query);
      setQueryResult(data);
    } catch (e) {
      alert("Query failed");
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-700 text-ink flex items-center gap-3 mb-1">
          <GitCompare size={22} className="text-accent" />
          Compare Documents
        </h1>
        <p className="text-sm text-muted">Select two PDFs to find differences, contradictions, and shared themes</p>
      </div>

      {/* Document selector */}
      {step === "select" || !analysis ? (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-muted">
              Select exactly 2 documents:
              {docA && <span className="text-ink font-medium ml-1">{docA.filename.slice(0, 20)}…</span>}
              {docA && docB && <span className="text-muted"> vs </span>}
              {docB && <span className="text-ink font-medium">{docB.filename.slice(0, 20)}…</span>}
            </p>
          </div>

          {docs.length === 0 ? (
            <div className="text-center py-12 text-muted">No ready documents. Upload some PDFs first.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {docs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onSelect={handleSelect}
                  selected={docA?.id === doc.id || docB?.id === doc.id}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={!docA || !docB || analyzing}
              className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {analyzing ? <Loader size={16} className="animate-spin" /> : <GitCompare size={16} />}
              {analyzing ? "Analyzing…" : "Analyze Documents"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Results */}
      {analysis && (
        <div className="space-y-6 animate-fade-in">
          {/* Doc labels */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card border-rose/30">
              <p className="text-xs text-muted mb-1">Document A</p>
              <p className="font-display font-600 text-ink text-sm truncate">{analysis.doc_a.filename}</p>
            </div>
            <div className="card border-cyan/30">
              <p className="text-xs text-muted mb-1">Document B</p>
              <p className="font-display font-600 text-ink text-sm truncate">{analysis.doc_b.filename}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-accent" />
              <h3 className="font-display font-600 text-ink text-sm">Summary</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">{analysis.analysis.summary}</p>
          </div>

          {/* Common themes */}
          {analysis.analysis.common_themes?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} className="text-amber" />
                <h3 className="font-display font-600 text-ink text-sm">Common themes</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.analysis.common_themes.map((t, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber/10 border border-amber/20 text-amber">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key differences */}
          {analysis.analysis.key_differences?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Minus size={14} className="text-rose" />
                <h3 className="font-display font-600 text-ink text-sm">Key differences</h3>
              </div>
              <div className="space-y-3">
                {analysis.analysis.key_differences.map((d, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-border">
                    <div className="bg-subtle px-3 py-2 text-xs font-display font-600 text-ink">{d.topic}</div>
                    <div className="grid grid-cols-2 gap-0">
                      <div className="diff-unique-a px-3 py-2.5 text-xs text-muted">{d.doc_a}</div>
                      <div className="diff-unique-b px-3 py-2.5 text-xs text-muted">{d.doc_b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contradictions */}
          {analysis.analysis.contradictions?.length > 0 && (
            <div className="card border-amber/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-amber" />
                <h3 className="font-display font-600 text-ink text-sm">Contradictions</h3>
              </div>
              <div className="space-y-3">
                {analysis.analysis.contradictions.map((c, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-amber/20">
                    <div className="bg-amber/5 px-3 py-2 text-xs font-display font-600 text-amber">{c.topic}</div>
                    <div className="grid grid-cols-2 gap-0">
                      <div className="diff-unique-a px-3 py-2.5 text-xs text-muted">{c.doc_a}</div>
                      <div className="diff-unique-b px-3 py-2.5 text-xs text-muted">{c.doc_b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {analysis.analysis.recommendation && (
            <div className="card border-emerald/20">
              <div className="flex items-center gap-2 mb-2">
                <Plus size={14} className="text-emerald" />
                <h3 className="font-display font-600 text-ink text-sm">Recommendation</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed">{analysis.analysis.recommendation}</p>
            </div>
          )}

          {/* Cross-doc Q&A */}
          <div className="card">
            <h3 className="font-display font-600 text-ink text-sm mb-3 flex items-center gap-2">
              <GitCompare size={14} className="text-accent" />
              Ask across both documents
            </h3>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                placeholder="What does each document say about…?"
                className="input-field flex-1"
              />
              <button onClick={handleQuery} disabled={!query.trim() || querying} className="btn-primary px-4 disabled:opacity-40">
                {querying ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>

            {queryResult && (
              <div className="mt-4 animate-fade-in">
                <div className="bg-surface rounded-lg p-4 border border-border">
                  <div className="markdown-content max-w-none">
                    <ReactMarkdown>{queryResult.answer}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { setAnalysis(null); setDocA(null); setDocB(null); setStep("select"); }}
            className="btn-ghost text-sm"
          >
            ← Compare different documents
          </button>
        </div>
      )}
    </div>
  );
}
