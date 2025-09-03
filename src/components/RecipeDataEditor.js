import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSave, faTimes, faTrash, faPlus, faFolder, faFile } from '@fortawesome/free-solid-svg-icons';

const RecipeDataEditor = ({ 
  isOpen, 
  onClose, 
  onSave, 
  blockName, 
  currentData, 
  isNested = false 
}) => {
  const [recipeData, setRecipeData] = useState({});
  const [newItem, setNewItem] = useState({ name: '', order: 0, per: 1 });
  const [newCategory, setNewCategory] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (isOpen && currentData) {
      setRecipeData(JSON.parse(JSON.stringify(currentData)));
    }
  }, [isOpen, currentData]);

  const handleItemChange = (path, field, value) => {
    const newData = { ...recipeData };
    const pathArray = path.split('.');
    let current = newData;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = {
      ...current[pathArray[pathArray.length - 1]],
      [field]: field === 'order' || field === 'per' ? parseFloat(value) || 0 : value
    };
    
    setRecipeData(newData);
  };

  const addItem = (category = null) => {
    if (!newItem.name.trim()) return;
    
    const newData = { ...recipeData };
    const itemData = {
      order: parseFloat(newItem.order) || 0,
      per: parseFloat(newItem.per) || 1
    };
    
    if (category) {
      if (!newData[category]) {
        newData[category] = {};
      }
      newData[category][newItem.name] = itemData;
    } else {
      newData[newItem.name] = itemData;
    }
    
    setRecipeData(newData);
    setNewItem({ name: '', order: 0, per: 1 });
  };

  const removeItem = (path) => {
    const newData = { ...recipeData };
    const pathArray = path.split('.');
    let current = newData;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    delete current[pathArray[pathArray.length - 1]];
    setRecipeData(newData);
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    
    const newData = { ...recipeData };
    newData[newCategory] = {};
    setRecipeData(newData);
    setNewCategory('');
  };

  const removeCategory = (categoryName) => {
    const newData = { ...recipeData };
    delete newData[categoryName];
    setRecipeData(newData);
  };

  const startEditItem = (path) => {
    setEditingItem(path);
  };

  const saveItemEdit = () => {
    setEditingItem(null);
  };

  const renderItem = (itemKey, itemData, path) => {
    const isEditing = editingItem === path;
    
    return (
      <div key={itemKey} className="flex items-center space-x-2 p-2 border border-gray-200 rounded bg-gray-50">
        {isEditing ? (
          <>
            <input
              type="text"
              value={itemKey}
              onChange={(e) => {
                // Handle item name change
                const newData = { ...recipeData };
                const pathArray = path.split('.');
                let current = newData;
                
                for (let i = 0; i < pathArray.length - 1; i++) {
                  current = current[pathArray[i]];
                }
                
                const oldData = current[itemKey];
                delete current[itemKey];
                current[e.target.value] = oldData;
                setRecipeData(newData);
              }}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <input
              type="number"
              step="0.01"
              value={itemData.order}
              onChange={(e) => handleItemChange(path, 'order', e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Order"
            />
            <input
              type="number"
              step="0.01"
              value={itemData.per}
              onChange={(e) => handleItemChange(path, 'per', e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Per"
            />
            <button
              onClick={saveItemEdit}
              className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              <FontAwesomeIcon icon={faSave} />
            </button>
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faFile} className="text-gray-400" />
            <span className="flex-1 text-sm font-medium">{itemKey}</span>
            <span className="w-20 text-sm text-gray-600">Order: {itemData.order}</span>
            <span className="w-20 text-sm text-gray-600">Per: {itemData.per}</span>
            <button
              onClick={() => startEditItem(path)}
              className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
          </>
        )}
        <button
          onClick={() => removeItem(path)}
          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    );
  };

  const renderCategory = (categoryName, categoryData) => {
    return (
      <div key={categoryName} className="border border-gray-300 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faFolder} className="text-blue-500" />
            <h3 className="text-lg font-semibold">{categoryName}</h3>
          </div>
          <button
            onClick={() => removeCategory(categoryName)}
            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
        
        <div className="space-y-2">
          {Object.keys(categoryData).map(itemKey => 
            renderItem(itemKey, categoryData[itemKey], `${categoryName}.${itemKey}`)
          )}
        </div>
        
        {/* Add Item to Category */}
        <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Item name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            step="0.01"
            value={newItem.order}
            onChange={(e) => setNewItem(prev => ({ ...prev, order: parseFloat(e.target.value) || 0 }))}
            placeholder="Order"
            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            step="0.01"
            value={newItem.per}
            onChange={(e) => setNewItem(prev => ({ ...prev, per: parseFloat(e.target.value) || 1 }))}
            placeholder="Per"
            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => addItem(categoryName)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
      </div>
    );
  };

  const handleSave = () => {
    onSave(recipeData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Edit Recipe Data - {blockName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Add Category (for nested structures) */}
          {isNested && (
            <div className="flex space-x-2 p-4 border border-gray-300 rounded-lg">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCategory}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                <FontAwesomeIcon icon={faPlus} /> Add Category
              </button>
            </div>
          )}

          {/* Recipe Data */}
          <div>
            {isNested ? (
              // Nested structure (categories with items)
              <div className="space-y-4">
                {Object.keys(recipeData).map(categoryName => 
                  renderCategory(categoryName, recipeData[categoryName])
                )}
              </div>
            ) : (
              // Flat structure (items directly)
              <div className="space-y-2">
                {Object.keys(recipeData).map(itemKey => 
                  renderItem(itemKey, recipeData[itemKey], itemKey)
                )}
                
                {/* Add Item (for flat structures) */}
                <div className="flex space-x-2 p-4 border border-gray-300 rounded-lg">
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Item name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.order}
                    onChange={(e) => setNewItem(prev => ({ ...prev, order: parseFloat(e.target.value) || 0 }))}
                    placeholder="Order"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.per}
                    onChange={(e) => setNewItem(prev => ({ ...prev, per: parseFloat(e.target.value) || 1 }))}
                    placeholder="Per"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addItem()}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              </div>
            )}
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

export default RecipeDataEditor;
