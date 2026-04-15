// Chat page for asking grounded questions about a single document.
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Bot, User, FileText, ArrowLeft, Loader, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getDocument } from "../utils/api";
import { sendChat } from "../utils/api";
import CitationPanel from "../components/CitationPanel";
import clsx from "clsx";

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key findings?",
  "List the main topics covered",
  "What conclusions are drawn?",
];

export default function Chat() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getDocument(docId);
        setDoc(data);
      } catch {
        navigate("/library");
      } finally {
        setDocLoading(false);
      }
    })();
  }, [docId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    // Sends query + history to backend and appends assistant response.
    const query = text || input.trim();
    if (!query || loading) return;

    setInput("");
    const userMsg = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { data } = await sendChat({ doc_id: docId, query, history });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
          chunks_used: data.chunks_used,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: " + (e.response?.data?.detail || "Something went wrong."), citations: [] },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (docLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        <Loader size={20} className="animate-spin mr-2" /> Loading document…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface/80 backdrop-blur">
        <button onClick={() => navigate("/library")} className="btn-ghost p-1.5">
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <FileText size={14} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-600 text-ink text-sm truncate">{doc?.filename}</h2>
          <p className="text-xs text-muted">{doc?.pages} pages · {doc?.chunks} chunks indexed</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald/10 border border-emerald/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          <span className="text-[10px] font-mono text-emerald">ready</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-accent" />
            </div>
            <h3 className="font-display font-600 text-ink mb-2">Ready to chat</h3>
            <p className="text-sm text-muted mb-8">Ask anything about <span className="text-ink font-medium">{doc?.filename}</span></p>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 text-muted hover:text-ink transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={clsx("flex gap-3 animate-slide-up", msg.role === "user" && "flex-row-reverse")}>
            {/* Avatar */}
            <div className={clsx(
              "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
              msg.role === "user"
                ? "bg-accent/20 border border-accent/30"
                : "bg-subtle border border-border"
            )}>
              {msg.role === "user"
                ? <User size={14} className="text-accent" />
                : <Bot size={14} className="text-muted" />}
            </div>

            {/* Bubble */}
            <div className={clsx(
              "max-w-[75%] rounded-xl px-4 py-3",
              msg.role === "user" ? "chat-user" : "chat-ai"
            )}>
              <div className="markdown-content max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.role === "assistant" && msg.citations && (
                <CitationPanel citations={msg.citations} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-lg bg-subtle border border-border flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-muted" />
            </div>
            <div className="chat-ai rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border bg-surface/80 backdrop-blur">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask a question about this document…"
            rows={1}
            className="input-field resize-none flex-1 py-3 max-h-32 overflow-y-auto"
            style={{ fieldSizing: "content" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary p-3 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted mt-2">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
