// Drag-and-drop uploader with progress and success/error states.
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { uploadDocument } from "../utils/api";
import clsx from "clsx";

export default function Uploader({ onUploaded }) {
  const [state, setState] = useState("idle"); // idle | uploading | success | error
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const onDrop = useCallback(async (accepted) => {
    // Upload selected PDF and surface progress/errors in UI.
    const file = accepted[0];
    if (!file) return;

    setFileName(file.name);
    setState("uploading");
    setProgress(0);
    setError("");

    try {
      const { data } = await uploadDocument(file, setProgress);
      setState("success");
      setTimeout(() => {
        setState("idle");
        onUploaded && onUploaded(data);
      }, 1800);
    } catch (e) {
      setState("error");
      setError(e.response?.data?.detail || "Upload failed");
    }
  }, [onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: state === "uploading",
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        "relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300",
        isDragActive
          ? "border-accent bg-accent/5 scale-[1.01]"
          : state === "success"
          ? "border-emerald bg-emerald/5"
          : state === "error"
          ? "border-rose bg-rose/5"
          : "border-border hover:border-accent/50 hover:bg-accent/3"
      )}
    >
      <input {...getInputProps()} />

      {/* Idle */}
      {state === "idle" && (
        <div className="animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-subtle border border-border flex items-center justify-center mx-auto mb-4">
            <Upload size={24} className={isDragActive ? "text-accent" : "text-muted"} />
          </div>
          <p className="font-display font-500 text-ink mb-1">
            {isDragActive ? "Drop your PDF here" : "Upload a PDF document"}
          </p>
          <p className="text-sm text-muted">Drag & drop or click to browse · Max 50MB</p>
        </div>
      )}

      {/* Uploading */}
      {state === "uploading" && (
        <div className="animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-subtle border border-border flex items-center justify-center mx-auto mb-4">
            <Loader size={24} className="text-accent animate-spin" />
          </div>
          <p className="font-display font-500 text-ink mb-1 truncate max-w-xs mx-auto">{fileName}</p>
          <div className="mt-4 bg-subtle rounded-full h-1.5 overflow-hidden max-w-xs mx-auto">
            <div
              className="h-full bg-accent rounded-full progress-glow transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2 font-mono">{progress}% — ingesting & embedding…</p>
        </div>
      )}

      {/* Success */}
      {state === "success" && (
        <div className="animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-emerald/10 border border-emerald/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-emerald" />
          </div>
          <p className="font-display font-500 text-ink mb-1">Uploaded successfully!</p>
          <p className="text-sm text-muted">Processing and embedding your document…</p>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-rose/10 border border-rose/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-rose" />
          </div>
          <p className="font-display font-500 text-ink mb-1">Upload failed</p>
          <p className="text-sm text-rose/80">{error}</p>
          <p className="text-xs text-muted mt-2">Click to try again</p>
        </div>
      )}
    </div>
  );
}
