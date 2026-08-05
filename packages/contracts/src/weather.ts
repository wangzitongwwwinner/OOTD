import { z } from 'zod';

export const currentWeatherRequestSchema = z
  .object({
    cityCode: z.string().min(1).max(32),
    cityName: z.string().min(1).max(64),
    refresh: z.boolean().optional(),
  })
  .strict();

const temperatureSchema = z.number().min(-100).max(100);

export const weatherInfoSchema = z
  .object({
    cityCode: z.string().min(1).max(32),
    cityName: z.string().min(1).max(64),
    localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    condition: z.string().min(1).max(64),
    temperatureCelsius: temperatureSchema,
    feelsLikeCelsius: temperatureSchema,
    humidityPercent: z.number().min(0).max(100).optional(),
    highCelsius: temperatureSchema,
    lowCelsius: temperatureSchema,
    uvIndex: z.number().min(0).max(20).optional(),
    windSpeedKilometersPerHour: z.number().min(0).max(500).optional(),
    observedAt: z.string().datetime({ offset: true }),
    source: z.literal('qweather'),
    isStale: z.boolean(),
  })
  .strict()
  .refine((weather) => weather.highCelsius >= weather.lowCelsius, {
    message: 'Highest temperature must not be below lowest temperature',
    path: ['highCelsius'],
  });

export type CurrentWeatherRequest = z.infer<
  typeof currentWeatherRequestSchema
>;
export type WeatherInfo = z.infer<typeof weatherInfoSchema>;
