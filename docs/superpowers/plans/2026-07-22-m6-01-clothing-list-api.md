# M6-01 Clothing List API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development. Do not commit, push, deploy, create collections, or change permissions without explicit user authorization.

**Goal:** Establish the production clothing contract and an authenticated, user-isolated `GET /v1/clothing` API that later upload, processing, editing, deletion, and wardrobe UI tasks can reuse.

**Architecture:** Shared Zod contracts define stable clothing categories, processing states, public clothing records, and list envelopes. A clothing repository owns persistence and strips database/user fields; a list use case and router expose only records belonging to the trusted WeChat identity.

**Tech Stack:** TypeScript 5.8, Zod, Node.js 20, CloudBase database, Node test runner.

## Global Constraints

- Clothing categories are `top`, `bottom`, `shoes`, and `accessory`.
- Processing states are `draft`, `processing`, `ready`, and `failed`.
- Public responses never expose `userId`, WeChat identity, database `_id`, storage credentials, or private storage paths.
- The client cannot choose or override identity.
- This task does not upload files, call MPS, create image-processing jobs, edit clothing, or delete clothing.

---

### Task 1: Shared clothing contract

**Files:**

- Create: `packages/contracts/src/clothing.ts`
- Create: `packages/contracts/src/clothing.test.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/package.json`

- [ ] Write failing tests for a valid clothing list and rejection of unknown fields, invalid categories, invalid states, and `processedFileId` on non-ready records.
- [ ] Run the focused contract test and confirm failure because the module is missing.
- [ ] Implement strict schemas for clothing records and `{ items }` lists, then export them.
- [ ] Run the focused contract test and confirm it passes.

### Task 2: Trusted list use case and repository boundary

**Files:**

- Create: `cloudfunctions/api/src/clothing/repository.ts`
- Create: `cloudfunctions/api/src/clothing/list-clothing.ts`
- Create: `cloudfunctions/api/src/clothing/list-clothing.test.ts`

- [ ] Write a failing test asserting trusted identity is passed to the repository and public clothing is returned in a standard envelope.
- [ ] Add repository-failure coverage expecting a friendly retryable error without internal details.
- [ ] Implement the minimal repository interface and list use case.
- [ ] Run the focused tests and confirm they pass.

### Task 3: CloudBase repository and route integration

**Files:**

- Create: `cloudfunctions/api/src/clothing/cloudbase-clothing-repository.ts`
- Modify: `cloudfunctions/api/src/router.ts`
- Modify: `cloudfunctions/api/src/router.test.ts`
- Modify: `cloudfunctions/api/src/index.ts`
- Modify: `cloudfunctions/api/package.json`
- Modify: `PROGRESS.md`

- [ ] Add a failing router test for authenticated `GET /v1/clothing`.
- [ ] Implement the CloudBase identity-to-user lookup, user-scoped clothing query, public-field mapping, and route dependency.
- [ ] Run cloud-function tests, typecheck, build, root build, and `git diff --check`.
- [ ] Record M5-04 as accepted and M6-01 as awaiting deployment/database acceptance.
- [ ] Provide exact collection and cloud-test acceptance steps; do not deploy or change CloudBase automatically.
