/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, Ingredient, AppState } from './types';
import { 
  loadFromLocalStorage, 
  saveToLocalStorage, 
  exportSession, 
  importSession 
} from './utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { InventoryManager } from './components/InventoryManager';
import { RecipeCard } from './components/RecipeCard';
import { RecipeForm } from './components/RecipeForm';
import { ShoppingList } from './components/ShoppingList';
import { SettingsManager } from './components/SettingsManager';
import { 
  ChefHat, 
  Package, 
  ShoppingCart, 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Filter,
  UtensilsCrossed,
  X,
  Check,
  Settings
} from 'lucide-react';
import { cn } from './utils/cn';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_DATA: AppState = {
  recipes: [
    {
      id: '1',
      name: 'Classic Margherita Pizza',
      description: 'A simple yet delicious Italian classic with fresh basil and mozzarella.',
      ingredients: [
        { id: 'i1', name: 'Pizza Dough', amount: 1, unit: 'pcs', category: 'Bakery' },
        { id: 'i2', name: 'Tomato Sauce', amount: 100, unit: 'ml', category: 'Pantry' },
        { id: 'i3', name: 'Mozzarella', amount: 150, unit: 'g', category: 'Dairy' },
        { id: 'i4', name: 'Fresh Basil', amount: 5, unit: 'leaves', category: 'Produce' }
      ],
      instructions: '1. Preheat oven to 250°C.\n2. Roll out dough.\n3. Spread sauce.\n4. Add cheese.\n5. Bake for 10-12 mins.\n6. Add fresh basil.',
      tags: ['Dinner', 'Vegetarian'],
      prepTime: 20
    },
    {
      id: '2',
      name: 'Avocado Toast',
      description: 'The perfect healthy breakfast or snack.',
      ingredients: [
        { id: 'i5', name: 'Sourdough Bread', amount: 2, unit: 'slices', category: 'Bakery' },
        { id: 'i6', name: 'Avocado', amount: 1, unit: 'pcs', category: 'Produce' },
        { id: 'i7', name: 'Red Pepper Flakes', amount: 1, unit: 'tsp', category: 'Pantry' }
      ],
      instructions: '1. Toast the bread.\n2. Mash avocado with salt and pepper.\n3. Spread on toast.\n4. Sprinkle red pepper flakes.',
      tags: ['Breakfast', 'Quick', 'Vegan'],
      prepTime: 5
    }
  ],
  inventory: [
    { id: 'inv1', name: 'Sourdough Bread', amount: 4, unit: 'slices', category: 'Bakery' },
    { id: 'inv2', name: 'Avocado', amount: 2, unit: 'pcs', category: 'Produce' }
  ],
  customTags: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Vegetarian', 'Vegan', 'Quick'],
  categories: ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Beverages', 'Household', 'Other']
};

type Tab = 'recipes' | 'inventory' | 'shopping' | 'settings';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = loadFromLocalStorage();
    return saved.recipes.length > 0 ? saved : INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = useState<Tab>('recipes');
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string | 'All'>('All');

  useEffect(() => {
    saveToLocalStorage(state);
  }, [state]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const newState = await importSession(file);
        setState(newState);
      } catch (err) {
        alert('Failed to import session. Please check the file format.');
      }
    }
  };

  const filteredRecipes = useMemo(() => {
    return state.recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = activeTag === 'All' || recipe.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [state.recipes, searchTerm, activeTag]);

  const updateInventory = (inventory: Ingredient[]) => {
    setState(prev => ({ ...prev, inventory }));
  };

  const addToInventory = (item: { name: string; amount: number; unit: string; category: string }) => {
    setState(prev => {
      const existingIndex = prev.inventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
      const updatedInventory = [...prev.inventory];
      
      if (existingIndex >= 0) {
        const existing = updatedInventory[existingIndex];
        if (existing.untrackedAmount) {
          existing.stockStatus = 'in-stock';
        } else {
          existing.amount += item.amount;
        }
      } else {
        updatedInventory.push({
          id: uuidv4(),
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          category: item.category,
          untrackedAmount: true,
          stockStatus: 'in-stock'
        });
      }
      return { ...prev, inventory: updatedInventory };
    });
  };

  const saveRecipe = (recipe: Recipe) => {
    setState(prev => {
      const exists = prev.recipes.find(r => r.id === recipe.id);
      if (exists) {
        return {
          ...prev,
          recipes: prev.recipes.map(r => r.id === recipe.id ? recipe : r)
        };
      }
      return {
        ...prev,
        recipes: [...prev.recipes, recipe]
      };
    });
    setIsAddingRecipe(false);
    setEditingRecipe(null);
  };

  const deleteRecipe = (id: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      setState(prev => ({
        ...prev,
        recipes: prev.recipes.filter(r => r.id !== id)
      }));
      setViewingRecipe(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <ChefHat size={24} />
              </div>
              <h1 className="text-xl font-bold text-stone-900 hidden sm:block">Culinary Companion</h1>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => exportSession(state)}
                className="p-2 text-stone-500 hover:text-brand-600 hover:bg-stone-50 rounded-lg transition-all cursor-pointer"
                title="Export Data"
              >
                <Download size={20} />
              </button>
              <label className="p-2 text-stone-500 hover:text-brand-600 hover:bg-stone-50 rounded-lg transition-all cursor-pointer" title="Import Data">
                <Upload size={20} />
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'recipes', label: 'My Recipes', icon: UtensilsCrossed },
              { id: 'inventory', label: 'Inventory', icon: Package },
              { id: 'shopping', label: 'Shopping List', icon: ShoppingCart },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all cursor-pointer",
                  activeTab === tab.id 
                    ? "border-brand-600 text-brand-600" 
                    : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'recipes' && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1 w-full max-w-md relative">
                  {!searchTerm && (
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                  )}
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    className={cn(
                      "input-field transition-all duration-200",
                      !searchTerm ? "pr-10" : "pr-4"
                    )}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsAddingRecipe(true)}
                  className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
                >
                  <Plus size={20} /> New Recipe
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTag('All')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                    activeTag === 'All' ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
                  )}
                >
                  All Recipes
                </button>
                {state.customTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                      activeTag === tag ? "bg-brand-600 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-brand-400"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.length === 0 ? (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                      <UtensilsCrossed size={40} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-stone-800 font-medium text-lg">No recipes found</p>
                      <p className="text-stone-500">Try adjusting your search or filters, or add a new recipe!</p>
                    </div>
                  </div>
                ) : (
                  filteredRecipes.map(recipe => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      inventory={state.inventory}
                      onClick={() => setViewingRecipe(recipe)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <InventoryManager 
                inventory={state.inventory} 
                categories={state.categories}
                onUpdate={updateInventory} 
              />
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ShoppingList 
                recipes={state.recipes} 
                inventory={state.inventory} 
                categories={state.categories}
                onAddToInventory={addToInventory}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SettingsManager 
                state={state}
                onUpdateState={setState}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      {(isAddingRecipe || editingRecipe) && (
        <RecipeForm 
          recipe={editingRecipe || undefined}
          tags={state.customTags}
          categories={state.categories}
          onSave={saveRecipe}
          onCancel={() => {
            setIsAddingRecipe(false);
            setEditingRecipe(null);
          }}
        />
      )}

      {viewingRecipe && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h2 className="text-2xl font-bold text-stone-800">{viewingRecipe.name}</h2>
              <button onClick={() => setViewingRecipe(null)} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="flex flex-wrap gap-2">
                {viewingRecipe.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-stone-600 text-lg leading-relaxed">
                {viewingRecipe.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <Package size={20} className="text-brand-500" /> Ingredients
                  </h3>
                  <ul className="space-y-2">
                    {viewingRecipe.ingredients.map(ing => {
                      const inStock = state.inventory.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
                      const hasEnough = inStock && inStock.amount >= ing.amount;
                      
                      return (
                        <li key={ing.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                          <span className="text-stone-700">
                            {ing.name} <span className="text-stone-400 ml-2">{ing.amount} {ing.unit}</span>
                          </span>
                          {hasEnough ? (
                            <Check size={16} className="text-brand-500" />
                          ) : (
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Missing</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <UtensilsCrossed size={20} className="text-brand-500" /> Instructions
                  </h3>
                  <div className="text-stone-600 whitespace-pre-wrap leading-relaxed bg-stone-50 p-6 rounded-2xl border border-stone-100">
                    {viewingRecipe.instructions}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex gap-3">
              <button 
                onClick={() => {
                  setEditingRecipe(viewingRecipe);
                  setViewingRecipe(null);
                }}
                className="btn-secondary flex-1"
              >
                Edit Recipe
              </button>
              <button 
                onClick={() => deleteRecipe(viewingRecipe.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

