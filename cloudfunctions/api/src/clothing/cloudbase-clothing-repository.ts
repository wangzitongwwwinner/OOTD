import { randomUUID } from "node:crypto";
import type { Db } from "@cloudbase/database";
import {
  clothingSchema,
  createClothingUploadRequestSchema,
  createClothingUploadResultSchema,
  type CreateClothingUploadRequest,
  type CreateClothingUploadResult,
  type CompleteClothingUploadRequest,
  type PublicClothing,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { ClothingRepository } from "./repository.ts";

export class CloudBaseClothingRepository implements ClothingRepository {
  constructor(private readonly database: Db) {}

  async findByIdentity(identity: TrustedIdentity): Promise<PublicClothing[]> {
    const users = await this.database
      .collection("users")
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = users.data[0] as { id?: unknown } | undefined;
    if (!user || typeof user.id !== "string") return [];
    const result = await this.database
      .collection("clothing")
      .where({ userId: user.id })
      .orderBy("updatedAt", "desc")
      .limit(500)
      .get();
    return result.data.map(toPublicClothing);
  }

  async createUploadDraft(
    input: CreateClothingUploadRequest,
    identity: TrustedIdentity,
  ): Promise<CreateClothingUploadResult> {
    const validated = createClothingUploadRequestSchema.parse(input);
    const userId = await this.resolveUserId(identity);
    if (!userId) throw new Error("User not found");

    const id = `clothing_${randomUUID()}`;
    const uploadPath = `clothing-sources/${userId}/${id}.${validated.extension}`;
    const now = new Date().toISOString();
    const stored = {
      id,
      userId,
      name: validated.name,
      category: validated.category,
      color: validated.color,
      sourceFileId: uploadPath,
      processingStatus: "draft" as const,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    await this.database.collection("clothing").add(stored);
    return createClothingUploadResultSchema.parse({
      clothing: toPublicClothing(stored),
      uploadPath,
    });
  }

  async completeUpload(
    id: string,
    input: CompleteClothingUploadRequest,
    identity: TrustedIdentity,
  ) {
    const userId = await this.resolveUserId(identity);
    if (!userId) return { status: "not_found" as const };
    const result = await this.database
      .collection("clothing")
      .where({ id, userId })
      .limit(1)
      .get();
    const stored = result.data[0] as Record<string, unknown> | undefined;
    if (!stored || stored.processingStatus !== "draft")
      return { status: "not_found" as const };
    if (stored.version !== input.expectedVersion)
      return { status: "conflict" as const };
    if (
      typeof stored.sourceFileId !== "string" ||
      !input.fileId.endsWith(`/${stored.sourceFileId}`)
    ) {
      return { status: "not_found" as const };
    }
    const updatedAt = new Date().toISOString();
    const next = {
      ...stored,
      sourceFileId: input.fileId,
      updatedAt,
      version: input.expectedVersion + 1,
    };
    const update = await this.database
      .collection("clothing")
      .where({ id, userId, version: input.expectedVersion })
      .update({
        sourceFileId: input.fileId,
        updatedAt,
        version: input.expectedVersion + 1,
      });
    if (update.updated !== 1) return { status: "conflict" as const };
    return { status: "updated" as const, clothing: toPublicClothing(next) };
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

function toPublicClothing(stored: unknown): PublicClothing {
  if (typeof stored !== "object" || stored === null)
    throw new Error("Invalid stored clothing");
  const {
    userId: _userId,
    _id: _databaseId,
    ...publicFields
  } = stored as Record<string, unknown>;
  return clothingSchema.parse(publicFields);
}
