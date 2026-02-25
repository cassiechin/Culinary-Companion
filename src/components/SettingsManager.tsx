import React, { useState } from 'react';
import { AppState } from '../types';
import { Settings, Trash2, Plus, RotateCcw, Tag, AlertTriangle, Package } from 'lucide-react';
import { cn } from '../utils/cn';

interface SettingsManagerProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ state, onUpdateState }) => {
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const addTag = () => {
    if (!newTag.trim() || state.customTags.includes(newTag.trim())) return;
    onUpdateState({
      ...state,
      customTags: [...state.customTags, newTag.trim()]
    });
    setNewTag('');
  };

  const addCategory = () => {
    if (!newCategory.trim() || state.categories.includes(newCategory.trim())) return;
    onUpdateState({
      ...state,
      categories: [...state.categories, newCategory.trim()]
    });
    setNewCategory('');
  };

  const removeTag = (tag: string) => {
    onUpdateState({
      ...state,
      customTags: state.customTags.filter(t => t !== tag),
      // Also remove the tag from all recipes
      recipes: state.recipes.map(r => ({
        ...r,
        tags: r.tags.filter(t => t !== tag)
      }))
    });
  };

  const removeCategory = (category: string) => {
    if (state.categories.length <= 1) {
      alert("You must have at least one category.");
      return;
    }
    onUpdateState({
      ...state,
      categories: state.categories.filter(c => c !== category),
      // Update all ingredients that used this category to 'Other'
      recipes: state.recipes.map(r => ({
        ...r,
        ingredients: r.ingredients.map(i => i.category === category ? { ...i, category: 'Other' } : i)
      })),
      inventory: state.inventory.map(i => i.category === category ? { ...i, category: 'Other' } : i)
    });
  };

  const clearInventory = () => {
    if (confirm('Are you sure you want to clear your entire inventory? This cannot be undone.')) {
      onUpdateState({
        ...state,
        inventory: []
      });
    }
  };

  const resetAll = () => {
    if (confirm('DANGER: This will delete ALL recipes, inventory, and custom tags. Are you absolutely sure?')) {
      onUpdateState({
        recipes: [],
        inventory: [],
        customTags: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Vegetarian', 'Vegan', 'Quick'],
        categories: ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Beverages', 'Household', 'Other']
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-6">
          <Settings className="text-brand-600" size={28} />
          <h2 className="text-2xl font-bold text-stone-800">Application Settings</h2>
        </div>

        {/* Custom Tags Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Tag size={20} className="text-brand-500" /> Manage Recipe Tags
          </h3>
          <p className="text-stone-500 text-sm">
            Add or remove tags to categorize your recipes. Removing a tag will also remove it from any recipes that use it.
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New tag name..."
              className="input-field flex-1"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
            />
            <button onClick={addTag} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Add Tag
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {state.customTags.map(tag => (
              <div 
                key={tag} 
                className="group flex items-center gap-2 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-full text-sm font-medium border border-stone-200 hover:border-brand-300 transition-all cursor-default"
              >
                {tag}
                <button 
                  onClick={() => removeTag(tag)}
                  className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-stone-100" />

        {/* Categories Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Package size={20} className="text-brand-500" /> Manage Shopping Categories
          </h3>
          <p className="text-stone-500 text-sm">
            Define the sections of your supermarket to organize your shopping list.
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name..."
              className="input-field flex-1"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
            />
            <button onClick={addCategory} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Add Category
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {state.categories.map(cat => (
              <div 
                key={cat} 
                className="group flex items-center gap-2 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-full text-sm font-medium border border-stone-200 hover:border-brand-300 transition-all cursor-default"
              >
                {cat}
                <button 
                  onClick={() => removeCategory(cat)}
                  className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-stone-100" />

        {/* Data Management Section */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" /> Data Management
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-stone-100 bg-stone-50 space-y-4">
              <div>
                <h4 className="font-bold text-stone-800">Clear Inventory</h4>
                <p className="text-stone-500 text-sm">Remove all items from your current inventory stock.</p>
              </div>
              <button 
                onClick={clearInventory}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-amber-600 border border-amber-200 rounded-xl font-medium hover:bg-amber-50 transition-all cursor-pointer"
              >
                <RotateCcw size={18} /> Clear Inventory
              </button>
            </div>

            <div className="p-6 rounded-2xl border border-red-100 bg-red-50/30 space-y-4">
              <div>
                <h4 className="font-bold text-red-800">Factory Reset</h4>
                <p className="text-red-600/70 text-sm">Wipe all data including recipes, inventory, and tags.</p>
              </div>
              <button 
                onClick={resetAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 cursor-pointer"
              >
                <Trash2 size={18} /> Reset All Data
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
