import {
  createItineraryRequestSchema,
  failure,
  success,
  updateItineraryRequestSchema,
  type ApiEnvelope,
  type Itinerary,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import { recordMetricSafely } from "../metrics/cloudbase-metrics-recorder.ts";
import type { MetricsRecorder } from "../metrics/metrics-recorder.ts";
import type { ItineraryRepository } from "./repository.ts";

export async function createItinerary(
  body: unknown,
  identity: TrustedIdentity,
  repository: ItineraryRepository,
  requestId: string,
  metrics?: MetricsRecorder,
  clock: () => Date = () => new Date(),
): Promise<ApiEnvelope<Itinerary>> {
  const p = createItineraryRequestSchema.safeParse(body);
  if (!p.success)
    return failure(
      "VALIDATION_ERROR",
      "请填写完整的行程信息",
      false,
      requestId,
    );
  try {
    const item = await repository.create(p.data, identity);
    if (metrics) {
      await recordMetricSafely(() =>
        metrics.markFirstSuccess(
          identity,
          "firstItinerarySavedAt",
          clock().toISOString(),
        ),
      );
    }
    return success(item, requestId);
  } catch (e) {
    console.error(
      "createItinerary error:",
      e instanceof Error ? e.message : String(e),
    );
    return failure(
      "INTERNAL_ERROR",
      "行程添加失败，请稍后重试",
      true,
      requestId,
    );
  }
}

export async function updateItinerary(
  id: string,
  body: unknown,
  identity: TrustedIdentity,
  repository: ItineraryRepository,
  requestId: string,
  metrics?: MetricsRecorder,
  clock: () => Date = () => new Date(),
): Promise<ApiEnvelope<Itinerary>> {
  const p = updateItineraryRequestSchema.safeParse(body);
  if (!p.success)
    return failure(
      "VALIDATION_ERROR",
      "请填写完整的行程信息",
      false,
      requestId,
    );
  try {
    const existing = await repository.findById(id, identity);
    if (!existing)
      return failure("NOT_FOUND", "行程不存在或已删除", false, requestId);
    const r = await repository.update(id, p.data, identity);
    if (r.status === "updated") {
      if (metrics) {
        await recordMetricSafely(() =>
          metrics.markFirstSuccess(
            identity,
            "firstItinerarySavedAt",
            clock().toISOString(),
          ),
        );
      }
      return success(r.itinerary, requestId);
    }
    if (r.status === "conflict")
      return failure("CONFLICT", "行程已被修改，请刷新后重试", true, requestId);
    return failure("NOT_FOUND", "行程不存在或已删除", false, requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "行程编辑失败，请稍后重试",
      true,
      requestId,
    );
  }
}
