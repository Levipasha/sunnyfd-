import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createEnterKeyHandler } from '../../utils/keyboardNavigation';
import AddRecipeButton from '../AddRecipeButton';
import EditDeleteButton from '../EditDeleteButton';
import NewRecipeColumn from '../newrecpiecoloum';
import SaveButton from '../save';
import { 
  loadCustomRecipes, 
  saveCustomRecipes, 
  calculateCustomRecipe, 
  formatCalculatedValue,
  getSortedRecipes,
  getAllIngredientsFromRecipes,
  recipeContainsIngredient,
  getIngredientQuantity
} from '../../utils/autoCalculation';
import { printRecipeBlock } from '../../utils/blockPrintUtils';

const CrossUpdateBlock = ({ inventory, setInventory, isAuthenticated }) => {
  const [customRecipes, setCustomRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Order quantities for each recipe
  const [orderQuantities, setOrderQuantities] = useState({});
  
  // Ref for the block content
  const blockRef = useRef(null);

  const handleEnterKey = useMemo(() => createEnterKeyHandler(() => blockRef.current), []);



  // Load recipes from MongoDB on component mount
  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      try {
        const recipes = await loadCustomRecipes('cross_update');
        setCustomRecipes(recipes);
        
        // Initialize orderQuantities with default values for each recipe
        const initialOrderQuantities = {};
        recipes.forEach(recipe => {
          // Set default order quantity to 0 so it looks zero by default
          initialOrderQuantities[recipe.id] = 0;
        });
        setOrderQuantities(initialOrderQuantities);
        
        console.log(`✅ Loaded ${recipes.length} recipes for Cross Update Block`);
        console.log('Initialized order quantities:', initialOrderQuantities);
      } catch (error) {
        console.error('Error loading recipes:', error);
        setCustomRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
    
    // Set up periodic refresh every 30 seconds to keep data in sync
    const refreshInterval = setInterval(refreshRecipes, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Function to refresh recipes from MongoDB
  const refreshRecipes = async () => {
    try {
      console.log('🔄 Starting refreshRecipes...');
      console.log('🔄 Calling loadCustomRecipes with category: cross_update');
      
      const recipes = await loadCustomRecipes('cross_update');
      console.log('🔄 loadCustomRecipes returned:', recipes);
      console.log('🔄 Recipes count:', recipes.length);
      console.log('🔄 First recipe:', recipes[0]);
      
      setCustomRecipes(recipes);
      console.log('🔄 setCustomRecipes called with:', recipes);
      
      // Preserve existing order quantities for recipes that still exist
      setOrderQuantities(prev => {
        const newOrderQuantities = {};
        recipes.forEach(recipe => {
          newOrderQuantities[recipe.id] = prev[recipe.id] || 0;
        });
        console.log('🔄 Updated order quantities:', newOrderQuantities);
        return newOrderQuantities;
      });
      
      console.log(`✅ Refreshed ${recipes.length} recipes from MongoDB`);
    } catch (error) {
      console.error('❌ Error refreshing recipes:', error);
    }
  };

  // Print block functionality
  const handlePrintBlock = async () => {
    console.log('🖨️ handlePrintBlock called');
    console.log('📊 recipesBySubCategory:', recipesBySubCategory);
    console.log('📊 orderQuantities:', orderQuantities);
    
    if (Object.keys(recipesBySubCategory).length === 0) {
      alert('No recipes to print. Please add some recipes first.');
      return;
    }

    setIsPrinting(true);
    
    try {
      // Prepare block data with updated order quantities
      const blockDataWithQuantities = {};
      
      Object.entries(recipesBySubCategory).forEach(([subCategory, recipes]) => {
        console.log(`📝 Processing subcategory: ${subCategory}`);
        console.log(`📝 Recipes in ${subCategory}:`, recipes);
        
        blockDataWithQuantities[subCategory] = recipes.map(recipe => {
          const orderQty = orderQuantities[recipe.id] || 0;
          console.log(`📝 Recipe ${recipe.description || recipe.name}: orderQty = ${orderQty}`);
          
          return {
            ...recipe,
            orderQty: orderQty
          };
        });
      });

      console.log('📊 Final blockDataWithQuantities:', blockDataWithQuantities);

      await printRecipeBlock('CROSS UPDATE', blockDataWithQuantities, () => {
        setIsPrinting(false);
        console.log('✅ Cross Update block printed successfully');
      });
    } catch (error) {
      console.error('❌ Error printing block:', error);
      setIsPrinting(false);
      alert('Error printing block: ' + error.message);
    }
  };

  // Custom recipes functionality
  const orderedRecipes = useMemo(() => {
    return getSortedRecipes(customRecipes);
  }, [customRecipes]);

  // Group recipes by sub-category
  const recipesBySubCategory = useMemo(() => {
    const grouped = {};
    orderedRecipes.forEach(recipe => {
      const subCategory = recipe.subCategory || 'Uncategorized';
      if (!grouped[subCategory]) {
        grouped[subCategory] = [];
      }
      grouped[subCategory].push(recipe);
    });
    return grouped;
  }, [orderedRecipes]);

  const handleAddRecipe = async (newRecipe) => {
    console.log('🚀 handleAddRecipe function called');
    console.log('🚀 newRecipe:', newRecipe);
    
    // This creates a new sub-category
    // Don't update local state immediately - wait for MongoDB save and refresh
    
    // Save to localStorage for immediate access (but don't display it yet)
    console.log('🚀 About to call saveCustomRecipes...');
    await saveCustomRecipes('cross_update', [newRecipe, ...customRecipes], true); // Skip MongoDB save to prevent duplicates
    console.log('🚀 saveCustomRecipes completed');
    
    // Save the new recipe directly to MongoDB for persistence
    console.log('🚀 About to start MongoDB save process...');
    try {
      console.log('🔍 Debug: newRecipe data:', newRecipe);
      console.log('🔍 Debug: newRecipe.ingredients:', newRecipe.ingredients);
      console.log('🔍 Debug: newRecipe.ingredients type:', typeof newRecipe.ingredients);
      console.log('🔍 Debug: newRecipe.ingredients length:', newRecipe.ingredients?.length);
      console.log('🔍 Debug: newRecipe.ingredients isArray:', Array.isArray(newRecipe.ingredients));
      
      if (newRecipe.ingredients && Array.isArray(newRecipe.ingredients)) {
        console.log('🔍 Debug: Processing each ingredient:');
        newRecipe.ingredients.forEach((ing, index) => {
          console.log(`  Ingredient ${index + 1}:`, ing);
          console.log(`    Name: ${ing.name}`);
          console.log(`    Qty: ${ing.qty} (type: ${typeof ing.qty})`);
          console.log(`    Parsed qty: ${parseFloat(ing.qty)}`);
          console.log(`    ID: ${ing.id}`);
          console.log(`    Unit: ${ing.unit}`);
        });
      } else {
        console.log('⚠️ Warning: ingredients is not an array or is undefined:', newRecipe.ingredients);
      }
      
      // Process ingredient values from user input
      const ingredientValues = {};
      if (newRecipe.ingredients && Array.isArray(newRecipe.ingredients)) {
        newRecipe.ingredients.forEach(ing => {
          if (ing.name && ing.qty !== undefined && ing.qty !== '') {
            const qty = parseFloat(ing.qty) || 0;
            ingredientValues[ing.name] = qty;
            console.log(`✅ Processing ingredient: ${ing.name} = ${qty}`);
          } else {
            console.log(`⚠️ Skipping ingredient ${ing.name} - missing name or quantity:`, ing);
          }
        });
      }
      
      // If no ingredients were processed, use fallback
      if (Object.keys(ingredientValues).length === 0) {
        console.log('⚠️ No ingredients found, using fallback data');
        ingredientValues["SALT -25"] = 2.5;
        ingredientValues["CHICKEN MASALA"] = 1.8;
        ingredientValues["GOOD DAY-25"] = 3.2;
      }
      
      console.log('🔍 Debug: Final ingredientValues:', ingredientValues);
      
      // Create ONE complete recipe document with all fields
      const recipeData = {
        title: newRecipe.description,
        description: `Recipe from Cross Update Block: ${newRecipe.description}`,
        category: "cross_update",
        subCategory: newRecipe.subCategory,
        tableStructure: {
          columns: [
            { name: 'Item', type: 'item' },
            { name: 'Order', type: 'order' },
            { name: 'Per', type: 'per' },
            { name: 'Total Qty', type: 'totalQty' },
            ...Object.keys(ingredientValues).map(ingName => ({ name: ingName, type: 'ingredient' })),
            { name: 'Actions', type: 'action' }
          ],
          ingredients: Object.keys(ingredientValues)
        },
        items: [{
          name: newRecipe.description,
          order: 0,
          per: 1,
          totalQty: 1,
          ingredientValues: ingredientValues
        }],
        totals: {
          orderTotal: 1,
          totalQtyTotal: 1,
          ingredientTotals: ingredientValues
        },
        createdBy: 'system'
      };
      
      console.log('🔍 Debug: Final recipeData being sent to MongoDB:', JSON.stringify(recipeData, null, 2));
      console.log('🔍 Debug: recipeData.items[0].ingredientValues:', recipeData.items[0].ingredientValues);
      console.log('🔍 Debug: recipeData.totals.ingredientTotals:', recipeData.totals.ingredientTotals);
      
      // Send the recipe to MongoDB
      console.log('🔍 Debug: SENDING RECIPE TO MONGODB...');
      
      // Determine if this is a new recipe or an update to existing recipe
      const isUpdate = newRecipe.mongoId;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `https://sunny-bd.onrender.com/recipes/${newRecipe.mongoId}`
        : 'https://sunny-bd.onrender.com/recipes';
      
      console.log('🔍 Debug: URL:', url);
      console.log('🔍 Debug: Method:', method);
      console.log('🔍 Debug: Is Update:', isUpdate);
      console.log('🔍 Debug: Recipe ID:', newRecipe.mongoId);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        console.log('🔍 Debug: Fetch request starting...');
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipeData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('🔍 Debug: Fetch request completed');
        console.log('🔍 Debug: Response received:', response);
        console.log('🔍 Debug: Response status:', response.status);
        console.log('🔍 Debug: Response ok:', response.ok);
        console.log('🔍 Debug: Response statusText:', response.statusText);
        
        if (response.ok) {
          const result = await response.json();
          // Update the recipe with MongoDB ID
          newRecipe.mongoId = result.data._id;
          console.log(`✅ Recipe saved to MongoDB: ${result.data._id}`);
          console.log('🔍 Debug: MongoDB response:', result);
          
          // Wait a moment for the database transaction to fully commit
          console.log('⏳ Waiting for database transaction to commit...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh recipes from MongoDB to get the updated data structure
          await refreshRecipes();
          
          // Now update local state with the refreshed data from MongoDB
          console.log('✅ Recipe table updated with data from MongoDB');
        } else {
          console.error('❌ Failed to save recipe to MongoDB');
          console.error('❌ Response status:', response.status);
          console.error('❌ Response statusText:', response.statusText);
          
          const errorText = await response.text();
          console.error('❌ Error response body:', errorText);
          
          throw new Error(`Failed to save recipe: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        console.error('❌ Fetch error name:', fetchError.name);
        console.error('❌ Fetch error message:', fetchError.message);
        console.error('❌ Fetch error stack:', fetchError.stack);
        
        if (fetchError.name === 'AbortError') {
          console.error('❌ Fetch request timed out after 10 seconds');
        } else if (fetchError.name === 'TypeError') {
          console.error('❌ Network error - possible CORS or connection issue');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error saving recipe to MongoDB:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      // Re-throw the error so the calling function knows it failed
      throw error;
    }
    
    console.log('🚀 handleAddRecipe function completed successfully');
  };

  const handleAddRow = async (newRow, subCategory) => {
    // This adds a row to an existing sub-category
    const recipeWithSubCategory = {
      ...newRow,
      subCategory: subCategory
    };
    
    // Don't update local state immediately - wait for MongoDB save and refresh
    
    // Save to localStorage for immediate access (but don't display it yet)
    await saveCustomRecipes('cross_update', [recipeWithSubCategory, ...customRecipes], true); // Skip MongoDB save to prevent duplicates
    
    // Save the new row directly to MongoDB for persistence
    try {
      // Create ONE complete recipe document with all fields
      const recipeData = {
        title: newRow.description || newRow.name,
        description: `Recipe row from Cross Update Block: ${newRow.description || newRow.name}`,
        category: "cross_update",
        subCategory: subCategory,
        tableStructure: {
          columns: [
            { name: 'Item', type: 'item' },
            { name: 'Order', type: 'order' },
            { name: 'Per', type: 'per' },
            { name: 'Total Qty', type: 'totalQty' },
            ...(newRow.ingredients ? 
              (Array.isArray(newRow.ingredients) ? 
                newRow.ingredients.map(ing => ({ name: ing.name, type: 'ingredient' })) :
                Object.keys(newRow.ingredients).map(name => ({ name, type: 'ingredient' }))
              ) : []
            ),
            { name: 'Actions', type: 'action' }
          ],
          ingredients: newRow.ingredients ? 
            (Array.isArray(newRow.ingredients) ? 
              newRow.ingredients.map(ing => ing.name) :
              Object.keys(newRow.ingredients)
            ) : []
        },
        items: [{
          name: newRow.description || newRow.name,
          order: parseFloat(newRow.order) || 0,
          per: parseFloat(newRow.per) || 1,
          totalQty: parseFloat(newRow.order) || 0,
          ingredientValues: newRow.ingredients ? 
            (Array.isArray(newRow.ingredients) ? 
              newRow.ingredients.reduce((acc, ing) => {
                acc[ing.name] = parseFloat(ing.qty || ing.quantity) || 0;
                return acc;
              }, {}) :
              newRow.ingredients
            ) : {}
        }],
        totals: {
          orderTotal: parseFloat(newRow.order) || 0,
          totalQtyTotal: parseFloat(newRow.order) || 0,
          ingredientTotals: newRow.ingredients ? 
            (Array.isArray(newRow.ingredients) ? 
              newRow.ingredients.reduce((acc, ing) => {
                acc[ing.name] = parseFloat(ing.qty || ing.quantity) || 0;
                return acc;
              }, {}) :
              newRow.ingredients
            ) : {}
        },
        createdBy: 'system'
      };
      
      const response = await fetch('https://sunny-bd.onrender.com/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData)
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update the recipe with MongoDB ID
        recipeWithSubCategory.mongoId = result.data._id;
        console.log(`✅ Recipe row saved to MongoDB: ${result.data._id}`);
        
        // Refresh recipes from MongoDB to get the updated data structure
        await refreshRecipes();
        
        // Now update local state with the refreshed data from MongoDB
        console.log('✅ Recipe table updated with data from MongoDB');
      } else {
        console.error('Failed to save recipe row to MongoDB');
      }
    } catch (error) {
      console.error('Error saving recipe row to MongoDB:', error);
    }
  };

  const handleEditRecipe = async (updatedRecipe) => {
    const updatedRecipes = customRecipes.map(recipe => 
      recipe.id === updatedRecipe.id ? updatedRecipe : recipe
    );
    setCustomRecipes(updatedRecipes);
    
    // Save to localStorage for immediate access
    await saveCustomRecipes('cross_update', updatedRecipes, true); // Skip MongoDB save to prevent duplicates
    
    // Also update the recipe in MongoDB if it has a mongoId
    if (updatedRecipe.mongoId) {
      try {
        const recipeData = {
          title: updatedRecipe.description,
          description: `Recipe from Cross Update Block: ${updatedRecipe.description}`,
          category: "cross_update",
          subCategory: updatedRecipe.subCategory,
          items: [{
            name: updatedRecipe.description,
            order: 0,
            per: 1,
            totalQty: 1,
            ingredientValues: updatedRecipe.ingredients ? 
              (Array.isArray(updatedRecipe.ingredients) ? 
                updatedRecipe.ingredients.reduce((acc, ing) => {
                  // Save the base quantity (per unit) that was entered
                  acc[ing.name] = parseFloat(ing.qty || ing.quantity) || 0;
                  return acc;
                }, {}) :
                updatedRecipe.ingredients
              ) : {}
          }],
          totals: {
            orderTotal: 1,
            totalQtyTotal: 1,
            ingredientTotals: updatedRecipe.ingredients ? 
              (Array.isArray(updatedRecipe.ingredients) ? 
                updatedRecipe.ingredients.reduce((acc, ing) => {
                  // Save the base quantity (per unit) that was entered
                  acc[ing.name] = parseFloat(ing.qty || ing.quantity) || 0;
                  return acc;
                }, {}) :
                updatedRecipe.ingredients
              ) : {}
          },
          tableStructure: {
            columns: [
              { name: 'Item', type: 'item' },
              { name: 'Order', type: 'order' },
              { name: 'Per', type: 'per' },
              { name: 'Total Qty', type: 'totalQty' },
              ...(updatedRecipe.ingredients ? 
                (Array.isArray(updatedRecipe.ingredients) ? 
                  updatedRecipe.ingredients.map(ing => ({ name: ing.name, type: 'ingredient' })) :
                  Object.keys(updatedRecipe.ingredients).map(name => ({ name, type: 'ingredient' }))
                ) : []
              ),
              { name: 'Actions', type: 'action' }
            ],
            ingredients: updatedRecipe.ingredients ? 
              (Array.isArray(updatedRecipe.ingredients) ? 
                updatedRecipe.ingredients.map(ing => ing.name) :
                Object.keys(updatedRecipe.ingredients)
              ) : []
          },
          createdBy: 'system'
        };
        
        const response = await fetch(`https://sunny-bd.onrender.com/recipes/${updatedRecipe.mongoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipeData)
        });
        
        if (response.ok) {
          console.log(`✅ Recipe updated in MongoDB: ${updatedRecipe.mongoId}`);
          
          // Refresh recipes from MongoDB to get the updated data structure
          await refreshRecipes();
        } else {
          console.error('Failed to update recipe in MongoDB');
        }
      } catch (error) {
        console.error('Error updating recipe in MongoDB:', error);
      }
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    const recipeToDelete = customRecipes.find(recipe => recipe.id === recipeId);
    const updatedRecipes = customRecipes.filter(recipe => recipe.id !== recipeId);
    setCustomRecipes(updatedRecipes);
    
    // Save to localStorage for immediate access
    await saveCustomRecipes('cross_update', updatedRecipes, true); // Skip MongoDB save to prevent duplicates
    
    // Also delete the recipe from MongoDB if it has a mongoId
    if (recipeToDelete && recipeToDelete.mongoId) {
      try {
        const response = await fetch(`https://sunny-bd.onrender.com/recipes/${recipeToDelete.mongoId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          console.log(`✅ Recipe deleted from MongoDB: ${recipeToDelete.mongoId}`);
          
          // Refresh recipes from MongoDB to get the updated data structure
          await refreshRecipes();
        } else {
          console.error('Failed to delete recipe from MongoDB');
        }
      } catch (error) {
        console.error('Error deleting recipe from MongoDB:', error);
      }
    }
  };

  const handleOrderQuantityChange = (recipeId, value) => {
    setOrderQuantities(prev => ({
                                    ...prev,
      [recipeId]: value
    }));
  };

  const calculateSubCategoryTotals = (recipes) => {
    const totals = {};
    recipes.forEach(recipe => {
      const orderQty = parseFloat(orderQuantities[recipe.id]) || 0;
      if (orderQty > 0) {
        // Try to get ingredient values from MongoDB structure first
        if (recipe.items && recipe.items.length > 0 && recipe.items[0].ingredientValues) {
          Object.keys(recipe.items[0].ingredientValues).forEach(ingredientName => {
            if (!totals[ingredientName]) {
              totals[ingredientName] = 0;
            }
            // ingredientValues contains base quantities, multiply by order quantity
            totals[ingredientName] += parseFloat(recipe.items[0].ingredientValues[ingredientName] || 0) * orderQty;
          });
        }
        // Fallback to ingredients array
        else if (Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach(ingredient => {
            if (!totals[ingredient.name]) {
              totals[ingredient.name] = 0;
            }
            totals[ingredient.name] += parseFloat(ingredient.qty || 0) * orderQty;
          });
        }
        // Fallback to ingredients object (backward compatibility)
        else if (recipe.ingredients && typeof recipe.ingredients === 'object') {
          Object.keys(recipe.ingredients).forEach(ingredientName => {
            if (!totals[ingredientName]) {
              totals[ingredientName] = 0;
            }
            totals[ingredientName] += parseFloat(recipe.ingredients[ingredientName] || 0) * orderQty;
          });
        }
      }
    });
    return totals;
  };

  if (loading) {
    return (
      <div className="block-container">
        <h2>Cross Update Block</h2>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#007bff' }}></i>
          <p>Loading recipes from database...</p>
        </div>
      </div>
    );
  }
                        
                        return (
    <div className="block-container" ref={blockRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '20px', margin: 0 }}>Cross Update Block</h2>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              console.log('🖨️ Print button clicked!');
              handlePrintBlock();
            }}
            disabled={isPrinting || Object.keys(recipesBySubCategory).length === 0}
            style={{
              padding: '6px 12px',
              backgroundColor: isPrinting ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isPrinting ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Print this block for chef"
          >
            <i className={`fas ${isPrinting ? 'fa-spinner fa-spin' : 'fa-print'}`}></i>
            {isPrinting ? 'Printing...' : 'Print Block'}
          </button>
          

          
          <button
            onClick={refreshRecipes}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Refresh data from MongoDB"
          >
            <i className="fas fa-sync-alt"></i>
            Refresh Data
          </button>
        </div>
      </div>
      
            {/* Add Recipe Button and Save Button - Fixed position */}
      <div style={{ position: 'relative', marginBottom: '10px', minHeight: '40px' }}>
        {isAuthenticated && (
          <AddRecipeButton inventory={inventory} onSaveRecipe={handleAddRecipe} />
        )}
        <div style={{ position: 'absolute', top: '0', right: '0', minHeight: '32px', minWidth: '120px', zIndex: 1 }}>
          <SaveButton 
            recipes={orderedRecipes}
            orderQuantities={orderQuantities}
            categoryName="Cross Update Block"
            onSave={(savedRecipes) => {
              console.log('Saved recipes:', savedRecipes);
            }}
            inventory={inventory}
            setInventory={setInventory}
          />
        </div>
       </div>

      {/* Sub-Categories with their own tables */}
      {Object.keys(recipesBySubCategory).length > 0 &&
        Object.entries(recipesBySubCategory).map(([subCategory, recipes]) => (
          <div key={subCategory} className="sub-category-section">
            <h3 style={{ fontSize: '16px', margin: '6px 0' }}>{subCategory}</h3>
            <div className="table-container">
                  <table className="recipe-table" style={{ fontSize: '12px' }}>
                    <thead>
                  <tr>
                    <th style={{ padding: '6px 8px' }}>Item</th>
                    <th style={{ padding: '6px 8px' }}>Order</th>
                    <th style={{ padding: '6px 8px' }}>Per</th>
                    <th style={{ padding: '6px 8px' }}>Total Qty</th>
                    {recipes.length > 0 && (() => {
                      const ingredientColumns = getAllIngredientsFromRecipes(recipes);
                      return ingredientColumns.map(ingredient => (
                        <th key={ingredient} style={{ padding: '6px 8px' }}>{ingredient}</th>
                      ));
                    })()}
                    <th style={{ padding: '6px 8px' }}>Actions</th>
                 </tr>
               </thead>
               <tbody>
                  {recipes.map((recipe, index) => (
                    <tr key={recipe.id}>
                      <td style={{ padding: '6px 8px' }}>{recipe.description}</td>
                      <td style={{ padding: '6px 8px' }}>
                     <input 
                       type="number" 
                          value={orderQuantities[recipe.id] ?? 0}
                          onChange={(e) => handleOrderQuantityChange(recipe.id, e.target.value)}
                          onKeyDown={handleEnterKey}
                          className="order-qty-input"
                                placeholder="0"
                          style={{ width: '48px', fontSize: '12px', padding: '2px 4px' }}
                     />
                   </td>
                      <td style={{ padding: '6px 8px' }}>1</td>
                      <td style={{ padding: '6px 8px' }}>{orderQuantities[recipe.id] || 0}</td>
                      {(() => {
                        const ingredientColumns = getAllIngredientsFromRecipes(recipes);
                        
                        return ingredientColumns.map(ingredient => {
                          // Check if this recipe contains the ingredient
                          if (!recipeContainsIngredient(recipe, ingredient)) {
                            // Show empty cell for ingredients not in this recipe
                            return (
                              <td key={ingredient} style={{ background: '#f8f9fa', padding: '6px 8px' }}>
                                {/* Empty cell for ingredients not in this recipe */}
                              </td>
                            );
                          }
                          
                          // Get ingredient quantity and calculate total
                          const baseQty = getIngredientQuantity(recipe, ingredient);
                          const orderQty = orderQuantities[recipe.id] || 0;
                          const totalQty = parseFloat(baseQty) * orderQty;
                          
                          return (
                            <td key={ingredient} style={{ padding: '6px 8px' }}>
                              {formatCalculatedValue(totalQty, 2)}
                          </td>
                        );
                        });
                      })()}
                      <td style={{ padding: '6px 8px' }}>
                            {isAuthenticated && (
                              <EditDeleteButton
                                recipe={recipe}
                                inventory={inventory}
                                onEditRecipe={handleEditRecipe}
                                onDeleteRecipe={handleDeleteRecipe}
                              />
                            )}
                          </td>
                 </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="totals-row">
                    <td style={{ padding: '6px 8px' }}><strong>TOTALS</strong></td>
                    <td style={{ padding: '6px 8px' }}><strong>{Object.values(orderQuantities).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}</strong></td>
                    <td style={{ padding: '6px 8px' }}>-</td>
                    <td style={{ padding: '6px 8px' }}><strong>{Object.values(orderQuantities).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}</strong></td>
                    {recipes.length > 0 && (() => {
                      const ingredientColumns = getAllIngredientsFromRecipes(recipes);
                      
                      return ingredientColumns.map(ingredient => {
                        const total = calculateSubCategoryTotals(recipes)[ingredient] || 0;
                        return (
                          <td key={ingredient} style={{ padding: '6px 8px' }}>
                            <strong>{formatCalculatedValue(total, 2)}</strong>
                   </td>
                        );
                      });
                    })()}
                    <td style={{ padding: '6px 8px' }}></td>
                 </tr>
               </tbody>
             </table>
           </div>
            {isAuthenticated && (
              <NewRecipeColumn
                onAddRow={(newRow) => handleAddRow(newRow, subCategory)}
                categoryName={subCategory}
                inventory={inventory}
                existingIngredients={recipes.length > 0 ? getAllIngredientsFromRecipes(recipes) : []}
              />
            )}
         </div>
        ))}

      {/* Show message when no recipes exist */}
      {Object.keys(recipesBySubCategory).length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No custom recipes yet. Use the "Add Recipe" button above to create your first sub-category!</p>
         </div>
      )}
     </div>
   );
};

export default CrossUpdateBlock;
