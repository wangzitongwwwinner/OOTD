# Referenced Clothing Deletion Implementation Plan

> **For agentic workers:** Execute inline with test-driven development. Do not commit or push without renewed user confirmation.

**Goal:** Deleting clothing referenced by saved outfits requires a second confirmation and, after confirmation, atomically removes every matching outfit node before deleting the clothing.

**Architecture:** Extend the shared delete request with `confirmReferencedRemoval` and add a `CLOTHING_REFERENCED` error code. The application use case delegates the reference check and atomic mutation to `ClothingRepository.delete`; the CloudBase implementation uses a database transaction scoped to the trusted user. The mini program recognizes the typed business error, opens a destructive confirmation modal, and retries with confirmation.

**Tech Stack:** TypeScript, Zod, Node test runner, CloudBase database transactions, Taro, Vitest, React Testing Library.

## Global Constraints

- Never trust a client-supplied user ID; scope all reads and writes through `TrustedIdentity`.
- If references exist and confirmation is absent, perform no writes.
- After confirmation, outfit-node updates and clothing deletion must be one transaction.
- Do not implement soft deletion or historical placeholders in MVP.
- Do not commit, push, deploy, or modify production data in this task.

---

### Task 1: Shared contract and use-case behavior

**Files:**
- Modify: `packages/contracts/src/errors.ts`
- Modify: `packages/contracts/src/clothing.ts`
- Modify: `packages/contracts/src/clothing.test.ts`
- Modify: `cloudfunctions/api/src/clothing/repository.ts`
- Modify: `cloudfunctions/api/src/clothing/delete-clothing.ts`
- Modify: `cloudfunctions/api/src/clothing/delete-clothing.test.ts`

**Interfaces:**
- `DeleteClothingRequest`: `{ expectedVersion: number; confirmReferencedRemoval?: boolean }`
- Repository result adds `{ status: "referenced"; referenceCount: number }`
- API maps that result to `CLOTHING_REFERENCED` without mutating data.

- [ ] Add failing contract tests for the optional strict boolean and new error code.
- [ ] Run contract tests and confirm failure is caused by the missing fields.
- [ ] Add failing delete-use-case tests for referenced and confirmed calls.
- [ ] Run the focused cloud-function tests and confirm failure.
- [ ] Implement the minimal schemas, types, and error mapping.
- [ ] Run both focused suites and confirm they pass.

### Task 2: CloudBase atomic reference cleanup

**Files:**
- Modify: `cloudfunctions/api/src/clothing/cloudbase-clothing-repository.ts`
- Create: `cloudfunctions/api/src/clothing/cloudbase-clothing-repository.test.ts`

**Interfaces:**
- `delete(id, input, identity)` returns `referenced` before mutation when references exist and confirmation is false.
- With confirmation, each owned outfit node matching `clothingId` is removed, outfit `updatedAt` and `version` advance, then the owned clothing record is deleted in the same transaction.

- [ ] Add a failing repository test with one referenced and one unrelated node.
- [ ] Verify no transaction writes occur without confirmation.
- [ ] Add a failing confirmed-deletion test that asserts updated nodes and clothing removal.
- [ ] Implement the CloudBase transaction with trusted-user filters and optimistic clothing version validation.
- [ ] Run the repository and full cloud-function suites.

### Task 3: Mini-program two-stage confirmation

**Files:**
- Modify: `miniprogram/src/features/wardrobe/clothing-service.ts`
- Modify: `miniprogram/src/features/wardrobe/clothing-service.test.ts`
- Modify: `miniprogram/src/pages/wardrobe/index.tsx`
- Create or modify: `miniprogram/src/pages/wardrobe/index.test.tsx`

**Interfaces:**
- `ReferencedClothingError` identifies `CLOTHING_REFERENCED`.
- `deleteClothing(id, version, confirmReferencedRemoval = false)` passes the flag only for the confirmed retry.
- Page opens a modal explaining that saved outfits will be updated, retries only when the user confirms, and leaves local state unchanged on cancellation or failure.

- [ ] Add failing service tests for typed reference errors and confirmed retry payload.
- [ ] Add a failing page interaction test for cancellation and confirmation.
- [ ] Implement the minimal typed error and modal retry flow.
- [ ] Run focused tests, full mini-program tests, typecheck, lint, and production build.

### Task 4: Documentation and final verification

**Files:**
- Modify: `PROGRESS.md`
- Modify: `TASK.md` only if all M6/M7 acceptance gates are satisfied.

- [ ] Run contract, cloud-function, and mini-program full test suites.
- [ ] Run type checks, lint, builds, and `git diff --check`.
- [ ] Record implementation status, remaining deployment requirement, and Android acceptance steps in `PROGRESS.md`.
- [ ] Request deployment authorization only after local verification; do not commit or push.
