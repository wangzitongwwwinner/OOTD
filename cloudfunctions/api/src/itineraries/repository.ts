import type { Itinerary } from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";

export interface ItineraryCreateInput {
  startTime: string;
  sceneId: string;
  sceneName: string;
  sceneCategory: string;
  estimatedTemperatureCelsius: number;
  durationMinutes: number;
}

export interface ItineraryUpdateInput extends ItineraryCreateInput {
  expectedVersion: number;
}

export type UpdateItineraryResult =
  | { status: "updated"; itinerary: Itinerary }
  | { status: "conflict" }
  | { status: "not_found" };

export interface ItineraryRepository {
  findByDate(date: string, identity: TrustedIdentity): Promise<Itinerary[]>;
  create(
    input: ItineraryCreateInput,
    identity: TrustedIdentity,
  ): Promise<Itinerary>;
  findById(
    id: string,
    identity: TrustedIdentity,
  ): Promise<Itinerary | undefined>;
  update(
    id: string,
    input: ItineraryUpdateInput,
    identity: TrustedIdentity,
  ): Promise<UpdateItineraryResult>;
  delete(
    id: string,
    identity: TrustedIdentity,
  ): Promise<{ status: "deleted" } | { status: "not_found" }>;
}
