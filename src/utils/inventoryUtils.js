/**
 * Inventory Utility Functions
 * Handles common inventory calculations and operations
 */

/**
 * Calculate the next day's opening stock based on current final stock
 * @param {Object} inventoryItem - The current inventory item
 * @returns {Object} Object with calculated values for next day
 */
export const calculateNextDayOpeningStock = (inventoryItem) => {
  const finalStock = inventoryItem.finalStock || inventoryItem.currentStock || 0;
  const finalStockPrimary = inventoryItem.finalStockPrimary || finalStock;
  const finalStockSecondary = inventoryItem.finalStockSecondary || 0;
  
  return {
    openingStock: finalStock,
    openingStockPrimary: finalStockPrimary,
    openingStockSecondary: finalStockSecondary,
    received: 0,
    consumed: 0,
    received2: 0,
    consumed2: 0,
    total: finalStock,
    balance: finalStock,
    total2: finalStock,
    finalStock: finalStock,
    currentStock: finalStock
  };
};

/**
 * Get tomorrow's date as a Date object
 * @returns {Date} Tomorrow's date at midnight
 */
export const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

/**
 * Format date for API calls (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Get the current date at midnight
 * @returns {Date} Current date at midnight
 */
export const getCurrentDateMidnight = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

/**
 * Inventory Utility Functions
 * Handles inventory deduction when recipes are printed/produced
 */

/**
 * Deduct ingredients from inventory after recipe printing
 * @param {Array} recipeIngredients - Array of ingredients with quantities
 * @param {Array} inventory - Current inventory state
 * @param {Function} setInventory - Function to update inventory state
 * @param {Function} updateInventoryItem - API function to update inventory in database
 * @returns {Object} Result object with success status and message
 */
export const deductInventory = async (recipeIngredients, inventory, setInventory, updateInventoryItem) => {
  try {
    // Validate inputs
    if (!Array.isArray(recipeIngredients) || !Array.isArray(inventory)) {
      throw new Error('Invalid input parameters');
    }

    if (recipeIngredients.length === 0) {
      return {
        success: true,
        message: 'No ingredients to deduct from inventory.'
      };
    }

    // Check inventory availability for all ingredients
    const insufficientItems = [];
    const inventoryUpdates = [];

    for (const ingredient of recipeIngredients) {
      // Find matching inventory item with improved matching logic
      const inventoryItem = findMatchingInventoryItem(inventory, ingredient.name);

      if (!inventoryItem) {
        insufficientItems.push({
          name: ingredient.name,
          required: ingredient.quantity,
          available: 0,
          unit: ingredient.unit || 'kg'
        });
        continue;
      }

      const requiredQuantity = parseFloat(ingredient.quantity) || 0;
      const availableQuantity = parseFloat(inventoryItem.currentStock) || 0;

      if (availableQuantity < requiredQuantity) {
        insufficientItems.push({
          name: ingredient.name,
          required: requiredQuantity,
          available: availableQuantity,
          unit: inventoryItem.unit
        });
      } else {
        // Calculate new stock after deduction
        const newStock = availableQuantity - requiredQuantity;
        inventoryUpdates.push({
          ...inventoryItem,
          currentStock: newStock,
          consumed: (parseFloat(inventoryItem.consumed) || 0) + requiredQuantity
        });
      }
    }

    // If any ingredients are insufficient, return error
    if (insufficientItems.length > 0) {
      const errorMessages = insufficientItems.map(item => 
        `Not enough ${item.name} in inventory. Available: ${item.available} ${item.unit}, Required: ${item.required} ${item.unit}`
      );
      
      return {
        success: false,
        message: errorMessages.join('\n'),
        insufficientItems
      };
    }

    // Update inventory state
    const updatedInventory = inventory.map(item => {
      const update = inventoryUpdates.find(update => update.id === item.id);
      return update || item;
    });

    // Update local state immediately for UI feedback
    setInventory(updatedInventory);

    // Update database for each modified item
    const updatePromises = inventoryUpdates.map(item => 
      updateInventoryItem(item.id, item)
    );

    await Promise.all(updatePromises);

    return {
      success: true,
      message: 'Inventory updated successfully after printing recipe.',
      updatedItems: inventoryUpdates
    };

  } catch (error) {
    console.error('Error deducting inventory:', error);
    return {
      success: false,
      message: `Failed to update inventory: ${error.message}`
    };
  }
};

/**
 * Extract ingredients from recipe data for inventory deduction
 * @param {Object} recipeData - Recipe data object
 * @param {Object} multipliers - Quantity multipliers for scaling
 * @returns {Array} Array of ingredients with quantities
 */
export const extractRecipeIngredients = (recipeData, multipliers = {}) => {
  const ingredients = [];

  // Handle predefined recipe data structure
  if (recipeData && typeof recipeData === 'object') {
    console.log('Extracting ingredients from recipe data:', recipeData);
    
    // Check if it's a flat structure (like CROSS UPDATE) or nested structure
    const isFlatStructure = Object.values(recipeData).some(item => 
      item && typeof item === 'object' && item.order !== undefined
    );
    
    console.log('Is flat structure:', isFlatStructure);

    if (isFlatStructure) {
      // Handle flat structure (CROSS UPDATE, OSAMANIA, etc.)
      Object.keys(recipeData).forEach(itemKey => {
        const item = recipeData[itemKey];
        console.log(`Processing item ${itemKey}:`, item);
        
        if (item && typeof item === 'object' && item.order) {
          const orderQuantity = parseFloat(item.order) || 0;
          console.log(`Order quantity for ${itemKey}:`, orderQuantity);
          
          // Get ingredients based on the item type
          const itemIngredients = getIngredientsForItem('flat', itemKey, orderQuantity);
          console.log(`Ingredients for ${itemKey}:`, itemIngredients);
          
          // Add ingredients to the list
          itemIngredients.forEach(ingredient => {
            const existingIngredient = ingredients.find(ing => 
              ing.name.toLowerCase() === ingredient.name.toLowerCase()
            );

            if (existingIngredient) {
              existingIngredient.quantity += ingredient.quantity;
            } else {
              ingredients.push(ingredient);
            }
          });
        }
      });
    } else {
      // Handle nested structure (QAMEER, MAWA, etc.)
      Object.keys(recipeData).forEach(categoryKey => {
        const category = recipeData[categoryKey];
        
        if (category && typeof category === 'object') {
          // Process each item in the category
          Object.keys(category).forEach(itemKey => {
            const item = category[itemKey];
            
            if (item && typeof item === 'object' && item.order) {
              const orderQuantity = parseFloat(item.order) || 0;
              
              // Get ingredients based on the item type and category
              const itemIngredients = getIngredientsForItem(categoryKey, itemKey, orderQuantity);
              
              // Add ingredients to the list
              itemIngredients.forEach(ingredient => {
                const existingIngredient = ingredients.find(ing => 
                  ing.name.toLowerCase() === ingredient.name.toLowerCase()
                );

                if (existingIngredient) {
                  existingIngredient.quantity += ingredient.quantity;
                } else {
                  ingredients.push(ingredient);
                }
              });
            }
          });
        }
      });
    }
  }

  return ingredients;
};

/**
 * Get ingredients for a specific item based on category and item name
 * @param {string} category - Category name (mainProduction, tose, bread, etc.)
 * @param {string} itemName - Item name
 * @param {number} orderQuantity - Order quantity
 * @returns {Array} Array of ingredients with quantities
 */
const getIngredientsForItem = (category, itemName, orderQuantity) => {
  const ingredients = [];
  
  console.log(`Getting ingredients for item: ${itemName}, category: ${category}, orderQuantity: ${orderQuantity}`);
  
  // Define ingredient mappings for different categories and items
  const ingredientMappings = {};

  // Return ingredients for the specific item, or empty array if not found
  const result = ingredientMappings[itemName] || [];
  console.log(`Found ingredients for ${itemName}:`, result);
  return result;
};

/**
 * Extract ingredients from custom recipe blocks
 * @param {Array} customRecipeBlocks - Array of custom recipe blocks
 * @param {string} category - Category filter (optional)
 * @returns {Array} Array of ingredients with quantities
 */
export const extractCustomRecipeIngredients = (customRecipeBlocks, category = null) => {
  const ingredients = [];

  const filteredBlocks = category 
    ? customRecipeBlocks.filter(block => block.category === category)
    : customRecipeBlocks;

  filteredBlocks.forEach(block => {
    if (block.items && Array.isArray(block.items)) {
      block.items.forEach(item => {
        if (item.ingredients && Array.isArray(item.ingredients)) {
          item.ingredients.forEach(ingredient => {
            const existingIngredient = ingredients.find(ing => 
              ing.name.toLowerCase() === ingredient.name.toLowerCase()
            );

            if (existingIngredient) {
              existingIngredient.quantity += parseFloat(ingredient.quantity) || 0;
            } else {
              ingredients.push({
                name: ingredient.name,
                quantity: parseFloat(ingredient.quantity) || 0,
                unit: ingredient.unit || 'kg'
              });
            }
          });
        }
      });
    }
  });

  return ingredients;
};

/**
 * Validate inventory before printing
 * @param {Array} ingredients - Array of ingredients to check
 * @param {Array} inventory - Current inventory state
 * @returns {Object} Validation result with warnings and errors
 */
export const validateInventoryForRecipe = (ingredients, inventory) => {
  const warnings = [];
  const errors = [];

  ingredients.forEach(ingredient => {
    const inventoryItem = findMatchingInventoryItem(inventory, ingredient.name);

    if (!inventoryItem) {
      errors.push(`Ingredient "${ingredient.name}" not found in inventory`);
      return;
    }

    const requiredQuantity = parseFloat(ingredient.quantity) || 0;
    const availableQuantity = parseFloat(inventoryItem.currentStock) || 0;

    if (availableQuantity < requiredQuantity) {
      errors.push(`Not enough ${ingredient.name}. Available: ${availableQuantity} ${inventoryItem.unit}, Required: ${requiredQuantity} ${ingredient.unit || inventoryItem.unit}`);
    } else if (availableQuantity < requiredQuantity * 1.2) {
      // Warning if stock is less than 120% of required
      warnings.push(`Low stock for ${ingredient.name}. Available: ${availableQuantity} ${inventoryItem.unit}, Required: ${requiredQuantity} ${ingredient.unit || inventoryItem.unit}`);
    }
  });

  return { warnings, errors };
};

/**
 * Find matching inventory item with improved matching logic
 * @param {Array} inventory - Inventory array
 * @param {string} ingredientName - Ingredient name to find
 * @returns {Object|null} Matching inventory item or null
 */
const findMatchingInventoryItem = (inventory, ingredientName) => {
  const searchName = ingredientName.toLowerCase().trim();
  
  // First, try exact match
  let match = inventory.find(item => 
    item.name.toLowerCase().trim() === searchName
  );
  
  if (match) return match;
  
  // Second, try contains match
  match = inventory.find(item => 
    item.name.toLowerCase().includes(searchName) ||
    searchName.includes(item.name.toLowerCase())
  );
  
  if (match) return match;
  
  // Third, try common variations and abbreviations
  const variations = {
    'kk maida': ['maida', 'all purpose flour', 'wheat flour'],
    'g.sugar': ['sugar', 'granulated sugar', 'white sugar'],
    'm.sugar': ['powdered sugar', 'icing sugar', 'confectioners sugar'],
    'vanilla powder': ['vanilla', 'vanilla extract', 'vanilla essence'],
    'amul spray': ['spray', 'cooking spray', 'oil spray'],
    'amul milk': ['milk', 'fresh milk', 'whole milk'],
    'goodlife': ['oil', 'cooking oil', 'vegetable oil'],
    'cornflor': ['cornflour', 'corn starch', 'corn flour'],
    'glocus': ['glucose', 'glucose syrup'],
    'milk maid': ['condensed milk', 'sweetened condensed milk'],
    'rose essen': ['rose essence', 'rose extract', 'rose flavor'],
    'gold more': ['golden syrup', 'corn syrup', 'liquid glucose'],
    'alfa gr': ['ghee', 'clarified butter'],
    'b5 maida': ['maida', 'all purpose flour'],
    '65 maida': ['maida', 'all purpose flour'],
    'green lily': ['ghee', 'clarified butter'],
    'amrit': ['ghee', 'clarified butter'],
    'bake cake ghee': ['ghee', 'clarified butter'],
    'alfa ghee': ['ghee', 'clarified butter']
  };
  
  const variationsForIngredient = variations[searchName];
  if (variationsForIngredient) {
    for (const variation of variationsForIngredient) {
      match = inventory.find(item => 
        item.name.toLowerCase().includes(variation)
      );
      if (match) return match;
    }
  }
  
  // Fourth, try reverse lookup (check if any variation matches this ingredient)
  for (const [key, values] of Object.entries(variations)) {
    if (values.some(v => searchName.includes(v))) {
      match = inventory.find(item => 
        item.name.toLowerCase().includes(key)
      );
      if (match) return match;
    }
  }
  
  return null;
};
