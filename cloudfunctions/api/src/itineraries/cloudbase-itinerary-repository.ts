import type { Db } from "@cloudbase/database";
import {
  createItineraryRequestSchema,
  itinerarySchema,
  updateItineraryRequestSchema,
  type Itinerary,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";
import type {
  ItineraryCreateInput,
  ItineraryRepository,
  ItineraryUpdateInput,
  UpdateItineraryResult,
} from "./repository.ts";

export class CloudBaseItineraryRepository implements ItineraryRepository {
  constructor(private readonly database: Db) {}

  async findByDate(
    date: string,
    identity: TrustedIdentity,
  ): Promise<Itinerary[]> {
    const users = await this.database
      .collection("users")
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const user = users.data[0] as { id?: unknown } | undefined;
    if (!user || typeof user.id !== "string") return [];
    try {
      const result = await this.database
        .collection("itineraries")
        .where({ userId: user.id, localDate: date })
        .orderBy("startTime", "asc")
        .limit(100)
        .get();
      return result.data.map((stored: unknown) => toPublic(stored));
    } catch {
      return [];
    }
  }

  async create(
    input: ItineraryCreateInput,
    identity: TrustedIdentity,
  ): Promise<Itinerary> {
    const v = createItineraryRequestSchema.safeParse(input);
    if (!v.success)
      throw new Error("create validation: " + JSON.stringify(v.error.issues));
    const userId = await this.resolveUserId(identity);
    if (!userId) throw new Error("create: user not found");
    const id = "iti_" + Math.random().toString(36).slice(2, 14);
    const now = new Date().toISOString();
    try {
      const doc: Record<string, unknown> = {
        ...v.data,
        id,
        userId,
        localDate: now.slice(0, 10),
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      await this.database.collection("itineraries").add(doc);
      return toPublic(doc);
    } catch (e) {
      throw new Error(
        "create db: " + (e instanceof Error ? e.message : String(e)),
      );
    }
  }

  async findById(
    id: string,
    identity: TrustedIdentity,
  ): Promise<Itinerary | undefined> {
    const userId = await this.resolveUserId(identity);
    if (!userId) return undefined;
    try {
      const r = await this.database
        .collection("itineraries")
        .where({ id, userId })
        .limit(1)
        .get();
      const s = r.data[0];
      return s ? toPublic(s) : undefined;
    } catch {
      return undefined;
    }
  }

  async update(
    id: string,
    input: ItineraryUpdateInput,
    identity: TrustedIdentity,
  ): Promise<UpdateItineraryResult> {
    const v = updateItineraryRequestSchema.safeParse(input);
    if (!v.success) throw new Error("行程输入校验失败");
    const userId = await this.resolveUserId(identity);
    if (!userId) return { status: "not_found" };
    try {
      const r = await this.database
        .collection("itineraries")
        .where({ id, userId })
        .limit(1)
        .get();
      const s = r.data[0] as Record<string, unknown> | undefined;
      if (!s) return { status: "not_found" };
      if ((s.version as number) !== input.expectedVersion)
        return { status: "conflict" };
      const now = new Date().toISOString();
      const u: Record<string, unknown> = {
        startTime: input.startTime,
        sceneId: input.sceneId,
        sceneName: input.sceneName,
        sceneCategory: input.sceneCategory,
        estimatedTemperatureCelsius: input.estimatedTemperatureCelsius,
        durationMinutes: input.durationMinutes,
        version: (s.version as number) + 1,
        updatedAt: now,
      };
      await this.database
        .collection("itineraries")
        .where({ id, userId })
        .update(u);
      const fresh = await this.findById(id, identity);
      return fresh
        ? { status: "updated", itinerary: fresh }
        : { status: "not_found" };
    } catch {
      return { status: "not_found" };
    }
  }

  async delete(
    id: string,
    identity: TrustedIdentity,
  ): Promise<{ status: "deleted" } | { status: "not_found" }> {
    const userId = await this.resolveUserId(identity);
    if (!userId) return { status: "not_found" };
    try {
      const r = await this.database
        .collection("itineraries")
        .where({ id, userId })
        .limit(1)
        .get();
      if (!r.data[0]) return { status: "not_found" };
      await this.database
        .collection("itineraries")
        .where({ id, userId })
        .remove();
      return { status: "deleted" };
    } catch {
      return { status: "not_found" };
    }
  }

  private async resolveUserId(
    identity: TrustedIdentity,
  ): Promise<string | undefined> {
    const users = await this.database
      .collection("users")
      .where({ wechatOpenId: identity.openId, wechatAppId: identity.appId })
      .limit(1)
      .get();
    const u = users.data[0] as { id?: unknown } | undefined;
    return u && typeof u.id === "string" ? u.id : undefined;
  }
}

function toPublic(stored: unknown): Itinerary {
  if (typeof stored !== "object" || stored === null)
    throw new Error("Invalid itinerary");
  const {
    userId: _u,
    _id: _d,
    localDate: _ld,
    ...itinerary
  } = stored as Record<string, unknown>;
  void _u;
  void _d;
  void _ld;
  return itinerarySchema.parse(itinerary);
}
