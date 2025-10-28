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