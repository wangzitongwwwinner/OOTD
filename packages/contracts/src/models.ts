export type FeelPreference = 'cold' | 'comfortable' | 'stuffy' | 'cool';

export interface User {
  id: string;
  wechatOpenId: string;
  nickname: string;
  avatarFileId?: string;
  recentFeelPreference: FeelPreference;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Scene {
  id: string;
  userId?: string;
  name: string;
  type: string;
  estimatedTemperatureCelsius: number;
  feel: FeelPreference;
  isPreset: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ItineraryItem {
  id: string;
  userId: string;
  localDate: string;
  startTime: string;
  sceneId: string;
  estimatedTemperatureCelsius: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type ClothingProcessingStatus =
  | 'draft'
  | 'processing'
  | 'ready'
  | 'failed';

export interface Clothing {
  id: string;
  userId: string;
  name: string;
  category: string;
  colors: string[];
  sourceFileId: string;
  processedFileId?: string;
  processingStatus: ClothingProcessingStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface OutfitNode {
  clothingId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface SavedOutfit {
  id: string;
  userId: string;
  name: string;
  seasonTags: string[];
  colorTags: string[];
  canvasVersion: number;
  nodes: OutfitNode[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface WeatherInfo {
  city: string;
  localDate: string;
  condition: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidityPercent: number;
  highCelsius: number;
  lowCelsius: number;
  uvIndex: number;
  windSpeedKilometersPerHour: number;
  observedAt: string;
}
