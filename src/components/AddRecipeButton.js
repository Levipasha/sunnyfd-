import React, { useState } from "react";
import "./AddRecipeButton.css";

const AddRecipeButton = ({ inventory = [], onSaveRecipe }) => {
  const [open, setOpen] = useState(false);
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");

  const handleAddIngredientFromInventory = (inventoryItem) => {
    const alreadyAdded = ingredients.some(ing => ing.id === inventoryItem.id);
    if (alreadyAdded) {
      // Remove ingredient if already added (deselect)
      const updatedIngredients = ingredients.filter(ing => ing.id !== inventoryItem.id);
      setIngredients(updatedIngredients);
      console.log(`🔍 Debug: Removed ingredient ${inventoryItem.name}, new count: ${updatedIngredients.length}`);
    } else {
      // Add ingredient if not already added
      const newIngredient = { 
        name: inventoryItem.name, 
        qty: "", // Empty string to prompt user input
        id: inventoryItem.id,
        unit: inventoryItem.unit 
      };
      const updatedIngredients = [...ingredients, newIngredient];
      setIngredients(updatedIngredients);
      console.log(`🔍 Debug: Added ingredient ${inventoryItem.name}:`, newIngredient);
      console.log(`🔍 Debug: Total ingredients count: ${updatedIngredients.length}`);
      console.log(`🔍 Debug: All ingredients:`, updatedIngredients);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    console.log(`🔍 Debug: handleIngredientChange called - index: ${index}, field: ${field}, value: ${value}`);
    console.log(`🔍 Debug: Current ingredients state:`, ingredients);
    
    const updated = [...ingredients];
    updated[index][field] = value;
    
    console.log(`🔍 Debug: Updated ingredient at index ${index}:`, updated[index]);
    console.log(`🔍 Debug: New ingredients state:`, updated);
    
    setIngredients(updated);
    
    // Log the updated state after setting
    setTimeout(() => {
      console.log(`🔍 Debug: State after update (delayed):`, ingredients);
    }, 0);
  };

  const handleReset = () => {
    setOpen(false);
    setSubCategory("");
    setDescription("");
    setIngredients([]);
    setInventorySearch("");
  };

  const handleSaveRecipe = () => {
    console.log('🔍 Debug: handleSaveRecipe called');
    console.log('🔍 Debug: Current state - subCategory:', subCategory);
    console.log('🔍 Debug: Current state - description:', description);
    console.log('🔍 Debug: Current state - ingredients:', ingredients);
    console.log('🔍 Debug: Current state - ingredients length:', ingredients.length);
    
    if (!subCategory.trim() || !description.trim() || ingredients.length === 0) {
      console.log('❌ Validation failed: Missing required fields');
      alert("Please fill in all required fields and select at least one ingredient.");
      return;
    }

    // Check if all ingredients have quantities (including 0)
    const ingredientsWithQuantities = ingredients.filter(ing => ing.qty !== undefined && ing.qty !== '');
    console.log('🔍 Debug: ingredientsWithQuantities:', ingredientsWithQuantities);
    console.log('🔍 Debug: ingredientsWithQuantities length:', ingredientsWithQuantities.length);
    
    if (ingredientsWithQuantities.length === 0) {
      console.log('❌ Validation failed: No ingredients with quantities defined');
      alert("Please enter quantities for at least one ingredient.");
      return;
    }

    console.log('🔍 Debug: AddRecipeButton - ingredients before filtering:', ingredients);
    console.log('🔍 Debug: AddRecipeButton - ingredientsWithQuantities:', ingredientsWithQuantities);
    console.log('🔍 Debug: AddRecipeButton - checking each ingredient:');
    ingredientsWithQuantities.forEach((ing, index) => {
      console.log(`  Ingredient ${index + 1}:`, ing);
      console.log(`    Name: ${ing.name}`);
      console.log(`    Qty: ${ing.qty} (type: ${typeof ing.qty})`);
      console.log(`    Parsed qty: ${parseFloat(ing.qty)}`);
    });

    const newRecipe = {
      id: Date.now(),
      subCategory: subCategory.trim(),
      description: description.trim(),
      ingredients: ingredientsWithQuantities, // Send all ingredients with quantities (including 0)
      createdAt: new Date().toISOString()
    };

    console.log('🔍 Debug: AddRecipeButton - final newRecipe being sent:', newRecipe);
    console.log('🔍 Debug: AddRecipeButton - ingredients array details:');
    if (newRecipe.ingredients && Array.isArray(newRecipe.ingredients)) {
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

    // Call the parent component's save function
    if (onSaveRecipe) {
      console.log('🔍 Debug: Calling onSaveRecipe with:', newRecipe);
      onSaveRecipe(newRecipe);
    } else {
      console.log('❌ Error: onSaveRecipe function is not provided');
    }

    // Reset the form
    handleReset();
    
    // Show success message
    alert("Recipe saved successfully!");
  };

  return (
    <div className="add-recipe-container">
      <button
        className="add-recipe-btn"
        onClick={() => setOpen(!open)}
        title="Create a new sub-category with a recipe"
      >
        <i className="fas fa-plus"></i> Add Recipe
      </button>

      {open && (
        <div className="dropdown-form">
          {/* Recipe Details Section */}
          <div className="form-row">
            <div className="form-group">
              <label>Sub-Category Name</label>
              <input
                type="text"
                placeholder="Enter sub-category name"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Only show ingredient selection when both fields are filled */}
          {subCategory.trim() && description.trim() && (
            <div className="ingredient-selection">
              <h5>Select Ingredients from Inventory:</h5>
              <div className="inventory-search">
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="inventory-search-input"
                />
              </div>
              <div className="inventory-grid">
                {inventory
                  .filter(item => 
                    item.name.toLowerCase().includes(inventorySearch.toLowerCase())
                  )
                  .map((item) => {
                    const isAlreadyAdded = ingredients.some(ing => ing.id === item.id);
                    return (
                      <button
                        key={item.id}
                        className={`inventory-item-btn ${isAlreadyAdded ? 'added' : ''}`}
                        onClick={() => handleAddIngredientFromInventory(item)}
                        title={`${item.name} (${item.unit}) - ${isAlreadyAdded ? 'Click to remove' : 'Click to add'}`}
                      >
                        <span className="item-name">{item.name}</span>
                        <span className="item-unit">({item.unit})</span>
                        {isAlreadyAdded && <i className="fas fa-check"></i>}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recipe Preview Section */}
          {subCategory.trim() && description.trim() && ingredients.length > 0 && (
            <div className="recipe-preview">
              <h5>Recipe Preview:</h5>
              <div className="recipe-table-container preview">
                <h4>{subCategory}</h4>
                
                <table className="recipe-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Order</th>
                      <th>Per</th>
                      <th>Total Qty</th>
                      {ingredients.map(ingredient => (
                        <th key={ingredient.name}>{ingredient.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{description}</td>
                      <td>
                        <input
                          type="number"
                          placeholder="Order"
                          min="0"
                          step="0.01"
                          style={{ width: '80px', textAlign: 'center' }}
                          disabled
                        />
                      </td>
                      <td>1</td>
                      <td>0.00</td>
                      {ingredients.map(ingredient => (
                        <td key={ingredient.name}>
                          <input
                            type="number"
                            placeholder="0"
                            value={ingredient.qty}
                            onChange={(e) => handleIngredientChange(ingredients.findIndex(ing => ing.id === ingredient.id), "qty", e.target.value)}
                            style={{ width: '60px', textAlign: 'center' }}
                          />
                        </td>
                      ))}
                    </tr>
                    
                    {/* Recipe Totals Row */}
                    <tr className="totals-row">
                      <td><strong>TOTALS</strong></td>
                      <td></td>
                      <td></td>
                      <td><strong>0.00</strong></td>
                      {ingredients.map(ingredient => (
                        <td key={ingredient.name}>
                          <strong>{ingredient.qty || '0.00'}</strong>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="button-group">
            <button
              className="reset-btn"
              onClick={handleReset}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            {ingredients.length > 0 && (() => {
              // Check if all ingredients have quantities defined (including 0)
              const allIngredientsHaveQuantities = ingredients.every(ing => ing.qty !== undefined && ing.qty !== '');
              return (
                <button
                  className={`save-btn ${allIngredientsHaveQuantities ? 'ready' : 'disabled'}`}
                  onClick={handleSaveRecipe}
                  disabled={!allIngredientsHaveQuantities}
                  title={allIngredientsHaveQuantities ? 'Save Recipe' : 'Please enter quantities for all ingredients'}
                >
                  <i className="fas fa-save"></i> Save Recipe
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddRecipeButton;
