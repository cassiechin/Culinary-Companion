import React, { useState, useMemo } from 'react';
import { Recipe, Ingredient } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, Copy, Check, Search, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { cn } from '../utils/cn';

const ITEMS_PER_PAGE = 10;

interface ShoppingListProps {
  recipes: Recipe[];
  inventory: Ingredient[];
  categories: string[];
  onAddToInventory: (item: { name: string; amount: number; unit: string; category: string }) => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ recipes, inventory, categories, onAddToInventory }) => {
  const [selectedRecipes, setSelectedRecipes] = useState<{ recipeId: string; count: number }[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hoveredItemKey, setHoveredItemKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [replenishItems, setReplenishItems] = useState<Set<string>>(new Set());

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipes, searchTerm]);

  const totalPages = Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE);
  const paginatedRecipes = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredRecipes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecipes, currentPage]);

  const addToPlan = (recipeId: string) => {
    const existing = selectedRecipes.find(r => r.recipeId === recipeId);
    if (existing) {
      setSelectedRecipes(selectedRecipes.map(r => r.recipeId === recipeId ? { ...r, count: r.count + 1 } : r));
    } else {
      setSelectedRecipes([...selectedRecipes, { recipeId, count: 1 }]);
    }
  };

  const updateCount = (recipeId: string, delta: number) => {
    setSelectedRecipes(selectedRecipes.map(r => {
      if (r.recipeId === recipeId) {
        return { ...r, count: Math.max(0, r.count + delta) };
      }
      return r;
    }).filter(r => r.count > 0));
  };

  const shoppingList = useMemo(() => {
    const needed: Record<string, { amount: number; unit: string; category: string }> = {};

    selectedRecipes.forEach(plan => {
      const recipe = recipes.find(r => r.id === plan.recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        if (!needed[key]) {
          needed[key] = { amount: 0, unit: ing.unit, category: ing.category || 'Other' };
        }
        needed[key].amount += ing.amount * plan.count;
      });
    });

    // Subtract inventory
    const finalItems: { name: string; amount: number; unit: string; category: string }[] = [];
    Object.entries(needed).forEach(([name, data]) => {
      const inStock = inventory.find(i => i.name.toLowerCase() === name);
      
      // If we have it in stock and it's untracked, we assume we have enough unless it's out of stock
      if (inStock?.untrackedAmount && inStock.stockStatus !== 'out-of-stock') return;

      const stockAmount = inStock ? inStock.amount : 0;
      const finalAmount = Math.max(0, data.amount - stockAmount);

      if (finalAmount > 0) {
        finalItems.push({ name, amount: finalAmount, unit: data.unit, category: data.category });
      }
    });

    // Add manual replenishment items
    inventory.forEach(item => {
      if (item.stockStatus === 'out-of-stock') {
        const existing = finalItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (!existing) {
          finalItems.push({ name: item.name, amount: 1, unit: item.unit || 'unit', category: item.category || 'Other' });
        }
      } else if (item.stockStatus === 'low-stock' && replenishItems.has(item.id)) {
        const existing = finalItems.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (!existing) {
          finalItems.push({ name: item.name, amount: 1, unit: item.unit || 'unit', category: item.category || 'Other' });
        }
      }
    });

    return finalItems;
  }, [selectedRecipes, recipes, inventory, replenishItems]);

  const toggleCheck = (name: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setCheckedItems(newSet);
  };

  const toggleReplenish = (id: string) => {
    const newSet = new Set(replenishItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setReplenishItems(newSet);
  };

  const handleCopy = () => {
    if (shoppingList.length === 0) return;

    let text = "🛒 SHOPPING LIST\n\n";
    
    categories.forEach(category => {
      const items = shoppingList.filter(i => i.category === category);
      if (items.length > 0) {
        text += `[ ${category.toUpperCase()} ]\n`;
        items.forEach(item => {
          text += `☐ ${item.name} (${item.amount} ${item.unit})\n`;
        });
        text += "\n";
      }
    });

    navigator.clipboard.writeText(text.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Plus size={20} className="text-brand-500" /> Add to Plan
          </h3>

          <div className="relative">
            {!searchTerm && (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
            )}
            <input
              type="text"
              placeholder="Search recipes..."
              className={cn(
                "w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all",
                !searchTerm ? "pr-10" : "pr-4"
              )}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>

          <div className="space-y-2">
            {paginatedRecipes.length === 0 ? (
              <div className="py-10 text-center text-stone-400 text-sm">
                No recipes found
              </div>
            ) : (
              paginatedRecipes.map(recipe => (
                <div key={recipe.id} className="relative group/item">
                  <button
                    onClick={() => addToPlan(recipe.id)}
                    onMouseEnter={() => setHoveredItemKey(`add-${recipe.id}`)}
                    onMouseLeave={() => setHoveredItemKey(null)}
                    className="w-full text-left p-3 rounded-xl border border-stone-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <span className="font-medium text-stone-700 truncate text-sm">{recipe.name}</span>
                    <Plus size={16} className="text-stone-300 group-hover:text-brand-500" />
                  </button>
                  
                  {hoveredItemKey === `add-${recipe.id}` && (
                    <div className="absolute z-50 w-64 bg-white p-4 rounded-2xl shadow-xl border border-stone-100 pointer-events-none hidden md:block
                                  lg:left-full lg:ml-2 lg:top-0
                                  left-0 top-full mt-1">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">Ingredients</p>
                      <ul className="space-y-1">
                        {recipe.ingredients.map((ing, idx) => (
                          <li key={idx} className="text-xs text-stone-600 flex justify-between">
                            <span>{ing.name}</span>
                            <span className="text-stone-400">{ing.amount} {ing.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-stone-50">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1 text-stone-400 hover:text-brand-600 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-1 text-stone-400 hover:text-brand-600 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {selectedRecipes.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Current Plan</h3>
            <div className="space-y-3">
              {selectedRecipes.map(plan => {
                const recipe = recipes.find(r => r.id === plan.recipeId);
                if (!recipe) return null;
                const itemKey = `plan-${plan.recipeId}`;
                return (
                  <div 
                    key={plan.recipeId} 
                    className="flex items-center justify-between relative group/item"
                    onMouseEnter={() => setHoveredItemKey(itemKey)}
                    onMouseLeave={() => setHoveredItemKey(null)}
                  >
                    <span className="text-stone-700 text-sm font-medium truncate flex-1 mr-2">{recipe.name}</span>
                    <div className="flex items-center bg-stone-100 rounded-lg p-1">
                      <button onClick={() => updateCount(plan.recipeId, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md cursor-pointer"><Minus size={14}/></button>
                      <span className="w-8 text-center text-xs font-bold">{plan.count}</span>
                      <button onClick={() => updateCount(plan.recipeId, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-md cursor-pointer"><Plus size={14}/></button>
                    </div>

                    {hoveredItemKey === itemKey && (
                      <div className="absolute z-50 w-64 bg-white p-4 rounded-2xl shadow-xl border border-stone-100 pointer-events-none hidden md:block
                                    lg:left-full lg:ml-2 lg:top-0
                                    left-0 top-full mt-1">
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">Ingredients</p>
                        <ul className="space-y-1">
                          {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="text-xs text-stone-600 flex justify-between">
                              <span>{ing.name}</span>
                              <span className="text-stone-400">{ing.amount} {ing.unit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inventory Replenishment Section */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Package size={20} className="text-brand-600" /> Replenish Stock
          </h3>
          <div className="space-y-2">
            {inventory.filter(i => i.stockStatus === 'low-stock' || i.stockStatus === 'out-of-stock').length === 0 ? (
              <p className="text-stone-400 text-xs italic">No items currently low or out of stock.</p>
            ) : (
              inventory
                .filter(i => i.stockStatus === 'low-stock' || i.stockStatus === 'out-of-stock')
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        item.stockStatus === 'out-of-stock' ? "bg-red-500" : "bg-amber-500"
                      )} />
                      <span className="text-sm font-medium text-stone-700">{item.name}</span>
                      <span className="text-[10px] uppercase font-bold text-stone-400">
                        {item.stockStatus === 'out-of-stock' ? '(Out)' : '(Low)'}
                      </span>
                    </div>
                    {item.stockStatus === 'low-stock' ? (
                      <button
                        onClick={() => toggleReplenish(item.id)}
                        className={cn(
                          "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer",
                          replenishItems.has(item.id)
                            ? "bg-brand-500 text-white"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        )}
                      >
                        {replenishItems.has(item.id) ? 'Added' : 'Add to List'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-brand-600 uppercase">Auto-Added</span>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <ShoppingCart size={24} className="text-brand-600" /> Shopping List
            </h3>
            <button 
              onClick={handleCopy}
              className={cn(
                "p-2 transition-all duration-200 rounded-lg flex items-center gap-2 text-sm font-medium",
                copied 
                  ? "text-emerald-600 bg-emerald-50" 
                  : "text-stone-400 hover:text-brand-600 hover:bg-stone-100"
              )}
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={20} />
                  <span className="hidden sm:inline">Copy List</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 p-6">
            {shoppingList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
                <ShoppingCart size={48} strokeWidth={1} />
                <p>Your shopping list is empty. Add some meals to your plan!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {categories.map(category => {
                  const items = shoppingList.filter(i => i.category === category);
                  if (items.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div 
                            key={item.name}
                            onClick={() => toggleCheck(item.name)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group",
                              checkedItems.has(item.name) 
                                ? "bg-stone-50 border-stone-100 opacity-60" 
                                : "bg-white border-stone-200 hover:border-brand-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                checkedItems.has(item.name) ? "bg-brand-500 border-brand-500" : "border-stone-300"
                              )}>
                                {checkedItems.has(item.name) && <Check size={14} className="text-white" />}
                              </div>
                              <span className={cn(
                                "font-medium text-stone-800",
                                checkedItems.has(item.name) && "line-through"
                              )}>
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-stone-500 font-mono text-sm">
                                {item.amount} {item.unit}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToInventory(item);
                                }}
                                className={cn(
                                  "p-2 rounded-lg transition-all cursor-pointer",
                                  checkedItems.has(item.name)
                                    ? "text-brand-600 bg-brand-100 opacity-100"
                                    : "text-stone-400 hover:text-brand-600 hover:bg-stone-100 opacity-0 group-hover:opacity-100"
                                )}
                                title="Add to Inventory"
                              >
                                <Package size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
