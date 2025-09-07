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

const SaltItemsBlock = ({ inventory, setInventory, isAuthenticated, contentRef }) => {
  const [customRecipes, setCustomRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

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
        const recipes = await loadCustomRecipes('saltitems');
        setCustomRecipes(recipes);
        
        // Initialize orderQuantities with default values for each recipe
        const initialOrderQuantities = {};
        recipes.forEach(recipe => {
          // Default order quantity should be 0
          initialOrderQuantities[recipe.id] = 0;
        });
        setOrderQuantities(initialOrderQuantities);
        
        console.log(`✅ Loaded ${recipes.length} recipes for SaltItemsBlock`);
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
      console.log('🔄 Calling loadCustomRecipes with category: saltitems');
      
      const recipes = await loadCustomRecipes('saltitems');
      console.log('🔄 loadCustomRecipes returned:', recipes);
      console.log('🔄 Recipes count:', recipes.length);
      console.log('🔄 First recipe:', recipes[0]);
      
      setCustomRecipes(recipes);
      console.log('🔄 setCustomRecipes called with:', recipes);
      
      // Preserve existing order quantities for recipes that still exist
      setOrderQuantities(prev => {
        const newOrderQuantities = {};
        recipes.forEach(recipe => {
          newOrderQuantities[recipe.id] = prev[recipe.id] ?? 0;
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
    if (Object.keys(recipesBySubCategory).length === 0) {
      alert('No recipes to print. Please add some recipes first.');
      return;
    }

    setIsPrinting(true);
    
    try {
      // Prepare block data with updated order quantities
      const blockDataWithQuantities = {};
      
      Object.entries(recipesBySubCategory).forEach(([subCategory, recipes]) => {
        blockDataWithQuantities[subCategory] = recipes.map(recipe => ({
          ...recipe,
          orderQty: orderQuantities[recipe.id] || 1
        }));
      });

      await printRecipeBlock('SALT + ITEMS', blockDataWithQuantities, () => {
        setIsPrinting(false);
        console.log('✅ Salt Items block printed successfully');
      });
    } catch (error) {
      console.error('Error printing block:', error);
      setIsPrinting(false);
      alert('Error printing block: ' + error.message);
    }
  };

  // Custom recipes functionality
  const orderedRecipes = useMemo(() => {
    console.log('🔄 SaltItemsBlock: orderedRecipes recalculating, customRecipes count:', customRecipes.length);
    return getSortedRecipes(customRecipes);
  }, [customRecipes]);

  // Group recipes by sub-category
  const recipesBySubCategory = useMemo(() => {
    console.log('🔄 SaltItemsBlock: recipesBySubCategory recalculating, orderedRecipes count:', orderedRecipes.length);
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
    // This creates a new sub-category
    // Don't update local state immediately - wait for MongoDB save and refresh
    
    setIsSaving(true);
    
    try {
      // Save to localStorage for immediate access (but don't display it yet)
      await saveCustomRecipes('saltitems', [newRecipe, ...customRecipes], true); // Skip MongoDB save to prevent duplicates
      
      // Save the new recipe directly to MongoDB for persistence
      console.log('🔍 Debug: newRecipe data:', newRecipe);
      console.log('🔍 Debug: newRecipe.ingredients:', newRecipe.ingredients);
      console.log('🔍 Debug: newRecipe.ingredients type:', typeof newRecipe.ingredients);
      console.log('🔍 Debug: newRecipe.ingredients length:', newRecipe.ingredients?.length);
      console.log('🔍 Debug: newRecipe.ingredients isArray:', Array.isArray(newRecipe.ingredients));
      
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
      console.log('🔍 Debug: ingredientValues keys:', Object.keys(ingredientValues));
      console.log('🔍 Debug: ingredientValues values:', Object.values(ingredientValues));
      console.log('🔍 Debug: ingredientValues object keys count:', Object.keys(ingredientValues).length);
      
      // Create ONE complete recipe document with all fields
      const recipeData = {
        title: newRecipe.description,
        description: `Recipe from Salt Items Block: ${newRecipe.description}`,
        category: "saltitems",
        subCategory: newRecipe.subCategory || 'Default',
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
      
      try {
        console.log('🔍 Debug: Fetch request starting...');
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipeData)
        });
        
        if (response.ok) {
          const result = await response.json();
          // Update the recipe with MongoDB ID
          newRecipe.mongoId = result.data._id;
          console.log(`✅ Recipe saved to MongoDB: ${result.data._id}`);
          console.log('🔍 Debug: MongoDB response:', result);
          console.log('🔍 Debug: Saved recipe category:', result.data.category);
          
          // Wait a moment for MongoDB to fully commit the transaction
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Test: Try to fetch the recipe directly by ID to verify it was saved
          try {
            const testResponse = await fetch(`https://sunny-bd.onrender.com/recipes/${result.data._id}`);
            if (testResponse.ok) {
              const testRecipe = await testResponse.json();
              console.log('🔍 Debug: Direct fetch by ID successful:', testRecipe);
              console.log('🔍 Debug: Direct fetch category:', testRecipe.data.category);
            } else {
              console.log('⚠️ Direct fetch by ID failed:', testResponse.status);
            }
          } catch (testError) {
            console.log('⚠️ Direct fetch test error:', testError);
          }
          
          // Test: Try to fetch all recipes to see what's in the database
          try {
            const allRecipesResponse = await fetch('https://sunny-bd.onrender.com/recipes');
            if (allRecipesResponse.ok) {
              const allRecipes = await allRecipesResponse.json();
              console.log('🔍 Debug: All recipes in database:', allRecipes);
              console.log('🔍 Debug: Total recipes count:', allRecipes.count);
              if (allRecipes.data && allRecipes.data.length > 0) {
                console.log('🔍 Debug: Sample recipe categories:', allRecipes.data.map(r => r.category));
              }
            } else {
              console.log('⚠️ Fetch all recipes failed:', allRecipesResponse.status);
            }
          } catch (allRecipesError) {
            console.log('⚠️ Fetch all recipes test error:', allRecipesError);
          }
          
          // Refresh recipes from MongoDB to get the updated data structure
          await refreshRecipes();
          
          // Now update local state with the refreshed data from MongoDB
          console.log('✅ Recipe table updated with data from MongoDB');
          setSuccessMessage('Recipe saved successfully!');
          setTimeout(() => setSuccessMessage(null), 3000); // Auto-hide after 3 seconds
        } else {
          console.error('Failed to save recipe to MongoDB');
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to save recipe: ${errorText}`);
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
      console.error('Error saving recipe to MongoDB:', error);
      // Re-throw the error so the calling function knows it failed
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRow = async (newRow, subCategory) => {
    // This adds a row to an existing sub-category
    const recipeWithSubCategory = {
      ...newRow,
      subCategory: subCategory
    };
    
    // Don't update local state immediately - wait for MongoDB save and refresh
    
    // Save to localStorage for immediate access (but don't display it yet)
    await saveCustomRecipes('saltitems', [recipeWithSubCategory, ...customRecipes], true); // Skip MongoDB save to prevent duplicates
    
    // Save the new row directly to MongoDB for persistence
    try {
      // Create ONE complete recipe document with all fields
      const recipeData = {
        title: newRow.description || newRow.name,
        description: `Recipe row from Salt Items Block: ${newRow.description || newRow.name}`,
        category: "saltitems",
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
          order: parseFloat(newRow.order) || 1,
          per: parseFloat(newRow.per) || 1,
          totalQty: parseFloat(newRow.order) || 1,
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
          orderTotal: parseFloat(newRow.order) || 1,
          totalQtyTotal: parseFloat(newRow.order) || 1,
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
    // Update the recipe in the local state
    const updatedRecipes = customRecipes.map(recipe => 
      recipe.id === updatedRecipe.id ? { ...recipe, ...updatedRecipe } : recipe
    );
    setCustomRecipes(updatedRecipes);
    
    // Save to localStorage for immediate access
    await saveCustomRecipes('saltitems', updatedRecipes, true); // Skip MongoDB save to prevent duplicates
    
    // Also update the recipe in MongoDB if it has a mongoId
    if (updatedRecipe.mongoId) {
      try {
        // Create complete recipe document with all fields
        const recipeData = {
          title: updatedRecipe.description,
          description: `Recipe from Salt Items Block: ${updatedRecipe.description}`,
          category: "saltitems",
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
    await saveCustomRecipes('saltitems', updatedRecipes, true); // Skip MongoDB save to prevent duplicates
    
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
      [recipeId]: parseFloat(value) || 0
    }));
  };

  // Helper function to get ingredient columns consistently
  const getIngredientColumns = (recipes) => {
    return getAllIngredientsFromRecipes(recipes);
  };

  // Helper function to get ingredient value consistently
  const getIngredientValue = (recipe, ingredientName) => {
    const quantity = getIngredientQuantity(recipe, ingredientName);
    return quantity !== null ? quantity : 0;
  };

  if (loading) {
    return (
      <div className="block-container">
        <h2>Salt Items Block</h2>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#007bff' }}></i>
          <p>Loading recipes from database...</p>
          <button 
            onClick={() => {
              setLoading(false);
              // setError('Loading was interrupted. Please refresh the page or try again.'); // Removed setError
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Cancel Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="block-container" ref={blockRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>Salt Items Block</h2>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrintBlock}
            disabled={isPrinting || Object.keys(recipesBySubCategory).length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: isPrinting ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isPrinting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Print this block for chef"
          >
            <i className={`fas ${isPrinting ? 'fa-spinner fa-spin' : 'fa-print'}`}></i>
            {isPrinting ? 'Printing...' : 'Print Block'}
          </button>
          <SaveButton 
            recipes={orderedRecipes}
            orderQuantities={orderQuantities}
            categoryName="Salt Items Block"
            onSave={(savedRecipes) => {
              console.log('Saved recipes:', savedRecipes);
            }}
            inventory={inventory}
            setInventory={setInventory}
          />
        </div>
      </div>

      {/* Success Message Display */}
      {successMessage && (
        <div style={{ 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          border: '1px solid #c3e6cb'
        }}>
          <strong>Success:</strong> {successMessage}
          <button 
            onClick={() => setSuccessMessage(null)}
            style={{ 
              float: 'right', 
              background: 'none', 
              border: 'none', 
              color: '#155724', 
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Add Recipe Button */}
      <div style={{ position: 'relative', marginBottom: '20px', minHeight: '60px' }}>
        {isAuthenticated && (
          <AddRecipeButton 
            inventory={inventory} 
            onSaveRecipe={handleAddRecipe}
            disabled={isSaving}
          />
        )}
      </div>

      {/* Loading State for Saving */}
      {isSaving && (
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          backgroundColor: '#e7f3ff', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
          Saving recipe...
        </div>
      )}

      {/* Sub-Categories with their own tables */}
      {Object.keys(recipesBySubCategory).length > 0 &&
        Object.entries(recipesBySubCategory).map(([subCategory, recipes]) => (
          <div key={subCategory} className="sub-category-section">
            <h3>{subCategory}</h3>
            <div className="table-container">
                  <table className="recipe-table">
                    <thead>
                    <tr>
                      <th>Item</th>
                      <th>Order</th>
                      <th>Per</th>
                      <th>Total Qty</th>
                    {getIngredientColumns(recipes).map(ingredient => (
                      <th key={ingredient}>{ingredient}</th>
                    ))}
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                  {recipes.map((recipe, index) => (
                    <tr key={recipe.id}>
                      <td>{recipe.description}</td>
                      <td>
                              <input
                                type="number"
                          value={orderQuantities[recipe.id] || ''}
                          onChange={(e) => handleOrderQuantityChange(recipe.id, e.target.value)}
                                onKeyDown={handleEnterKey}
                                className="order-qty-input"
                                placeholder="0"
                          style={{ width: '60px' }}
                              />
                            </td>
                      <td>1</td>
                      <td>{orderQuantities[recipe.id] || 0}</td>
                                            {getIngredientColumns(recipes).map(ingredient => {
                        // Check if this recipe contains the ingredient
                        if (!recipeContainsIngredient(recipe, ingredient)) {
                          // Show empty cell for ingredients not in this recipe
                          return (
                            <td key={ingredient} style={{ background: '#f8f9fa' }}>
                              {/* Empty cell for ingredients not in this recipe */}
                            </td>
                          );
                        }
                        
                        // Calculate the total quantity for ingredients that are part of this recipe
                        const baseQty = getIngredientValue(recipe, ingredient);
                        const orderQty = orderQuantities[recipe.id] || 0;
                        const totalQty = parseFloat(baseQty) * orderQty;
                        
                        return (
                          <td key={ingredient}>
                            {formatCalculatedValue(totalQty, 2)}
                          </td>
                        );
                      })}
                      <td>
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
                </tbody>
              </table>
            </div>
            
            {/* Add Row Button */}
            <div style={{ marginTop: '10px' }}>
              <NewRecipeColumn
                onAddRow={(newRow) => handleAddRow(newRow, subCategory)}
                categoryName={subCategory}
                inventory={inventory}
                existingIngredients={getIngredientColumns(recipes)}
              />
            </div>
          </div>
        ))}

      {/* No recipes message */}
      {Object.keys(recipesBySubCategory).length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>No recipes found. Add your first recipe to get started!</p>
        </div>
      )}
    </div>
  );
};

export default SaltItemsBlock;
