import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
}

const DifficultyBadge: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
  const colors = {
    Easy: 'bg-green-600 text-green-100',
    Medium: 'bg-yellow-600 text-yellow-100',
    Hard: 'bg-red-600 text-red-100',
  };
  return <span className={`px-2 py-1 text-xs font-bold rounded-full ${colors[difficulty]}`}>{difficulty}</span>;
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, isFavorite, onToggleFavorite }) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onSelect from firing when clicking the favorite button
    onToggleFavorite(recipe);
  };

  return (
    <div 
      onClick={() => onSelect(recipe)}
      className="bg-dark-card rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 flex flex-col relative"
    >
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 p-1 rounded-full bg-dark-bg bg-opacity-50 hover:bg-opacity-75 transition-colors z-10"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-all duration-200 ${isFavorite ? 'text-red-500 fill-current' : 'text-subtle-text fill-none stroke-current hover:text-red-400'}`} viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>

      <div className="p-5 flex-grow">
        <h3 className="text-xl font-bold text-light-text mb-2 h-14 pr-8">{recipe.name}</h3>
        <div className="flex justify-between items-center mb-4">
          <DifficultyBadge difficulty={recipe.difficulty} />
          <div className="flex items-center text-subtle-text text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.prepTime} min
          </div>
        </div>
        <p className="text-medium-text text-sm">
          <span className="font-semibold text-brand-primary">{recipe.calories}</span> calories per serving
        </p>
      </div>
      <div className="bg-dark-surface px-5 py-3 text-center text-brand-primary font-semibold hover:bg-brand-secondary hover:text-white transition-colors duration-200">
        View Recipe
      </div>
    </div>
  );
};

export default RecipeCard;