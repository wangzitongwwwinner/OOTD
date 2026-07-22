import {
  failure,
  success,
  type ApiEnvelope,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { ItineraryRepository } from "./repository.ts";

export async function deleteItinerary(
  id: string,
  identity: TrustedIdentity,
  repository: ItineraryRepository,
  requestId: string,
): Promise<ApiEnvelope<null>> {
  try {
    const r = await repository.delete(id, identity);
    if (r.status === "deleted") return success(null, requestId);
    return failure("NOT_FOUND", "行程不存在或已删除", false, requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "行程删除失败，请稍后重试",
      true,
      requestId,
    );
  }
}
