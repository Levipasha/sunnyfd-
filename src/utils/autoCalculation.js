/**
 * Auto-Calculation System
 * Provides calculation functions for custom recipes with storage
 */

// Base calculation functions
export const calculateTotal = (order, per) => {
  return (parseFloat(order) || 0) * (parseFloat(per) || 0);
};

export const calculatePercentage = (total, percentage) => {
  return (parseFloat(total) || 0) * (parseFloat(percentage) || 0) / 100;
};

// Storage keys for different categories
export const STORAGE_KEYS = {
  CROSS_UPDATE: 'crossUpdateCustomRecipes',
  MAWA: 'mawaCustomRecipes',
  QAMEER: 'qameerCustomRecipes',
  OSAMANIA: 'osamaniaCustomRecipes',
  SALT_ITEMS: 'saltItemsCustomRecipes',
  SHOWROOM: 'showroomCustomRecipes',
  DYNAMIC: 'dynamicCustomRecipes'
};

// Get storage key for dynamic categories
export const getDynamicStorageKey = (categoryId) => {
  return `dynamic_${categoryId}_CustomRecipes`;
};

// Load custom recipes from MongoDB instead of localStorage
export const loadCustomRecipes = async (category) => {
  try {
    console.log(`🔄 loadCustomRecipes called with category: ${category}`);
    
    // First try to load from MongoDB
    const url = `https://sunny-b.onrender.com/recipes?category=${encodeURIComponent(category)}`;
    console.log(`🔄 Fetching from URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`🔄 Response status: ${response.status}`);
    console.log(`🔄 Response ok: ${response.ok}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`🔄 Response data:`, data);
      console.log(`🔄 Data success: ${data.success}`);
      console.log(`🔄 Data data:`, data.data);
      console.log(`🔄 Data count: ${data.count}`);
      
      if (data.success && data.data) {
        // Convert MongoDB recipes to the format expected by the frontend
        const recipes = data.data.map(recipe => {
          console.log(`🔄 Processing recipe:`, recipe);
          console.log(`🔄 Recipe has items:`, !!recipe.items);
          console.log(`🔄 Recipe items length:`, recipe.items?.length);
          console.log(`🔄 Recipe items[0]:`, recipe.items?.[0]);
          console.log(`🔄 Recipe items[0].ingredientValues:`, recipe.items?.[0]?.ingredientValues);
          console.log(`🔄 Recipe tableStructure.ingredients:`, recipe.tableStructure?.ingredients);
          
          // Extract ingredients from the MongoDB structure
          let ingredients = [];
          
          if (recipe.items && recipe.items.length > 0) {
            // New structure: items array with ingredientValues
            if (recipe.items[0].ingredientValues) {
              ingredients = Object.entries(recipe.items[0].ingredientValues).map(([name, qty]) => ({
                name: name,
                qty: qty.toString(),
                baseQty: qty.toString(),
                id: name, // Use name as ID for now
                unit: 'kg' // Default unit
              }));
              console.log(`🔄 Extracted ingredients from items[0].ingredientValues:`, ingredients);
            }
          } else if (recipe.ingredients) {
            // Fallback: direct ingredients property
            if (Array.isArray(recipe.ingredients)) {
              ingredients = recipe.ingredients.map(ing => ({
                name: ing.name || ing,
                qty: (ing.qty || ing.quantity || 0).toString(),
                baseQty: (ing.qty || ing.quantity || 0).toString(),
                id: ing.name || ing,
                unit: ing.unit || 'kg'
              }));
              console.log(`🔄 Extracted ingredients from recipe.ingredients array:`, ingredients);
            } else if (typeof recipe.ingredients === 'object') {
              ingredients = Object.entries(recipe.ingredients).map(([name, qty]) => ({
                name: name,
                qty: qty.toString(),
                baseQty: qty.toString(),
                id: name,
                unit: 'kg'
              }));
              console.log(`🔄 Extracted ingredients from recipe.ingredients object:`, ingredients);
            }
          }
          
          // If still no ingredients, try to extract from tableStructure.ingredients
          if (ingredients.length === 0 && recipe.tableStructure && recipe.tableStructure.ingredients) {
            console.log(`🔄 Trying to extract from tableStructure.ingredients:`, recipe.tableStructure.ingredients);
            // Try to get quantities from items if available
            let ingredientQuantities = {};
            if (recipe.items && recipe.items.length > 0 && recipe.items[0].ingredientValues) {
              ingredientQuantities = recipe.items[0].ingredientValues;
            }
            
            ingredients = recipe.tableStructure.ingredients.map(ingName => ({
              name: ingName,
              qty: (ingredientQuantities[ingName] || 0).toString(),
              baseQty: (ingredientQuantities[ingName] || 0).toString(),
              id: ingName,
              unit: 'kg'
            }));
            console.log(`🔄 Extracted ingredients from tableStructure.ingredients with quantities:`, ingredients);
          }
          
          console.log(`🔄 Final ingredients array:`, ingredients);
          console.log(`🔄 Final ingredients length:`, ingredients.length);
          
          const transformedRecipe = {
            id: recipe._id,
            description: recipe.title || recipe.description,
            subCategory: recipe.subCategory || 'Default',
            ingredients: ingredients,
            mongoId: recipe._id,
            createdAt: recipe.createdAt,
            // Preserve additional MongoDB data for reference
            tableStructure: recipe.tableStructure,
            items: recipe.items,
            totals: recipe.totals
          };
          
          console.log(`🔄 Transformed recipe:`, transformedRecipe);
          return transformedRecipe;
        });
        console.log(`✅ Loaded ${recipes.length} recipes from MongoDB for category: ${category}`);
        console.log(`✅ Final recipes array:`, recipes);
        return recipes;
      }
    }
    
    // Fallback to localStorage if MongoDB fails
    console.log(`⚠️ MongoDB fetch failed, falling back to localStorage for category: ${category}`);
    const storageKey = STORAGE_KEYS[category.toUpperCase()] || `${category}CustomRecipes`;
    const saved = localStorage.getItem(storageKey);
    const fallbackRecipes = saved ? JSON.parse(saved) : [];
    console.log(`⚠️ Fallback recipes from localStorage:`, fallbackRecipes);
    return fallbackRecipes;
  } catch (error) {
    console.error('❌ Error loading custom recipes from MongoDB:', error);
    // Fallback to localStorage
    const storageKey = STORAGE_KEYS[category.toUpperCase()] || `${category}CustomRecipes`;
    const saved = localStorage.getItem(storageKey);
    const fallbackRecipes = saved ? JSON.parse(saved) : [];
    console.log(`⚠️ Error fallback recipes from localStorage:`, fallbackRecipes);
    return fallbackRecipes;
  }
};

// Save custom recipes to both MongoDB and localStorage
export const saveCustomRecipes = async (category, recipes, skipMongoSave = false) => {
  try {
    // Save to localStorage for immediate access
    const storageKey = STORAGE_KEYS[category.toUpperCase()] || `${category}CustomRecipes`;
    localStorage.setItem(storageKey, JSON.stringify(recipes));
    
    // Skip MongoDB save if requested (to prevent duplicate saves from CrossUpdateBlock)
    if (skipMongoSave) {
      console.log('🔄 Skipping MongoDB save to prevent duplicates (handled by CrossUpdateBlock)');
      return;
    }
    
    // Also save to MongoDB for persistence across browsers
    for (const recipe of recipes) {
      if (!recipe.mongoId) { // Only save if not already in MongoDB
        try {
          // Create complete recipe document with all fields
          const recipeData = {
            title: recipe.description || 'Untitled Recipe',
            description: `Recipe from ${category}`,
            category: category,
            subCategory: recipe.subCategory || 'Default',
            tableStructure: {
              columns: [
                { name: 'Item', type: 'item' },
                { name: 'Order', type: 'order' },
                { name: 'Per', type: 'per' },
                { name: 'Total Qty', type: 'totalQty' },
                ...(recipe.ingredients ? 
                  (Array.isArray(recipe.ingredients) ? 
                    recipe.ingredients.map(ing => ({ name: ing.name, type: 'ingredient' })) :
                    Object.keys(recipe.ingredients).map(name => ({ name, type: 'ingredient' }))
                  ) : []
                )
              ],
              ingredients: recipe.ingredients ? 
                (Array.isArray(recipe.ingredients) ? 
                  recipe.ingredients.map(ing => ing.name) :
                  Object.keys(recipe.ingredients)
                ) : []
            },
            items: [{
              name: recipe.description || 'Untitled Item',
              order: 1,
              per: 1,
              totalQty: 1,
              ingredientValues: recipe.ingredients || {}
            }],
            totals: {
              orderTotal: 1,
              totalQtyTotal: 1,
              ingredientTotals: recipe.ingredients || {}
            },
            createdBy: 'system'
          };
          
          // Determine if this is a new recipe or an update to existing recipe
          const isUpdate = recipe.mongoId;
          const method = isUpdate ? 'PUT' : 'POST';
          const url = isUpdate 
            ? `https://sunny-b.onrender.com/recipes/${recipe.mongoId}`
            : 'https://sunny-b.onrender.com/recipes';
          
          console.log(`🔍 Debug: Saving recipe "${recipe.description}" - Method: ${method}, URL: ${url}, Is Update: ${isUpdate}`);
          
          const response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipeData)
          });
          
          if (response.ok) {
            const result = await response.json();
            recipe.mongoId = result.data._id;
            console.log(`✅ Recipe saved to MongoDB: ${result.data._id}`);
          }
        } catch (error) {
          console.error('Error saving recipe to MongoDB:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error saving custom recipes:', error);
  }
};

// Add new custom recipe
export const addCustomRecipe = (category, recipe) => {
  try {
    const recipes = loadCustomRecipes(category);
    const newRecipe = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...recipe
    };
    const updatedRecipes = [newRecipe, ...recipes];
    saveCustomRecipes(category, updatedRecipes);
    return newRecipe;
  } catch (error) {
    console.error('Error adding custom recipe:', error);
    return null;
  }
};

// Update custom recipe
export const updateCustomRecipe = (category, recipeId, updatedData) => {
  try {
    const recipes = loadCustomRecipes(category);
    const updatedRecipes = recipes.map(recipe => 
      recipe.id === recipeId ? { ...recipe, ...updatedData, updatedAt: new Date().toISOString() } : recipe
    );
    saveCustomRecipes(category, updatedRecipes);
    return true;
  } catch (error) {
    console.error('Error updating custom recipe:', error);
    return false;
  }
};

// Delete custom recipe
export const deleteCustomRecipe = (category, recipeId) => {
  try {
    const recipes = loadCustomRecipes(category);
    const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeId);
    saveCustomRecipes(category, updatedRecipes);
    return true;
  } catch (error) {
    console.error('Error deleting custom recipe:', error);
    return false;
  }
};

// Calculate recipe based on ingredients and quantities
export const calculateCustomRecipe = (ingredients, orderQty = 1) => {
  try {
    const calculated = {};
    const totalQty = parseFloat(orderQty) || 1;
    
    ingredients.forEach(ingredient => {
      const qty = parseFloat(ingredient.qty) || 0;
      calculated[ingredient.name] = qty * totalQty;
    });
    
    return calculated;
  } catch (error) {
    console.error('Error calculating custom recipe:', error);
    return {};
  }
};

// Calculate totals for multiple recipes
export const calculateCategoryTotals = (recipes) => {
  const totals = {
    totalOrder: 0,
    ingredients: {}
  };
  
  try {
    recipes.forEach(recipe => {
      const orderQty = parseFloat(recipe.order) || 1;
      totals.totalOrder += orderQty;
      
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          const ingredientName = ingredient.name;
          const qty = parseFloat(ingredient.qty) || 0;
          const calculatedQty = qty * orderQty;
          
          if (!totals.ingredients[ingredientName]) {
            totals.ingredients[ingredientName] = 0;
          }
          totals.ingredients[ingredientName] += calculatedQty;
        });
      }
    });
  } catch (error) {
    console.error('Error in calculateCategoryTotals:', error);
  }
  
  return totals;
};

// Format calculated values
export const formatCalculatedValue = (value, decimals = 2) => {
  return parseFloat(value || 0).toFixed(decimals);
};

// Validate calculation inputs
export const validateCalculationInput = (order, per) => {
  const orderNum = parseFloat(order);
  const perNum = parseFloat(per);
  
  if (isNaN(orderNum) || orderNum < 0) {
    return { valid: false, message: 'Order quantity must be a positive number' };
  }
  
  if (isNaN(perNum) || perNum < 0) {
    return { valid: false, message: 'Per quantity must be a positive number' };
  }
  
  return { valid: true };
};

// Get sorted recipes (newest first)
export const getSortedRecipes = (recipes) => {
  return [...recipes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Search recipes by name or description
export const searchRecipes = (recipes, searchTerm) => {
  if (!searchTerm) return recipes;
  
  const term = searchTerm.toLowerCase();
  return recipes.filter(recipe => 
    recipe.description?.toLowerCase().includes(term) ||
    recipe.subCategory?.toLowerCase().includes(term) ||
    recipe.ingredients?.some(ing => ing.name.toLowerCase().includes(term))
  );
};

// Export recipe data
export const exportRecipes = (category) => {
  try {
    const recipes = loadCustomRecipes(category);
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${category}_recipes.json`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting recipes:', error);
  }
};

// Import recipe data
export const importRecipes = (category, file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const recipes = JSON.parse(e.target.result);
        saveCustomRecipes(category, recipes);
        resolve(recipes);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Clear all recipes for a category from both MongoDB and localStorage
export const clearAllRecipes = async (category) => {
  try {
    // Clear from localStorage
    const storageKey = STORAGE_KEYS[category.toUpperCase()] || `${category}CustomRecipes`;
    localStorage.removeItem(storageKey);
    
    // Clear from MongoDB
    try {
      const response = await fetch(`https://sunny-b.onrender.com/recipes/category/${encodeURIComponent(category)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Cleared ${result.deletedCount} recipes from MongoDB for category: ${category}`);
        return true;
      } else {
        console.error('Failed to clear recipes from MongoDB');
        return false;
      }
    } catch (error) {
      console.error('Error clearing recipes from MongoDB:', error);
      return false;
    }
  } catch (error) {
    console.error('Error clearing recipes:', error);
    return false;
  }
};

// Get recipe statistics
export const getRecipeStats = (category) => {
  try {
    const recipes = loadCustomRecipes(category);
    return {
      totalRecipes: recipes.length,
      totalIngredients: recipes.reduce((sum, recipe) => sum + (recipe.ingredients?.length || 0), 0),
      averageIngredients: recipes.length > 0 ? 
        recipes.reduce((sum, recipe) => sum + (recipe.ingredients?.length || 0), 0) / recipes.length : 0,
      newestRecipe: recipes.length > 0 ? recipes[0] : null,
      oldestRecipe: recipes.length > 0 ? recipes[recipes.length - 1] : null
    };
  } catch (error) {
    console.error('Error getting recipe stats:', error);
    return {
      totalRecipes: 0,
      totalIngredients: 0,
      averageIngredients: 0,
      newestRecipe: null,
      oldestRecipe: null
    };
  }
};

// Helper function to get all ingredients from all recipes in a subcategory
export const getAllIngredientsFromRecipes = (recipes) => {
  let allIngredientColumns = new Set();
  
  recipes.forEach(recipe => {
    let recipeIngredients = [];
    
    // Check if recipe has tableStructure from MongoDB
    if (recipe.tableStructure && recipe.tableStructure.ingredients) {
      recipeIngredients = recipe.tableStructure.ingredients;
    }
    // Check if recipe has ingredients array
    else if (Array.isArray(recipe.ingredients)) {
      recipeIngredients = recipe.ingredients.map(ing => ing.name);
    }
    // Check if recipe has ingredients object
    else if (recipe.ingredients && typeof recipe.ingredients === 'object') {
      recipeIngredients = Object.keys(recipe.ingredients);
    }
    // Check if recipe has items with ingredientValues (MongoDB structure)
    else if (recipe.items && recipe.items.length > 0 && recipe.items[0].ingredientValues) {
      recipeIngredients = Object.keys(recipe.items[0].ingredientValues);
    }
    
    // Add all ingredients to the set
    recipeIngredients.forEach(ing => allIngredientColumns.add(ing));
  });
  
  // Convert set to array and sort for consistent display
  return Array.from(allIngredientColumns).sort();
};

// Helper function to check if a recipe contains a specific ingredient
export const recipeContainsIngredient = (recipe, ingredientName) => {
  // Check if recipe has tableStructure from MongoDB
  if (recipe.tableStructure && recipe.tableStructure.ingredients) {
    return recipe.tableStructure.ingredients.includes(ingredientName);
  }
  // Check if recipe has ingredients array
  else if (Array.isArray(recipe.ingredients)) {
    return recipe.ingredients.some(ing => ing.name === ingredientName);
  }
  // Check if recipe has ingredients object
  else if (recipe.ingredients && typeof recipe.ingredients === 'object') {
    return recipe.ingredients[ingredientName] !== undefined;
  }
  // Check if recipe has items with ingredientValues (MongoDB structure)
  else if (recipe.items && recipe.items.length > 0 && recipe.items[0].ingredientValues) {
    return recipe.items[0].ingredientValues[ingredientName] !== undefined;
  }
  
  return false;
};

// Helper function to get ingredient quantity from a recipe
export const getIngredientQuantity = (recipe, ingredientName) => {
  // Check if recipe has tableStructure from MongoDB
  if (recipe.tableStructure && recipe.tableStructure.ingredients) {
    if (recipe.tableStructure.ingredients.includes(ingredientName)) {
      return recipe.items?.[0]?.ingredientValues?.[ingredientName] || 0;
    }
  }
  // Check if recipe has ingredients array
  else if (Array.isArray(recipe.ingredients)) {
    const foundIngredient = recipe.ingredients.find(ing => ing.name === ingredientName);
    if (foundIngredient) {
      return foundIngredient.qty || 0;
    }
  }
  // Check if recipe has ingredients object
  else if (recipe.ingredients && typeof recipe.ingredients === 'object') {
    if (recipe.ingredients[ingredientName] !== undefined) {
      return recipe.ingredients[ingredientName] || 0;
    }
  }
  // Check if recipe has items with ingredientValues (MongoDB structure)
  else if (recipe.items && recipe.items.length > 0 && recipe.items[0].ingredientValues) {
    if (recipe.items[0].ingredientValues[ingredientName] !== undefined) {
      return recipe.items[0].ingredientValues[ingredientName] || 0;
    }
  }
  
  return null; // Ingredient not found in this recipe
};

const autoCalculation = {
  STORAGE_KEYS,
  loadCustomRecipes,
  saveCustomRecipes,
  addCustomRecipe,
  updateCustomRecipe,
  deleteCustomRecipe,
  calculateCustomRecipe,
  calculateCategoryTotals,
  formatCalculatedValue,
  validateCalculationInput,
  getSortedRecipes,
  searchRecipes,
  exportRecipes,
  importRecipes,
  clearAllRecipes,
  getRecipeStats
};

export default autoCalculation;
