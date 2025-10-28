
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
Based on the identified ingredients, generate 5 diverse recipes. You MUST leverage the provided Google Search tool to find popular, real-world, and accurate recipes.
For each recipe, provide the following details: name, difficulty ('Easy', 'Medium', or 'Hard'), prepTime (in minutes), cookTime (in minutes, if available), calories (per serving), dietaryTags (an array of strings), ingredients (an array of objects with 'name' and 'isAvailable' boolean), and instructions (an array of strings for each step).
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
      throw new Error("The AI provided an empty response. This can happen if the image is unclear or the safety filters were triggered. Please try a different photo.");
    }
    
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3, -3).trim();
    }
    
    // Check if the response seems to be a valid JSON array before parsing.
    if (!jsonText.startsWith('[') || !jsonText.endsWith(']')) {
      const preview = jsonText.length > 150 ? `${jsonText.substring(0, 150)}...` : jsonText;
      console.warn("AI response was not a JSON array:", preview);
      throw new Error("The AI couldn't generate recipes from the image. It might be unclear or contain no recognizable food items. Please try a clearer photo.");
    }

    const recipes = JSON.parse(jsonText) as Recipe[];
    return recipes;

  } catch (error) {
    console.error("Error in analyzeFridgeAndSuggestRecipes:", error);
    
    if (error instanceof SyntaxError) {
        // This specifically catches JSON.parse errors
        throw new Error("The AI's recipe list was not in the expected format. This can be a temporary issue. Please try uploading the image again.");
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('safety')) {
            throw new Error("The image was blocked due to safety settings. Please try a different photo.");
        }
        if (message.includes('fetch') || message.includes('network')) {
            throw new Error("Could not connect to the recipe service. Please check your internet connection and try again.");
        }
        // Re-throw other specific, user-friendly messages from the try block
        throw error;
    }

    // A final catch-all for any other unexpected errors
    throw new Error("An unexpected error occurred while getting recipes. Please try again later.");
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

export const estimateCookTime = async (recipeName: string, instructions: string[]): Promise<number | null> => {
  try {
    const prompt = `Based on the following instructions for a recipe called "${recipeName}", estimate the total active cook time in minutes.
Cook time includes time spent sautéing, boiling, baking, frying, etc. It does NOT include passive time like marinating, resting, or cooling.
Your response MUST be a single integer representing the number of minutes. Do not include any other text, units, or explanations.

Instructions:
${instructions.join('\n')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    const text = response.text.trim();
    const time = parseInt(text, 10);

    if (isNaN(time)) {
      console.warn("AI did not return a valid number for cook time. Response:", text);
      return null;
    }
    
    return time;

  } catch (error) {
    console.error("Error estimating cook time with Gemini:", error);
    return null; // Return null on error to prevent UI crash
  }
};