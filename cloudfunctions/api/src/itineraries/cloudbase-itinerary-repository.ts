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
    await this.ensureUserExamplesInitialized(user.id, date);
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
    await this.ensureUserExamplesInitialized(userId, new Date().toISOString().slice(0, 10));
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
        .where(EXAMPLE_IDS.has(id) ? { sourcePresetId: id, userId } : { id, userId })
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
    await this.ensureUserExamplesInitialized(userId, new Date().toISOString().slice(0, 10));
    try {
      const r = await this.database
        .collection("itineraries")
        .where(EXAMPLE_IDS.has(id) ? { sourcePresetId: id, userId } : { id, userId })
        .limit(1)
        .get();
      const s = r.data[0] as Record<string, unknown> | undefined;
      if (!s) return { status: "not_found" };
      if ((s.version as number) !== input.expectedVersion)
        return { status: "conflict" };
      const now = new Date().toISOString();
      const u: Record<string, unknown> = {
        startTime: input.startTime,
        sceneId: personalSceneId(input.sceneId, userId),
        sceneName: input.sceneName,
        sceneCategory: input.sceneCategory,
        estimatedTemperatureCelsius: input.estimatedTemperatureCelsius,
        durationMinutes: input.durationMinutes,
        version: (s.version as number) + 1,
        updatedAt: now,
      };
      await this.database
        .collection("itineraries")
        .where(EXAMPLE_IDS.has(id) ? { sourcePresetId: id, userId } : { id, userId })
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
    await this.ensureUserExamplesInitialized(userId, new Date().toISOString().slice(0, 10));
    try {
      const r = await this.database
        .collection("itineraries")
        .where(EXAMPLE_IDS.has(id) ? { sourcePresetId: id, userId } : { id, userId })
        .limit(1)
        .get();
      if (!r.data[0]) return { status: "not_found" };
      await this.database
        .collection("itineraries")
        .where(EXAMPLE_IDS.has(id) ? { sourcePresetId: id, userId } : { id, userId })
        .remove();
      return { status: "deleted" };
    } catch {
      return { status: "not_found" };
    }
  }

  private async ensureUserExamplesInitialized(userId: string, date: string) {
    const result = await this.database.collection("users").where({ id: userId }).limit(1).get();
    const user = result.data[0] as Record<string, unknown> | undefined;
    if (!user || user.itineraryExamplesInitializedVersion === 1) return;
    const now = new Date().toISOString();
    const itineraries = this.database.collection("itineraries");
    for (const example of EXAMPLE_ITINERARIES) {
      const existing = await itineraries
        .where({ userId, sourcePresetId: example.id })
        .limit(1)
        .get();
      if (existing.data.length) continue;
      const id = example.id + "__" + userId;
      await itineraries.doc(id).set({ ...example, id, sourcePresetId: example.id, sceneId: personalSceneId(example.sceneId, userId), userId, localDate: date, version: 1, createdAt: now, updatedAt: now });
    }
    await this.database.collection("users").doc(String(user._id ?? userId)).update({ itineraryExamplesInitializedVersion: 1, updatedAt: now });
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

const EXAMPLE_ITINERARIES = [
  { id: "preset_itinerary_metro", startTime: "08:00", sceneId: "preset_metro", sceneName: "\u5730\u94c1\u901a\u52e4", sceneCategory: "metro", estimatedTemperatureCelsius: 26, durationMinutes: 60 },
  { id: "preset_itinerary_office", startTime: "09:00", sceneId: "preset_office", sceneName: "\u529e\u516c\u5ba4", sceneCategory: "office", estimatedTemperatureCelsius: 22, durationMinutes: 480 },
] as const;
const EXAMPLE_IDS = new Set<string>(EXAMPLE_ITINERARIES.map((item) => item.id));
const SCENE_PRESET_IDS = new Set(["preset_office", "preset_home", "preset_metro", "preset_mall"]);
function personalSceneId(id: string, userId: string) { return SCENE_PRESET_IDS.has(id) ? id + "__" + userId : id; }

function toPublic(stored: unknown): Itinerary {
  if (typeof stored !== "object" || stored === null)
    throw new Error("Invalid itinerary");
  const {
    userId: _u,
    _id: _d,
    localDate: _ld,
    sourcePresetId: _sp,
    ...itinerary
  } = stored as Record<string, unknown>;
  void _u;
  void _d;
  void _ld;
  return itinerarySchema.parse({
    ...itinerary,
    ...(typeof _sp === "string" ? { id: _sp } : {}),
  });
}
