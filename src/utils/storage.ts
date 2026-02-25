import { AppState } from "../types";

const STORAGE_KEY = "culinary_companion_data";

export const saveToLocalStorage = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const DEFAULT_CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Beverages', 'Household', 'Other'];

export const loadFromLocalStorage = (): AppState => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return { 
      recipes: [], 
      inventory: [], 
      customTags: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Vegetarian', 'Vegan', 'Quick'],
      categories: DEFAULT_CATEGORIES
    };
  }
  try {
    const parsed = JSON.parse(data);
    return {
      recipes: parsed.recipes || [],
      inventory: parsed.inventory || [],
      customTags: parsed.customTags || ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Vegetarian', 'Vegan', 'Quick'],
      categories: parsed.categories || DEFAULT_CATEGORIES
    };
  } catch (e) {
    console.error("Failed to parse local storage data", e);
    return { 
      recipes: [], 
      inventory: [], 
      customTags: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Vegetarian', 'Vegan', 'Quick'],
      categories: DEFAULT_CATEGORIES
    };
  }
};

export const exportSession = (state: AppState) => {
  const dataStr = JSON.stringify(state, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `culinary-companion-export-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importSession = (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const state = JSON.parse(event.target?.result as string);
        resolve(state);
      } catch (e) {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
