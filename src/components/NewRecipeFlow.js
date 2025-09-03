import React, { useState, useEffect } from 'react';
import './NewRecipeFlow.css';

const NewRecipeFlow = ({ 
  isAuthenticated, 
  inventory, 
  onClose, 
  onCategoryCreated
}) => {
  const [currentStep, setCurrentStep] = useState('main');
  const [recipeType, setRecipeType] = useState(''); // 'single' or 'multiple'
  const [categoryName, setCategoryName] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [recipeUnit, setRecipeUnit] = useState('');
  const [recipeValue, setRecipeValue] = useState('');
  const [ingredients, setIngredients] = useState([{ id: 1, name: '', unit: '', quantity: 0 }]);



  // Reset form when step changes
  useEffect(() => {
    if (currentStep === 'main') {
      resetForm();
    }
  }, [currentStep]);

  const resetForm = () => {
    setRecipeType('');
    setCategoryName('');
    setRecipeName('');
    setRecipeUnit('');
    setRecipeValue('');
    setIngredients([{ id: 1, name: '', unit: '', quantity: 0 }]);
  };

  const addIngredient = () => {
    const newIngredient = {
      id: Date.now() + Math.random(),
      name: '',
      unit: '',
      quantity: '',
      // Multiple items recipe fields
      manda1: '',
      manda2: '',
      totalQty: '',
      alfaGr: '',
      maida65: '',
      kkMaida: '',
      mSugar: '',
      vanillaPdr: '',
      goldMore: '',
      salt: '',
      roseEssen: '',
      insert: '',
      rangna: ''
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const removeIngredient = (id) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(item => item.id !== id));
    }
  };

  const updateIngredient = (id, field, value) => {
    setIngredients(ingredients.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleCreateRecipe = () => {
    // Create new category with recipe
    const newCategory = {
      id: Date.now(),
      name: categoryName,
      type: recipeType,
      category: 'customRecipeBlock', // Add category type for auto-calculation
      recipes: [{
        id: Date.now(),
        name: recipeName,
        unit: recipeUnit,
        value: parseFloat(recipeValue) || 0,
        // Add fields needed for auto-calculation
        manda1: 0,
        manda2: 0,
        totQnty: 0,
        // Convert ingredients array to object format for auto-calculation
        ingredients: ingredients.reduce((acc, ing) => {
          acc[ing.name] = parseFloat(ing.quantity) || 0;
          return acc;
        }, {}),
        // Keep original ingredients array for compatibility
        ingredientsList: ingredients.map(ing => ({
          ...ing,
          quantity: parseFloat(ing.quantity) || 0
        }))
      }]
    };
    onCategoryCreated(newCategory);
    onClose();
  };

  const canProceed = () => {
    if (currentStep === 'recipe-type') {
      return recipeType !== '';
    } else if (currentStep === 'ingredients') {
      // Check if recipe details are filled and ingredients are valid
      const recipeDetailsValid = categoryName.trim() !== '' && recipeName.trim() !== '';
      const ingredientsValid = ingredients.every(ing => ing.name.trim() !== '' && ing.quantity > 0);
      
      return recipeDetailsValid && ingredientsValid;
    }
    return false;
  };

  const nextStep = () => {
    if (currentStep === 'main') setCurrentStep('recipe-type');
    else if (currentStep === 'recipe-type') setCurrentStep('ingredients');
  };

  const prevStep = () => {
    if (currentStep === 'ingredients') setCurrentStep('recipe-type');
    else if (currentStep === 'recipe-type') setCurrentStep('main');
  };

  if (!isAuthenticated) {
    return (
      <div className="recipe-flow-overlay">
        <div className="recipe-flow-modal">
          <div className="auth-required">
            <i className="fas fa-lock"></i>
            <h3>Authentication Required</h3>
            <p>Please login to create new recipes.</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-flow-overlay">
      <div className="recipe-flow-modal">
        {/* Header */}
        <div className="recipe-flow-header">
          <h2>New Recipe Wizard</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* Progress Bar */}
        <div className="recipe-flow-progress">
          <div className={`progress-step ${currentStep === 'main' ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Start</span>
          </div>
          <div className={`progress-step ${currentStep === 'recipe-type' ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Recipe Type</span>
          </div>
          <div className={`progress-step ${currentStep === 'ingredients' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Ingredients</span>
          </div>
        </div>

        {/* Main Step */}
        {currentStep === 'main' && (
          <div className="recipe-step">
            <h3>Create New Category</h3>
            <div className="option-cards">
              <div className="option-card" onClick={() => {
                setCurrentStep('recipe-type');
              }}>
                <div className="card-icon">
                  <i className="fas fa-folder-plus"></i>
                </div>
                <h4>Create New Category</h4>
                <p>Create a completely new category with your recipe</p>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Type Step */}
        {currentStep === 'recipe-type' && (
          <div className="recipe-step">
            <h3>Select Recipe Type</h3>
            <div className="option-cards">
              <div 
                className={`option-card ${recipeType === 'single' ? 'selected' : ''}`}
                onClick={() => setRecipeType('single')}
              >
                <div className="card-icon">
                  <i className="fas fa-cookie-bite"></i>
                </div>
                <h4>Single Item Recipe</h4>
                <p>Like BAKE CAKE - one recipe with multiple ingredients</p>
                <div className="example">
                  <strong>Example:</strong> BAKE CAKE with KK MAIDA, G.SUGAR, etc.
                </div>
              </div>
              <div 
                className={`option-card ${recipeType === 'multiple' ? 'selected' : ''}`}
                onClick={() => setRecipeType('multiple')}
              >
                <div className="card-icon">
                  <i className="fas fa-layer-group"></i>
                </div>
                <h4>Multiple Items Recipe</h4>
                <p>Like TIE ITEMS - multiple recipes in one category</p>
                <div className="example">
                  <strong>Example:</strong> TIE ITEMS with PLAIN TIE, MINI TIE, etc.
                </div>
              </div>
            </div>
          </div>
        )}





        {/* Ingredients Step */}
        {currentStep === 'ingredients' && (
          <div className="recipe-step">
            <h3>Ingredients List</h3>
            
            {/* Recipe Details Form */}
            <div className="form-group" style={{ marginBottom: '30px' }}>
              <div className="form-row">
                <label>Category Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., SPECIAL RECIPES"
                />
              </div>
              <div className="form-row">
                <label>Recipe Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder={recipeType === 'single' ? "e.g., BAKE CAKE" : "e.g., PLAIN TIE"}
                />
              </div>
              {recipeType === 'single' && (
                <>
                  <div className="form-row">
                    <label>Unit</label>
                    <input
                      type="text"
                      className="form-control"
                      value={recipeUnit}
                      onChange={(e) => setRecipeUnit(e.target.value)}
                      placeholder="e.g., box 15Kg."
                    />
                  </div>
                  <div className="form-row">
                    <label>Base Quantity</label>
                    <input
                      type="number"
                      step="0.001"
                      className="form-control"
                      value={recipeValue}
                      onChange={(e) => setRecipeValue(e.target.value)}
                      placeholder="e.g., 1.000"
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Editable Recipe Name Above Table */}
            <div className="recipe-name-section">
              <label htmlFor="recipe-name-input">Recipe Name:</label>
              <input
                id="recipe-name-input"
                type="text"
                className="form-control recipe-name-input"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Enter recipe name"
              />
            </div>
            
            {recipeType === 'single' ? (
              // Single Item Recipe Layout (like BAKE CAKE)
              <div className="single-recipe-layout">
                <div className="production-header">
                  <div className="production-info">
                    <strong>FIXED Production:</strong> 
                    <input 
                      type="number" 
                      className="form-control production-input" 
                      placeholder="1750" 
                      defaultValue="1750"
                    /> PCS
                  </div>
                  <div className="order-input">
                    <strong>ORDER IN KG:</strong>
                    <input 
                      type="number" 
                      className="form-control production-input" 
                      placeholder="0" 
                      defaultValue="0"
                    />
                  </div>
                </div>
                
                <div className="ingredients-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>SNO</th>
                        <th>ITEM</th>
                        <th>Unit</th>
                        <th>KG./Litr.</th>
                        <th>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map((ingredient, index) => (
                        <tr key={ingredient.id}>
                          <td>{index + 1}</td>
                          <td>
                            <select
                              className="form-control"
                              value={ingredient.name}
                              onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                            >
                              <option value="">Select from inventory</option>
                              {inventory.map((item) => (
                                <option key={item.id} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={ingredient.unit}
                              onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                              placeholder="e.g., box 15Kg."
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.quantity}
                              onChange={(e) => updateIngredient(ingredient.id, 'quantity', e.target.value)}
                              placeholder="e.g., 1.500"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value="0.00"
                              readOnly
                              style={{backgroundColor: '#f8f9fa', color: '#6c757d'}}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="ingredients-actions">
                    <button className="btn btn-success" onClick={addIngredient}>
                      <i className="fas fa-plus"></i> Add Ingredient
                    </button>
                    {ingredients.length > 1 && (
                      <button className="btn btn-outline-danger" onClick={() => removeIngredient(ingredients[ingredients.length - 1].id)}>
                        <i className="fas fa-minus"></i> Remove Last
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Multiple Items Recipe Layout (like TIE ITEMS)
              <div className="multiple-recipe-layout">
                <div className="table-header">
                  <h4>TIE ITEMS</h4>
                </div>
                
                <div className="ingredients-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Sn</th>
                        <th>DESCRIPTION</th>
                        <th>Manda</th>
                        <th>Manda</th>
                        <th>Tot.Qnty</th>
                        <th>ALFA GR</th>
                        <th>65 MAIDA</th>
                        <th>KK MAIDA</th>
                        <th>M.SUGAR</th>
                        <th>VANILLA PDR</th>
                        <th>GOLD MORE</th>
                        <th>SALT</th>
                        <th>Rose Essen</th>
                        <th>Insert</th>
                        <th>Rangna</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map((ingredient, index) => (
                        <tr key={ingredient.id}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={ingredient.name}
                              onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                              placeholder="e.g., CREAM CAKE, PLAIN TIE"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.manda1 || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'manda1', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.manda2 || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'manda2', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.totalQty || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'totalQty', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.alfaGr || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'alfaGr', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.maida65 || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'maida65', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.kkMaida || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'kkMaida', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.mSugar || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'mSugar', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.vanillaPdr || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'vanillaPdr', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.goldMore || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'goldMore', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.salt || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'salt', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.roseEssen || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'roseEssen', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.insert || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'insert', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.001"
                              className="form-control"
                              value={ingredient.rangna || 0}
                              onChange={(e) => updateIngredient(ingredient.id, 'rangna', e.target.value)}
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="ingredients-actions">
                    <button className="btn btn-success" onClick={addIngredient}>
                      <i className="fas fa-plus"></i> Add Item
                    </button>
                    {ingredients.length > 1 && (
                      <button className="btn btn-outline-danger" onClick={() => removeIngredient(ingredients[ingredients.length - 1].id)}>
                        <i className="fas fa-minus"></i> Remove Last
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="recipe-flow-navigation">
          {currentStep !== 'main' && (
            <button className="btn btn-outline-secondary" onClick={prevStep}>
              <i className="fas fa-arrow-left"></i> Previous
            </button>
          )}
          {currentStep !== 'ingredients' && currentStep !== 'main' && (
            <button 
              className="btn btn-primary" 
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next <i className="fas fa-arrow-right"></i>
            </button>
          )}
          {currentStep === 'ingredients' && (
            <button 
              className="btn btn-success" 
              onClick={handleCreateRecipe}
              disabled={!canProceed()}
            >
              <i className="fas fa-save"></i> Create Recipe
            </button>
          )}
        </div>

        {/* Inventory suggestions datalist */}
        <datalist id="inventory-suggestions">
          {inventory.map(item => (
            <option key={item.id} value={item.name} />
          ))}
        </datalist>
      </div>
    </div>
  );
};

export default NewRecipeFlow;
