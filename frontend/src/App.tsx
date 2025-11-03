const sampleChallenges = [
  { slug: "sqli_001", title: "Unsafe Login Query", difficulty: "Easy" },
  { slug: "xss_001", title: "Unescaped Account Name", difficulty: "Medium" },
  { slug: "command_injection_001", title: "Verbose Backup CLI", difficulty: "Hard" },
]

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-brand.primary/20 px-3 py-1 text-sm font-semibold text-brand.light">
              VulnLabs
            </span>
            <span className="text-sm text-slate-400">Secure Coding Arena</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <button className="rounded-md border border-slate-700 px-3 py-1.5 transition hover:border-brand.light hover:text-brand.light">
              Docs
            </button>
            <button className="rounded-md bg-brand.primary px-3 py-1.5 font-medium text-white shadow-panel transition hover:bg-brand.dark">
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl grid-cols-[280px_minmax(0,1fr)_320px] gap-6 px-6 py-6">
        <aside className="rounded-xl bg-surface.panel p-4 shadow-panel">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Challenges
          </h2>
          <ul className="space-y-2">
            {sampleChallenges.map((challenge) => (
              <li key={challenge.slug}>
                <button className="w-full rounded-lg border border-transparent bg-slate-900/60 px-4 py-3 text-left transition hover:border-brand.light">
                  <p className="text-sm font-semibold text-slate-100">
                    {challenge.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{challenge.difficulty}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface.panel p-4 shadow-panel">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h1 className="text-lg font-semibold text-slate-100">Unsafe Login Query</h1>
                <p className="text-sm text-slate-400">SQL Injection · Python</p>
              </div>
              <button className="rounded-md border border-brand.light px-3 py-1.5 text-sm font-medium text-brand.light transition hover:border-brand.primary hover:text-brand.primary">
                Show Solution
              </button>
            </div>
            <div className="mt-4 rounded-lg bg-slate-900/80 p-4 text-sm leading-relaxed text-slate-300">
              <p className="mb-4">
                The banking portal concatenates raw user input into the SQL query that checks credentials.
                Update the snippet so that user controlled values are parameterized and cannot break out of the query.
              </p>
              <code className="block rounded-lg bg-slate-950/70 p-4 text-xs text-slate-200">
                {`username = request.json["username"]
password = request.json["password"]
query = f"SELECT id FROM users WHERE username = '{username}' AND password = '{password}'"
return db.execute(query).fetchone()`}
              </code>
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-xl bg-surface.panel shadow-panel">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm text-slate-300">
              <span className="font-medium">Your Fix</span>
              <button className="rounded-md border border-slate-700 px-3 py-1.5 transition hover:border-brand.light hover:text-brand.light">
                Reset Code
              </button>
            </div>
            <textarea
              className="h-full flex-1 resize-none bg-transparent p-4 font-mono text-sm text-slate-100 outline-none"
              placeholder="Write your secure fix here..."
            />
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-4 py-3">
              <button className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500">
                Run Tests
              </button>
              <button className="rounded-md bg-brand.primary px-5 py-2 text-sm font-semibold text-white shadow-panel transition hover:bg-brand.dark">
                Submit Fix
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl bg-surface.panel p-4 shadow-panel">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Acceptance Criteria</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>User input must not be concatenated into SQL statements.</li>
              <li>Prepared statements or safe query builders must be used.</li>
              <li>The query must still authenticate valid users.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-surface.panel p-4 shadow-panel">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent Feedback</h3>
            <div className="mt-3 space-y-3 text-sm text-slate-300">
              <p className="rounded-lg bg-slate-900/70 p-3">
                <span className="font-semibold text-brand.light">Semgrep:</span> Query still allows raw interpolation.
              </p>
              <p className="rounded-lg bg-slate-900/70 p-3">
                <span className="font-semibold text-green-400">Sandbox:</span> Compilation succeeded.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
