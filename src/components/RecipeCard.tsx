import React from 'react';
import { Recipe, Ingredient } from '../types';
import { Clock, CheckCircle2, XCircle, Tag, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface RecipeCardProps {
  recipe: Recipe;
  inventory: Ingredient[];
  onClick: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, inventory, onClick }) => {
  const checkCookability = () => {
    const missing: string[] = [];
    recipe.ingredients.forEach(req => {
      const inStock = inventory.find(i => i.name.toLowerCase() === req.name.toLowerCase());
      if (!inStock || inStock.amount < req.amount) {
        if (!req.optional) missing.push(req.name);
      }
    });
    return missing;
  };

  const missingIngredients = checkCookability();
  const canCook = missingIngredients.length === 0;

  return (
    <div 
      onClick={onClick}
      className="recipe-card group cursor-pointer overflow-hidden flex flex-col h-full"
    >
      <div className="p-5 flex-1 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-xl font-bold text-stone-800 group-hover:text-brand-600 transition-colors">
            {recipe.name}
          </h3>
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
            canCook ? "bg-brand-100 text-brand-700" : "bg-stone-100 text-stone-500"
          )}>
            {canCook ? (
              <><CheckCircle2 size={14} /> Ready to cook</>
            ) : (
              <><XCircle size={14} /> Missing {missingIngredients.length} items</>
            )}
          </div>
        </div>

        <p className="text-stone-500 text-sm line-clamp-2">
          {recipe.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {recipe.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold uppercase tracking-widest">
              <Tag size={10} /> {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-stone-500 text-xs">
          {recipe.prepTime && (
            <span className="flex items-center gap-1">
              <Clock size={14} /> {recipe.prepTime}m
            </span>
          )}
          <span>{recipe.ingredients.length} ingredients</span>
        </div>
        <ChevronRight size={16} className="text-stone-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};
