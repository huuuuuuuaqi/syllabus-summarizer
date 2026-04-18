"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Map markdown # / ## / ### to styled headings; use h3–h6 under the card’s “Summary” h2 for outline. */
const summaryMarkdownComponents: Partial<Components> = {
  h1: (props) => (
    <h3
      className="mt-6 mb-2 text-2xl font-bold tracking-tight text-foreground first:mt-0"
      {...props}
    />
  ),
  h2: (props) => (
    <h4
      className="mt-5 mb-2 text-xl font-semibold tracking-tight text-foreground first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h5 className="mt-4 mb-2 text-lg font-semibold text-foreground first:mt-0" {...props} />
  ),
  h4: (props) => (
    <h6 className="mt-4 mb-1.5 text-base font-semibold text-foreground" {...props} />
  ),
  h5: (props) => (
    <p className="mt-3 text-base font-semibold text-foreground" {...props} />
  ),
  h6: (props) => (
    <p className="mt-3 text-sm font-semibold text-foreground" {...props} />
  ),
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

  async function handleSummarize() {
    setError(null);
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
  }

  const canClear =
    text.trim().length > 0 || summary !== null || error !== null;

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
              disabled={loading}
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
          <section
            className="rounded-xl border border-neutral-200 bg-neutral-50/90 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/60"
            aria-live="polite"
          >
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Summary
            </h2>
            <div className="max-w-none text-base leading-relaxed text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={summaryMarkdownComponents}
              >
                {summary}
              </ReactMarkdown>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
