import {
  createOutfitRequestSchema,
  deleteOutfitRequestSchema,
  failure,
  success,
  type ApiEnvelope,
  type OutfitList,
  type PublicOutfit,
} from "../../../../packages/contracts/src/index.ts";
import type { ClothingRepository } from "../clothing/repository.ts";
import type { TrustedIdentity } from "../context.ts";
import type { OutfitRepository } from "./repository.ts";

export async function createOutfit(
  body: unknown,
  identity: TrustedIdentity,
  repository: OutfitRepository,
  clothingRepository: ClothingRepository,
  requestId: string,
): Promise<ApiEnvelope<PublicOutfit>> {
  const parsed = createOutfitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return failure(
      "VALIDATION_ERROR",
      "请填写搭配名称并至少添加一件衣物",
      false,
      requestId,
    );
  }

  try {
    const availableClothing = await clothingRepository.findByIdentity(identity);
    const availableIds = new Set(availableClothing.map((item) => item.id));
    if (parsed.data.nodes.some((node) => !availableIds.has(node.clothingId))) {
      return failure(
        "FORBIDDEN",
        "搭配中包含不可用的衣物，请刷新后重试",
        false,
        requestId,
      );
    }

    const outfit = await repository.create(parsed.data, identity);
    return success(outfit, requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "搭配保存失败，请稍后重试",
      true,
      requestId,
    );
  }
}

export async function deleteOutfit(
  id: string,
  body: unknown,
  identity: TrustedIdentity,
  repository: OutfitRepository,
  requestId: string,
): Promise<ApiEnvelope<Record<string, never>>> {
  const parsed = deleteOutfitRequestSchema.safeParse(body);
  if (!id || !parsed.success) {
    return failure("VALIDATION_ERROR", "删除搭配请求无效", false, requestId);
  }
  try {
    const result = await repository.delete(id, parsed.data, identity);
    if (result.status === "not_found") {
      return failure("NOT_FOUND", "搭配不存在或已删除", false, requestId);
    }
    if (result.status === "conflict") {
      return failure("CONFLICT", "搭配已更新，请刷新后重试", true, requestId);
    }
    return success({}, requestId);
  } catch {
    return failure("INTERNAL_ERROR", "搭配删除失败，请稍后重试", true, requestId);
  }
}

export async function listOutfits(
  identity: TrustedIdentity,
  repository: OutfitRepository,
  requestId: string,
): Promise<ApiEnvelope<OutfitList>> {
  try {
    const items = await repository.listByIdentity(identity);
    return success({ items }, requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "搭配加载失败，请稍后重试",
      true,
      requestId,
    );
  }
}

export async function getOutfit(
  id: string,
  identity: TrustedIdentity,
  repository: OutfitRepository,
  requestId: string,
): Promise<ApiEnvelope<PublicOutfit>> {
  try {
    const outfit = await repository.findById(id, identity);
    if (!outfit) {
      return failure("NOT_FOUND", "搭配不存在或已删除", false, requestId);
    }
    return success(outfit, requestId);
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "搭配加载失败，请稍后重试",
      true,
      requestId,
    );
  }
}
