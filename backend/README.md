# Backend Notes

- [x] Implement persistence layer for challenge metadata using the configured SQLite database.
  - Run `python -m backend.db_init` to create tables and seed the bundled JSON challenges.
- [x] Expose endpoints for listing challenges.
- [x] Add submission endpoint storing pending fixes.
- [x] Provide submission retrieval endpoints.
- [ ] Implement full scoring workflow (static analysis + sandbox execution).
  - Current stub records submissions as pending with placeholder feedback.
- [ ] Integrate static analysis (Semgrep/Bandit) pipeline for submission scoring.
- [ ] Wire optional container sandbox execution flow.
- [ ] Add automated tests covering challenge retrieval and scoring logic.

## Available Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service health check. |
| GET | `/challenges` | List challenges. |
| GET | `/challenges/{slug}` | Retrieve challenge detail. |
| POST | `/submissions` | Submit a fix attempt (recorded as pending). |
| GET | `/submissions` | List submissions; optional `challenge_slug` filter. |
| GET | `/submissions/{submission_id}` | Fetch a submission by id. |
