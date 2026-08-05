import type {
  CreateCutoutJobRequest,
  CutoutJob,
  PublicClothing,
  RetryCutoutJobRequest,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";

export interface InternalCutoutJob extends CutoutJob {
  sourceFileId: string;
  providerTaskId?: string;
}

export interface CutoutJobRepository {
  begin(
    input: CreateCutoutJobRequest,
    identity: TrustedIdentity,
  ): Promise<
    | { status: "created"; job: InternalCutoutJob }
    | { status: "not_found" }
    | { status: "conflict" }
  >;
  attachProviderTask(
    job: InternalCutoutJob,
    providerTaskId: string,
  ): Promise<InternalCutoutJob>;
  findById(
    id: string,
    identity: TrustedIdentity,
  ): Promise<InternalCutoutJob | undefined>;
  succeed(job: InternalCutoutJob, processedFileId: string): Promise<CutoutJob>;
  fail(job: InternalCutoutJob): Promise<CutoutJob>;
  retry(
    id: string,
    input: RetryCutoutJobRequest,
    identity: TrustedIdentity,
  ): Promise<
    | { status: "retried"; job: InternalCutoutJob }
    | { status: "not_found" }
    | { status: "conflict" }
    | { status: "exhausted" }
  >;
  confirm(
    id: string,
    expectedVersion: number,
    identity: TrustedIdentity,
  ): Promise<
    | { status: "confirmed"; clothing: PublicClothing }
    | { status: "not_found" }
    | { status: "conflict" }
  >;
}
