import {
  deleteClothingRequestSchema,
  failure,
  success,
  type ApiEnvelope,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { ClothingRepository } from "./repository.ts";

export async function deleteClothing(
  id: string,
  body: unknown,
  identity: TrustedIdentity,
  repository: ClothingRepository,
  requestId: string,
): Promise<ApiEnvelope<Record<string, never>>> {
  if (!id || typeof id !== "string" || id.length === 0) {
    return failure("INVALID_REQUEST", "衣物 ID 不能为空", false, requestId);
  }
  const parsed = deleteClothingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure("INVALID_REQUEST", "请求参数无效", false, requestId);
  }
  try {
    const result = await repository.delete(id, parsed.data, identity);
    if (result.status === "not_found") {
      return failure("NOT_FOUND", "衣物不存在", false, requestId);
    }
    if (result.status === "conflict") {
      return failure("CONFLICT", "衣物信息已被更新，请刷新后重试", true, requestId);
    }
    return success({}, requestId);
  } catch {
    return failure("INTERNAL_ERROR", "删除失败，请稍后重试", true, requestId);
  }
}