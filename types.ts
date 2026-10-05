export interface Ingredient {
  name: string;
  isAvailable: boolean;
}

export interface Recipe {
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number; // in minutes
  cookTime?: number; // in minutes
  calories: number;
  dietaryTags: string[];
  ingredients: Ingredient[];
  instructions: string[];
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  translations?: { [languageCode: string]: string };
  groundingChunks?: GroundingChunk[];
}

export type View = 'upload' | 'recipes' | 'cooking';
export type Tab = 'recipes' | 'shoppingList' | 'favorites';

export interface YoloDetection {
  className: string;
  confidence: number;
  box: [number, number, number, number];
}

export interface DetectionResult {
  model: string;
  mode: 'world' | 'standard' | 'custom' | string;
  confidenceThreshold: number;
  inferenceMs: number;
  detections: YoloDetection[];
  ingredients: string[];
  annotatedImage: string;
}
