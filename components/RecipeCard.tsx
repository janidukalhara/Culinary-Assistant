import React from "react";
import { Recipe } from "../types";
import Icon from "./Icon";

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
}
export default function RecipeCard({
  recipe,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: RecipeCardProps) {
  const available = recipe.ingredients.filter(
    (ingredient) => ingredient.isAvailable,
  ).length;
  return (
    <article className="recipe-card">
      <div className="recipe-card-top">
        <span
          className={`difficulty difficulty-${recipe.difficulty.toLowerCase()}`}
        >
          {recipe.difficulty}
        </span>
        <button
          className={`favorite-button ${isFavorite ? "is-saved" : ""}`}
          aria-label={`${isFavorite ? "Remove from" : "Add to"} favorites: ${recipe.name}`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(recipe)}
        >
          <Icon name="heart" />
        </button>
      </div>
      <div className="recipe-card-body">
        <span className="eyebrow">SOMETHING DELICIOUS</span>
        <h3>
          <button onClick={() => onSelect(recipe)}>{recipe.name}</button>
        </h3>
        <p className="recipe-availability">
          <Icon name="leaf" />
          {available} of {recipe.ingredients.length} ingredients on hand
        </p>
        <div className="recipe-tags">
          {recipe.dietaryTags.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="recipe-meta">
          <span>
            <Icon name="clock" />
            {recipe.prepTime} min prep
          </span>
          <span>~{recipe.calories} kcal</span>
        </div>
      </div>
      <button className="recipe-open" onClick={() => onSelect(recipe)}>
        Let’s make this <Icon name="arrow" />
      </button>
    </article>
  );
}
