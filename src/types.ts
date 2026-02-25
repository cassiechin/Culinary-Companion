export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
  untrackedAmount?: boolean;
  stockStatus?: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface RecipeIngredient extends Ingredient {
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string;
  tags: string[];
  prepTime?: number;
}

export interface AppState {
  recipes: Recipe[];
  inventory: Ingredient[];
  customTags: string[];
  categories: string[];
}
