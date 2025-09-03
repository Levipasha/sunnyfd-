import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSave, faTimes, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const FormulaEditor = ({ 
  isOpen, 
  onClose, 
  onSave, 
  blockName, 
  categoryName, 
  itemName, 
  currentFormulas, 
  currentIngredients 
}) => {
  const [formulas, setFormulas] = useState({});
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState({ name: '', multiplier: 1 });
  const [editingIngredient, setEditingIngredient] = useState(null);

  useEffect(() => {
    if (isOpen && currentFormulas) {
      setFormulas({ ...currentFormulas });
      setIngredients([...currentIngredients]);
    }
  }, [isOpen, currentFormulas, currentIngredients]);

  const handleFormulaChange = (field, value) => {
    setFormulas(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: field === 'multiplier' ? parseFloat(value) || 0 : value
    };
    setIngredients(updatedIngredients);
  };

  const addIngredient = () => {
    if (newIngredient.name.trim()) {
      setIngredients(prev => [...prev, { ...newIngredient }]);
      setNewIngredient({ name: '', multiplier: 1 });
    }
  };

  const removeIngredient = (index) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const startEditIngredient = (index) => {
    setEditingIngredient(index);
  };

  const saveIngredientEdit = (index) => {
    setEditingIngredient(null);
  };

  const handleSave = () => {
    onSave({
      formulas,
      ingredients
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Edit Formulas - {blockName} - {categoryName} - {itemName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formula Fields */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Formula Fields</h3>
            <div className="space-y-3">
              {Object.keys(formulas).map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <label className="w-32 text-sm font-medium">{field}:</label>
                  <input
                    type="text"
                    value={formulas[field]}
                    onChange={(e) => handleFormulaChange(field, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter formula (e.g., order * per * 0.75)"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
            
            {/* Add New Ingredient */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ingredient name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="0.01"
                value={newIngredient.multiplier}
                onChange={(e) => setNewIngredient(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 0 }))}
                placeholder="Multiplier"
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addIngredient}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>

            {/* Ingredients List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded">
                  {editingIngredient === index ? (
                    <>
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={ingredient.multiplier}
                        onChange={(e) => handleIngredientChange(index, 'multiplier', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => saveIngredientEdit(index)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{ingredient.name}</span>
                      <span className="w-20 text-sm text-gray-600">{ingredient.multiplier}</span>
                      <button
                        onClick={() => startEditIngredient(index)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => removeIngredient(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormulaEditor;
