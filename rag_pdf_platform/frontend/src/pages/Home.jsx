// Home page with primary upload CTA and post-upload readiness polling.
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Uploader from "../components/Uploader";

export default function Home() {
  // Redirects users to chat once backend indexing finishes.
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto text-center mb-12 pt-10">
        <h1 className="font-display text-5xl font-800 text-ink mb-4 leading-tight">
          Chat with your{" "}
          <span className="gradient-text">documents</span>
        </h1>
        <p className="text-muted text-lg leading-relaxed">
          Upload any PDF and ask questions in plain English. DocLensAI retrieves exact passages,
          cites sources, and answers with clarity.
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-10">
        <Uploader onUploaded={(data) => {
          const poll = setInterval(async () => {
            try {
              const res = await fetch(`/api/documents/${data.doc_id}`);
              const doc = await res.json();
              if (doc.status === "ready") {
                clearInterval(poll);
                navigate(`/chat/${data.doc_id}`);
              }
            } catch {}
          }, 1500);
          setTimeout(() => clearInterval(poll), 60000);
        }} />
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate("/library")}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
        >
          Or pick from your library
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
