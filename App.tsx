import React, { useState, useMemo, useCallback, useEffect } from "react";
import { GoogleGenAI, Chat } from "@google/genai";
import { generateRecipesFromIngredients } from "./services/geminiService";
import { detectFridgeIngredients } from "./services/yoloService";
import { Recipe, View, Tab, ChatMessage, DetectionResult } from "./types";
import ImageUploader from "./components/ImageUploader";
import RecipeDetailView from "./components/RecipeDetailView";
import FilterSidebar from "./components/FilterSidebar";
import RecipeCard from "./components/RecipeCard";
import ShoppingList from "./components/ShoppingList";
import Chatbot from "./components/Chatbot";
import DetectionResults from "./components/DetectionResults";
import { DIETARY_OPTIONS } from "./constants";
import Icon from "./components/Icon";

const App: React.FC = () => {
  const [view, setView] = useState<View>("upload");
  const [activeTab, setActiveTab] = useState<Tab>("recipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [detectionResult, setDetectionResult] =
    useState<DetectionResult | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<"detecting" | "recipes">(
    "detecting",
  );
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>(() => {
    try {
      const savedFavorites = localStorage.getItem("favoriteRecipes");
      const parsed = savedFavorites ? JSON.parse(savedFavorites) : [];
      return Array.isArray(parsed)
        ? parsed.filter(
            (recipe) =>
              recipe &&
              typeof recipe.name === "string" &&
              Array.isArray(recipe.ingredients) &&
              Array.isArray(recipe.dietaryTags) &&
              Array.isArray(recipe.instructions),
          )
        : [];
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
      localStorage.setItem("favoriteRecipes", JSON.stringify(favoriteRecipes));
    } catch (e) {
      console.error("Could not save favorite recipes to localStorage", e);
    }
  }, [favoriteRecipes]);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = () => {
      if (!process.env.API_KEY) return;
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const chat = ai.chats.create({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction:
              "You are a helpful and friendly culinary assistant. You can answer questions about recipes, cooking techniques, ingredient substitutions, and nutrition. Use Google Search to find the most up-to-date and accurate information, especially for specific recipes, nutritional data, or current food trends. Keep your answers concise and easy to understand.",
            tools: [{ googleSearch: {} }],
          },
        });
        setChatSession(chat);
        setChatMessages([
          {
            role: "model",
            text: "Hi! I'm your culinary assistant. Ask me for cooking tips, ingredient substitutions, or recipe ideas!",
          },
        ]);
      } catch (e) {
        console.error("Failed to initialize chat:", e);
        // Do not block the main app if chat fails
        setChatMessages([
          { role: "model", text: "Sorry, the chatbot could not be started." },
        ]);
      }
    };
    initChat();
  }, []);

  const createRecipes = async (result: DetectionResult) => {
    setLoadingStage("recipes");
    try {
      setRecipes(
        await generateRecipesFromIngredients(result.ingredients, activeFilters),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Recipes could not be generated. Please try again.",
      );
    }
    setView("recipes");
    setActiveTab("recipes");
  };

  const handleImageUpload = async (file: File) => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadingStage("detecting");
    setError(null);
    setRecipes([]);
    setDetectionResult(null);
    setSearchQuery("");
    try {
      const result = await detectFridgeIngredients(file);
      setDetectionResult(result);
      await createRecipes(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The photo could not be scanned. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retryRecipes = async () => {
    if (!detectionResult || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      await createRecipes(detectionResult);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  const handleFilterChange = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
  };

  const sourceRecipes = useMemo(() => {
    if (activeTab === "favorites") {
      return favoriteRecipes;
    }
    return recipes; // for 'recipes' tab
  }, [activeTab, recipes, favoriteRecipes]);

  const filteredRecipes = useMemo(() => {
    // First, filter by dietary options
    const dietFiltered =
      activeFilters.length === 0
        ? sourceRecipes
        : sourceRecipes.filter((recipe) =>
            activeFilters.every((filter) =>
              recipe.dietaryTags.includes(filter),
            ),
          );

    // Then, filter by search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return dietFiltered;
    }

    return dietFiltered.filter((recipe) => {
      const nameMatch = recipe.name.toLowerCase().includes(query);
      const ingredientMatch = recipe.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(query),
      );
      return nameMatch || ingredientMatch;
    });
  }, [sourceRecipes, activeFilters, searchQuery]);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setView("cooking");
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
    setView("recipes");
  };

  const addToShoppingList = useCallback((items: string[]) => {
    setShoppingList((prev) => {
      const newItems = items.filter((item) => !prev.includes(item));
      return [...prev, ...newItems];
    });
  }, []);

  const removeFromShoppingList = (itemToRemove: string) => {
    setShoppingList((prev) => prev.filter((item) => item !== itemToRemove));
  };

  const handleToggleFavorite = (recipeToToggle: Recipe) => {
    setFavoriteRecipes((prev) => {
      const isFavorited = prev.some(
        (recipe) => recipe.name === recipeToToggle.name,
      );
      if (isFavorited) {
        return prev.filter((recipe) => recipe.name !== recipeToToggle.name);
      } else {
        return [...prev, recipeToToggle];
      }
    });
  };

  const resetApp = () => {
    setView("upload");
    setRecipes([]);
    setDetectionResult(null);
    setSelectedRecipe(null);
    setError(null);
    setSearchQuery("");
  };

  const handleSendMessage = async (message: string) => {
    if (!chatSession) return;

    const userMessage: ChatMessage = { role: "user", text: message };
    setChatMessages((prev) => [...prev, userMessage]);
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
          setChatMessages((prev) => [
            ...prev,
            { role: "model", text: fullResponse },
          ]);
          firstChunk = false;
        } else {
          // On subsequent chunks, update the last message
          setChatMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = fullResponse;
            return newMessages;
          });
        }
      }

      // After the stream, update the last message with grounding info from the final chunk
      const groundingChunks =
        finalChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && groundingChunks.length > 0) {
        setChatMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === "model") {
            lastMessage.groundingChunks = groundingChunks;
          }
          return newMessages;
        });
      }
    } catch (e) {
      console.error("Chat error:", e);
      const errorMessage: ChatMessage = {
        role: "model",
        text: "Sorry, I'm having trouble connecting right now.",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
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

  const openCollection = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSelectedRecipe(null);
    setView("recipes");
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={resetApp}
            disabled={isLoading}
            aria-label="Culinary Assistant home"
          >
            <span className="brand-mark">
              <Icon name="chef" />
            </span>
            <span>
              Culinary<span className="brand-subtitle">ASSISTANT</span>
            </span>
          </button>
          <nav className="main-nav" aria-label="Main navigation">
            <button
              className={view === "upload" ? "nav-active" : ""}
              aria-current={view === "upload" ? "page" : undefined}
              onClick={resetApp}
              disabled={isLoading}
            >
              <Icon name="scan" />
              <span>My kitchen</span>
            </button>
            <button
              className={
                view === "recipes" && activeTab === "favorites"
                  ? "nav-active"
                  : ""
              }
              onClick={() => openCollection("favorites")}
              disabled={isLoading}
            >
              <Icon name="heart" />
              <span>Saved recipes</span>
              {favoriteRecipes.length > 0 && (
                <small>{favoriteRecipes.length}</small>
              )}
            </button>
            <button
              className={
                view === "recipes" && activeTab === "shoppingList"
                  ? "nav-active"
                  : ""
              }
              onClick={() => openCollection("shoppingList")}
              disabled={isLoading}
            >
              <Icon name="bag" />
              <span>Shopping list</span>
            </button>
          </nav>
          <span className="header-note">
            <Icon name="leaf" /> Cook a little greener.
          </span>
        </div>
      </header>
      <main id="main" className="main-container">
        {view === "upload" && (
          <ImageUploader
            onImageUpload={handleImageUpload}
            isLoading={isLoading}
            loadingStage={loadingStage}
            error={error}
          />
        )}

        {view === "recipes" && (
          <div className="results-view reveal">
            <div className="section-heading results-heading">
              <div>
                <span className="eyebrow">YOUR PERSONAL RECIPE NOTEBOOK</span>
                <h1>
                  {activeTab === "favorites"
                    ? "The ones you love."
                    : activeTab === "shoppingList"
                      ? "A few things to pick up."
                      : "Fresh from your fridge."}
                </h1>
                <p>
                  {activeTab === "recipes"
                    ? "A little inspiration for what’s already in your kitchen."
                    : activeTab === "favorites"
                      ? "Good food is always worth coming back to."
                      : "Everything you need for your next delicious idea."}
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={resetApp}
                disabled={isLoading}
              >
                <Icon name="upload" /> Scan a new photo
              </button>
            </div>
            {detectionResult && activeTab === "recipes" && (
              <DetectionResults result={detectionResult} />
            )}
            {error && activeTab === "recipes" && (
              <div className="error-notice recipe-error" role="alert">
                <p>{error}</p>
                {!!detectionResult?.ingredients.length && (
                  <button
                    className="secondary-button"
                    onClick={retryRecipes}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating recipes…" : "Retry recipes"}
                  </button>
                )}
              </div>
            )}
            <div
              className="collection-tabs"
              role="tablist"
              aria-label="Recipe collections"
            >
              {(
                [
                  {
                    id: "recipes",
                    label: "For you",
                    icon: "sparkles",
                    count: recipes.length,
                  },
                  {
                    id: "favorites",
                    label: "Saved recipes",
                    icon: "heart",
                    count: favoriteRecipes.length,
                  },
                  {
                    id: "shoppingList",
                    label: "Shopping list",
                    icon: "bag",
                    count: shoppingList.length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-controls="collection-panel"
                  aria-selected={activeTab === tab.id}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  disabled={isLoading}
                  className={activeTab === tab.id ? "is-active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => {
                    const tabs: Tab[] = [
                      "recipes",
                      "favorites",
                      "shoppingList",
                    ];
                    const direction =
                      event.key === "ArrowRight"
                        ? 1
                        : event.key === "ArrowLeft"
                          ? -1
                          : 0;
                    if (direction) {
                      event.preventDefault();
                      const next =
                        tabs[
                          (tabs.indexOf(activeTab) + direction + tabs.length) %
                            tabs.length
                        ];
                      setActiveTab(next);
                      document.getElementById(`tab-${next}`)?.focus();
                    }
                  }}
                >
                  <Icon name={tab.icon} />
                  {tab.label}
                  <span>{tab.count}</span>
                </button>
              ))}
            </div>
            <div
              id="collection-panel"
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              aria-busy={isLoading}
            >
              {activeTab === "shoppingList" ? (
                <ShoppingList
                  items={shoppingList}
                  onRemove={removeFromShoppingList}
                />
              ) : (
                <div className="recipe-layout">
                  <FilterSidebar
                    options={DIETARY_OPTIONS}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                  <div className="recipe-content">
                    <div className="recipe-toolbar">
                      <p>
                        <strong>{filteredRecipes.length}</strong> delicious
                        possibilities
                      </p>
                      <input
                        type="search"
                        placeholder="Find a recipe or ingredient…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search recipes"
                      />
                    </div>
                    {isLoading ? (
                      <div className="empty-state" role="status">
                        <Icon name="sparkles" />
                        <h3>Creating your recipes…</h3>
                        <p>Finding ideas for your detected ingredients.</p>
                      </div>
                    ) : filteredRecipes.length > 0 ? (
                      <div className="recipe-grid">
                        {filteredRecipes.map((recipe, index) => (
                          <RecipeCard
                            key={`${recipe.name}-${index}`}
                            recipe={recipe}
                            onSelect={handleSelectRecipe}
                            isFavorite={favoriteRecipes.some(
                              (fav) => fav.name === recipe.name,
                            )}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <Icon
                          name={activeTab === "favorites" ? "heart" : "chef"}
                        />
                        <h3>
                          {activeTab === "favorites" && !favoriteRecipes.length
                            ? "Your favourites start here."
                            : !recipes.length && activeTab === "recipes"
                              ? "Let’s find your next favourite."
                              : "Nothing on the menu just yet."}
                        </h3>
                        <p>
                          {activeTab === "favorites" && !favoriteRecipes.length
                            ? "Tap the heart on a recipe to keep it in your collection."
                            : searchQuery || activeFilters.length
                              ? "Try another search or clear your dietary filters."
                              : "Scan a fridge photo to discover recipes with your ingredients."}
                        </p>
                        {(searchQuery || activeFilters.length > 0) && (
                          <button
                            className="text-link"
                            onClick={() => {
                              setSearchQuery("");
                              handleClearFilters();
                            }}
                          >
                            Clear search and filters <Icon name="arrow" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "cooking" && selectedRecipe && (
          <div className="cooking-view reveal">
            <RecipeDetailView
              recipe={selectedRecipe}
              onBack={handleBackToRecipes}
              onAddToShoppingList={addToShoppingList}
              isFavorite={favoriteRecipes.some(
                (fav) => fav.name === selectedRecipe.name,
              )}
              onToggleFavorite={handleToggleFavorite}
              onAskChatbot={askChatbot}
            />
          </div>
        )}
      </main>
      <footer className="site-footer">
        <span>
          <Icon name="chef" /> Culinary Assistant
        </span>
        <p>A little creativity. A lot less waste.</p>
        <span className="footer-end">
          Made for everyday kitchens <Icon name="leaf" />
        </span>
      </footer>

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
          className="chat-launcher"
          aria-label="Open chatbot"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default App;
