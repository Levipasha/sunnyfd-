/**
 * Inventory Consumption System
 * Handles automatic consumption of ingredients when recipes are saved
 * Manages daily cycles (6 AM to 6 AM) and stock tracking
 */

// Daily cycle constants (6 AM to 6 AM)
const CYCLE_START_HOUR = 6;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// Calculate split unit consumption intelligently
const calculateSplitUnitConsumption = (inventoryItem, totalConsumedQty) => {
  const {
    openingStockPrimary = 0,
    openingStockSecondary = 0,
    receivedPrimary = 0,
    receivedSecondary = 0,
    consumedPrimary = 0,
    consumedSecondary = 0,
    quantityPerSecondaryUnit = 0,
    primaryUnit = 'kg',
    secondaryUnit = 'bag'
  } = inventoryItem;
  
  // Calculate current available stock in primary units
  const currentStockPrimary = openingStockPrimary + receivedPrimary - consumedPrimary;
  const currentStockSecondary = openingStockSecondary + receivedSecondary - consumedSecondary;
  const totalCurrentStock = currentStockPrimary + (currentStockSecondary * quantityPerSecondaryUnit);
  
  // Calculate how much to consume from each unit type
  let remainingToConsume = totalConsumedQty;
  let consumedFromPrimary = 0;
  let consumedFromSecondary = 0;
  
  // First consume from loose (primary) units
  if (remainingToConsume > 0 && currentStockPrimary > 0) {
    consumedFromPrimary = Math.min(remainingToConsume, currentStockPrimary);
    remainingToConsume -= consumedFromPrimary;
  }
  
  // Then consume from secondary units (bags, etc.)
  if (remainingToConsume > 0 && currentStockSecondary > 0) {
    const secondaryUnitsNeeded = Math.ceil(remainingToConsume / quantityPerSecondaryUnit);
    const actualSecondaryUnitsConsumed = Math.min(secondaryUnitsNeeded, currentStockSecondary);
    
    consumedFromSecondary = actualSecondaryUnitsConsumed;
    remainingToConsume -= (actualSecondaryUnitsConsumed * quantityPerSecondaryUnit);
  }
  
  // If we still need more, consume from remaining primary units
  if (remainingToConsume > 0 && currentStockPrimary > consumedFromPrimary) {
    const additionalPrimary = Math.min(remainingToConsume, currentStockPrimary - consumedFromPrimary);
    consumedFromPrimary += additionalPrimary;
    remainingToConsume -= additionalPrimary;
  }
  
  console.log(`Split consumption calculation for ${inventoryItem.name}:`);
  console.log(`  Total needed: ${totalConsumedQty} ${primaryUnit}`);
  console.log(`  Consumed from loose: ${consumedFromPrimary} ${primaryUnit}`);
  console.log(`  Consumed from ${secondaryUnit}s: ${consumedFromSecondary} ${secondaryUnit}s`);
  console.log(`  Remaining needed: ${remainingToConsume} ${primaryUnit}`);
  
  return {
    consumedPrimary: consumedFromPrimary,
    consumedSecondary: consumedFromSecondary
  };
};

// Get current cycle date (6 AM to 6 AM)
export const getCurrentCycleDate = () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // If it's before 6 AM, use yesterday's date
  if (currentHour < CYCLE_START_HOUR) {
    const yesterday = new Date(now.getTime() - MILLISECONDS_PER_DAY);
    return yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  
  // If it's 6 AM or after, use today's date
  return now.toISOString().split('T')[0];
};

// Get cycle start time for a given date
export const getCycleStartTime = (dateString) => {
  const date = new Date(dateString);
  date.setHours(CYCLE_START_HOUR, 0, 0, 0);
  return date;
};

// Global flag to prevent rollover during critical operations
let isProcessingRecipe = false;
let lastRecipeProcessingTime = 0;
const RECIPE_PROCESSING_COOLDOWN = 60000; // 60 seconds cooldown (increased from 30s)

// Check if we need to roll over to a new day
export const shouldRolloverDay = () => {
  // Don't rollover if we're processing a recipe
  if (isProcessingRecipe) {
    console.log('🔍 DEBUG: Skipping rollover - recipe processing in progress');
    return false;
  }
  
  // Don't rollover if we recently processed a recipe (cooldown period)
  const now = Date.now();
  if (now - lastRecipeProcessingTime < RECIPE_PROCESSING_COOLDOWN) {
    console.log(`🔍 DEBUG: Skipping rollover - recipe processing cooldown active (${Math.round((RECIPE_PROCESSING_COOLDOWN - (now - lastRecipeProcessingTime)) / 1000)}s remaining)`);
    return false;
  }
  
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentMinute = currentDate.getMinutes();
  
  // Check if it's exactly 6 AM
  const shouldRollover = currentHour === CYCLE_START_HOUR && currentMinute === 0;
  
  if (shouldRollover) {
    console.log('🔍 DEBUG: Rollover check - 6 AM detected');
  } else {
    // Log rollover check timing for debugging (but less frequently)
    if (currentMinute % 5 === 0) { // Only log every 5 minutes to reduce noise
      console.log(`🔍 DEBUG: Rollover check - Current time: ${currentHour}:${currentMinute}, Rollover time: ${CYCLE_START_HOUR}:00`);
    }
  }
  
  return shouldRollover;
};

// Roll over inventory to new day
export const rolloverInventory = (inventory) => {
  const today = getCurrentCycleDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];
  
  console.log(`🔍 DEBUG: Daily rollover triggered for ${today}`);
  console.log(`🔍 DEBUG: Saving yesterday's data (${yesterdayString})`);
  
  // Save yesterday's data to records
  const yesterdayData = {
    date: yesterdayString,
    inventory: inventory.map(item => ({
      id: item.id,
      name: item.name,
      received: item.received || 0,
      consumed: item.consumed || 0,
      received2: item.received2 || 0,
      consumed2: item.consumed2 || 0,
      total: item.finalStock || item.currentStock || 0
    }))
  };
  
  // Save to daily records
  saveDailyRecord(yesterdayData);
  
  // Update inventory for new day
  // IMPORTANT: Preserve consumed values, only reset received values
  const newDayInventory = inventory.map(item => {
    const newItem = {
      ...item,
      openingStock: item.finalStock || item.currentStock || 0,
      minimumQuantity: item.minimumQuantity || 0, // Preserve minimum quantity
      received: 0,  // Reset received for new day
      received2: 0, // Reset received2 for new day
      // DO NOT reset consumed values - they accumulate across days
      // consumed: item.consumed || 0,  // Keep existing consumed
      // consumed2: item.consumed2 || 0, // Keep existing consumed2
      total: item.finalStock || item.currentStock || 0,
      balance: item.finalStock || item.currentStock || 0,
      total2: item.finalStock || item.currentStock || 0,
      finalStock: item.finalStock || item.currentStock || 0,
      currentStock: item.finalStock || item.currentStock || 0
    };
    
    console.log(`🔍 DEBUG: Rollover for ${item.name}:`, {
      oldOpeningStock: item.openingStock,
      newOpeningStock: newItem.openingStock,
      oldConsumed: item.consumed,
      newConsumed: newItem.consumed,
      oldBalance: item.balance,
      newBalance: newItem.balance
    });
    
    return newItem;
  });
  
  console.log(`🔍 DEBUG: Daily rollover completed. New inventory prepared for ${today}`);
  return newDayInventory;
};

// Save daily record
const saveDailyRecord = (dailyData) => {
  try {
    const existingRecords = localStorage.getItem('dailyInventoryRecords') || '{}';
    const records = JSON.parse(existingRecords);
    
    // Group by month
    const month = dailyData.date.substring(0, 7); // YYYY-MM
    if (!records[month]) {
      records[month] = {};
    }
    
    records[month][dailyData.date] = dailyData.inventory;
    localStorage.setItem('dailyInventoryRecords', JSON.stringify(records));
    
    console.log(`Daily record saved for ${dailyData.date}`);
  } catch (error) {
    console.error('Error saving daily record:', error);
  }
};

// Consume ingredients from inventory when recipe is saved (legacy function)
export const consumeIngredientsFromRecipe = async (recipe, orderQty, inventory, setInventory) => {
  isProcessingRecipe = true; // Set flag before processing
  lastRecipeProcessingTime = Date.now(); // Update last processing time
  try {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
      console.warn('Recipe has no ingredients to consume');
      return;
    }
    
    const updatedInventory = [...inventory];
    const consumptionData = {
      date: getCurrentCycleDate(),
      recipeId: recipe.id,
      recipeName: recipe.description,
      orderQty: orderQty,
      ingredients: []
    };
    
    recipe.ingredients.forEach(ingredient => {
      const inventoryItem = updatedInventory.find(item => 
        item.name.toLowerCase() === ingredient.name.toLowerCase()
      );
      
      if (inventoryItem) {
        const consumedQty = (parseFloat(ingredient.qty) || 0) * (parseFloat(orderQty) || 0);
        
        // Handle split unit consumption intelligently
        if (inventoryItem.secondaryUnit && inventoryItem.quantityPerSecondaryUnit > 0) {
          // Calculate consumption using split units
          const { consumedPrimary, consumedSecondary } = calculateSplitUnitConsumption(
            inventoryItem, 
            consumedQty
          );
          
          // Update split consumed fields
          inventoryItem.consumedPrimary = (parseFloat(inventoryItem.consumedPrimary) || 0) + consumedPrimary;
          inventoryItem.consumedSecondary = (parseFloat(inventoryItem.consumedSecondary) || 0) + consumedSecondary;
          
          // Update legacy consumed field
          inventoryItem.consumed = (parseFloat(inventoryItem.consumed) || 0) + consumedQty;
          
          console.log(`Consumed ${consumedPrimary} ${inventoryItem.primaryUnit} + ${consumedSecondary} ${inventoryItem.secondaryUnit} (${consumedQty} total) from ${inventoryItem.name}`);
        } else {
          // Standard consumption for single unit items
          inventoryItem.consumed = (parseFloat(inventoryItem.consumed) || 0) + consumedQty;
          console.log(`Consumed ${consumedQty} ${inventoryItem.name}`);
        }
        
        // Recalculate totals
        inventoryItem.total = (parseFloat(inventoryItem.openingStock) || 0) + (parseFloat(inventoryItem.received) || 0);
        inventoryItem.balance = inventoryItem.total - inventoryItem.consumed;
        inventoryItem.total2 = inventoryItem.balance + (parseFloat(inventoryItem.received2) || 0);
        inventoryItem.finalStock = inventoryItem.total2 - (parseFloat(inventoryItem.consumed2) || 0);
        inventoryItem.currentStock = inventoryItem.finalStock;
        
        // Update split balance and total fields if they exist
        if (inventoryItem.secondaryUnit) {
          inventoryItem.balancePrimary = inventoryItem.balance;
          inventoryItem.balanceSecondary = 0;
          inventoryItem.finalStockPrimary = inventoryItem.finalStock;
          inventoryItem.finalStockSecondary = 0;
        }
        
        // Record consumption
        consumptionData.ingredients.push({
          name: ingredient.name,
          qty: ingredient.qty,
          consumed: consumedQty,
          remaining: inventoryItem.finalStock,
          consumedPrimary: inventoryItem.consumedPrimary || 0,
          consumedSecondary: inventoryItem.consumedSecondary || 0
        });
      } else {
        console.warn(`Ingredient ${ingredient.name} not found in inventory`);
      }
    });
    
    // Save consumption record
    saveConsumptionRecord(consumptionData);
    
    // Update local state
    setInventory(updatedInventory);
    
    try {
      // Update each modified inventory item in the database
      const itemsToUpdate = updatedInventory.filter(item => item.consumed > 0);
      
      if (itemsToUpdate.length === 0) {
        console.log('No inventory items need updating');
        return updatedInventory;
      }
      
      console.log('Updating inventory items:', itemsToUpdate);
      
      const updatePromises = itemsToUpdate.map(async (item) => {
        // Use the full URL in development, relative URL in production
        const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'https://sunny-b.onrender.com';
        const url = `${apiBaseUrl}/inventory/${item.id}`;
        const body = JSON.stringify({
          name: item.name,
          openingStock: item.openingStock,
          received: item.received,
          consumed: item.consumed,
          received2: item.received2,
          consumed2: item.consumed2,
          unit: item.unit,
          // Include split unit fields
          primaryUnit: item.primaryUnit,
          customPrimaryUnit: item.customPrimaryUnit,
          secondaryUnit: item.secondaryUnit,
          quantityPerSecondaryUnit: item.quantityPerSecondaryUnit,
          // Split quantity fields
          openingStockPrimary: item.openingStockPrimary,
          openingStockSecondary: item.openingStockSecondary,
          receivedPrimary: item.receivedPrimary,
          receivedSecondary: item.receivedSecondary,
          consumedPrimary: item.consumedPrimary,
          consumedSecondary: item.consumedSecondary,
          received2Primary: item.received2Primary,
          received2Secondary: item.received2Secondary,
          consumed2Primary: item.consumed2Primary,
          consumed2Secondary: item.consumed2Secondary,
          balancePrimary: item.balancePrimary,
          balanceSecondary: item.balanceSecondary,
          finalStockPrimary: item.finalStockPrimary,
          finalStockSecondary: item.finalStockSecondary
        });
        
        console.log(`Sending PUT request to ${url} with data:`, body);
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to update item ${item.id}: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Failed to update item ${item.id}: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Successfully updated item ${item.id}:`, result);
        return result;
      });
      
      await Promise.all(updatePromises);
      console.log('✅ Successfully updated all inventory items in database');
      
    } catch (error) {
      console.error('❌ Failed to update inventory in database:', error);
      // Revert local state on error
      setInventory(inventory);
      throw error;
    }
    
    return updatedInventory;
  } finally {
    isProcessingRecipe = false; // Reset flag after processing
  }
};

// Consume ingredients from inventory when order is placed (with split unit support)
export const consumeIngredientsFromOrder = async (recipe, orderQty, inventory, setInventory) => {
  isProcessingRecipe = true; // Set flag before processing
  lastRecipeProcessingTime = Date.now(); // Update last processing time
  
  try {
    console.log(`🔍 DEBUG: consumeIngredientsFromOrder called with:`, {
      recipeName: recipe.name || recipe.description || recipe.title,
      orderQty: orderQty,
      inventoryLength: inventory?.length,
      setInventoryType: typeof setInventory
    });
    
    // Handle different recipe structures
    let ingredientsToConsume = [];
    
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      // Legacy structure: ingredients array
      ingredientsToConsume = recipe.ingredients;
      console.log(`🔍 DEBUG: Using legacy ingredients array structure`);
    } else if (recipe.items && Array.isArray(recipe.items)) {
      // New structure: items array with ingredientValues
      console.log(`🔍 DEBUG: Using new items array structure with ingredientValues`);
      recipe.items.forEach(item => {
        if (item.ingredientValues && typeof item.ingredientValues === 'object') {
          Object.entries(item.ingredientValues).forEach(([ingredientName, quantity]) => {
            if (quantity && parseFloat(quantity) > 0) {
              ingredientsToConsume.push({
                name: ingredientName,
                qty: quantity,
                quantity: quantity,
                totalQuantity: quantity
              });
            }
          });
        }
      });
      console.log(`🔍 DEBUG: Extracted ingredients from items:`, ingredientsToConsume);
    } else {
      console.warn('Recipe has no valid ingredients structure');
      return inventory;
    }
    
    if (ingredientsToConsume.length === 0) {
      console.warn('No ingredients found to consume');
      return inventory;
    }
    
    if (!inventory || !Array.isArray(inventory)) {
      console.warn('Inventory is not available or not an array');
      return inventory;
    }
    
    console.log(`🔍 DEBUG: Recipe ingredients to consume:`, ingredientsToConsume);
    console.log(`🔍 DEBUG: Inventory items:`, inventory.map(item => ({
      id: item.id,
      name: item.name,
      consumed: item.consumed,
      balance: item.balance
    })));
    
    // Additional debugging for inventory structure
    console.log(`🔍 DEBUG: Inventory structure details:`, {
      totalItems: inventory.length,
      firstItemKeys: inventory[0] ? Object.keys(inventory[0]) : [],
      firstItemValues: inventory[0] ? Object.values(inventory[0]) : [],
      hasIdField: inventory.every(item => item.hasOwnProperty('id')),
      hasNameField: inventory.every(item => item.hasOwnProperty('name')),
      idTypes: inventory.map(item => ({ id: item.id, idType: typeof item.id })),
      nameTypes: inventory.map(item => ({ name: item.name, nameType: typeof item.name }))
    });
    
    const updatedInventory = [...inventory];
    const consumptionData = {
      date: getCurrentCycleDate(),
      recipeId: recipe.id || recipe.name || recipe._id,
      recipeName: recipe.name || recipe.description || recipe.title || 'Unknown Recipe',
      orderQty: orderQty,
      ingredients: []
    };
    
    console.log(`🔍 DEBUG: Processing order for recipe: ${recipe.name || recipe.description || recipe.title}`);
    console.log(`🔍 DEBUG: Order quantity: ${orderQty}`);
    console.log(`🔍 DEBUG: Ingredients to consume:`, ingredientsToConsume);
    
    ingredientsToConsume.forEach(ingredient => {
      console.log(`🔍 DEBUG: Processing ingredient: ${ingredient.name}`);
      
      const inventoryItem = updatedInventory.find(item => 
        item.name.toLowerCase() === ingredient.name.toLowerCase()
      );
      
      if (inventoryItem) {
        console.log(`🔍 DEBUG: Found inventory item:`, {
          id: inventoryItem.id,
          name: inventoryItem.name,
          currentConsumed: inventoryItem.consumed,
          currentBalance: inventoryItem.balance
        });
        
        const consumedQty = (parseFloat(ingredient.quantity || ingredient.qty || ingredient.totalQuantity) || 0) * (parseFloat(orderQty) || 0);
        
        console.log(`🔍 DEBUG:   Per unit: ${ingredient.quantity || ingredient.qty || ingredient.totalQuantity}`);
        console.log(`🔍 DEBUG:   Order quantity: ${orderQty}`);
        console.log(`🔍 DEBUG:   Total to consume: ${consumedQty}`);
        
        // Handle split unit consumption intelligently
        if (inventoryItem.secondaryUnit && inventoryItem.quantityPerSecondaryUnit > 0) {
          // Calculate consumption using split units
          const { consumedPrimary, consumedSecondary } = calculateSplitUnitConsumption(
            inventoryItem, 
            consumedQty
          );
          
          // Update split consumed fields
          inventoryItem.consumedPrimary = (parseFloat(inventoryItem.consumedPrimary) || 0) + consumedPrimary;
          inventoryItem.consumedSecondary = (parseFloat(inventoryItem.consumedSecondary) || 0) + consumedSecondary;
          
          // Update legacy consumed field
          inventoryItem.consumed = (parseFloat(inventoryItem.consumed) || 0) + consumedQty;
          
          console.log(`✅ Consumed ${consumedPrimary} ${inventoryItem.primaryUnit} + ${consumedSecondary} ${inventoryItem.secondaryUnit} (${consumedQty} total) from ${inventoryItem.name}`);
          console.log(`🔍 DEBUG: Updated consumption values for ${inventoryItem.name}:`, {
            consumedPrimary: inventoryItem.consumedPrimary,
            consumedSecondary: inventoryItem.consumedSecondary,
            consumed: inventoryItem.consumed,
            originalConsumed: parseFloat(inventoryItem.consumed) || 0,
            addedConsumed: consumedQty
          });
        } else if (inventoryItem.secondaryUnit && inventoryItem.quantityPerSecondaryUnit === 0) {
          // Configuration error: secondary unit set but quantityPerSecondaryUnit is 0
          console.warn(`⚠️ WARNING: Inventory item ${inventoryItem.name} has secondary unit "${inventoryItem.secondaryUnit}" but quantityPerSecondaryUnit is 0. This is a configuration error.`);
          console.warn(`⚠️ Using standard consumption as fallback. Please fix the inventory item configuration.`);
          
          // Fall back to standard consumption
          inventoryItem.consumedPrimary = (parseFloat(inventoryItem.consumedPrimary) || 0) + consumedQty;
          inventoryItem.consumedSecondary = 0;
          inventoryItem.consumed = (parseFloat(inventoryItem.consumed) || 0) + consumedQty;
          
          console.log(`✅ Consumed ${consumedQty} ${inventoryItem.name} (fallback due to config error)`);
        } else {
          // Standard consumption for single unit items or items with invalid secondary unit configuration
          console.log(`🔍 DEBUG: Using standard consumption for ${inventoryItem.name} - secondaryUnit: "${inventoryItem.secondaryUnit}", quantityPerSecondaryUnit: ${inventoryItem.quantityPerSecondaryUnit}`);
          
          // Initialize split fields if they don't exist
          if (!inventoryItem.consumedPrimary) {
            inventoryItem.consumedPrimary = 0;
          }
          if (!inventoryItem.consumedSecondary) {
            inventoryItem.consumedSecondary = 0;
          }
          
          // For standard consumption, put everything in primary units
          inventoryItem.consumedPrimary = (parseFloat(inventoryItem.consumedPrimary) || 0) + consumedQty;
          inventoryItem.consumedSecondary = 0;
          
          // Update legacy consumed field
          inventoryItem.consumed = (parseFloat(inventoryItem.consumed) || 0) + consumedQty;
          
          console.log(`✅ Consumed ${consumedQty} ${inventoryItem.name} (standard consumption)`);
          console.log(`🔍 DEBUG: Updated consumption values for ${inventoryItem.name}:`, {
            consumedPrimary: inventoryItem.consumedPrimary,
            consumedSecondary: inventoryItem.consumedSecondary,
            consumed: inventoryItem.consumed,
            originalConsumed: parseFloat(inventoryItem.consumed) || 0,
            addedConsumed: consumedQty
          });
        }
        
        // Recalculate totals
        inventoryItem.total = (parseFloat(inventoryItem.openingStock) || 0) + (parseFloat(inventoryItem.received) || 0);
        inventoryItem.balance = inventoryItem.total - inventoryItem.consumed;
        inventoryItem.total2 = inventoryItem.balance + (parseFloat(inventoryItem.received2) || 0);
        inventoryItem.finalStock = inventoryItem.total2 - (parseFloat(inventoryItem.consumed2) || 0);
        inventoryItem.currentStock = inventoryItem.finalStock;
        
        // Update split balance and total fields if they exist
        if (inventoryItem.secondaryUnit) {
          inventoryItem.balancePrimary = inventoryItem.balance;
          inventoryItem.balanceSecondary = 0;
          inventoryItem.finalStockPrimary = inventoryItem.finalStock;
          inventoryItem.finalStockSecondary = 0;
        }
        
        console.log(`🔍 DEBUG:   After consumption:`, {
          consumed: inventoryItem.consumed,
          balance: inventoryItem.balance,
          total: inventoryItem.total,
          finalStock: inventoryItem.finalStock
        });
        
        // Record consumption
        consumptionData.ingredients.push({
          name: ingredient.name,
          qty: ingredient.quantity || ingredient.qty || ingredient.totalQuantity,
          consumed: consumedQty,
          remaining: inventoryItem.finalStock,
          consumedPrimary: inventoryItem.consumedPrimary || 0,
          consumedSecondary: inventoryItem.consumedSecondary || 0
        });
      } else {
        console.warn(`⚠️ Ingredient ${ingredient.name} not found in inventory`);
        console.warn(`⚠️ Available inventory items:`, updatedInventory.map(item => item.name));
      }
    });
    
    // Save consumption record
    saveConsumptionRecord(consumptionData);
    
    console.log(`🔍 DEBUG: About to update local inventory state`);
    console.log(`🔍 DEBUG: Updated inventory before setState:`, updatedInventory.map(item => ({
      id: item.id,
      name: item.name,
      consumed: item.consumed,
      balance: item.balance
    })));
    
    // Update local state
    setInventory(updatedInventory);
    
    console.log(`🔍 DEBUG: Local inventory state updated`);
    console.log(`🔍 DEBUG: Updated inventory after setState:`, updatedInventory.map(item => ({
      id: item.id,
      name: item.name,
      consumed: item.consumed,
      balance: item.balance,
      total: item.total,
      finalStock: item.finalStock
    })));
    
    // Additional verification that consumed values are correct
    const itemsWithConsumption = updatedInventory.filter(item => item.consumed > 0);
    console.log(`🔍 DEBUG: Items with consumption after update:`, itemsWithConsumption.map(item => ({
      id: item.id,
      name: item.name,
      consumed: item.consumed,
      balance: item.balance
    })));
    
    try {
      // Update each modified inventory item in the database
      const itemsToUpdate = updatedInventory.filter(item => item.consumed > 0);
      
      if (itemsToUpdate.length === 0) {
        console.log('🔍 DEBUG: No inventory items need updating');
        return updatedInventory;
      }
      
      console.log('🔍 DEBUG: Items to update in database:', itemsToUpdate.map(item => ({
        id: item.id,
        name: item.name,
        consumed: item.consumed,
        balance: item.balance,
        total: item.total,
        finalStock: item.finalStock
      })));
      
      // Prevent rollover during database updates
      const originalIsProcessingRecipe = isProcessingRecipe;
      isProcessingRecipe = true;
      
      try {
        const updatePromises = itemsToUpdate.map(async (item) => {
          const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'https://sunny-b.onrender.com';
          const url = `${apiBaseUrl}/inventory/${item.id}`;
          
          const updateData = {
            name: item.name,
            openingStock: item.openingStock,
            received: item.received,
            consumed: item.consumed,
            received2: item.received2,
            consumed2: item.consumed2,
            unit: item.unit,
            // Include split unit fields
            primaryUnit: item.primaryUnit,
            customPrimaryUnit: item.customPrimaryUnit,
            secondaryUnit: item.secondaryUnit,
            quantityPerSecondaryUnit: item.quantityPerSecondaryUnit,
            // Split quantity fields
            openingStockPrimary: item.openingStockPrimary,
            openingStockSecondary: item.openingStockSecondary,
            receivedPrimary: item.receivedPrimary,
            receivedSecondary: item.receivedSecondary,
            consumedPrimary: item.consumedPrimary,
            consumedSecondary: item.consumedSecondary,
            received2Primary: item.received2Primary,
            received2Secondary: item.received2Secondary,
            consumed2Primary: item.consumed2Primary,
            consumed2Secondary: item.consumed2Secondary,
            balancePrimary: item.balancePrimary,
            balanceSecondary: item.balanceSecondary,
            finalStockPrimary: item.finalStockPrimary,
            finalStockSecondary: item.finalStockSecondary
          };
          
          console.log(`🔍 DEBUG: Updating item ${item.id} (${item.name}) with data:`, updateData);
          console.log(`🔍 DEBUG: API URL: ${url}`);
          console.log(`🔍 DEBUG: Request body:`, JSON.stringify(updateData, null, 2));
          console.log(`🔍 DEBUG: Critical consumption values being sent:`, {
            consumed: updateData.consumed,
            consumedPrimary: updateData.consumedPrimary,
            consumedSecondary: updateData.consumedSecondary,
            consumed2: updateData.consumed2,
            consumed2Primary: updateData.consumed2Primary,
            consumed2Secondary: updateData.consumed2Secondary
          });
          
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
          });
          
          console.log(`🔍 DEBUG: Response status: ${response.status}`);
          console.log(`🔍 DEBUG: Response ok: ${response.ok}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to update item ${item.id}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Failed to update item ${item.id}: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log(`✅ Successfully updated item ${item.id}:`, result);
          console.log(`🔍 DEBUG: Updated item data from server:`, {
            id: result.data?.id,
            name: result.data?.name,
            consumed: result.data?.consumed,
            balance: result.data?.balance,
            total: result.data?.total,
            finalStock: result.data?.finalStock
          });
          return result;
        });
        
        const results = await Promise.all(updatePromises);
        console.log('✅ Successfully updated all inventory items in database');
        console.log('🔍 DEBUG: All update results:', results);
        
      } finally {
        // Restore original processing state
        isProcessingRecipe = originalIsProcessingRecipe;
      }
      
    } catch (error) {
      console.error('❌ Failed to update inventory in database:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      // Revert local state on error
      setInventory(inventory);
      throw error;
    }
    
    console.log(`🔍 DEBUG: consumeIngredientsFromOrder completed successfully`);
    return updatedInventory;
  } finally {
    isProcessingRecipe = false; // Reset flag after processing
  }
};

// Save consumption record
const saveConsumptionRecord = (consumptionData) => {
  try {
    const existingRecords = localStorage.getItem('consumptionRecords') || '[]';
    const records = JSON.parse(existingRecords);
    records.push({
      ...consumptionData,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('consumptionRecords', JSON.stringify(records));
  } catch (error) {
    console.error('Error saving consumption record:', error);
  }
};

// Get daily records for a specific month
export const getDailyRecords = (month) => {
  try {
    const existingRecords = localStorage.getItem('dailyInventoryRecords') || '{}';
    const records = JSON.parse(existingRecords);
    return records[month] || {};
  } catch (error) {
    console.error('Error loading daily records:', error);
    return {};
  }
};

// Get consumption records for a specific date
export const getConsumptionRecords = (date) => {
  try {
    const existingRecords = localStorage.getItem('consumptionRecords') || '[]';
    const records = JSON.parse(existingRecords);
    return records.filter(record => record.date === date);
  } catch (error) {
    console.error('Error loading consumption records:', error);
    return [];
  }
};

// Check if inventory needs daily rollover
export const checkDailyRollover = (inventory, setInventory) => {
  if (shouldRolloverDay()) {
    console.log('Daily rollover detected at 6 AM');
    const newInventory = rolloverInventory(inventory);
    setInventory(newInventory);
    return true;
  }
  return false;
};

// Initialize daily rollover check
export const initializeDailyRollover = (inventory, setInventory) => {
  // Check every 5 minutes for rollover instead of every minute
  // This reduces interference with recipe operations
  const interval = setInterval(() => {
    // Add additional safety check
    if (isProcessingRecipe) {
      console.log('🔍 DEBUG: Skipping rollover check - recipe processing in progress');
      return;
    }
    
    // Additional check for recent recipe processing
    const now = Date.now();
    if (now - lastRecipeProcessingTime < RECIPE_PROCESSING_COOLDOWN) {
      console.log(`🔍 DEBUG: Skipping rollover check - recipe processing cooldown active (${Math.round((RECIPE_PROCESSING_COOLDOWN - (now - lastRecipeProcessingTime)) / 1000)}s remaining)`);
      return;
    }
    
    const shouldRollover = shouldRolloverDay();
    if (shouldRollover) {
      console.log('🔍 DEBUG: Rollover check triggered - processing rollover');
      try {
        const newInventory = rolloverInventory(inventory);
        setInventory(newInventory);
        console.log('🔍 DEBUG: Rollover completed successfully');
      } catch (error) {
        console.error('❌ Error during rollover:', error);
      }
    }
  }, 300000); // 5 minutes instead of 1 minute
  
  console.log('🔍 DEBUG: Daily rollover initialized - checking every 5 minutes');
  
  return () => {
    console.log('🔍 DEBUG: Clearing daily rollover interval');
    clearInterval(interval);
  };
};

const inventoryConsumptionUtils = {
  getCurrentCycleDate,
  getCycleStartTime,
  shouldRolloverDay,
  rolloverInventory,
  consumeIngredientsFromRecipe,
  consumeIngredientsFromOrder,
  getDailyRecords,
  getConsumptionRecords,
  checkDailyRollover,
  initializeDailyRollover
};

export default inventoryConsumptionUtils;