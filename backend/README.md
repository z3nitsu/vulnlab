# Backend Notes

- [x] Implement persistence layer for challenge metadata using the configured SQLite database.
  - Run `python -m backend.db_init` to create tables and seed the bundled JSON challenges.
- [x] Expose endpoints for listing challenges.
- [x] Add submission endpoint storing pending fixes.
- [x] Provide submission retrieval endpoints.
- [x] Implement basic heuristic scoring for initial challenges.
- [x] Implement full scoring workflow (static analysis + sandbox execution).
  - Heuristics, Semgrep/Bandit, and sandbox checks run asynchronously via the worker.
- [x] Integrate static analysis (Semgrep/Bandit) pipeline for submission scoring.
- [ ] Wire optional container sandbox execution flow.
- [x] Add automated tests covering challenge retrieval and scoring logic.

## Available Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service health check. |
| GET | `/challenges` | List challenges. |
| GET | `/challenges/{slug}` | Retrieve challenge detail. |
| POST | `/submissions` | Submit a fix attempt (heuristics run immediately). |
| GET | `/submissions` | List submissions; supports `challenge_slug`, `limit`, `offset` filters. |
| GET | `/submissions/{submission_id}` | Fetch a submission by id. |
| POST | `/submissions/{submission_id}/rescore` | Re-run scoring using the latest analyzers. |
| GET | `/stats/submissions` | Aggregate submission metrics (total, averages, per-status counts). |

## Configuration

| Environment Variable | Default | Description |
| --- | --- | --- |
| `VULNLABS_DEBUG` | `false` | Enables FastAPI debug mode. |
| `VULNLABS_DATABASE_URL` | SQLite file under `backend/data` | Connection string for persistence layer. |
| `VULNLABS_LOG_LEVEL` | `INFO` | Log verbosity (`DEBUG`, `INFO`, `WARNING`, etc.). |
| `VULNLABS_SEMGREP_RULES_ROOT` | `backend/static_analysis/semgrep` | Location of Semgrep rule packs. |
| `VULNLABS_SEMGREP_BINARY` | `semgrep` | Path to the Semgrep CLI binary. |
| `VULNLABS_SEMGREP_TIMEOUT_SECONDS` | `20` | Maximum time Semgrep is allowed to scan a snippet. |
| `VULNLABS_BANDIT_BINARY` | `bandit` | Path to Bandit CLI. |
| `VULNLABS_BANDIT_TIMEOUT_SECONDS` | `10` | Max execution time for Bandit runs. |
| `VULNLABS_BANDIT_SEVERITY` | `LOW` | Minimum severity Bandit should report. |
| `VULNLABS_BANDIT_CONFIDENCE` | `LOW` | Minimum confidence Bandit should report. |
| `VULNLABS_API_KEY` | unset | When provided, POST endpoints require `X-API-Key` to match. |
| `VULNLABS_SANDBOX_TIMEOUT_SECONDS` | `5` | Max time allowed for sandbox compilation run. |
| `VULNLABS_PYTHON_EXECUTABLE` | `python3` | Interpreter used by the sandbox executor. |
| `VULNLABS_SANDBOX_DRIVER` | `local` | Set to `docker` to run sandbox checks inside containers. |
| `VULNLABS_DOCKER_BINARY` | `docker` | Docker CLI binary path used by the sandbox. |
| `VULNLABS_DOCKER_IMAGE` | `python:3.11-slim` | Container image used for sandbox compilation. |
| `VULNLABS_DOCKER_MEMORY_LIMIT` | `128m` | Memory limit passed to Docker containers. |
| `VULNLABS_DOCKER_CPU_SHARES` | `256` | CPU share weight for Docker containers. |
| `VULNLABS_CORS_ALLOW_ORIGINS` | `http://127.0.0.1:5173,http://localhost:5173` | Comma-separated origins allowed by CORS middleware. |

All POST endpoints expect the `X-API-Key` header when an API key is configured.

## Scoring Heuristics (Current)

The scoring pipeline now runs asynchronously in the background. Submissions are queued, marked as `pending`, and processed by a worker that applies heuristics, Semgrep/Bandit findings, and a sandbox execution phase before persisting the results.

- Background worker: processes queued submissions and updates their status (`pending` → `running` → `passed/failed/error`).
- Semgrep rules (if the `semgrep` CLI is installed) add additional warnings to the submission feedback payload.
  - Install with `python3 -m pip install --user semgrep` or follow upstream instructions, and adjust `VULNLABS_SEMGREP_BINARY` if the binary lives outside your `PATH`.
- Bandit (if installed) runs against snippets to surface Python security issues with severity/confidence thresholds.
- Sandbox execution: defaults to a local Python subprocess that compiles the code; set `VULNLABS_SANDBOX_DRIVER=docker` to run the same check inside an isolated Docker container (memory/time limits applied).
  - Snippets are wrapped in a dummy function prior to compilation so top-level `return` statements from challenges are accepted.
  - If Docker is unavailable the run fails gracefully and the submission is marked with a sandbox error issue.

Heuristic checks currently look for:

- `sqli_001`: looks for parameterized SQL usage and absence of string concatenation.
- `xss_001`: expects HTML escaping or sanitization helpers.
- `command_injection_001`: prefers `subprocess` calls without `shell=True` or `os.system`.

Submissions failing these checks are marked `failed` with feedback; other challenges remain `pending` until expanded analyzers are introduced. When Semgrep matches fire, the submission response includes an `issues` array with tool/severity/message details.

## Tests

Install test tooling (once per environment):

```bash
python3 -m pip install --user pytest
```

Run the API and sandbox regression tests (use a temporary SQLite database) with:

```bash
pytest backend/tests
```
