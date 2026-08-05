import type { Recommendation } from "../../../../packages/contracts/src/index.ts";

export interface LlmInput {
  outdoorHighCelsius: number;
  outdoorLowCelsius: number;
  outdoorCondition: string;
  itineraries: Array<{
    sceneName: string;
    temperatureCelsius: number;
    durationMinutes: number;
  }>;
  feelPreference: string;
}

export interface LlmProvider {
  generateRecommendation(
    input: LlmInput,
    timeoutMs: number,
  ): Promise<Recommendation>;
}
