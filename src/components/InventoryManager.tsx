import React, { useState } from 'react';
import { Ingredient } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Package, Search } from 'lucide-react';
import { cn } from '../utils/cn';

interface InventoryManagerProps {
  inventory: Ingredient[];
  categories: string[];
  onUpdate: (inventory: Ingredient[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, categories, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({ 
    name: '', 
    amount: 0, 
    unit: 'pcs', 
    category: 'Other', 
    untrackedAmount: true,
    stockStatus: 'in-stock' as const
  });

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const existingIndex = inventory.findIndex(i => i.name.toLowerCase() === newItem.name.toLowerCase());
    if (existingIndex >= 0) {
      const updated = [...inventory];
      const existing = updated[existingIndex];
      
      if (newItem.untrackedAmount) {
        existing.untrackedAmount = true;
        existing.stockStatus = newItem.stockStatus;
      } else {
        if (existing.untrackedAmount) {
          existing.untrackedAmount = false;
          existing.amount = newItem.amount;
        } else {
          existing.amount += newItem.amount;
        }
      }
      onUpdate(updated);
    } else {
      onUpdate([...inventory, { ...newItem, id: uuidv4() }]);
    }
    setNewItem({ 
      name: '', 
      amount: 0, 
      unit: 'pcs', 
      category: 'Other', 
      untrackedAmount: true,
      stockStatus: 'in-stock'
    });
  };

  const removeItem = (id: string) => {
    onUpdate(inventory.filter(i => i.id !== id));
  };

  const updateAmount = (id: string, delta: number) => {
    onUpdate(inventory.map(i => {
      if (i.id === id) {
        return { ...i, amount: Math.max(0, i.amount + delta) };
      }
      return i;
    }));
  };

  const toggleUntracked = (id: string) => {
    onUpdate(inventory.map(i => {
      if (i.id === id) {
        return { ...i, untrackedAmount: !i.untrackedAmount, stockStatus: i.stockStatus || 'in-stock' };
      }
      return i;
    }));
  };

  const setStockStatus = (id: string, status: 'in-stock' | 'low-stock' | 'out-of-stock') => {
    onUpdate(inventory.map(i => {
      if (i.id === id) {
        return { ...i, stockStatus: status };
      }
      return i;
    }));
  };

  const updateCategory = (id: string, category: string) => {
    onUpdate(inventory.map(i => {
      if (i.id === id) {
        return { ...i, category };
      }
      return i;
    }));
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-medium text-stone-600">Ingredient Name</label>
            <input
              type="text"
              placeholder="e.g. Flour, Eggs, Milk"
              className="input-field"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            />
          </div>
          <div className={cn("w-full md:w-24 space-y-2 transition-opacity", newItem.untrackedAmount && "opacity-30 pointer-events-none")}>
            <label className="text-sm font-medium text-stone-600">Amount</label>
            <input
              type="number"
              className="input-field"
              disabled={newItem.untrackedAmount}
              value={newItem.amount}
              onChange={e => setNewItem({ ...newItem, amount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className={cn("w-full md:w-24 space-y-2 transition-opacity", newItem.untrackedAmount && "opacity-30 pointer-events-none")}>
            <label className="text-sm font-medium text-stone-600">Unit</label>
            <input
              type="text"
              placeholder="unit"
              className="input-field"
              disabled={newItem.untrackedAmount}
              value={newItem.unit}
              onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
            />
          </div>
          <div className="w-full md:w-32 space-y-2">
            <label className="text-sm font-medium text-stone-600">Category</label>
            <select
              className="input-field text-sm cursor-pointer"
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="cursor-pointer">{cat}</option>
              ))}
            </select>
          </div>
          <button onClick={addItem} className="btn-primary flex items-center gap-2 h-[42px]">
            <Plus size={18} /> Add
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="track-amount"
              className="w-4 h-4 text-brand-600 border-stone-300 rounded focus:ring-brand-500 cursor-pointer"
              checked={!newItem.untrackedAmount}
              onChange={e => setNewItem({ ...newItem, untrackedAmount: !e.target.checked })}
            />
            <label htmlFor="track-amount" className="text-sm text-stone-500 cursor-pointer select-none">
              Track specific amount (e.g. 500g, 2pcs)
            </label>
          </div>

          {newItem.untrackedAmount && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Status:</span>
              <div className="flex bg-stone-100 p-1 rounded-lg gap-1">
                {(['in-stock', 'low-stock', 'out-of-stock'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setNewItem({ ...newItem, stockStatus: status })}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer",
                      newItem.stockStatus === status 
                        ? status === 'in-stock' ? "bg-emerald-500 text-white" 
                          : status === 'low-stock' ? "bg-amber-500 text-white"
                          : "bg-red-500 text-white"
                        : "text-stone-500 hover:bg-stone-200"
                    )}
                  >
                    {status.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          {!searchTerm && (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
          )}
          <input
            type="text"
            placeholder="Search inventory..."
            className={cn(
              "input-field transition-all duration-200",
              !searchTerm ? "pr-10" : "pr-4"
            )}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-8">
          {filteredInventory.length === 0 ? (
            <div className="py-12 text-center text-stone-400 flex flex-col items-center gap-2 bg-white rounded-2xl border border-stone-200">
              <Package size={48} strokeWidth={1} />
              <p>No ingredients found. Start adding some!</p>
            </div>
          ) : (
            categories.map(category => {
              const items = filteredInventory.filter(i => (i.category || 'Other') === category);
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-stone-200 relative group hover:border-brand-200 transition-all min-h-[100px] flex flex-col justify-between">
                        {/* Category Dropdown - Top Right */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select
                            value={item.category || 'Other'}
                            onChange={(e) => updateCategory(item.id, e.target.value)}
                            className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-50 px-2 py-1 rounded-md border border-transparent hover:border-stone-200 hover:text-brand-600 cursor-pointer focus:ring-0 transition-colors appearance-none text-right"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat} className="cursor-pointer">{cat}</option>
                            ))}
                          </select>
                        </div>

                        {/* Main Content - Left Side */}
                        <div className="pr-24">
                          <h4 className="font-medium text-stone-800 mb-1">{item.name}</h4>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm text-stone-500">
                              {item.untrackedAmount ? (
                                <span className={cn(
                                  "font-medium italic",
                                  item.stockStatus === 'low-stock' ? "text-amber-600" : 
                                  item.stockStatus === 'out-of-stock' ? "text-red-600" : "text-brand-600"
                                )}>
                                  {item.stockStatus === 'low-stock' ? 'Low Stock' : 
                                   item.stockStatus === 'out-of-stock' ? 'Out of Stock' : 'In Stock'}
                                </span>
                              ) : (
                                <span className="font-mono text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                                  {item.amount} {item.unit}
                                </span>
                              )}
                            </p>
                            
                            {/* Controls - Bottom Left (visible on hover) */}
                            <div className="mt-1">
                              {item.untrackedAmount ? (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {(['in-stock', 'low-stock', 'out-of-stock'] as const).map(status => (
                                    <button
                                      key={status}
                                      onClick={() => setStockStatus(item.id, status)}
                                      className={cn(
                                        "w-4 h-4 rounded-full transition-all cursor-pointer",
                                        item.stockStatus === status 
                                          ? status === 'in-stock' ? "bg-emerald-500 ring-2 ring-emerald-100" 
                                            : status === 'low-stock' ? "bg-amber-500 ring-2 ring-amber-100"
                                            : "bg-red-500 ring-2 ring-red-100"
                                          : "bg-stone-200 hover:bg-stone-300"
                                      )}
                                      title={status.replace('-', ' ')}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center bg-stone-100 rounded-lg p-0.5 w-fit opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => updateAmount(item.id, -1)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-colors cursor-pointer text-stone-600 font-bold"
                                  >
                                    -
                                  </button>
                                  <button 
                                    onClick={() => updateAmount(item.id, 1)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-colors cursor-pointer text-stone-600 font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions - Bottom Right (Hover Only) */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => toggleUntracked(item.id)}
                            className={cn(
                              "p-2 rounded-lg transition-colors cursor-pointer",
                              item.untrackedAmount ? "text-stone-400 hover:text-stone-600 hover:bg-stone-100" : "text-brand-600 bg-brand-50"
                            )}
                            title={item.untrackedAmount ? "Enable specific amount tracking" : "Disable specific amount tracking"}
                          >
                            <Package size={16} />
                          </button>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
