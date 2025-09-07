import React, { useState, useEffect, useCallback } from 'react';
import { consumeIngredientsFromOrder } from '../utils/inventoryConsumption';
import { recipeService } from '../services/recipeService';

const SaveButton = ({ recipes, orderQuantities, categoryName, onSave, inventory, setInventory }) => {
  const [saveCount, setSaveCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Map display category names to database category names
  const getDatabaseCategory = (displayCategory) => {
    const categoryMap = {
      'Qameer Block': 'qameer',
      'Mawa Block': 'mawa',
      'Cross Update Block': 'cross_update',
      'Osamania Block': 'osamania',
      'Salt Items Block': 'saltitems',
      'Showroom Block': 'showroom',
      'Dynamic Block': 'dynamic'
    };
    
    // Handle ONE section dynamic categories (they come with categoryId)
    if (displayCategory && displayCategory.startsWith('main:')) {
      const categoryId = displayCategory.replace('main:', '');
      return `dynamic_${categoryId}`;
    }
    
    const dbCategory = categoryMap[displayCategory] || displayCategory.toLowerCase().replace(/\s+/g, '_');
    console.log(`🔍 Debug: Category mapping: "${displayCategory}" → "${dbCategory}"`);
    return dbCategory;
  };

  // Calculate which recipes have values and should be saved
  const getRecipesWithValues = useCallback(() => {
    return recipes.filter(recipe => {
      const orderQty = parseFloat(orderQuantities[recipe.id]) || 0;
      return orderQty > 0; // Only recipes with order values > 0
    });
  }, [recipes, orderQuantities]);

  // Update save count when recipes or order quantities change
  useEffect(() => {
    const recipesWithValues = getRecipesWithValues();
    setSaveCount(recipesWithValues.length);
  }, [getRecipesWithValues]);

  // Listen for data refresh events from PrintButton
  useEffect(() => {
    const handleDataRefreshed = () => {
      // Reset save count when data is refreshed
      setSaveCount(0);
    };

    window.addEventListener('dataRefreshed', handleDataRefreshed);
    
    return () => {
      window.removeEventListener('dataRefreshed', handleDataRefreshed);
    };
  }, []);

  const handleSave = async () => {
    const recipesWithValues = getRecipesWithValues();
    
    if (recipesWithValues.length === 0) {
      alert('No recipes with values to save. Please enter order quantities first.');
      return;
    }

    setIsSaving(true);

    try {
      // Get all unique ingredients from all recipes to understand the table structure
      const allIngredients = new Set();
      recipesWithValues.forEach(recipe => {
        // Check if recipe has ingredients array (new structure)
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach(ing => {
            if (ing.name) allIngredients.add(ing.name);
          });
        }
        // Check if recipe has ingredient properties (old structure)
        else if (recipe.ingredients && typeof recipe.ingredients === 'object') {
          Object.keys(recipe.ingredients).forEach(ingredientName => {
            allIngredients.add(ingredientName);
          });
        }
      });
      
      const ingredientArray = Array.from(allIngredients);
      
      // Define the table structure based on the actual columns
      const tableStructure = {
        columns: [
          { name: 'Item', type: 'item' },
          { name: 'Order', type: 'order' },
          { name: 'Per', type: 'per' },
          { name: 'Total Qty', type: 'totalQty' },
          ...ingredientArray.map(ingredient => ({ name: ingredient, type: 'ingredient' })),
          { name: 'Actions', type: 'action' }
        ],
        ingredients: ingredientArray
      };

      // Save each recipe to MongoDB
      const savedRecipes = [];
      
      for (const recipe of recipesWithValues) {
        console.log(`🔍 Debug: Processing recipe:`, recipe);
        console.log(`🔍 Debug: Recipe ID:`, recipe.id);
        console.log(`🔍 Debug: Recipe mongoId:`, recipe.mongoId);
        console.log(`🔍 Debug: Recipe _id:`, recipe._id);
        console.log(`🔍 Debug: Recipe description:`, recipe.description);
        console.log(`🔍 Debug: Recipe category:`, recipe.category);
        console.log(`🔍 Debug: Recipe ingredients:`, recipe.ingredients);
        console.log(`🔍 Debug: Recipe ingredients type:`, typeof recipe.ingredients);
        console.log(`🔍 Debug: Recipe ingredients isArray:`, Array.isArray(recipe.ingredients));
        console.log(`🔍 Debug: Recipe ingredients length:`, recipe.ingredients?.length);
        
        const orderQty = parseFloat(orderQuantities[recipe.id]) || 0;
        
        // Extract ingredient values based on recipe structure
        let ingredientValues = {};
        
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          // New structure: ingredients array - save ONLY base quantities (per unit)
          recipe.ingredients.forEach(ing => {
            if (ing.name) {
              // Save the base quantity (per unit), NOT the calculated value
              const baseQty = parseFloat(ing.baseQty || ing.qty || ing.quantity || 0);
              ingredientValues[ing.name] = baseQty;
            }
          });
        } else if (recipe.ingredients && typeof recipe.ingredients === 'object') {
          // Old structure: ingredients object - save ONLY base quantities (per unit)
          Object.keys(recipe.ingredients).forEach(ingredientName => {
            const baseValue = parseFloat(recipe.ingredients[ingredientName]) || 0;
            // Save the base quantity (per unit), NOT the calculated value
            ingredientValues[ingredientName] = baseValue;
          });
        }
        
        // Calculate totals for ingredient values (these are the base quantities, not calculated values)
        const ingredientTotals = {};
        ingredientArray.forEach(ingredient => {
          ingredientTotals[ingredient] = ingredientValues[ingredient] || 0;
        });
        
        console.log(`🔍 Debug: Calculated ingredientValues:`, ingredientValues);
        console.log(`🔍 Debug: Calculated ingredientTotals:`, ingredientTotals);
        console.log(`🔍 Debug: Order quantity:`, orderQty);
        
        // Prepare recipe data for MongoDB with complete table structure
        const recipeData = {
          title: recipe.description || recipe.name || 'Untitled Recipe',
          description: `Recipe from ${categoryName} with order quantity ${orderQty}`,
          category: getDatabaseCategory(categoryName),
          subCategory: recipe.subCategory || 'Default',
          tableStructure: tableStructure,
          items: [{
            name: recipe.description || recipe.name || 'Untitled Item',
            order: orderQty,
            per: 1,
            totalQty: orderQty,
            ingredientValues: ingredientValues
          }],
          totals: {
            orderTotal: orderQty,
            totalQtyTotal: orderQty,
            ingredientTotals: ingredientTotals
          },
          createdBy: 'system'
        };

        // If this is an existing recipe (has mongoId), include it for updates
        if (recipe.mongoId) {
          recipeData._id = recipe.mongoId;
          console.log(`🔍 Debug: Including existing recipe ID: ${recipe.mongoId} for update`);
        }

        console.log(`🔍 Debug: Final recipeData before sending:`, recipeData);
        console.log(`🔍 Debug: RecipeData _id:`, recipeData._id);
        console.log(`🔍 Debug: RecipeData mongoId:`, recipeData.mongoId);
        console.log(`🔍 Debug: RecipeData category:`, recipeData.category);
        console.log(`🔍 Debug: RecipeData title:`, recipeData.title);
        console.log(`🔍 Debug: RecipeData description:`, recipeData.description);

        try {
          console.log('🔍 Debug: Sending recipe data to backend...');
          console.log('🔍 Debug: Recipe data:', JSON.stringify(recipeData, null, 2));
          
          const savedRecipe = await recipeService.saveRecipe(recipeData);
          console.log('🔍 Debug: Recipe service response:', savedRecipe);
          
          savedRecipes.push({
            ...recipe,
            savedOrderQty: orderQty,
            savedAt: new Date().toISOString(),
            categoryName: categoryName,
            mongoId: savedRecipe.data._id
          });
          
          console.log(`✅ Recipe saved to MongoDB: ${savedRecipe.data._id}`);
          console.log(`🔍 Debug: Recipe saved successfully, mongoId: ${savedRecipe.data._id}`);
          console.log(`🔍 Debug: Recipe data after save:`, savedRecipe.data);
          console.log('Table structure saved:', tableStructure);
          console.log('Ingredient columns:', ingredientArray);
        } catch (error) {
          console.error(`❌ Failed to save recipe ${recipe.id}:`, error);
          console.error(`❌ Error details:`, {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          console.error(`❌ Recipe data that failed:`, recipeData);
          throw new Error(`Failed to save recipe: ${error.message}`);
        }
      }

      // Save to localStorage for the PrintButton to access (maintain existing functionality)
      const existingSaved = localStorage.getItem('savedRecipes');
      const existingData = existingSaved ? JSON.parse(existingSaved) : [];
      
      // Merge with existing saved recipes, replacing any duplicates
      const mergedData = [...existingData];
      savedRecipes.forEach(newRecipe => {
        const existingIndex = mergedData.findIndex(r => r.id === newRecipe.id && r.categoryName === newRecipe.categoryName);
        if (existingIndex >= 0) {
          mergedData[existingIndex] = newRecipe; // Replace existing
        } else {
          mergedData.push(newRecipe); // Add new
        }
      });
      
      localStorage.setItem('savedRecipes', JSON.stringify(mergedData));
      
      // CONSUME INGREDIENTS FROM INVENTORY
      if (inventory && setInventory) {
        try {
          console.log(`🔍 Debug: Starting inventory consumption for ${savedRecipes.length} recipes`);
          console.log(`🔍 Debug: Saved recipes before inventory consumption:`, savedRecipes);
          console.log(`🔍 Debug: Current inventory state:`, inventory);
          
          // TEST: Verify inventory structure
          console.log(`🔍 Debug: Inventory structure test:`, {
            length: inventory.length,
            firstItem: inventory[0],
            hasIdField: inventory[0]?.hasOwnProperty('id'),
            idType: typeof inventory[0]?.id,
            idValue: inventory[0]?.id,
            hasNameField: inventory[0]?.hasOwnProperty('name'),
            nameValue: inventory[0]?.name
          });
          
          // TEST: Create a simple test recipe to verify consumption
          if (inventory.length > 0) {
            const testRecipe = {
              id: 'test',
              name: 'Test Recipe',
              description: 'Test Recipe for Consumption',
              ingredients: [
                {
                  name: inventory[0].name, // Use first inventory item
                  qty: 10,
                  quantity: 10,
                  totalQuantity: 10
                }
              ]
            };
            
            console.log(`🔍 Debug: Testing consumption with test recipe:`, testRecipe);
            console.log(`🔍 Debug: Test recipe ingredients:`, testRecipe.ingredients);
            console.log(`🔍 Debug: About to test consumeIngredientsFromOrder...`);
            
            try {
              console.log(`🔍 Debug: === TESTING CONSUMPTION FUNCTION ===`);
              const testResult = await consumeIngredientsFromOrder(testRecipe, 1, inventory, setInventory, { useSecondCycleForConsumption: false });
              console.log(`🔍 Debug: Test consumption result:`, testResult);
              console.log(`🔍 Debug: Inventory after test consumption:`, inventory);
              console.log(`🔍 Debug: === TEST CONSUMPTION COMPLETED ===`);
            } catch (testError) {
              console.error(`❌ Test consumption failed:`, testError);
              console.error(`❌ Test error stack:`, testError.stack);
              console.error(`❌ This means the consumption function is broken!`);
            }
          }
          
          // CRITICAL: Check if we have any recipes to process
          console.log(`🔍 Debug: savedRecipes count:`, savedRecipes.length);
          console.log(`🔍 Debug: savedRecipes data:`, savedRecipes);
          
          if (savedRecipes.length === 0) {
            console.warn(`⚠️ Warning: No recipes to process for consumption`);
            return;
          }
          
          // CRITICAL: Check the recipe structure to see why consumption isn't working
          console.log(`🔍 Debug: === RECIPE STRUCTURE ANALYSIS ===`);
          savedRecipes.forEach((recipe, index) => {
            console.log(`🔍 Debug: Recipe ${index + 1}:`, {
              id: recipe.id,
              name: recipe.name,
              description: recipe.description,
              hasIngredients: !!recipe.ingredients,
              ingredientsType: typeof recipe.ingredients,
              ingredientsIsArray: Array.isArray(recipe.ingredients),
              ingredientsLength: recipe.ingredients?.length,
              ingredientsKeys: recipe.ingredients ? Object.keys(recipe.ingredients) : [],
              ingredientsData: recipe.ingredients
            });
          });
          console.log(`🔍 Debug: === END RECIPE ANALYSIS ===`);
          
          // Process each recipe one by one to avoid race conditions
          for (const recipe of savedRecipes) {
            const orderQty = parseFloat(orderQuantities[recipe.id]) || 0;
            console.log(`🔍 Debug: Processing recipe ${recipe.id}:`, {
              recipeId: recipe.id,
              orderQty: orderQty,
              hasIngredients: !!recipe.ingredients,
              ingredientsType: typeof recipe.ingredients,
              ingredientsIsArray: Array.isArray(recipe.ingredients),
              ingredientsLength: recipe.ingredients?.length,
              ingredientsData: recipe.ingredients
            });
            
            if (orderQty > 0) {
              console.log(`🔍 Debug: Consuming ingredients for recipe ${recipe.id} (${orderQty} units)`);
              console.log(`🔍 Debug: Recipe data before consumption:`, recipe);
              console.log(`🔍 Debug: Recipe ingredients type:`, typeof recipe.ingredients);
              console.log(`🔍 Debug: Recipe ingredients isArray:`, Array.isArray(recipe.ingredients));
              console.log(`🔍 Debug: Recipe ingredients:`, recipe.ingredients);
              
              // Create a properly structured recipe object for consumption
              // The consumption function now handles both legacy and new structures
              const consumptionRecipe = {
                ...recipe,
                // The function will automatically detect and handle the structure
                // No need to manually convert ingredients structure
              };
              
              console.log(`🔍 Debug: Consumption recipe structure:`, consumptionRecipe);
              console.log(`🔍 Debug: Recipe has items:`, !!consumptionRecipe.items);
              console.log(`🔍 Debug: Recipe has ingredients:`, !!consumptionRecipe.ingredients);
              console.log(`🔍 Debug: Recipe items structure:`, consumptionRecipe.items);
              console.log(`🔍 Debug: Recipe ingredients structure:`, consumptionRecipe.ingredients);
              console.log(`🔍 Debug: About to call consumeIngredientsFromOrder with:`, {
                recipe: consumptionRecipe,
                orderQty: orderQty,
                inventoryLength: inventory.length,
                setInventory: typeof setInventory
              });
              
              // Verify inventory structure before consumption
              console.log(`🔍 Debug: Inventory structure verification:`, {
                hasInventory: !!inventory,
                isArray: Array.isArray(inventory),
                length: inventory?.length,
                firstItem: inventory?.[0],
                firstItemKeys: inventory?.[0] ? Object.keys(inventory[0]) : [],
                hasIdField: inventory?.[0]?.hasOwnProperty('id'),
                hasNameField: inventory?.[0]?.hasOwnProperty('name')
              });
              
              console.log(`🔍 Debug: About to call consumeIngredientsFromOrder...`);
              const useSecondCycleForConsumption = ['qameer', 'cross_update'].includes(getDatabaseCategory(categoryName));
              const consumptionResult = await consumeIngredientsFromOrder(
                consumptionRecipe,
                orderQty,
                inventory,
                setInventory,
                { useSecondCycleForConsumption }
              );
              console.log(`🔍 Debug: consumeIngredientsFromOrder result:`, consumptionResult);
              console.log(`🔍 Debug: Recipe data after consumption:`, recipe);
              
              // Check inventory state after consumption
              console.log(`🔍 Debug: Inventory state after consumption:`, inventory);
            } else {
              console.log(`🔍 Debug: Skipping recipe ${recipe.id} - no order quantity (${orderQty})`);
            }
          }
          
          console.log(`🔍 Debug: Inventory consumption completed for all recipes`);
          console.log(`🔍 Debug: Final inventory state:`, inventory);
        } catch (error) {
          console.error('❌ Error consuming ingredients:', error);
          console.error('❌ Error stack:', error.stack);
          alert('Warning: Recipe saved to MongoDB but failed to update inventory. Please try updating inventory manually.');
        }
      } else {
        console.warn('⚠️ Warning: inventory or setInventory not available for consumption');
        console.warn('⚠️ inventory:', inventory);
        console.warn('⚠️ setInventory:', typeof setInventory);
      }
      
      // Call parent's onSave callback
      if (onSave) {
        console.log(`🔍 Debug: Calling onSave callback with ${savedRecipes.length} recipes`);
        console.log(`🔍 Debug: Final savedRecipes data:`, savedRecipes);
        onSave(savedRecipes);
      }

      // Show success message
      console.log(`🔍 Debug: Save process completed successfully`);
      console.log(`🔍 Debug: Final savedRecipes count:`, savedRecipes.length);
      alert(`✅ Successfully saved ${savedRecipes.length} recipe(s) to MongoDB!\n\nYou can now refresh MongoDB Compass to see the new recipe documents in the recipes collection.`);
      
    } catch (error) {
      console.error('❌ Error during save process:', error);
      alert(`❌ Error saving recipes: ${error.message}\n\nCheck the browser console for more details.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      style={{
        padding: '8px 16px',
        backgroundColor: isSaving ? '#6c757d' : '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: isSaving ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        opacity: isSaving ? 0.7 : 1
      }}
      onMouseOver={(e) => {
        if (!isSaving) {
          e.target.style.backgroundColor = '#218838';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseOut={(e) => {
        if (!isSaving) {
          e.target.style.backgroundColor = '#28a745';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
      }}
      title={isSaving ? 'Saving...' : `Save ${saveCount} recipe(s) with values`}
    >
      <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'}`} style={{ fontSize: '14px' }}></i>
      {isSaving ? 'Saving...' : `Save (${saveCount})`}
    </button>
  );
};

export default SaveButton;