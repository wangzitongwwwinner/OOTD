import type {
  CreateClothingUploadRequest,
  CreateClothingUploadResult,
  CompleteClothingUploadRequest,
  PublicClothing,
  UpdateClothingRequest,
  DeleteClothingRequest,
} from "../../../../packages/contracts/src/index.ts";
import type { TrustedIdentity } from "../context.ts";

export interface ClothingRepository {
  findByIdentity(identity: TrustedIdentity): Promise<PublicClothing[]>;
  createUploadDraft(
    input: CreateClothingUploadRequest,
    identity: TrustedIdentity,
  ): Promise<CreateClothingUploadResult>;
  completeUpload(
    id: string,
    input: CompleteClothingUploadRequest,
    identity: TrustedIdentity,
  ): Promise<
    | { status: "updated"; clothing: PublicClothing }
    | { status: "not_found" }
    | { status: "conflict" }
  >;
  update(
    id: string,
    input: UpdateClothingRequest,
    identity: TrustedIdentity,
  ): Promise<
    | { status: "updated"; clothing: PublicClothing }
    | { status: "not_found" }
    | { status: "conflict" }
  >;
  delete(
    id: string,
    input: DeleteClothingRequest,
    identity: TrustedIdentity,
  ): Promise<
    | { status: "deleted" }
    | { status: "referenced"; referenceCount: number }
    | { status: "not_found" }
    | { status: "conflict" }
  >;
}
