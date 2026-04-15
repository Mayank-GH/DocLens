// Library page: list, refresh, upload, and delete documents.
import { useEffect, useState } from "react";
import { FolderOpen, RefreshCw, Plus } from "lucide-react";
import { listDocuments, deleteDocument } from "../utils/api";
import DocCard from "../components/DocCard";
import Uploader from "../components/Uploader";

export default function Library() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const fetchDocs = async () => {
    // Pull latest document list from backend.
    try {
      setLoading(true);
      const { data } = await listDocuments();
      setDocs(data.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    // Optimistic UI: remove card instantly while backend cleanup continues.
    setDeletingIds((prev) => new Set(prev).add(id));
    const previous = docs;
    setDocs((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDocument(id);
    } catch (e) {
      console.error(e);
      // Revert optimistic update if delete request fails.
      setDocs(previous);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchDocs();
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-700 text-ink flex items-center gap-3">
            <FolderOpen size={22} className="text-accent" />
            Document Library
          </h1>
          <p className="text-sm text-muted mt-1">{docs.length} document{docs.length !== 1 ? "s" : ""} stored</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchDocs} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={14} />
            Upload PDF
          </button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="mb-8 animate-slide-up">
          <Uploader onUploaded={() => { setShowUpload(false); fetchDocs(); }} />
        </div>
      )}

      {/* Grid */}
      {loading && docs.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted">
          <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={40} className="text-muted mx-auto mb-4 opacity-40" />
          <p className="text-muted">No documents yet. Upload your first PDF!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docs.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onDelete={deletingIds.has(doc.id) ? undefined : handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
