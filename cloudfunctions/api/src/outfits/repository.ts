import type {
  CreateOutfitRequest,
  DeleteOutfitRequest,
  PublicOutfit,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";

export interface OutfitRepository {
  listByIdentity(identity: TrustedIdentity): Promise<PublicOutfit[]>;
  findById(
    id: string,
    identity: TrustedIdentity,
  ): Promise<PublicOutfit | undefined>;
  create(
    input: CreateOutfitRequest,
    identity: TrustedIdentity,
  ): Promise<PublicOutfit>;
  delete(
    id: string,
    input: DeleteOutfitRequest,
    identity: TrustedIdentity,
  ): Promise<
    | { status: "deleted" }
    | { status: "not_found" }
    | { status: "conflict" }
  >;
}
