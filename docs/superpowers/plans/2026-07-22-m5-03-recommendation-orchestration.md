# M5-03 Trusted Recommendation Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development to implement this plan task-by-task. This repository requires explicit user confirmation before any commit.

**Goal:** Make `POST /v1/recommendations` accept only city-level trigger data and build the LLM input on the server from trusted weather, today itineraries, and the authenticated user's feel preference.

**Architecture:** Add a recommendation orchestration use case between the router and the existing LLM/rules generator. The router supplies authenticated identity and repositories; the use case loads weather first, uses its `localDate` for the itinerary query, loads the current profile, and then calls the existing generator. The cloud-function entry must no longer bypass identity checks for recommendations.

**Tech Stack:** TypeScript 5.8, Node.js 20, Zod contracts, CloudBase repositories, Node test runner.

## Global Constraints

- Client input contains only `cityCode` and `cityName`; it must not contain identity, wardrobe data, itineraries, weather values, or feel preference.
- The service uses the complete itinerary list returned for the weather `localDate`.
- Missing profile or unavailable dependencies return a friendly failure envelope.
- LLM failure continues to fall back to local rules within the existing four-second timeout.
- Do not deploy, commit, or push without separate user authorization.

---

### Task 1: Trigger contract

**Files:**

- Modify: `packages/contracts/src/recommendation.ts`
- Test: `cloudfunctions/api/src/recommendation/orchestrate-recommendation.test.ts`

**Interfaces:**

- Produces: `recommendationRequestSchema` and `RecommendationRequest` containing exactly `cityCode` and `cityName`.

- [ ] Write a failing orchestration test that passes city data and asserts the LLM receives server-loaded weather, all itineraries, and the profile preference.
- [ ] Run `node --import tsx --test src/recommendation/orchestrate-recommendation.test.ts`; expect failure because the orchestration module does not exist.
- [ ] Add the strict Zod request schema and export its inferred type.

### Task 2: Trusted recommendation use case

**Files:**

- Create: `cloudfunctions/api/src/recommendation/orchestrate-recommendation.ts`
- Test: `cloudfunctions/api/src/recommendation/orchestrate-recommendation.test.ts`

**Interfaces:**

- Consumes: authenticated `TrustedIdentity`, `UserRepository`, `ItineraryRepository`, weather provider/cache, optional `LlmProvider`.
- Produces: `orchestrateRecommendation(body, identity, dependencies, requestId)` returning `ApiEnvelope<Recommendation>`.

- [ ] Test success with two itineraries and assert original ordering and duration values reach the LLM.
- [ ] Test strict rejection of client-supplied itinerary or preference fields.
- [ ] Test missing profile and repository/provider failures return friendly envelopes without invoking the LLM.
- [ ] Implement validation, weather loading, profile lookup, `weather.localDate` itinerary lookup, and delegation to `generateRecommendation`.
- [ ] Run the focused test until all cases pass.

### Task 3: Authenticated route integration

**Files:**

- Modify: `cloudfunctions/api/src/router.ts`
- Modify: `cloudfunctions/api/src/index.ts`
- Modify: `cloudfunctions/api/src/router.test.ts`
- Modify: `cloudfunctions/api/package.json`

**Interfaces:**

- `POST /v1/recommendations` is reachable only after CloudBase identity resolution.
- Router receives existing user, weather, itinerary, and LLM dependencies and passes them to the orchestration use case.

- [ ] Add a router test for the city-only request and trusted aggregate result.
- [ ] Run the router test and confirm it fails against the old direct generator route.
- [ ] Replace the direct generator call with the orchestration use case.
- [ ] Remove the pre-auth recommendation shortcut from the cloud-function entry.
- [ ] Add the orchestration test file to the package test command.
- [ ] Run `npm test` and `npm run build` in `cloudfunctions/api`.

### Task 4: Verification and status

**Files:**

- Modify: `TASK.md`
- Modify: `PROGRESS.md`

- [ ] Run `npm run typecheck` in `cloudfunctions/api`; distinguish pre-existing failures from M5-03 failures.
- [ ] Run root `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Record M5-02 complete and M5-03 implementation status without claiming deployment or true-device acceptance.
- [ ] Report changed files, passing evidence, pre-existing blockers, and the next frontend task. Do not commit.
