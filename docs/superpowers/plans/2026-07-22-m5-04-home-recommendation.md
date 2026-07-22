# M5-04 Home Recommendation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development. Do not commit, push, or deploy without explicit user authorization.

**Goal:** Add the homepage interaction that lets an authenticated user generate or refresh an all-day clothing recommendation and clearly see loading, AI/rules source, success, and retry states.

**Architecture:** A small recommendation service validates the CloudBase envelope and structured recommendation. A self-contained `RecommendationCard` owns request state and receives the current city; the homepage places it after weather and before today's itinerary.

**Tech Stack:** Taro 4.2, React 18, TypeScript 5.8, Vitest, React Testing Library, SCSS.

## Global Constraints

- Request body contains only `cityCode` and `cityName`.
- Generation starts only after a user click.
- Loading copy is exactly “综合全天行程，编排穿脱方案…”.
- Loading disables duplicate clicks.
- `source=rules` is labeled “通用策略”; no model confidence is shown.
- The card must not imply access to specific wardrobe items.

---

### Task 1: Recommendation client service

**Files:**

- Create: `miniprogram/src/features/recommendation/recommendation-service.ts`
- Create: `miniprogram/src/features/recommendation/recommendation-service.test.ts`

**Interfaces:**

- `Recommendation` has `summary`, typed `layers`, `tips`, and `source`.
- `createRecommendationService(call).generate(city)` calls `POST /v1/recommendations` with only city fields.

- [ ] Write tests for the exact request, valid response, failure envelope, network failure, and malformed response.
- [ ] Run the focused service test and confirm it fails because the module is missing.
- [ ] Implement the minimal validator and CloudBase adapter.
- [ ] Run the focused service test and confirm it passes.

### Task 2: Recommendation card states

**Files:**

- Create: `miniprogram/src/features/recommendation/RecommendationCard.tsx`
- Create: `miniprogram/src/features/recommendation/RecommendationCard.scss`
- Create: `miniprogram/src/features/recommendation/RecommendationCard.test.tsx`

**Interfaces:**

- `RecommendationCard({ city, service? })` accepts city-level location and an injectable `generate` service.

- [ ] Write component tests for idle state, loading copy and duplicate-click blocking, AI result, rules label, and failed-request retry.
- [ ] Run the focused component test and confirm it fails because the component is missing.
- [ ] Implement the state machine and structured layers/tips rendering using existing visual tokens.
- [ ] Run the focused component test and confirm it passes.

### Task 3: Homepage integration and verification

**Files:**

- Modify: `miniprogram/src/pages/index/index.tsx`
- Modify: `miniprogram/src/pages/index/index.scss`
- Modify: `PROGRESS.md`

- [ ] Insert `RecommendationCard` after `WeatherCard` and before `TodayItinerary`, rendering only when city is available.
- [ ] Run focused tests, full mini-program tests, typecheck, lint, WeChat build, root build, and `git diff --check`.
- [ ] Record M5-03 as accepted and M5-04 as awaiting developer-tool/true-device acceptance.
- [ ] Report verification evidence and exact acceptance steps; do not deploy or commit.
