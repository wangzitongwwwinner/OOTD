export interface User {
  id: string;
  nickname: string;
  avatar: string;
  recentFeel: "偏冷" | "舒适" | "偏热";
  isLoggedIn: boolean;
}

export type SceneCategory = "办公室" | "家" | "地铁通勤" | "商场" | "户外" | "自定义";

export interface Scene {
  id: string;
  name: string;
  category: SceneCategory;
  temperature: number; // estimated temperature in celsius
  feel: "偏冷" | "舒适" | "闷热" | "微凉";
  isPreset: boolean;
  remark?: string;
}

export interface ItineraryItem {
  id: string;
  time: string; // e.g. "08:30"
  sceneId: string; // references Scene
  temperature: number; // estimated ambient temperature
  duration: number; // duration in hours
}

export type ClothingCategory = "上衣" | "下装" | "鞋履" | "配饰";

export interface Clothing {
  id: string;
  name: string;
  image: string; // Unsplash or mock source url
  category: ClothingCategory;
  color: string;
  isCustom?: boolean;
}

export interface CanvasItem {
  id: string; // unique node id
  clothingId: string; // references Clothing
  x: number; // percentage coordinate 0-100
  y: number; // percentage coordinate 0-100
  scale: number; // e.g. 1.0, 1.2
  zIndex: number;
}

export interface SavedOutfit {
  id: string;
  name: string;
  canvasItems: CanvasItem[];
  season: "春天" | "夏天" | "秋天" | "冬天";
  colorTag: string;
  createdAt: string;
}

export interface WeatherInfo {
  city: string;
  date: string;
  weather: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  high: number;
  low: number;
  uvIndex: string;
  windSpeed: string;
  source: string;
}

export interface AiRecommendation {
  recommendedOutfit: string;
  layeringExplanation: string;
  tips: string[];
  suggestedItems: string[];
  isAi: boolean;
}
