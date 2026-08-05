import { z } from 'zod';

export const resolveCityRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}).strict();

export const cityLocationSchema = z.object({
  cityCode: z.string().min(1).max(32),
  cityName: z.string().min(1).max(64),
}).strict();

export type ResolveCityRequest = z.infer<typeof resolveCityRequestSchema>;
export type CityLocation = z.infer<typeof cityLocationSchema>;
