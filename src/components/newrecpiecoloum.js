import React, { useState, useEffect } from 'react';
import { initialInventory } from '../data';

const NewRecipeColumn = ({ onAddRow, categoryName, existingIngredients = [], inventory = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [order, setOrder] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!showModal) {
      setDescription('');
      setSelectedIngredients([]);
      setOrder(1);
      setSearchTerm('');
    }
  }, [showModal]);

  const handleIngredientToggle = (ingredient) => {
    setSelectedIngredients(prev => {
      const exists = prev.find(item => item.id === ingredient.id);
      if (exists) {
        return prev.filter(item => item.id !== ingredient.id);
      } else {
        return [...prev, { ...ingredient, qty: 0, baseQty: 0 }];
      }
    });
  };

  const handleQuantityChange = (ingredientId, newQty) => {
    setSelectedIngredients(prev => 
      prev.map(item => 
        item.id === ingredientId 
          ? { 
              ...item, 
              baseQty: parseFloat(newQty) || 0,
              qty: ((parseFloat(newQty) || 0) * (parseFloat(order) || 1)).toString()
            }
          : item
      )
    );
  };

  const handleOrderChange = (value) => {
    const orderValue = parseFloat(value) || 0;
    setOrder(value);
    setSelectedIngredients(prev => 
      prev.map(ing => ({
        ...ing,
        qty: (parseFloat(ing.baseQty || 0) * orderValue).toString()
      }))
    );
  };

  const handleSave = () => {
    if (!description.trim()) {
      window.alert('Please enter a description');
      return;
    }

    if (selectedIngredients.length === 0) {
      window.alert('Please select at least one ingredient');
      return;
    }

    const newRow = {
      id: Date.now(),
      description: description.trim(),
      order: parseFloat(order) || 1,
      ingredients: selectedIngredients.map(ing => ({
        ...ing,
        qty: ing.baseQty || "0", // Save base quantity, not calculated quantity
        baseQty: ing.baseQty || "0"
      })),
      createdAt: new Date().toISOString()
    };

    // Pass the new row to the parent component - it will handle adding the sub-category
    onAddRow(newRow, categoryName);
    setShowModal(false);
  };

  const calculateTotalQty = () => {
    return (parseFloat(order) || 1).toFixed(2);
  };

  const getScaledQuantity = (ingredient) => {
    const orderValue = parseFloat(order) || 0;
    const baseQty = parseFloat(ingredient.baseQty || 0);
    return (baseQty * orderValue).toFixed(2);
  };

  // Filter ingredients based on search term - use inventory prop if available, fallback to initialInventory
  const filteredIngredients = (inventory.length > 0 ? inventory : initialInventory).filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug logging for inventory data
  useEffect(() => {
    if (searchTerm) {
      console.log('🔍 Search term:', searchTerm);
      console.log('🔍 Using inventory prop:', inventory.length > 0);
      console.log('🔍 Inventory prop length:', inventory.length);
      console.log('🔍 Filtered ingredients count:', filteredIngredients.length);
      console.log('🔍 First few filtered ingredients:', filteredIngredients.slice(0, 5).map(i => i.name));
    }
  }, [searchTerm, inventory, filteredIngredients]);

  return (
    <div className="new-recipe-column">
      {/* Add Recipe Block Button */}
      <button 
        onClick={() => setShowModal(true)}
        title="Add recipe row"
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
        <i className="fas fa-plus"></i>
        Add Recipe Block
      </button>

      {/* Floating Modal */}
      {showModal && (
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
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h4 style={{ margin: 0, color: '#007bff', fontSize: '18px', fontWeight: 'bold' }}>
                Add Recipe Row to "{categoryName}"
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleSave}
                  disabled={!description.trim() || selectedIngredients.length === 0}
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
                  <i className="fas fa-save"></i> Add Row
                </button>
                <button 
                  onClick={() => setShowModal(false)}
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
                  Recipe Description
                </label>
                <input
                  type="text"
                  placeholder="Enter recipe description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Order Quantity
                </label>
                <input
                  type="number"
                  placeholder="Enter order quantity"
                  value={order}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  min="0"
                  step="0.01"
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                {filteredIngredients.length > 0 ? (
                  filteredIngredients.map((item) => {
                    const isAlreadyAdded = selectedIngredients.some(ing => ing.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleIngredientToggle(item)}
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
                  })
                ) : (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '20px',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    {searchTerm ? (
                      <>
                        <p>No ingredients found matching "{searchTerm}"</p>
                        <p style={{ fontSize: '12px', marginTop: '5px' }}>
                          Try searching for different terms or check if the ingredient exists in your inventory.
                        </p>
                        {inventory.length === 0 && (
                          <p style={{ fontSize: '12px', color: '#dc3545', marginTop: '5px' }}>
                            ⚠️ No inventory data available. Please refresh the page or check your connection.
                          </p>
                        )}
                      </>
                    ) : (
                      <p>Start typing to search for ingredients...</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Current Ingredients Table */}
            {selectedIngredients.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                  Recipe Preview:
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
                      {selectedIngredients.map((ingredient, index) => (
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
                        {description}
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        border: '1px solid #ccc',
                        fontSize: '14px'
                      }}>
                        {order}
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
                      {selectedIngredients.map((ingredient, index) => (
                        <td key={index} style={{
                          padding: '8px',
                          textAlign: 'center',
                          border: '1px solid #ccc',
                          fontSize: '14px'
                        }}>
                          <input
                            type="number"
                            value={ingredient.baseQty || ingredient.qty || "0"}
                            onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)}
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
                      {selectedIngredients.map((ingredient, index) => (
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
      )}
    </div>
  );
};

export default NewRecipeColumn;
