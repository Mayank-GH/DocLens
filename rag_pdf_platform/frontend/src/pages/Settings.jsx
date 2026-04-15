// Settings page for storing local Groq API key used in requests.
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Key, Save, CheckCircle, Eye, EyeOff, ExternalLink } from "lucide-react";

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem("groq_api_key") || "");
  }, []);

  const handleSave = () => {
    // Persist API key in browser localStorage.
    localStorage.setItem("groq_api_key", apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const maskedKey = apiKey
    ? apiKey.slice(0, 8) + "•".repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4)
    : "";

  return (
    <div className="p-8 max-w-xl">
      <h1 className="font-display text-2xl font-700 text-ink flex items-center gap-3 mb-8">
        <SettingsIcon size={22} className="text-accent" />
        Settings
      </h1>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Key size={15} className="text-accent" />
          <h2 className="font-display font-600 text-ink">Groq API Key</h2>
        </div>

        <p className="text-xs text-muted mb-4 leading-relaxed">
          Your API key is stored locally in your browser and sent with each request.
          It never leaves your machine except to call Groq&apos;s API.{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="text-accent inline-flex items-center gap-1 hover:underline"
          >
            Get a free key <ExternalLink size={10} />
          </a>
        </p>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_••••••••••••••••••••••"
              className="input-field pr-10 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button type="button" onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm px-4">
            {saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>

        {apiKey && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
            Key stored: <span className="font-mono text-ink">{maskedKey}</span>
          </div>
        )}
      </div>
    </div>
  );
}
