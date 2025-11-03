# Backend Notes

- [x] Implement persistence layer for challenge metadata using the configured SQLite database.
  - Run `python -m backend.db_init` to create tables and seed the bundled JSON challenges.
- [x] Expose endpoints for listing challenges.
- [x] Add submission endpoint storing pending fixes.
- [x] Provide submission retrieval endpoints.
- [x] Implement basic heuristic scoring for initial challenges.
- [ ] Implement full scoring workflow (static analysis + sandbox execution).
  - Current heuristics act as lightweight guards until full pipeline lands.
- [x] Integrate static analysis (Semgrep/Bandit) pipeline for submission scoring.
- [ ] Wire optional container sandbox execution flow.
- [ ] Add automated tests covering challenge retrieval and scoring logic.

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
| `VULNLABS_BANDIT_BINARY` | `bandit` | Path to Bandit CLI. |
| `VULNLABS_BANDIT_TIMEOUT_SECONDS` | `10` | Max execution time for Bandit runs. |
| `VULNLABS_BANDIT_SEVERITY` | `LOW` | Minimum severity Bandit should report. |
| `VULNLABS_BANDIT_CONFIDENCE` | `LOW` | Minimum confidence Bandit should report. |
| `VULNLABS_API_KEY` | unset | When provided, POST endpoints require `X-API-Key` to match. |

All POST endpoints expect the `X-API-Key` header when an API key is configured.

## Scoring Heuristics (Current)

The scoring pipeline now runs asynchronously in the background. Submissions are queued, marked as `pending`, and processed by a worker that applies heuristics, Semgrep/Bandit findings, and a lightweight sandbox stub before persisting the results.

- Background worker: processes queued submissions and updates their status (`pending` → `running` → `passed/failed/error`).
- Semgrep rules (if the `semgrep` CLI is installed) add additional warnings to the submission feedback payload.
- Bandit (if installed) runs against snippets to surface Python security issues with severity/confidence thresholds.
- Sandbox stub detects obviously dangerous operations (e.g., `os.system`) and will be replaced by a containerised executor later on.

Heuristic checks currently look for:

- `sqli_001`: looks for parameterized SQL usage and absence of string concatenation.
- `xss_001`: expects HTML escaping or sanitization helpers.
- `command_injection_001`: prefers `subprocess` calls without `shell=True` or `os.system`.

Submissions failing these checks are marked `failed` with feedback; other challenges remain `pending` until expanded analyzers are introduced. When Semgrep matches fire, the submission response includes an `issues` array with tool/severity/message details.

## Tests

Run the API test suite (uses a temporary SQLite database) with:

```bash
pytest backend/tests
```
