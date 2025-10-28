import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { analyzeFridgeAndSuggestRecipes } from './services/geminiService';
import { Recipe, View, Tab, ChatMessage } from './types';
import ImageUploader from './components/ImageUploader';
import RecipeDetailView from './components/RecipeDetailView';
import FilterSidebar from './components/FilterSidebar';
import RecipeCard from './components/RecipeCard';
import ShoppingList from './components/ShoppingList';
import Chatbot from './components/Chatbot';
import { DIETARY_OPTIONS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<View>('upload');
  const [activeTab, setActiveTab] = useState<Tab>('recipes');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>(() => {
    try {
      const savedFavorites = localStorage.getItem('favoriteRecipes');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (e) {
      console.error("Could not load favorite recipes from localStorage", e);
      return [];
    }
  });

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotLoading, setIsBotLoading] = useState(false);
  
  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('favoriteRecipes', JSON.stringify(favoriteRecipes));
    } catch (e) {
      console.error("Could not save favorite recipes to localStorage", e);
    }
  }, [favoriteRecipes]);
  
  // Initialize Chat Session
  useEffect(() => {
    const initChat = () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: 'You are a helpful and friendly culinary assistant. You can answer questions about recipes, cooking techniques, ingredient substitutions, and nutrition. Use Google Search to find the most up-to-date and accurate information, especially for specific recipes, nutritional data, or current food trends. Keep your answers concise and easy to understand.',
            tools: [{googleSearch: {}}],
          },
        });
        setChatSession(chat);
        setChatMessages([{
          role: 'model',
          text: "Hi! I'm your culinary assistant. Ask me for cooking tips, ingredient substitutions, or recipe ideas!"
        }]);
      } catch (e) {
        console.error("Failed to initialize chat:", e);
        // Do not block the main app if chat fails
        setChatMessages([{ role: 'model', text: 'Sorry, the chatbot could not be started.' }]);
      }
    };
    initChat();
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploadedImage(file);
    setIsLoading(true);
    setError(null);
    setRecipes([]);
    try {
      const suggestedRecipes = await analyzeFridgeAndSuggestRecipes(file, activeFilters);
      setRecipes(suggestedRecipes);
      setView('recipes');
      setActiveTab('recipes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setView('upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };
  
  const handleClearFilters = () => {
    setActiveFilters([]);
  };
  
  const sourceRecipes = useMemo(() => {
    if (activeTab === 'favorites') {
      return favoriteRecipes;
    }
    return recipes; // for 'recipes' tab
  }, [activeTab, recipes, favoriteRecipes]);

  const filteredRecipes = useMemo(() => {
    // First, filter by dietary options
    const dietFiltered = activeFilters.length === 0
      ? sourceRecipes
      : sourceRecipes.filter(recipe =>
          activeFilters.every(filter => recipe.dietaryTags.includes(filter))
        );

    // Then, filter by search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return dietFiltered;
    }

    return dietFiltered.filter(recipe => {
      const nameMatch = recipe.name.toLowerCase().includes(query);
      const ingredientMatch = recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query));
      return nameMatch || ingredientMatch;
    });
  }, [sourceRecipes, activeFilters, searchQuery]);


  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setView('cooking');
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
    setView('recipes');
  };

  const addToShoppingList = useCallback((items: string[]) => {
    setShoppingList(prev => {
      const newItems = items.filter(item => !prev.includes(item));
      return [...prev, ...newItems];
    });
  }, []);

  const removeFromShoppingList = (itemToRemove: string) => {
    setShoppingList(prev => prev.filter(item => item !== itemToRemove));
  };
  
  const handleToggleFavorite = (recipeToToggle: Recipe) => {
    setFavoriteRecipes(prev => {
      const isFavorited = prev.some(recipe => recipe.name === recipeToToggle.name);
      if (isFavorited) {
        return prev.filter(recipe => recipe.name !== recipeToToggle.name);
      } else {
        return [...prev, recipeToToggle];
      }
    });
  };

  const resetApp = () => {
    setView('upload');
    setUploadedImage(null);
    setRecipes([]);
    setSelectedRecipe(null);
    setError(null);
    setSearchQuery('');
  };

  const handleSendMessage = async (message: string) => {
    if (!chatSession) return;

    const userMessage: ChatMessage = { role: 'user', text: message };
    setChatMessages(prev => [...prev, userMessage]);
    setIsBotLoading(true);

    try {
        const result = await chatSession.sendMessageStream({ message });
        let firstChunk = true;
        let fullResponse = "";
        let finalChunk: any = null; // Store the last chunk

        for await (const chunk of result) {
            fullResponse += chunk.text;
            finalChunk = chunk; // Update on each iteration
            if (firstChunk) {
                // On the first chunk, add a new message for the model
                setChatMessages(prev => [...prev, { role: 'model', text: fullResponse }]);
                firstChunk = false;
            } else {
                // On subsequent chunks, update the last message
                setChatMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = fullResponse;
                    return newMessages;
                });
            }
        }

        // After the stream, update the last message with grounding info from the final chunk
        const groundingChunks = finalChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks && groundingChunks.length > 0) {
            setChatMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.groundingChunks = groundingChunks;
                }
                return newMessages;
            });
        }

    } catch (e) {
        console.error("Chat error:", e);
        const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I'm having trouble connecting right now." };
        setChatMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsBotLoading(false);
    }
};

  const askChatbot = (prompt: string) => {
    setIsChatOpen(true);
    // To avoid showing the prompt as a user message if it's a button click,
    // we can just send it directly. Or, if we want to show it, we call handleSendMessage.
    // Let's call handleSendMessage for clarity in the chat history.
    handleSendMessage(prompt);
  };

  const Header = () => (
    <header className="p-4 bg-dark-card shadow-md flex justify-between items-center">
      <h1 className="text-2xl font-bold text-brand-primary cursor-pointer" onClick={resetApp}>
        Culinary Assistant
      </h1>
      {view !== 'upload' && (
         <button
          onClick={resetApp}
          className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-colors duration-300"
        >
          Start Over
        </button>
      )}
    </header>
  );

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <main className="p-4 md:p-8">
        {view === 'upload' && (
          <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} error={error} />
        )}

        {view === 'recipes' && (
          <div className="flex flex-col md:flex-row gap-8">
            <FilterSidebar
              options={DIETARY_OPTIONS}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <div className="flex-grow">
              <div className="flex border-b border-dark-surface mb-4">
                <button 
                  onClick={() => setActiveTab('recipes')} 
                  className={`py-2 px-4 text-lg font-semibold transition-colors ${activeTab === 'recipes' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-medium-text'}`}
                >
                  Suggested Recipes ({recipes.length})
                </button>
                <button 
                  onClick={() => setActiveTab('favorites')} 
                  className={`py-2 px-4 text-lg font-semibold transition-colors ${activeTab === 'favorites' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-medium-text'}`}
                >
                  Favorites ({favoriteRecipes.length})
                </button>
                <button 
                  onClick={() => setActiveTab('shoppingList')} 
                  className={`py-2 px-4 text-lg font-semibold transition-colors ${activeTab === 'shoppingList' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-medium-text'}`}
                >
                  Shopping List ({shoppingList.length})
                </button>
              </div>
              
              {(activeTab === 'recipes' || activeTab === 'favorites') && (
                <>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-subtle-text" xmlns="http://www.w.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search recipes by name or ingredient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-dark-surface text-light-text px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      aria-label="Search recipes"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRecipes.length > 0 ? (
                      filteredRecipes.map((recipe, index) => (
                        <RecipeCard 
                          key={`${recipe.name}-${index}`} 
                          recipe={recipe} 
                          onSelect={handleSelectRecipe} 
                          isFavorite={favoriteRecipes.some(fav => fav.name === recipe.name)}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))
                    ) : (
                       <p className="col-span-full text-center text-subtle-text">
                        {activeTab === 'favorites'
                          ? "You haven't saved any favorite recipes yet."
                          : "No recipes match your search or filters."
                        }
                      </p>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'shoppingList' && (
                <ShoppingList items={shoppingList} onRemove={removeFromShoppingList} />
              )}
            </div>
          </div>
        )}

        {view === 'cooking' && selectedRecipe && (
          <RecipeDetailView
            recipe={selectedRecipe}
            onBack={handleBackToRecipes}
            onAddToShoppingList={addToShoppingList}
            isFavorite={favoriteRecipes.some(fav => fav.name === selectedRecipe.name)}
            onToggleFavorite={handleToggleFavorite}
            onAskChatbot={askChatbot}
          />
        )}
      </main>
      
      <Chatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isLoading={isBotLoading}
        onMessagesUpdate={setChatMessages}
      />
      
      {!isChatOpen && chatSession && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-brand-primary rounded-full text-white shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform"
          aria-label="Open chatbot"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default App;