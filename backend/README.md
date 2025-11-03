# Backend Notes

- [x] Implement persistence layer for challenge metadata using the configured SQLite database.
  - Run `python -m backend.db_init` to create tables and seed the bundled JSON challenges.
- [x] Expose endpoints for listing challenges.
- [x] Add submission endpoint storing pending fixes.
- [x] Provide submission retrieval endpoints.
- [x] Implement basic heuristic scoring for initial challenges.
- [ ] Implement full scoring workflow (static analysis + sandbox execution).
  - Current heuristics act as lightweight guards until full pipeline lands.
- [ ] Integrate static analysis (Semgrep/Bandit) pipeline for submission scoring.
- [ ] Wire optional container sandbox execution flow.
- [ ] Add automated tests covering challenge retrieval and scoring logic.

## Available Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service health check. |
| GET | `/challenges` | List challenges. |
| GET | `/challenges/{slug}` | Retrieve challenge detail. |
| POST | `/submissions` | Submit a fix attempt (heuristics run immediately). |
| GET | `/submissions` | List submissions; optional `challenge_slug` filter. |
| GET | `/submissions/{submission_id}` | Fetch a submission by id. |

## Configuration

| Environment Variable | Default | Description |
| --- | --- | --- |
| `VULNLABS_DEBUG` | `false` | Enables FastAPI debug mode. |
| `VULNLABS_DATABASE_URL` | SQLite file under `backend/data` | Connection string for persistence layer. |
| `VULNLABS_LOG_LEVEL` | `INFO` | Log verbosity (`DEBUG`, `INFO`, `WARNING`, etc.). |
| `VULNLABS_SEMGREP_RULES_ROOT` | `backend/static_analysis/semgrep` | Location of Semgrep rule packs. |

## Scoring Heuristics (Current)

The interim scoring service combines lightweight heuristics with optional Semgrep findings:

- `sqli_001`: looks for parameterized SQL usage and absence of string concatenation.
- `xss_001`: expects HTML escaping or sanitization helpers.
- `command_injection_001`: prefers `subprocess` calls without `shell=True` or `os.system`.
- Semgrep rules (if the `semgrep` CLI is installed) add additional warnings to the submission feedback payload.

Submissions failing these checks are marked `failed` with feedback; other challenges remain `pending` until expanded analyzers are introduced. When Semgrep matches fire, the submission response includes an `issues` array with tool/severity/message details.

## Tests

Run the API test suite (uses a temporary SQLite database) with:

```bash
pytest backend/tests
```
