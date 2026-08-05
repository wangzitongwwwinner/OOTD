import {
  clothingListSchema,
  failure,
  success,
  type ApiEnvelope,
  type ClothingList,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { ClothingRepository } from "./repository.ts";

export async function listClothing(
  identity: TrustedIdentity,
  repository: ClothingRepository,
  requestId: string,
): Promise<ApiEnvelope<ClothingList>> {
  try {
    return success(
      clothingListSchema.parse({
        items: await repository.findByIdentity(identity),
      }),
      requestId,
    );
  } catch {
    return failure(
      "INTERNAL_ERROR",
      "衣橱加载失败，请稍后重试",
      true,
      requestId,
    );
  }
}
