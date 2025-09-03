# Auto-Calculation System Usage Guide

## 📁 File Location
`src/utils/autoCalculation.js`

## 🚀 Quick Start

### 1. Import the Auto-Calculation Functions
```javascript
import { 
  loadCustomRecipes, 
  saveCustomRecipes, 
  addCustomRecipe,
  calculateCustomRecipe, 
  calculateCategoryTotals, 
  formatCalculatedValue,
  getSortedRecipes,
  searchRecipes,
  exportRecipes,
  importRecipes,
  clearAllRecipes,
  getRecipeStats
} from '../../utils/autoCalculation';
```

### 2. Basic Usage Examples

#### Load and Save Custom Recipes
```javascript
// Load recipes for a category
const recipes = loadCustomRecipes('cross_update');
console.log(recipes); // Array of custom recipes

// Save recipes to storage
saveCustomRecipes('cross_update', recipes);
```

#### Add New Custom Recipe
```javascript
const newRecipe = {
  description: 'My Custom Recipe',
  subCategory: 'Desserts',
  ingredients: [
    { name: 'Flour', qty: 2, unit: 'kg' },
    { name: 'Sugar', qty: 1, unit: 'kg' },
    { name: 'Eggs', qty: 4, unit: 'pieces' }
  ]
};

const addedRecipe = addCustomRecipe('cross_update', newRecipe);
console.log(addedRecipe); // Recipe with id and createdAt
```

#### Calculate Custom Recipe
```javascript
const ingredients = [
  { name: 'Flour', qty: 2, unit: 'kg' },
  { name: 'Sugar', qty: 1, unit: 'kg' }
];

const calculated = calculateCustomRecipe(ingredients, 5); // Order quantity of 5
console.log(calculated);
// Output: { 'Flour': 10, 'Sugar': 5 }
```

#### Calculate Category Totals
```javascript
const recipes = loadCustomRecipes('cross_update');
const orderQuantities = {
  1234567890: 10, // Recipe ID: Order quantity
  1234567891: 5
};

const totals = calculateCategoryTotals(recipes, orderQuantities);
console.log(totals);
// Output: { 'Flour': 25, 'Sugar': 15, 'Eggs': 20 }
```

#### Format Calculated Values
```javascript
const formattedValue = formatCalculatedValue(123.456789, 2);
console.log(formattedValue); // "123.46"
```

## 📊 Available Categories

The system supports these categories with separate storage:
- ✅ **CROSS_UPDATE** - `crossUpdateCustomRecipes`
- ✅ **MAWA** - `mawaCustomRecipes`
- ✅ **QAMEER** - `qameerCustomRecipes`
- ✅ **OSAMANIA** - `osamaniaCustomRecipes`
- ✅ **SALT_ITEMS** - `saltItemsCustomRecipes`
- ✅ **SHOWROOM** - `showroomCustomRecipes`

## 🔧 Integration Examples

### Example 1: React Component with Custom Recipes
```javascript
import React, { useState, useMemo } from 'react';
import { 
  loadCustomRecipes, 
  saveCustomRecipes, 
  calculateCustomRecipe, 
  formatCalculatedValue,
  getSortedRecipes 
} from '../../utils/autoCalculation';

const RecipeManager = () => {
  const [recipes, setRecipes] = useState(() => loadCustomRecipes('cross_update'));
  const [orderQuantities, setOrderQuantities] = useState({});
  
  const sortedRecipes = useMemo(() => getSortedRecipes(recipes), [recipes]);
  
  const handleSaveRecipe = (newRecipe) => {
    const updatedRecipes = [newRecipe, ...recipes];
    setRecipes(updatedRecipes);
    saveCustomRecipes('cross_update', updatedRecipes);
  };
  
  const handleOrderChange = (recipeId, value) => {
    setOrderQuantities(prev => ({
      ...prev,
      [recipeId]: value
    }));
  };
  
  return (
    <div>
      <h2>Custom Recipes</h2>
      {sortedRecipes.map(recipe => {
        const orderQty = parseFloat(orderQuantities[recipe.id]) || 0;
        const calculated = orderQty > 0 ? calculateCustomRecipe(recipe.ingredients, orderQty) : {};
        
        return (
          <div key={recipe.id}>
            <h3>{recipe.description}</h3>
            <input
              type="number"
              value={orderQuantities[recipe.id] || ''}
              onChange={(e) => handleOrderChange(recipe.id, e.target.value)}
              placeholder="Order quantity"
            />
            {orderQty > 0 && (
              <div>
                <h4>Calculated Quantities:</h4>
                {Object.entries(calculated).map(([ingredient, qty]) => (
                  <div key={ingredient}>
                    {ingredient}: {formatCalculatedValue(qty)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

### Example 2: Recipe Management with CRUD Operations
```javascript
import React, { useState, useEffect } from 'react';
import { 
  loadCustomRecipes, 
  saveCustomRecipes, 
  addCustomRecipe,
  updateCustomRecipe,
  deleteCustomRecipe,
  searchRecipes,
  getRecipeStats
} from '../../utils/autoCalculation';

const RecipeManager = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    const loadedRecipes = loadCustomRecipes('cross_update');
    setRecipes(loadedRecipes);
    setStats(getRecipeStats('cross_update'));
  }, []);
  
  const handleAddRecipe = (recipeData) => {
    const newRecipe = addCustomRecipe('cross_update', recipeData);
    if (newRecipe) {
      setRecipes(prev => [newRecipe, ...prev]);
      setStats(getRecipeStats('cross_update'));
    }
  };
  
  const handleUpdateRecipe = (recipeId, updatedData) => {
    const success = updateCustomRecipe('cross_update', recipeId, updatedData);
    if (success) {
      setRecipes(loadCustomRecipes('cross_update'));
      setStats(getRecipeStats('cross_update'));
    }
  };
  
  const handleDeleteRecipe = (recipeId) => {
    const success = deleteCustomRecipe('cross_update', recipeId);
    if (success) {
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      setStats(getRecipeStats('cross_update'));
    }
  };
  
  const filteredRecipes = searchRecipes(recipes, searchTerm);
  
  return (
    <div>
      <h2>Recipe Manager</h2>
      
      {/* Statistics */}
      <div className="stats">
        <p>Total Recipes: {stats.totalRecipes}</p>
        <p>Total Ingredients: {stats.totalIngredients}</p>
        <p>Average Ingredients per Recipe: {stats.averageIngredients.toFixed(1)}</p>
      </div>
      
      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search recipes..."
      />
      
      {/* Recipe List */}
      {filteredRecipes.map(recipe => (
        <div key={recipe.id}>
          <h3>{recipe.description}</h3>
          <p>Sub-Category: {recipe.subCategory}</p>
          <p>Created: {new Date(recipe.createdAt).toLocaleDateString()}</p>
          <button onClick={() => handleDeleteRecipe(recipe.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};
```

## 🎯 Advanced Features

### 1. Export and Import Recipes
```javascript
import { exportRecipes, importRecipes } from '../../utils/autoCalculation';

// Export recipes to JSON file
const handleExport = () => {
  exportRecipes('cross_update');
};

// Import recipes from JSON file
const handleImport = (file) => {
  importRecipes('cross_update', file)
    .then(recipes => {
      console.log('Imported recipes:', recipes);
      // Refresh your component state
    })
    .catch(error => {
      console.error('Import failed:', error);
    });
};
```

### 2. Recipe Statistics
```javascript
import { getRecipeStats } from '../../utils/autoCalculation';

const stats = getRecipeStats('cross_update');
console.log(stats);
// Output: {
//   totalRecipes: 5,
//   totalIngredients: 25,
//   averageIngredients: 5.0,
//   newestRecipe: { id: 123, description: '...', ... },
//   oldestRecipe: { id: 456, description: '...', ... }
// }
```

### 3. Clear All Recipes
```javascript
import { clearAllRecipes } from '../../utils/autoCalculation';

const handleClearAll = () => {
  if (window.confirm('Are you sure you want to delete all recipes?')) {
    const success = clearAllRecipes('cross_update');
    if (success) {
      console.log('All recipes cleared');
      // Refresh your component state
    }
  }
};
```

### 4. Validation
```javascript
import { validateCalculationInput } from '../../utils/autoCalculation';

const validation = validateCalculationInput(orderQty, perQty);
if (!validation.valid) {
  console.error(validation.message);
}
```

## 🔄 State Management Integration

### With React useState and localStorage
```javascript
const [recipes, setRecipes] = useState(() => loadCustomRecipes('cross_update'));

const updateRecipes = (newRecipes) => {
  setRecipes(newRecipes);
  saveCustomRecipes('cross_update', newRecipes);
};

const addRecipe = (recipeData) => {
  const newRecipe = addCustomRecipe('cross_update', recipeData);
  if (newRecipe) {
    setRecipes(prev => [newRecipe, ...prev]);
  }
};
```

### With Context API
```javascript
// RecipeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadCustomRecipes, saveCustomRecipes } from '../../utils/autoCalculation';

const RecipeContext = createContext();

export const RecipeProvider = ({ children, category }) => {
  const [recipes, setRecipes] = useState([]);
  
  useEffect(() => {
    setRecipes(loadCustomRecipes(category));
  }, [category]);
  
  const updateRecipes = (newRecipes) => {
    setRecipes(newRecipes);
    saveCustomRecipes(category, newRecipes);
  };
  
  return (
    <RecipeContext.Provider value={{ recipes, updateRecipes }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => useContext(RecipeContext);
```

## 📝 Best Practices

1. **Always use the storage functions** - Don't directly manipulate localStorage
2. **Handle errors gracefully** - All functions include try-catch blocks
3. **Use useMemo for expensive calculations** - Especially for category totals
4. **Validate input data** - Check recipe structure before saving
5. **Use stable keys** - Recipe IDs are timestamps, ensure uniqueness
6. **Backup important data** - Use export/import functions for data backup

## 🎉 That's it!

Your clean auto-calculation system is now ready for custom recipes only. The system is:
- ✅ **Clean** - No old recipe data, only custom recipes
- ✅ **Storage-based** - All data persists in localStorage
- ✅ **Modular** - Easy to extend and maintain
- ✅ **Reusable** - Works across all components
- ✅ **Performant** - Uses memoization and efficient calculations
- ✅ **Error-safe** - Includes validation and error handling
- ✅ **Flexible** - Supports all your recipe categories
- ✅ **Exportable** - Can backup and restore recipe data
