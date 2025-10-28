import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Recipe, Ingredient } from '../types';
import { translateTexts, estimateCookTime } from '../services/geminiService';
import { TRANSLATION_LANGUAGES } from '../constants';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
  onAddToShoppingList: (items: string[]) => void;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
  onAskChatbot: (prompt: string) => void;
}

const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onBack, onAddToShoppingList, isFavorite, onToggleFavorite, onAskChatbot }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Translation state
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<Record<string, { ingredients: Ingredient[]; instructions: string[] }>>({});
  
  // Cook time estimation state
  const [estimatedCookTime, setEstimatedCookTime] = useState<number | null>(null);
  const [isEstimatingCookTime, setIsEstimatingCookTime] = useState<boolean>(false);

  // Ingredient availability state, tied to original ingredient names
  const [ingredientAvailability, setIngredientAvailability] = useState(() =>
    new Map(recipe.ingredients.map(i => [i.name, i.isAvailable]))
  );

  // Reset availability when the recipe prop changes
  useEffect(() => {
    setIngredientAvailability(new Map(recipe.ingredients.map(i => [i.name, i.isAvailable])));
    setCurrentStep(0); // Also reset step counter
  }, [recipe]);

  const handleToggleAvailability = (originalIngredientName: string) => {
    setIngredientAvailability(prev => {
        const newMap = new Map(prev);
        const currentValue = newMap.get(originalIngredientName);
        newMap.set(originalIngredientName, !currentValue);
        return newMap;
    });
  };

  const displayedIngredients = translatedContent[selectedLanguage]?.ingredients || recipe.ingredients;
  const displayedInstructions = translatedContent[selectedLanguage]?.instructions || recipe.instructions;

  const missingIngredientNames = recipe.ingredients
    .filter(ing => !ingredientAvailability.get(ing.name))
    .map(ing => ing.name);

  const handleAddMissingIngredients = () => {
    onAddToShoppingList(missingIngredientNames);
    alert(`${missingIngredientNames.length} item(s) added to your shopping list!`);
  };

  // Effect to handle translation
  useEffect(() => {
    const handleTranslation = async () => {
      if (selectedLanguage === 'en' || translatedContent[selectedLanguage]) {
        return;
      }
      
      const targetLanguage = TRANSLATION_LANGUAGES.find(l => l.code === selectedLanguage);
      if (!targetLanguage) return;

      setIsTranslating(true);
      try {
        const originalIngredientNames = recipe.ingredients.map(ing => ing.name);
        const [translatedIngredientNames, translatedInstructions] = await Promise.all([
          translateTexts(originalIngredientNames, targetLanguage.name),
          translateTexts(recipe.instructions, targetLanguage.name),
        ]);

        const translatedIngredients = recipe.ingredients.map((ing, index) => ({
          ...ing,
          name: translatedIngredientNames[index] || ing.name,
        }));

        setTranslatedContent(prev => ({
          ...prev,
          [selectedLanguage]: {
            ingredients: translatedIngredients,
            instructions: translatedInstructions,
          },
        }));

      } catch (error) {
        console.error("Failed to translate recipe:", error);
        alert("Sorry, we couldn't translate the recipe at this time.");
        setSelectedLanguage('en'); // Revert to English on failure
      } finally {
        setIsTranslating(false);
      }
    };

    handleTranslation();
  }, [selectedLanguage, recipe, translatedContent]);

  // Effect to estimate cook time if not provided
  useEffect(() => {
    const fetchCookTime = async () => {
      if (recipe && !recipe.cookTime) {
        setIsEstimatingCookTime(true);
        setEstimatedCookTime(null);
        try {
          const time = await estimateCookTime(recipe.name, recipe.instructions);
          setEstimatedCookTime(time);
        } catch (error) {
          console.error("Failed to estimate cook time:", error);
          setEstimatedCookTime(null); // Ensure it's null on error
        } finally {
          setIsEstimatingCookTime(false);
        }
      }
    };

    fetchCookTime();
  }, [recipe]);


  const handleNextStep = useCallback(() => {
    if (currentStep < displayedInstructions.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentStep, displayedInstructions.length]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentStep]);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition is not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = selectedLanguage; // Use selected language for recognition
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      // Simple keyword matching for commands
      if (transcript.includes('next')) handleNextStep();
      if (transcript.includes('previous') || transcript.includes('back')) handlePrevStep();
    };
    
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
    }

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    };
  }, [handleNextStep, handlePrevStep, selectedLanguage]);

  const handleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(displayedInstructions[currentStep]);
      utterance.lang = selectedLanguage;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Could not start speech recognition:", err);
      }
    }
  };

  const LoadingOverlay: React.FC = () => (
    <div className="absolute inset-0 bg-dark-bg bg-opacity-75 flex items-center justify-center rounded-lg z-10">
      <div className="flex items-center space-x-2 text-light-text">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-primary"></div>
        <span>Translating...</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-dark-card p-6 md:p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <button onClick={onBack} className="flex items-center text-brand-primary font-semibold hover:text-brand-secondary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Recipes
        </button>
        <div className="flex flex-col items-end">
            <label htmlFor="language-select" className="text-sm text-subtle-text mb-1">Translate Recipe</label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-dark-surface text-light-text px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Select language for recipe translation"
            >
              {TRANSLATION_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
        </div>
      </div>


      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-4xl font-bold text-light-text">{recipe.name}</h2>
        <button
          onClick={() => onToggleFavorite(recipe)}
          className="p-2 rounded-full hover:bg-dark-surface transition-colors"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-all duration-200 ${isFavorite ? 'text-red-500 fill-current' : 'text-subtle-text fill-none stroke-current hover:text-red-400'}`} viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 mb-8 text-medium-text">
        <span className="bg-dark-surface px-3 py-1 rounded-full">{recipe.difficulty}</span>
        <span className="bg-dark-surface px-3 py-1 rounded-full">Prep: {recipe.prepTime} min</span>
        
        {recipe.cookTime && (
          <span className="bg-dark-surface px-3 py-1 rounded-full">Cook: {recipe.cookTime} min</span>
        )}
        {isEstimatingCookTime && (
          <span className="bg-dark-surface px-3 py-1 rounded-full flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-brand-primary"></div>
            <span>Estimating...</span>
          </span>
        )}
        {!recipe.cookTime && !isEstimatingCookTime && estimatedCookTime && estimatedCookTime > 0 && (
          <span className="bg-dark-surface px-3 py-1 rounded-full">Cook: ~{estimatedCookTime} min</span>
        )}

        <span className="bg-dark-surface px-3 py-1 rounded-full">{recipe.calories} kcal</span>
        <button
          onClick={() => onAskChatbot(`Can you find social media posts or videos about how to make "${recipe.name}"?`)}
          className="flex items-center gap-2 bg-dark-surface px-3 py-1 rounded-full text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
          aria-label="Get social media links for this recipe"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Get Social Links
        </button>
      </div>

      <div className="mb-8 relative">
        {isTranslating && <LoadingOverlay />}
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-2xl font-semibold text-light-text">Ingredients</h3>
            {missingIngredientNames.length > 0 && (
                <button 
                    onClick={handleAddMissingIngredients} 
                    className="bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    aria-label={`Add ${missingIngredientNames.length} missing items to shopping list`}
                >
                    Add {missingIngredientNames.length} to Shopping List
                </button>
            )}
        </div>
        <div className="bg-dark-bg p-4 rounded-lg">
            <ul className="space-y-2">
                {displayedIngredients.map((ingredient, index) => {
                    const originalIngredient = recipe.ingredients[index];
                    const isAvailable = ingredientAvailability.get(originalIngredient.name) ?? false;

                    return (
                        <li key={originalIngredient.name} className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-dark-surface">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isAvailable}
                                    onChange={() => handleToggleAvailability(originalIngredient.name)}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${isAvailable ? 'bg-brand-primary border-brand-primary' : 'bg-dark-surface border-subtle-text group-hover:border-brand-primary'}`}>
                                    {isAvailable && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`transition-colors ${isAvailable ? 'text-medium-text' : 'line-through text-subtle-text'}`}>
                                    {ingredient.name}
                                </span>
                            </label>

                            {!isAvailable && (
                                <button 
                                onClick={() => onAskChatbot(`What's a good substitute for ${ingredient.name} in a "${recipe.name}" recipe?`)}
                                className="text-xs bg-brand-primary text-white font-semibold py-1 px-2 rounded-full hover:bg-brand-secondary transition-colors whitespace-nowrap ml-2 flex-shrink-0"
                                aria-label={`Find substitute for ${ingredient.name}`}
                                >
                                Find Substitute
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    </div>

      <div className="bg-dark-bg p-6 rounded-lg">
        <h3 className="text-3xl font-bold text-center mb-4 text-brand-primary">Cooking Mode</h3>
        <div className="text-center mb-4 text-medium-text">
          Step {currentStep + 1} of {displayedInstructions.length}
        </div>
        <div className="relative min-h-[150px] flex items-center justify-center mb-6">
          {isTranslating && <LoadingOverlay />}
          <p className="text-2xl md:text-3xl text-center text-light-text">
            {displayedInstructions[currentStep]}
          </p>
        </div>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handlePrevStep} disabled={currentStep === 0} className="px-6 py-3 bg-dark-surface rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80 transition">Prev</button>
          <button onClick={handleReadAloud} className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center text-white hover:bg-brand-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand-primary">
            {isSpeaking ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.858 5.858a3 3 0 00-4.243 4.243" /><path d="M9 13.5l6-4.5-6-4.5v9z"/></svg>
            )}
          </button>
          <button onClick={handleToggleListening} className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg ${isListening ? 'bg-red-600 hover:bg-red-700 ring-red-500' : 'bg-dark-surface hover:bg-opacity-80 ring-dark-surface'}`} aria-label={isListening ? 'Stop listening for voice commands' : 'Start listening for voice commands'}>
            {isListening ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            )}
          </button>
          <button onClick={handleNextStep} disabled={currentStep === displayedInstructions.length - 1} className="px-6 py-3 bg-dark-surface rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80 transition">Next</button>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailView;