import { z } from "zod";

const outfitTagSchema = z.string().trim().min(1).max(20);

export const outfitNodeSchema = z
  .object({
    clothingId: z.string().min(1).max(80),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    scale: z.number().min(0.3).max(3),
    rotation: z.number().min(-180).max(180),
    zIndex: z.number().int().min(0).max(1_000),
  })
  .strict();

export const createOutfitRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    seasonTags: z.array(outfitTagSchema).max(12),
    colorTags: z.array(outfitTagSchema).max(12),
    canvasVersion: z.literal(1),
    nodes: z.array(outfitNodeSchema).min(1).max(50),
  })
  .strict();

export const publicOutfitSchema = createOutfitRequestSchema
  .extend({
    id: z.string().min(1).max(80),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int().positive(),
  })
  .strict();

export const outfitListSchema = z
  .object({
    items: z.array(publicOutfitSchema).max(500),
  })
  .strict();

export const deleteOutfitRequestSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export type PublicOutfitNode = z.infer<typeof outfitNodeSchema>;
export type CreateOutfitRequest = z.infer<typeof createOutfitRequestSchema>;
export type PublicOutfit = z.infer<typeof publicOutfitSchema>;
export type OutfitList = z.infer<typeof outfitListSchema>;
export type DeleteOutfitRequest = z.infer<typeof deleteOutfitRequestSchema>;
