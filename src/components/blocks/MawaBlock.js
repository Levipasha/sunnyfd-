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

const MawaBlock = ({ inventory, setInventory, isAuthenticated, contentRef }) => {
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
        const recipes = await loadCustomRecipes('mawa');
        setCustomRecipes(recipes);
        
        // Initialize orderQuantities with default values for each recipe
        const initialOrderQuantities = {};
        recipes.forEach(recipe => {
          // Set default order quantity to 0 so it looks zero by default
          initialOrderQuantities[recipe.id] = 0;
        });
        setOrderQuantities(initialOrderQuantities);
        
        console.log(`✅ Loaded ${recipes.length} recipes for Mawa Block`);
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
      console.log('🔄 Calling loadCustomRecipes with category: mawa');
      
      const recipes = await loadCustomRecipes('mawa');
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
          orderQty: orderQuantities[recipe.id] || 0
        }));
      });

      await printRecipeBlock('MAWA', blockDataWithQuantities, () => {
        setIsPrinting(false);
        console.log('✅ Mawa block printed successfully');
      });
    } catch (error) {
      console.error('Error printing block:', error);
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
    // This creates a new sub-category
    // Don't update local state immediately - wait for MongoDB save and refresh
    
    // Save to localStorage for immediate access (but don't display it yet)
    await saveCustomRecipes('mawa', [newRecipe, ...customRecipes], true); // Skip MongoDB save to prevent duplicates
    
    // Save the new recipe directly to MongoDB for persistence
    try {
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
        description: `Recipe from Mawa Block: ${newRecipe.description}`,
        category: "mawa",
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
        console.error('Failed to save recipe to MongoDB');
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to save recipe: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving recipe to MongoDB:', error);
      // Re-throw the error so the calling function knows it failed
      throw error;
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
    await saveCustomRecipes('mawa', [recipeWithSubCategory, ...customRecipes], true); // Skip MongoDB save to prevent duplicates
    
    // Save the new row directly to MongoDB for persistence
    try {
      // Create ONE complete recipe document with all fields
      const recipeData = {
        title: newRow.description || newRow.name,
        description: `Recipe row from Mawa Block: ${newRow.description || newRow.name}`,
        category: "mawa",
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
    // Update the recipe in the local state
    const updatedRecipes = customRecipes.map(recipe => 
      recipe.id === updatedRecipe.id ? { ...recipe, ...updatedRecipe } : recipe
    );
    setCustomRecipes(updatedRecipes);
    
    // Save to localStorage for immediate access
    await saveCustomRecipes('mawa', updatedRecipes, true); // Skip MongoDB save to prevent duplicates
    
    // Also update the recipe in MongoDB if it has a mongoId
    if (updatedRecipe.mongoId) {
      try {
        // Create complete recipe document with all fields
        const recipeData = {
          title: updatedRecipe.description,
          description: `Recipe from Mawa Block: ${updatedRecipe.description}`,
          category: "mawa",
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
    await saveCustomRecipes('mawa', updatedRecipes, true); // Skip MongoDB save to prevent duplicates
    
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

  if (loading) {
  return (
      <div className="block-container">
        <h2>Mawa Block</h2>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#007bff' }}></i>
          <p>Loading recipes from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="block-container">
      <h2>Mawa Block</h2>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '10px' }}>
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
          categoryName="Mawa Block"
          onSave={(savedRecipes) => {
            console.log('Saved recipes:', savedRecipes);
          }}
          inventory={inventory}
          setInventory={setInventory}
        />
      </div>

      {/* Add Recipe Button */}
      <div style={{ position: 'relative', marginBottom: '20px', minHeight: '60px' }}>
        {isAuthenticated && (
          <AddRecipeButton inventory={inventory} onSaveRecipe={handleAddRecipe} />
        )}
      </div>

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
                    {recipes.length > 0 && (() => {
                      const ingredientColumns = getAllIngredientsFromRecipes(recipes);
                      return ingredientColumns.map(ingredient => (
                        <th key={ingredient}>{ingredient}</th>
                      ));
                    })()}
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
                      {(() => {
                        const ingredientColumns = getAllIngredientsFromRecipes(recipes);
                        
                        return ingredientColumns.map(ingredient => {
                          // Check if this recipe contains the ingredient
                          if (!recipeContainsIngredient(recipe, ingredient)) {
                            // Show empty cell for ingredients not in this recipe
                            return (
                              <td key={ingredient} style={{ background: '#f8f9fa' }}>
                                {/* Empty cell for ingredients not in this recipe */}
                              </td>
                            );
                          }
                          
                          // Get ingredient quantity and calculate total
                          const baseQty = getIngredientQuantity(recipe, ingredient);
                          const orderQty = orderQuantities[recipe.id] || 0;
                          const totalQty = parseFloat(baseQty) * orderQty;
                          
                          return (
                            <td key={ingredient}>
                              {formatCalculatedValue(totalQty, 2)}
                          </td>
                        );
                        });
                      })()}
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
                existingIngredients={recipes.length > 0 ? getAllIngredientsFromRecipes(recipes) : []}
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

export default MawaBlock;
