import type { Scene } from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";

export type DeleteSceneResult = { status: "deleted" } | { status: "not_found" };

export interface SceneCreateInput {
  name: string;
  category: Scene["category"];
  estimatedTemperatureCelsius: number;
  feel: Scene["feel"];
  note?: string | undefined;
}

export interface SceneUpdateInput {
  name: string;
  category: Scene["category"];
  estimatedTemperatureCelsius: number;
  feel: Scene["feel"];
  note?: string | undefined;
  expectedVersion: number;
}

export type UpdateSceneResult =
  | { status: "updated"; scene: Scene }
  | { status: "conflict" }
  | { status: "not_found" };

export interface SceneRepository {
  findCustomByIdentity(identity: TrustedIdentity): Promise<Scene[]>;
  create(input: SceneCreateInput, identity: TrustedIdentity): Promise<Scene>;
  findById(id: string, identity: TrustedIdentity): Promise<Scene | undefined>;
  update(
    id: string,
    input: SceneUpdateInput,
    identity: TrustedIdentity,
  ): Promise<UpdateSceneResult>;
  delete(id: string, identity: TrustedIdentity): Promise<DeleteSceneResult>;
}
