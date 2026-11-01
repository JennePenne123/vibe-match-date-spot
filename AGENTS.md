# AGENTS.md

- Scheduled jobs (pg_cron → edge functions) authenticate with the `x-cron-token` header read from `venue_import_control.cron_token` inside the cron SQL; functions check it via the async `isCronAuthorized()` in `supabase/functions/_shared/auth-guards.ts` (always `await` it). Why: no secret is embedded in cron SQL and one token covers all jobs; the old anon-key Bearer headers were rejected.
- Batch workers that skip recently-tried rows must exclude them in the database query (e.g. `get_wikimedia_photo_candidates`), not by over-fetching and filtering in code. Why: a fixed over-fetched window fills up with cooled-down rows and the worker stalls.
