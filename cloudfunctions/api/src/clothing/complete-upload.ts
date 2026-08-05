import {
  clothingSchema,
  completeClothingUploadRequestSchema,
  failure,
  success,
  type ApiEnvelope,
  type PublicClothing,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { ClothingRepository } from "./repository.ts";

export async function completeClothingUpload(
  id: string,
  body: unknown,
  identity: TrustedIdentity,
  repository: ClothingRepository,
  requestId: string,
): Promise<ApiEnvelope<PublicClothing>> {
  const input = completeClothingUploadRequestSchema.safeParse(body);
  if (!id || !input.success)
    return failure(
      "VALIDATION_ERROR",
      "上传结果无效，请重新选择图片",
      false,
      requestId,
    );
  try {
    const result = await repository.completeUpload(id, input.data, identity);
    if (result.status === "not_found")
      return failure("NOT_FOUND", "衣物草稿不存在", false, requestId);
    if (result.status === "conflict")
      return failure(
        "CONFLICT",
        "衣物状态已更新，请刷新后重试",
        true,
        requestId,
      );
    return success(clothingSchema.parse(result.clothing), requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "上传确认失败，请稍后重试",
      true,
      requestId,
    );
  }
}
