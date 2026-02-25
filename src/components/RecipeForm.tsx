import React, { useState } from 'react';
import { Recipe, RecipeIngredient } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { cn } from '../utils/cn';

interface RecipeFormProps {
  recipe?: Recipe;
  tags: string[];
  categories: string[];
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, tags, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Recipe, 'id'>>(
    recipe ? { ...recipe } : {
      name: '',
      description: '',
      ingredients: [],
      instructions: '',
      tags: [],
      prepTime: 30
    }
  );

  const [newIng, setNewIng] = useState<RecipeIngredient>({ id: '', name: '', amount: 0, unit: 'pcs', category: 'Other' });

  const addIngredient = () => {
    if (!newIng.name.trim()) return;
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ...newIng, id: uuidv4() }]
    });
    setNewIng({ id: '', name: '', amount: 0, unit: 'pcs', category: 'Other' });
  };

  const removeIngredient = (id: string) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter(i => i.id !== id)
    });
  };

  const toggleTag = (tag: string) => {
    const newTags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag];
    setFormData({ ...formData, tags: newTags });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: recipe?.id || uuidv4() });
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h2 className="text-xl font-bold text-stone-800">{recipe ? 'Edit Recipe' : 'New Recipe'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Recipe Name</label>
              <input
                required
                className="input-field"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Classic Margherita Pizza"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Description</label>
              <textarea
                className="input-field min-h-[80px]"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Briefly describe this meal..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">Prep Time (mins)</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.prepTime}
                  onChange={e => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-stone-700">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer",
                      formData.tags.includes(tag)
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white border-stone-200 text-stone-600 hover:border-brand-300"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-stone-700">Ingredients</label>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input
                  className="input-field md:col-span-5"
                  placeholder="Ingredient"
                  value={newIng.name}
                  onChange={e => setNewIng({ ...newIng, name: e.target.value })}
                />
                <input
                  type="number"
                  className="input-field md:col-span-2"
                  placeholder="Qty"
                  value={newIng.amount || ''}
                  onChange={e => setNewIng({ ...newIng, amount: parseFloat(e.target.value) || 0 })}
                />
                <input
                  className="input-field md:col-span-2"
                  placeholder="Unit"
                  value={newIng.unit}
                  onChange={e => setNewIng({ ...newIng, unit: e.target.value })}
                />
                <select
                  className="input-field md:col-span-2 text-sm"
                  value={newIng.category}
                  onChange={e => setNewIng({ ...newIng, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button type="button" onClick={addIngredient} className="btn-primary p-2 md:col-span-1 flex items-center justify-center">
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {formData.ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="flex flex-col">
                      <span className="text-stone-700 font-medium">
                        {ing.name} <span className="text-stone-400 font-normal ml-2">{ing.amount} {ing.unit}</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">{ing.category}</span>
                    </div>
                    <button type="button" onClick={() => removeIngredient(ing.id)} className="text-stone-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">Instructions</label>
              <textarea
                className="input-field min-h-[150px]"
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Step by step instructions..."
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" onClick={handleSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Save size={18} /> Save Recipe
          </button>
        </div>
      </div>
    </div>
  );
};
