import { randomUUID } from "node:crypto";

import type { Db } from "@cloudbase/database";
import {
  createOutfitRequestSchema,
  publicOutfitSchema,
  type CreateOutfitRequest,
  type DeleteOutfitRequest,
  type PublicOutfit,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type { OutfitRepository } from "./repository.ts";

export class CloudBaseOutfitRepository implements OutfitRepository {
  constructor(private readonly database: Db) {}

  async listByIdentity(identity: TrustedIdentity): Promise<PublicOutfit[]> {
    const userId = await this.resolveUserId(identity);
    if (!userId) return [];
    const result = await this.database
      .collection("outfits")
      .where({ userId })
      .orderBy("updatedAt", "desc")
      .limit(500)
      .get();
    return result.data.map(toPublicOutfit);
  }

  async findById(
    id: string,
    identity: TrustedIdentity,
  ): Promise<PublicOutfit | undefined> {
    const userId = await this.resolveUserId(identity);
    if (!userId) return undefined;
    const result = await this.database
      .collection("outfits")
      .where({ id, userId })
      .limit(1)
      .get();
    const stored = result.data[0];
    return stored === undefined ? undefined : toPublicOutfit(stored);
  }

  async create(
    input: CreateOutfitRequest,
    identity: TrustedIdentity,
  ): Promise<PublicOutfit> {
    const validated = createOutfitRequestSchema.parse(input);
    const userId = await this.resolveUserId(identity);
    if (!userId) throw new Error("User not found");
    const now = new Date().toISOString();
    const stored = {
      id: `outfit_${randomUUID()}`,
      userId,
      ...validated,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    await this.database.collection("outfits").add(stored);
    return toPublicOutfit(stored);
  }

  async delete(
    id: string,
    input: DeleteOutfitRequest,
    identity: TrustedIdentity,
  ) {
    const userId = await this.resolveUserId(identity);
    if (!userId) return { status: "not_found" as const };
    const existing = await this.database
      .collection("outfits")
      .where({ id, userId })
      .limit(1)
      .get();
    const stored = existing.data[0] as Record<string, unknown> | undefined;
    if (!stored) return { status: "not_found" as const };
    if (stored.version !== input.expectedVersion) {
      return { status: "conflict" as const };
    }
    const removed = await this.database
      .collection("outfits")
      .where({ id, userId, version: input.expectedVersion })
      .remove();
    return removed.deleted === 1
      ? { status: "deleted" as const }
      : { status: "conflict" as const };
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

function toPublicOutfit(stored: unknown): PublicOutfit {
  if (typeof stored !== "object" || stored === null) {
    throw new Error("Invalid stored outfit");
  }
  const {
    userId: _userId,
    _id: _databaseId,
    ...publicFields
  } = stored as Record<string, unknown>;
  void _userId;
  void _databaseId;
  return publicOutfitSchema.parse(publicFields);
}
