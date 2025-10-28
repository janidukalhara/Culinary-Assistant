import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Recipe, Ingredient } from '../types';
import { translateTexts } from '../services/geminiService';
import { TRANSLATION_LANGUAGES } from '../constants';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
  onAddToShoppingList: (items: string[]) => void;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
}

const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onBack, onAddToShoppingList, isFavorite, onToggleFavorite }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Translation state
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<Record<string, { ingredients: Ingredient[]; instructions: string[] }>>({});

  const displayedIngredients = translatedContent[selectedLanguage]?.ingredients || recipe.ingredients;
  const displayedInstructions = translatedContent[selectedLanguage]?.instructions || recipe.instructions;

  const missingIngredients = displayedIngredients.filter(ing => !ing.isAvailable);
  const availableIngredients = displayedIngredients.filter(ing => ing.isAvailable);

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
  
  const handleAddMissingIngredients = () => {
    // We add the original ingredient names to the shopping list, not the translated ones
    const originalMissing = recipe.ingredients.filter(ing => !ing.isAvailable).map(ing => ing.name);
    onAddToShoppingList(originalMissing);
    alert(`${originalMissing.length} item(s) added to your shopping list!`);
  }

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
      
      <div className="flex flex-wrap gap-4 mb-8 text-medium-text">
        <span className="bg-dark-surface px-3 py-1 rounded-full">{recipe.difficulty}</span>
        <span className="bg-dark-surface px-3 py-1 rounded-full">{recipe.prepTime} min</span>
        <span className="bg-dark-surface px-3 py-1 rounded-full">{recipe.calories} kcal</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative">
        {isTranslating && <LoadingOverlay />}
        <div>
          <h3 className="text-2xl font-semibold mb-3 text-light-text">Available Ingredients</h3>
          <ul className="list-disc list-inside space-y-1 text-medium-text">
            {availableIngredients.map(ing => <li key={ing.name}>{ing.name}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-2xl font-semibold mb-3 text-red-400">Missing Ingredients</h3>
          {missingIngredients.length > 0 ? (
            <>
              <ul className="list-disc list-inside space-y-1 text-medium-text">
                {missingIngredients.map(ing => <li key={ing.name}>{ing.name}</li>)}
              </ul>
              <button onClick={handleAddMissingIngredients} className="mt-4 w-full bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors">
                Add All to Shopping List
              </button>
            </>
          ) : (
            <p className="text-medium-text">You have all the ingredients!</p>
          )}
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