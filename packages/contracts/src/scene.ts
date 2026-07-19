import { z } from 'zod';

export const sceneCategorySchema = z.enum([
  'office',
  'home',
  'metro',
  'mall',
  'outdoor',
  'custom',
]);

export const sceneFeelSchema = z.enum([
  'cold',
  'comfortable',
  'stuffy',
  'cool',
]);

export const sceneSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().min(1).max(40),
    category: sceneCategorySchema,
    estimatedTemperatureCelsius: z.number().min(-50).max(60),
    feel: sceneFeelSchema,
    isPreset: z.boolean(),
    note: z.string().max(500).optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int().positive(),
  })
  .strict();

export const sceneListSchema = z
  .object({ items: z.array(sceneSchema).max(200) })
  .strict();

export type SceneCategory = z.infer<typeof sceneCategorySchema>;
export type SceneFeel = z.infer<typeof sceneFeelSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type SceneList = z.infer<typeof sceneListSchema>;
