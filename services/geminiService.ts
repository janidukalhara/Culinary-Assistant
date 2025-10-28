import { GoogleGenAI } from "@google/genai";
import { Recipe } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string; } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as base64 string"));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const analyzeFridgeAndSuggestRecipes = async (image: File, dietaryFilters: string[]): Promise<Recipe[]> => {
  try {
    const imagePart = await fileToGenerativePart(image);

    const dietaryFilterText = dietaryFilters.length > 0
      ? `Prioritize recipes that fit these dietary restrictions: ${dietaryFilters.join(', ')}.`
      : '';

    const prompt = `You are a smart fridge culinary assistant.
Analyze the ingredients in the provided image of a refrigerator.
Based on the identified ingredients, generate 5 diverse recipes. Use Google Search to find popular and accurate recipes.
For each recipe, provide the following details: name, difficulty ('Easy', 'Medium', or 'Hard'), prepTime (in minutes), calories (per serving), dietaryTags (an array of strings), ingredients (an array of objects with 'name' and 'isAvailable' boolean), and instructions (an array of strings for each step).
${dietaryFilterText}
IMPORTANT: Your entire response MUST be a single, valid JSON array of recipe objects. Do not include any introductory text, markdown formatting (like \`\`\`json), or any other characters outside of the JSON array. The response should be directly parsable as JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    const text = response.text;
    if (!text) {
      throw new Error("The AI returned an empty response. This could be due to a safety filter or an issue with the image. Please try a different photo.");
    }
    
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3, -3).trim();
    }
    
    const recipes = JSON.parse(jsonText) as Recipe[];
    return recipes;

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    if (error instanceof SyntaxError) {
        throw new Error("The AI returned an invalid recipe format. Please try again.");
    }
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Failed to get recipes from the AI. Please try another image.");
  }
};


export const translateTexts = async (texts: string[], targetLanguageName: string): Promise<string[]> => {
  if (!texts || texts.length === 0) {
    return [];
  }

  try {
    const prompt = `Translate each string in the following JSON array into ${targetLanguageName}.
Your response MUST be a single, valid JSON array of strings, with the same number of elements and in the same order as the input. Do not include any other text or formatting.
Input:
${JSON.stringify(texts)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3, -3).trim();
    }
    
    const translatedArray = JSON.parse(jsonText);

    if (!Array.isArray(translatedArray) || translatedArray.length !== texts.length) {
      throw new Error("Translation did not return a valid array of the correct length.");
    }

    return translatedArray;

  } catch (error) {
    console.error("Error translating text with Gemini:", error);
    // In case of error, return original texts to prevent UI crash
    return texts;
  }
};