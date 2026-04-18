"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type SummarySection = { title: string; body: string };

function parseSummarySections(raw: string): SummarySection[] {
  const text = raw.trim();
  if (!text) return [];

  const parts = text.split(/\n(?=## )/);
  const sections: SummarySection[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      const rest = trimmed.slice(3);
      const nl = rest.indexOf("\n");
      const title = (nl === -1 ? rest : rest.slice(0, nl)).trim();
      const body = (nl === -1 ? "" : rest.slice(nl + 1)).trim();
      sections.push({ title, body });
    } else {
      const lines = trimmed.split("\n");
      let title = "Summary";
      let body = trimmed;
      if (lines[0]?.startsWith("# ")) {
        title = lines[0].replace(/^#\s+/, "").trim();
        body = lines.slice(1).join("\n").trim();
      }
      sections.push({ title, body });
    }
  }

  return sections;
}

function emojiForSectionTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("course overview")) return "📋";
  if (t.includes("key dates")) return "📅";
  if (t.includes("grading")) return "📊";
  if (t.includes("workload")) return "⏱";
  if (t.includes("professor") || t.includes("contact")) return "👤";
  return "📌";
}

const sectionBodyMarkdownComponents: Partial<Components> = {
  h1: (props) => <p className="my-2 font-semibold first:mt-0" {...props} />,
  h2: (props) => <p className="my-2 font-semibold first:mt-0" {...props} />,
  h3: (props) => <p className="my-2 font-semibold first:mt-0" {...props} />,
  p: (props) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...props} />,
  ul: (props) => (
    <ul className="my-2 list-disc space-y-1 pl-5 leading-relaxed" {...props} />
  ),
  ol: (props) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 leading-relaxed" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  a: (props) => (
    <a
      className="font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
};

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  async function handleSummarize() {
    setError(null);
    setCopyError(null);
    setSummary(null);
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabus: text }),
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Something went wrong. Please try again.";
        setError(message);
        return;
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "summary" in data &&
        typeof (data as { summary: unknown }).summary === "string"
      ) {
        setSummary((data as { summary: string }).summary);
      } else {
        setError("Received an unexpected response from the server.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setText("");
    setSummary(null);
    setError(null);
    setCopyError(null);
    setCopyFeedback(false);
  }

  async function handleCopySummary() {
    if (summary === null) return;
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(summary);
      setCopyFeedback(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      setCopyError("Could not copy to clipboard.");
    }
  }

  const canClear =
    text.trim().length > 0 || summary !== null || error !== null;

  const summarySections =
    summary !== null && !error ? parseSummarySections(summary) : [];

  return (
    <main className="flex min-h-full flex-1 flex-col px-6 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-2xl space-y-10">
        <header className="space-y-3 text-center sm:text-left">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Syllabus Summarizer
          </h1>
          <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            Paste your syllabus below to get an instant summary
          </p>
        </header>

        <div className="space-y-4">
          <label htmlFor="syllabus-text" className="sr-only">
            Syllabus text
          </label>
          <textarea
            id="syllabus-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder="Paste your syllabus text here..."
            disabled={loading}
            className="min-h-[min(28rem,60vh)] w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-base leading-relaxed text-foreground placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600/30"
          />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {text.length} {text.length === 1 ? "character" : "characters"}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || !canClear}
              className="rounded-lg border border-neutral-300 bg-transparent px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSummarize}
              disabled={loading || text.trim().length === 0}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {loading ? "Summarizing..." : "Summarize"}
            </button>
          </div>
        </div>

        {error && (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        {summary !== null && !error && (
          <div className="space-y-6" aria-live="polite">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Summary
                </h2>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {copyFeedback ? "Copied!" : "Copy summary"}
                </button>
              </div>
              {copyError && (
                <p className="text-right text-sm text-red-600 dark:text-red-400">
                  {copyError}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {summarySections.map((section, i) => (
                <article
                  key={`${i}-${section.title}`}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/90 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/60"
                >
                  <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                    <span aria-hidden>{emojiForSectionTitle(section.title)}</span>
                    <span>{section.title}</span>
                  </h3>
                  {section.body ? (
                    <div className="mt-3 max-w-none text-base leading-relaxed text-foreground">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={sectionBodyMarkdownComponents}
                      >
                        {section.body}
                      </ReactMarkdown>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
