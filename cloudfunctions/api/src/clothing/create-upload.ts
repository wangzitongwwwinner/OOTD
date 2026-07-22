import {
  createClothingUploadRequestSchema,
  createClothingUploadResultSchema,
  failure,
  success,
  type ApiEnvelope,
  type CreateClothingUploadResult,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { ClothingRepository } from "./repository.ts";

export async function createClothingUpload(
  body: unknown,
  identity: TrustedIdentity,
  repository: ClothingRepository,
  requestId: string,
): Promise<ApiEnvelope<CreateClothingUploadResult>> {
  const parsed = createClothingUploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      "VALIDATION_ERROR",
      "请选择不超过 10 MB 的 JPG 或 PNG 图片",
      false,
      requestId,
    );
  }

  try {
    const draft = await repository.createUploadDraft(parsed.data, identity);
    return success(createClothingUploadResultSchema.parse(draft), requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "上传准备失败，请稍后重试",
      true,
      requestId,
    );
  }
}
