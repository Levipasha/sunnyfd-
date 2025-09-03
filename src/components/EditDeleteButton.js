import React, { useState } from "react";

const EditDeleteButton = ({ 
  recipe, 
  inventory = [],
  onEditRecipe, 
  onDeleteRecipe 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    subCategory: recipe?.subCategory || "",
    description: recipe?.description || "",
    ingredients: Array.isArray(recipe?.ingredients) ? [...recipe.ingredients] : [],
    order: recipe?.order || "1"
  });
  const [inventorySearch, setInventorySearch] = useState("");

  // Safety check - if recipe is undefined, don't render anything
  if (!recipe) {
    console.warn('EditDeleteButton: recipe prop is undefined');
    return null;
  }

  const handleEditClick = () => {
    setIsEditing(true);
    setEditData({
      subCategory: recipe.subCategory || "",
      description: recipe.description || "",
      ingredients: Array.isArray(recipe.ingredients) ? [...recipe.ingredients] : [],
      order: recipe.order || "1"
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      subCategory: recipe.subCategory || "",
      description: recipe.description || "",
      ingredients: Array.isArray(recipe.ingredients) ? [...recipe.ingredients] : [],
      order: recipe.order || "1"
    });
  };

  const handleSaveEdit = () => {
    if (!editData.subCategory.trim() || !editData.description.trim() || editData.ingredients.length === 0) {
      alert("Please fill in all required fields and select at least one ingredient.");
      return;
    }

    const updatedRecipe = {
      ...recipe,
      subCategory: editData.subCategory.trim(),
      description: editData.description.trim(),
      ingredients: editData.ingredients.map(ing => ({
        ...ing,
        qty: ing.qty || "0",
        baseQty: ing.baseQty || "0" // Store base quantity for calculations
      })),
      order: editData.order || "1",
      updatedAt: new Date().toISOString()
    };

    if (onEditRecipe) {
      onEditRecipe(updatedRecipe);
    }

    setIsEditing(false);
    alert("Recipe updated successfully!");
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete the recipe "${recipe.description}"?`)) {
      if (onDeleteRecipe) {
        onDeleteRecipe(recipe.id);
      }
    }
  };

  const handleAddIngredientFromInventory = (inventoryItem) => {
    const alreadyAdded = editData.ingredients.some(ing => ing.id === inventoryItem.id);
    if (alreadyAdded) {
      // Remove ingredient if already added (deselect)
      const updatedIngredients = editData.ingredients.filter(ing => ing.id !== inventoryItem.id);
      setEditData(prev => ({
        ...prev,
        ingredients: updatedIngredients
      }));
    } else {
      // Add ingredient if not already added
      setEditData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { 
          name: inventoryItem.name, 
          qty: "0", 
          baseQty: "0", // Store base quantity
          id: inventoryItem.id,
          unit: inventoryItem.unit 
        }]
      }));
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...editData.ingredients];
    if (field === "qty") {
      // When changing quantity in edit mode, this should be the base quantity (for 1 unit)
      // The scaled quantity will be calculated based on order
      updated[index].baseQty = value;
      // Calculate the scaled quantity based on current order
      const orderValue = parseFloat(editData.order) || 1;
      updated[index].qty = (parseFloat(value) * orderValue).toString();
    } else {
      updated[index][field] = value;
    }
    setEditData(prev => ({
      ...prev,
      ingredients: updated
    }));
  };



  const handleOrderChange = (value) => {
    const orderValue = parseFloat(value) || 0;
    setEditData(prev => ({
      ...prev,
      order: value,
      ingredients: prev.ingredients.map(ing => ({
        ...ing,
        qty: (parseFloat(ing.baseQty || 0) * orderValue).toString()
      }))
    }));
  };

  // Calculate total quantity based on order
  const calculateTotalQty = () => {
    const orderValue = parseFloat(editData.order) || 0;
    return orderValue.toFixed(2);
  };

  // Calculate scaled ingredient quantities
  const getScaledQuantity = (ingredient) => {
    const orderValue = parseFloat(editData.order) || 0;
    const baseQty = parseFloat(ingredient.baseQty || 0);
    return (baseQty * orderValue).toFixed(2);
  };

  if (isEditing) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: '#f8f9fa',
          border: '2px solid #007bff',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 2px 10px rgba(0, 123, 255, 0.1)'
        }}>
          {/* Edit Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: 0, color: '#007bff', fontSize: '18px', fontWeight: 'bold' }}>
              Edit Recipe
            </h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleSaveEdit}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#218838'}
                onMouseOut={(e) => e.target.style.background = '#28a745'}
              >
                <i className="fas fa-save"></i> Save Changes
              </button>
              <button 
                onClick={handleCancelEdit}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#5a6268'}
                onMouseOut={(e) => e.target.style.background = '#6c757d'}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            </div>
          </div>

          {/* Recipe Details Section */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                Sub-Category Name
              </label>
              <input
                type="text"
                placeholder="Enter sub-category name"
                value={editData.subCategory}
                onChange={(e) => setEditData(prev => ({ ...prev, subCategory: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.3s ease'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                Description
              </label>
              <input
                type="text"
                placeholder="Enter description"
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* Ingredient Selection Section */}
          <div style={{ marginTop: '20px' }}>
            <h5 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
              Select Ingredients from Inventory:
            </h5>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Search ingredients..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              />
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '10px',
              background: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '6px'
            }}>
              {inventory
                .filter(item => 
                  item.name.toLowerCase().includes(inventorySearch.toLowerCase())
                )
                .map((item) => {
                  const isAlreadyAdded = editData.ingredients.some(ing => ing.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAddIngredientFromInventory(item)}
                      title={`${item.name} (${item.unit}) - ${isAlreadyAdded ? 'Click to remove' : 'Click to add'}`}
                      style={{
                        position: 'relative',
                        padding: '12px',
                        border: `1px solid ${isAlreadyAdded ? '#28a745' : '#dee2e6'}`,
                        borderRadius: '6px',
                        background: isAlreadyAdded ? '#d4edda' : 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        color: isAlreadyAdded ? '#155724' : 'inherit'
                      }}
                      onMouseOver={(e) => {
                        if (!isAlreadyAdded) {
                          e.target.style.borderColor = '#007bff';
                          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isAlreadyAdded) {
                          e.target.style.borderColor = '#dee2e6';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <span style={{ fontWeight: '500', fontSize: '14px', lineHeight: '1.2' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>
                        ({item.unit})
                      </span>
                      {isAlreadyAdded && (
                        <i className="fas fa-check" style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          color: '#28a745',
                          fontSize: '12px'
                        }}></i>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Current Ingredients Table */}
          {editData.ingredients.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                Current Ingredients:
              </h5>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                fontFamily: 'Arial, sans-serif'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: '8px',
                      textAlign: 'center',
                      background: '#007bff',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid #fff',
                      fontSize: '14px'
                    }}>Item</th>
                    <th style={{
                      padding: '8px',
                      textAlign: 'center',
                      background: '#007bff',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid #fff',
                      fontSize: '14px'
                    }}>Order</th>
                    <th style={{
                      padding: '8px',
                      textAlign: 'center',
                      background: '#007bff',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid #fff',
                      fontSize: '14px'
                    }}>Per</th>
                    <th style={{
                      padding: '8px',
                      textAlign: 'center',
                      background: '#007bff',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid #fff',
                      fontSize: '14px'
                    }}>Total Qty</th>
                                         {editData.ingredients.map((ingredient, index) => (
                       <th key={index} style={{
                         padding: '8px',
                         textAlign: 'center',
                         background: '#007bff',
                         color: 'white',
                         fontWeight: 'bold',
                         border: '1px solid #fff',
                         fontSize: '12px'
                       }}>
                         {ingredient.name.length > 10 ? ingredient.name.substring(0, 10) + '...' : ingredient.name}
                       </th>
                     ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{
                      padding: '8px',
                      textAlign: 'left',
                      border: '1px solid #ccc',
                      fontSize: '14px'
                    }}>
                      {editData.description}
                    </td>
                    <td style={{
                      padding: '8px',
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      fontSize: '14px'
                    }}>
                      <input
                        type="number"
                        placeholder="Order"
                        min="0"
                        step="0.01"
                        value={editData.order}
                        onChange={(e) => handleOrderChange(e.target.value)}
                        style={{
                          width: '80px',
                          textAlign: 'center',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '4px',
                          fontSize: '12px'
                        }}
                      />
                    </td>
                    <td style={{
                      padding: '8px',
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      fontSize: '14px'
                    }}>
                      1
                    </td>
                    <td style={{
                      padding: '8px',
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      fontSize: '14px'
                    }}>
                      {calculateTotalQty()}
                    </td>
                                         {editData.ingredients.map((ingredient, index) => (
                       <td key={index} style={{
                         padding: '8px',
                         textAlign: 'center',
                         border: '1px solid #ccc',
                         fontSize: '14px'
                       }}>
                         <input
                           type="number"
                           value={ingredient.baseQty || "0"}
                           onChange={(e) => handleIngredientChange(index, "qty", e.target.value)}
                           placeholder="0"
                           min="0"
                           step="0.01"
                           style={{
                             width: '60px',
                             textAlign: 'center',
                             border: '1px solid #ccc',
                             borderRadius: '4px',
                             padding: '4px',
                             fontSize: '12px'
                           }}
                         />
                       </td>
                     ))}
                  </tr>
                  
                  {/* Totals Row */}
                  <tr style={{ background: '#f8f9fa' }}>
                    <td style={{
                      padding: '8px',
                      textAlign: 'left',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      TOTALS
                    </td>
                    <td style={{
                      padding: '8px',
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}></td>
                    <td style={{
                      padding: '8px',
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}></td>
                    <td style={{
                      padding: '8px',
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {calculateTotalQty()}
                    </td>
                                         {editData.ingredients.map((ingredient, index) => (
                       <td key={index} style={{
                         padding: '8px',
                         textAlign: 'center',
                         border: '1px solid #ccc',
                         fontSize: '14px',
                         fontWeight: 'bold'
                       }}>
                         {getScaledQuantity(ingredient)}
                       </td>
                     ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginTop: '10px'
    }}>
      <button 
        onClick={handleEditClick}
        title="Edit recipe"
        style={{
          padding: '6px 10px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: '#007bff',
          color: 'white'
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#0056b3';
        }}
        onMouseOut={(e) => {
          e.target.style.background = '#007bff';
        }}
      >
        <i className="fas fa-edit"></i>
      </button>
      
      <button 
        onClick={handleDeleteClick}
        title="Delete recipe"
        style={{
          padding: '6px 10px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: '#dc3545',
          color: 'white'
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#c82333';
        }}
        onMouseOut={(e) => {
          e.target.style.background = '#dc3545';
        }}
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

export default EditDeleteButton;
