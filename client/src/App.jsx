import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function DropIcon({ className }) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden="true">
      <path
        d="M24 2C24 2 4 30 4 44a20 20 0 0 0 40 0C44 30 24 2 24 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M24 14c-4.5 8-12 20-12 28a12 12 0 0 0 24 0c0-8-7.5-20-12-28Z"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 12.5v-8A1.5 1.5 0 0 1 6 3h8" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path d="M4 10.5l3.5 3.5L16 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setCopied(false);

    if (!url.trim()) {
      setError("Enter a URL to distill.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to fetch summary.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result?.summary) return;
    try {
      await navigator.clipboard.writeText(result.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy — your browser may be blocking clipboard access.");
    }
  }

  return (
    <div className="shell">
      <div className="grain" aria-hidden="true" />

      <header className="hero">
        <DropIcon className="hero-icon" />
        <h1>
          Distill
        </h1>
        <p className="tagline">Drop in a link. Get the essence back — no fluff, no scrolling.</p>
      </header>

      <main className="panel">
        <form onSubmit={handleSubmit} className="url-form">
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            placeholder="https://example.com/a-very-long-article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            aria-label="Webpage URL"
          />
          <button type="submit" disabled={loading} className="submit-btn">
            <span className={loading ? "btn-label is-hidden" : "btn-label"}>Distill</span>
            {loading && (
              <span className="btn-loader" aria-hidden="true">
                <span className="drip" />
                <span className="drip" />
                <span className="drip" />
              </span>
            )}
          </button>
        </form>

        {loading && (
          <div className="loading-row" role="status" aria-live="polite">
            <div className="flask">
              <div className="flask-liquid" />
            </div>
            <span className="loading-text">Reading the page and reducing it down…</span>
          </div>
        )}

        {error && (
          <div className="error" role="alert">
            <strong>Couldn't distill that.</strong> {error}
          </div>
        )}

        {result && !loading && (
          <div className="result">
            <div className="result-head">
              {result.title && <h2>{result.title}</h2>}
              <button
                type="button"
                className={copied ? "copy-btn is-copied" : "copy-btn"}
                onClick={handleCopy}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="summary-text">{result.summary}</p>
            <p className="meta">
              Reduced from {result.sourceLength?.toLocaleString()} characters of source text.
            </p>
          </div>
        )}
      </main>

      <footer className="footer">React · Express · Groq</footer>
    </div>
  );
}

export default App;
