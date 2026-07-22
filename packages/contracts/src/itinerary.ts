import { z } from "zod";

export const itinerarySchema = z
  .object({
    id: z.string().min(1).max(64),
    startTime: z.string(),
    sceneId: z.string().min(1).max(64),
    sceneName: z.string().min(1).max(40),
    sceneCategory: z.enum([
      "office",
      "home",
      "metro",
      "mall",
      "outdoor",
      "custom",
    ]),
    estimatedTemperatureCelsius: z.number().min(-50).max(60),
    durationMinutes: z.number().int().min(5).max(1440),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int().positive(),
  })
  .strict();

export const createItineraryRequestSchema = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    sceneId: z.string().min(1).max(64),
    sceneName: z.string().min(1).max(40),
    sceneCategory: z.enum([
      "office",
      "home",
      "metro",
      "mall",
      "outdoor",
      "custom",
    ]),
    estimatedTemperatureCelsius: z.number().min(-50).max(60),
    durationMinutes: z.number().int().min(5).max(1440),
  })
  .strict();

export const updateItineraryRequestSchema = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    sceneId: z.string().min(1).max(64),
    sceneName: z.string().min(1).max(40),
    sceneCategory: z.enum([
      "office",
      "home",
      "metro",
      "mall",
      "outdoor",
      "custom",
    ]),
    estimatedTemperatureCelsius: z.number().min(-50).max(60),
    durationMinutes: z.number().int().min(5).max(1440),
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export const itineraryListSchema = z
  .object({ items: z.array(itinerarySchema).max(100) })
  .strict();

export type CreateItineraryRequest = z.infer<
  typeof createItineraryRequestSchema
>;
export type UpdateItineraryRequest = z.infer<
  typeof updateItineraryRequestSchema
>;
export type Itinerary = z.infer<typeof itinerarySchema>;
export type ItineraryList = z.infer<typeof itineraryListSchema>;
