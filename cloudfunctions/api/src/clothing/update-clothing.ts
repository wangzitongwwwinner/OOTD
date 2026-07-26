import {
  failure,
  success,
  updateClothingRequestSchema,
  type ApiEnvelope,
  type PublicClothing,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { ClothingRepository } from "./repository.ts";

export async function updateClothing(
  id: string,
  body: unknown,
  identity: TrustedIdentity,
  repository: ClothingRepository,
  requestId: string,
): Promise<ApiEnvelope<PublicClothing>> {
  if (!id || typeof id !== "string" || id.length === 0) {
    return failure("VALIDATION_ERROR", "衣物 ID 不能为空", false, requestId);
  }

  const parsed = updateClothingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      "VALIDATION_ERROR",
      "请填写完整的衣物名称、类别和颜色",
      false,
      requestId,
    );
  }

  try {
    const result = await repository.update(id, parsed.data, identity);
    if (result.status === "not_found") {
      return failure("NOT_FOUND", "衣物不存在", false, requestId);
    }
    if (result.status === "conflict") {
      return failure(
        "CONFLICT",
        "衣物信息已被更新，请刷新后重试",
        true,
        requestId,
      );
    }
    return success(result.clothing, requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "更新失败，请稍后重试",
      true,
      requestId,
    );
  }
}
