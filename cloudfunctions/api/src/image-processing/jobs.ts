import {
  createCutoutJobRequestSchema,
  cutoutJobSchema,
  failure,
  retryCutoutJobRequestSchema,
  success,
  type ApiEnvelope,
  type CutoutJob,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { CutoutProvider } from "./provider.ts";
import type { CutoutJobRepository, InternalCutoutJob } from "./repository.ts";

interface Dependencies {
  repository: CutoutJobRepository;
  provider: CutoutProvider;
}

export async function startCutoutJob(
  body: unknown,
  identity: TrustedIdentity,
  dependencies: Dependencies,
  requestId: string,
): Promise<ApiEnvelope<CutoutJob>> {
  let pendingJob: InternalCutoutJob | undefined;
  const input = createCutoutJobRequestSchema.safeParse(body);
  if (!input.success)
    return failure(
      "VALIDATION_ERROR",
      "衣物状态无效，请刷新后重试",
      false,
      requestId,
    );
  try {
    const begun = await dependencies.repository.begin(input.data, identity);
    if (begun.status === "not_found")
      return failure("NOT_FOUND", "衣物不存在", false, requestId);
    if (begun.status === "conflict")
      return failure(
        "CONFLICT",
        "衣物状态已更新，请刷新后重试",
        true,
        requestId,
      );
    pendingJob = begun.job;
    const submitted = await dependencies.provider.submit({
      sourceFileId: begun.job.sourceFileId,
      outputPath: `clothing-processed/${begun.job.clothingId}/${begun.job.id}.png`,
    });
    const stored = await dependencies.repository.attachProviderTask(
      begun.job,
      submitted.taskId,
    );
    return success(toPublicJob(stored), requestId);
  } catch {
    await markFailedAfterSubmitError(pendingJob, dependencies.repository);
    return failure(
      "EXTERNAL_SERVICE_ERROR",
      "智能抠图暂时不可用，请稍后重试",
      true,
      requestId,
    );
  }
}

export async function getCutoutJob(
  id: string,
  identity: TrustedIdentity,
  dependencies: Dependencies,
  requestId: string,
): Promise<ApiEnvelope<CutoutJob>> {
  try {
    const job = await dependencies.repository.findById(id, identity);
    if (!job) return failure("NOT_FOUND", "抠图任务不存在", false, requestId);
    if (job.status !== "processing" || !job.providerTaskId)
      return success(toPublicJob(job), requestId);
    const inspected = await dependencies.provider.inspect(job.providerTaskId);
    if (inspected.status === "processing")
      return success(toPublicJob(job), requestId);
    const updated =
      inspected.status === "succeeded"
        ? await dependencies.repository.succeed(job, inspected.processedFileId)
        : await dependencies.repository.fail(job);
    return success(cutoutJobSchema.parse(updated), requestId);
  } catch {
    return failure(
      "EXTERNAL_SERVICE_ERROR",
      "抠图状态查询失败，请稍后重试",
      true,
      requestId,
    );
  }
}

export async function retryCutoutJob(
  id: string,
  body: unknown,
  identity: TrustedIdentity,
  dependencies: Dependencies,
  requestId: string,
): Promise<ApiEnvelope<CutoutJob>> {
  let pendingJob: InternalCutoutJob | undefined;
  const input = retryCutoutJobRequestSchema.safeParse(body);
  if (!id || !input.success)
    return failure(
      "VALIDATION_ERROR",
      "重试请求无效，请刷新后重试",
      false,
      requestId,
    );
  try {
    const retried = await dependencies.repository.retry(
      id,
      input.data,
      identity,
    );
    if (retried.status === "not_found")
      return failure("NOT_FOUND", "抠图任务不存在", false, requestId);
    if (retried.status === "conflict")
      return failure(
        "CONFLICT",
        "任务状态已更新，请刷新后重试",
        true,
        requestId,
      );
    if (retried.status === "exhausted")
      return failure(
        "CONFLICT",
        "已达到最大重试次数，请重新上传图片",
        false,
        requestId,
      );
    pendingJob = retried.job;
    const submitted = await dependencies.provider.submit({
      sourceFileId: retried.job.sourceFileId,
      outputPath: `clothing-processed/${retried.job.clothingId}/${retried.job.id}.png`,
    });
    const stored = await dependencies.repository.attachProviderTask(
      retried.job,
      submitted.taskId,
    );
    return success(toPublicJob(stored), requestId);
  } catch {
    await markFailedAfterSubmitError(pendingJob, dependencies.repository);
    return failure(
      "EXTERNAL_SERVICE_ERROR",
      "智能抠图暂时不可用，请稍后重试",
      true,
      requestId,
    );
  }
}

function toPublicJob(job: InternalCutoutJob): CutoutJob {
  const {
    sourceFileId: _source,
    providerTaskId: _provider,
    ...publicJob
  } = job;
  return cutoutJobSchema.parse(publicJob);
}

async function markFailedAfterSubmitError(
  job: InternalCutoutJob | undefined,
  repository: CutoutJobRepository,
): Promise<void> {
  if (!job) return;
  try {
    await repository.fail(job);
  } catch {
    // Preserve the original provider error response; recovery is best effort.
  }
}
