import { randomUUID } from "node:crypto";
import type { Db } from "@cloudbase/database";
import {
  clothingSchema,
  cutoutJobSchema,
  type CreateCutoutJobRequest,
  type CutoutJob,
  type PublicClothing,
  type RetryCutoutJobRequest,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { CutoutJobRepository, InternalCutoutJob } from "./repository.ts";

export class CloudBaseCutoutJobRepository implements CutoutJobRepository {
  constructor(private readonly database: Db) {}

  async begin(input: CreateCutoutJobRequest, identity: TrustedIdentity) {
    const userId = await this.resolveUserId(identity);
    if (!userId) return { status: "not_found" as const };
    const clothingResult = await this.database
      .collection("clothing")
      .where({ id: input.clothingId, userId })
      .limit(1)
      .get();
    const clothing = clothingResult.data[0] as
      Record<string, unknown> | undefined;
    if (!clothing) return { status: "not_found" as const };
    if (
      clothing.version !== input.expectedVersion ||
      clothing.processingStatus !== "draft"
    ) {
      return { status: "conflict" as const };
    }
    if (
      typeof clothing.sourceFileId !== "string" ||
      !clothing.sourceFileId.startsWith("cloud://")
    ) {
      return { status: "conflict" as const };
    }

    const now = new Date().toISOString();
    const job: InternalCutoutJob = {
      id: `cutout_${randomUUID()}`,
      clothingId: input.clothingId,
      status: "processing",
      attempts: 1,
      sourceFileId: clothing.sourceFileId,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    await this.database
      .collection("image_processing_jobs")
      .add({ ...job, userId });
    const updated = await this.database
      .collection("clothing")
      .where({
        id: input.clothingId,
        userId,
        version: input.expectedVersion,
        processingStatus: "draft",
      })
      .update({
        processingStatus: "processing",
        updatedAt: now,
        version: input.expectedVersion + 1,
      });
    if (updated.updated !== 1) {
      await this.database
        .collection("image_processing_jobs")
        .where({ id: job.id, userId })
        .remove();
      return { status: "conflict" as const };
    }
    return { status: "created" as const, job };
  }

  async attachProviderTask(
    job: InternalCutoutJob,
    providerTaskId: string,
  ): Promise<InternalCutoutJob> {
    await this.database
      .collection("image_processing_jobs")
      .where({ id: job.id })
      .update({ providerTaskId, updatedAt: new Date().toISOString() });
    return { ...job, providerTaskId };
  }

  async findById(
    id: string,
    identity: TrustedIdentity,
  ): Promise<InternalCutoutJob | undefined> {
    const userId = await this.resolveUserId(identity);
    if (!userId) return undefined;
    const result = await this.database
      .collection("image_processing_jobs")
      .where({ id, userId })
      .limit(1)
      .get();
    const stored = result.data[0];
    return stored ? toInternalJob(stored) : undefined;
  }

  async succeed(
    job: InternalCutoutJob,
    processedFileId: string,
  ): Promise<CutoutJob> {
    const now = new Date().toISOString();
    const next = {
      ...toPublicJob(job),
      status: "succeeded" as const,
      processedFileId,
      updatedAt: now,
      version: job.version + 1,
    };
    await this.database
      .collection("clothing")
      .where({ id: job.clothingId, processingStatus: "processing" })
      .update({ processingStatus: "review", processedFileId, updatedAt: now });
    await this.database
      .collection("image_processing_jobs")
      .where({ id: job.id })
      .update({
        status: next.status,
        processedFileId,
        updatedAt: now,
        version: next.version,
      });
    return cutoutJobSchema.parse(next);
  }

  async fail(job: InternalCutoutJob): Promise<CutoutJob> {
    const now = new Date().toISOString();
    const next = {
      ...toPublicJob(job),
      status: "failed" as const,
      message: "智能抠图失败，请重试",
      updatedAt: now,
      version: job.version + 1,
    };
    await this.database
      .collection("clothing")
      .where({ id: job.clothingId, processingStatus: "processing" })
      .update({ processingStatus: "failed", updatedAt: now });
    await this.database
      .collection("image_processing_jobs")
      .where({ id: job.id })
      .update({
        status: next.status,
        message: next.message,
        updatedAt: now,
        version: next.version,
      });
    return cutoutJobSchema.parse(next);
  }

  async retry(
    id: string,
    input: RetryCutoutJobRequest,
    identity: TrustedIdentity,
  ) {
    const job = await this.findById(id, identity);
    if (!job) return { status: "not_found" as const };
    if (job.version !== input.expectedVersion || job.status !== "failed")
      return { status: "conflict" as const };
    if (job.attempts >= 2) return { status: "exhausted" as const };
    const now = new Date().toISOString();
    const next: InternalCutoutJob = {
      ...job,
      status: "processing",
      attempts: job.attempts + 1,
      updatedAt: now,
      version: job.version + 1,
    };
    delete (next as { message?: string }).message;
    delete next.providerTaskId;
    const updated = await this.database
      .collection("image_processing_jobs")
      .where({ id, version: input.expectedVersion, status: "failed" })
      .update({
        status: "processing",
        attempts: next.attempts,
        message: this.database.command.remove(),
        providerTaskId: this.database.command.remove(),
        updatedAt: now,
        version: next.version,
      });
    if (updated.updated !== 1) return { status: "conflict" as const };
    await this.database
      .collection("clothing")
      .where({ id: job.clothingId, processingStatus: "failed" })
      .update({ processingStatus: "processing", updatedAt: now });
    return { status: "retried" as const, job: next };
  }

  async confirm(
    id: string,
    expectedVersion: number,
    identity: TrustedIdentity,
  ) {
    const userId = await this.resolveUserId(identity);
    if (!userId) return { status: "not_found" as const };
    const jobResult = await this.database
      .collection("image_processing_jobs")
      .where({ id, userId })
      .limit(1)
      .get();
    const storedJob = jobResult.data[0] as
      | Record<string, unknown>
      | undefined;
    if (!storedJob) return { status: "not_found" as const };
    if (
      storedJob.status !== "succeeded" ||
      storedJob.version !== expectedVersion ||
      typeof storedJob.clothingId !== "string" ||
      typeof storedJob.processedFileId !== "string"
    ) {
      return { status: "conflict" as const };
    }
    const clothingResult = await this.database
      .collection("clothing")
      .where({ id: storedJob.clothingId, userId })
      .limit(1)
      .get();
    const storedClothing = clothingResult.data[0] as
      | Record<string, unknown>
      | undefined;
    if (!storedClothing) return { status: "not_found" as const };
    if (
      storedClothing.processingStatus !== "review" ||
      storedClothing.processedFileId !== storedJob.processedFileId ||
      typeof storedClothing.version !== "number"
    ) {
      return { status: "conflict" as const };
    }
    const now = new Date().toISOString();
    const nextVersion = storedClothing.version + 1;
    const updated = await this.database
      .collection("clothing")
      .where({
        id: storedJob.clothingId,
        userId,
        processingStatus: "review",
        version: storedClothing.version,
      })
      .update({
        processingStatus: "ready",
        updatedAt: now,
        version: nextVersion,
      });
    if (updated.updated !== 1) return { status: "conflict" as const };
    return {
      status: "confirmed" as const,
      clothing: toPublicClothing({
        ...storedClothing,
        processingStatus: "ready",
        updatedAt: now,
        version: nextVersion,
      }),
    };
  }

  private async resolveUserId(
    identity: TrustedIdentity,
  ): Promise<string | undefined> {
    const users = await this.database
      .collection("users")
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = users.data[0] as { id?: unknown } | undefined;
    return user && typeof user.id === "string" ? user.id : undefined;
  }
}

function toPublicClothing(stored: Record<string, unknown>): PublicClothing {
  const { userId: _user, _id: _databaseId, ...publicFields } = stored;
  return clothingSchema.parse(publicFields);
}

function toInternalJob(stored: unknown): InternalCutoutJob {
  if (typeof stored !== "object" || stored === null)
    throw new Error("Invalid cutout job");
  const {
    userId: _user,
    _id: _databaseId,
    sourceFileId,
    providerTaskId,
    ...job
  } = stored as Record<string, unknown>;
  const publicJob = cutoutJobSchema.parse(job);
  if (typeof sourceFileId !== "string") throw new Error("Invalid source file");
  return {
    ...publicJob,
    sourceFileId,
    ...(typeof providerTaskId === "string" ? { providerTaskId } : {}),
  };
}

function toPublicJob(job: InternalCutoutJob): CutoutJob {
  const {
    sourceFileId: _source,
    providerTaskId: _provider,
    ...publicJob
  } = job;
  return cutoutJobSchema.parse(publicJob);
}
