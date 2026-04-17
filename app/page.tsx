export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col px-6 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-2xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Syllabus Summarizer
          </h1>
          <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            Helps students understand their syllabus quickly.
          </p>
        </header>

        <div className="space-y-2">
          <label
            htmlFor="syllabus-text"
            className="sr-only"
          >
            Paste syllabus text
          </label>
          <textarea
            id="syllabus-text"
            name="syllabus"
            spellCheck={false}
            placeholder="Paste your syllabus text here…"
            className="min-h-[min(28rem,60vh)] w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-base leading-relaxed text-foreground placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-600 dark:focus:ring-neutral-600/30"
          />
        </div>
      </div>
    </main>
  );
}
