# M9 MVP Metrics and Reporting Implementation Plan

> **For agentic workers:** Execute inline with test-driven development. Do not commit, push, deploy, or query production data without renewed user confirmation.

**Goal:** Build reproducible non-feedback MVP metrics and on-demand Markdown/CSV reports using trusted server-side records.

**Architecture:** Keep metric calculation as a pure function over sanitized records. Add low-cost first-success markers to user records and idempotent recommendation snapshots in controlled server flows. Expose reporting only through an owner-operated local command/read-only adapter; do not add a mini-program operations page.

**Tech Stack:** TypeScript, Node test runner, CloudBase repositories, Markdown/CSV text output.

## Global Constraints

- Use UTC timestamps and interpret seven-day windows consistently.
- Exclude `isTestUser=true` users and records owned by them.
- Deduplicate users by trusted `userId` and recommendations by `recommendationId`.
- A zero denominator renders `—`, never `0%`.
- Reports include cutoff time, numerator, denominator, percentage, status, and metric-definition version.
- Feedback metrics remain “暂不可用” until M10-01.
- Deleted business data can bias cumulative rates downward; every report must disclose this limitation.
- Do not add a user-facing operations dashboard.

---

### Task 1: Pure metric calculation and fixed fixtures

**Files:**
- Create: `cloudfunctions/api/src/metrics/calculate-metrics.ts`
- Create: `cloudfunctions/api/src/metrics/calculate-metrics.test.ts`

**Interfaces:**
- `calculateMvpMetrics(input)` consumes sanitized users and recommendation snapshots.
- Produces usage, seven-day reuse, scene-edit, itinerary-save, and feel-modification metric rows plus three unavailable feedback rows.

- [ ] Write failing tests covering test-user exclusion, user/recommendation deduplication, zero denominators, and exact seven-day boundaries.
- [ ] Run the focused test and confirm it fails because the module is absent.
- [ ] Implement the smallest pure calculation.
- [ ] Run the focused and cloud-function full suites.

### Task 2: First-success markers and recommendation snapshots

**Files:**
- Modify: `cloudfunctions/api/src/scenes/cloudbase-scene-repository.ts`
- Modify: `cloudfunctions/api/src/itineraries/cloudbase-itinerary-repository.ts`
- Modify: `cloudfunctions/api/src/auth/cloudbase-user-repository.ts`
- Modify: `cloudfunctions/api/src/recommendation/orchestrate-recommendation.ts`
- Create: `cloudfunctions/api/src/metrics/metric-marker-repository.ts`
- Create: focused repository/use-case tests beside each changed module.

**Interfaces:**
- User fields: `firstSceneEditedAt?`, `firstItinerarySavedAt?`, `firstFeelPreferenceModifiedAt?`, `isTestUser?`.
- Recommendation snapshots: `recommendationId`, trusted `userId`, `source`, `createdAt`; retries do not duplicate a snapshot.

- [ ] Add failing tests for each marker being written only after the first successful business mutation.
- [ ] Add failing tests for idempotent recommendation snapshot writes.
- [ ] Implement controlled same-flow writes without changing public DTOs.
- [ ] Run focused and full cloud-function tests.

### Task 3: Read-only Markdown and CSV report

**Files:**
- Create: `cloudfunctions/api/src/metrics/render-metric-report.ts`
- Create: `cloudfunctions/api/src/metrics/render-metric-report.test.ts`
- Create: `cloudfunctions/api/scripts/generate-metrics-report.mjs`
- Modify: `cloudfunctions/api/package.json`

**Interfaces:**
- `renderMetricMarkdown(report)` and `renderMetricCsv(report)` produce deterministic text.
- `npm run metrics:report -- --format markdown|csv --cutoff <ISO>` reads sanitized CloudBase records and writes only to stdout unless an explicit output path is supplied.

- [ ] Add failing snapshot-free exact-string tests for Markdown and CSV.
- [ ] Implement renderers with escaping and `—` handling.
- [ ] Add the owner-operated command with no default external writes.
- [ ] Validate fixed fixtures and document deletion-related approximation limits.

### Task 4: Final verification and status

**Files:**
- Modify: `PROGRESS.md`
- Modify: `TASK.md` only after all M9-04 gates pass.

- [ ] Run contracts, cloud functions, mini program, type checks, builds, and `git diff --check`.
- [ ] Generate Markdown and CSV from fixed sanitized fixtures and verify all exact numerators and denominators.
- [ ] Record remaining production-data authorization and deployment requirements.
