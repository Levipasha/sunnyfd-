/**
 * Inventory Service
 * Handles all API calls to the backend for inventory management
 */

// API base URL - adjust this based on your backend server configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sunny-bd.onrender.com';

/**
 * Get all inventory items
 * @returns {Promise} Promise object with inventory items
 */
export const getAllInventoryItems = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch inventory items:', error);
    throw error;
  }
};

/**
 * Add a new inventory item
 * @param {Object} item - The inventory item to add
 * @returns {Promise} Promise object with the added item
 */
export const addInventoryItem = async (item) => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to add inventory item:', error);
    throw error;
  }
};

/**
 * Add multiple inventory items in bulk
 * @param {Array} items - Array of inventory items to add
 * @returns {Promise} Promise object with the added items
 */
export const addInventoryItems = async (items) => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to add inventory items:', error);
    throw error;
  }
};

/**
 * Update an inventory item
 * @param {number} id - The ID of the item to update
 * @param {Object} item - The updated inventory item data
 * @returns {Promise} Promise object with the updated item
 */
export const updateInventoryItem = async (id, item) => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to update inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an inventory item
 * @param {number} id - The ID of the item to delete
 * @returns {Promise} Promise object with the deleted item
 */
export const deleteInventoryItem = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Failed to delete inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Prepare inventory for next day
 * @returns {Promise} Promise object with the updated items
 */
export const prepareForNextDay = async () => {
  try {
    console.log('🚀 Calling prepare-next-day endpoint...');
    console.log('🔍 API URL:', `${API_BASE_URL}/inventory/prepare-next-day`);
    
    const response = await fetch(`${API_BASE_URL}/inventory/prepare-next-day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('🔍 Error response data:', errorData);
      } catch (parseError) {
        console.warn('🔍 Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('✅ Success response:', data);
    return data.data;
  } catch (error) {
    console.error('❌ Failed to prepare inventory for next day:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

/**
 * Initialize inventory with default data
 * @param {Array} initialData - Array of initial inventory items
 * @returns {Promise} Promise object with the initialized items
 */
export const initializeInventory = async (initialData) => {
  try {
    // First clear existing inventory (optional)
    const currentItems = await getAllInventoryItems();
    
    if (currentItems && currentItems.length > 0) {
      // If there are existing items, just return them
      return currentItems;
    }
    
    // Add all initial items
    return await addInventoryItems(initialData);
  } catch (error) {
    console.error('Failed to initialize inventory:', error);
    throw error;
  }
};

/**
 * Create inventory record for a specific date
 * @param {Object} recordData - The inventory record data
 * @returns {Promise} Promise object with the created/updated record
 */
export const createInventoryRecord = async (recordData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/create-record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to create inventory record:', error);
    throw error;
  }
};

/**
 * Produce a recipe and deduct ingredients from inventory
 * @param {string} recipeName - Name of the recipe to produce
 * @param {number} quantity - Quantity to produce (in recipe units)
 * @returns {Promise} Promise object with the production result
 */
export const produceRecipe = async (recipeName, quantity) => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/produce-recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipeName, quantity }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Failed to produce recipe:', error);
    throw error;
  }
};

/**
 * Get recipe information
 * @param {string} recipeName - Name of the recipe
 * @returns {Object} Recipe information
 */
export const getRecipeInfo = async (recipeName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/recipes/${encodeURIComponent(recipeName)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to get recipe info:', error);
    throw error;
  }
};

/**
 * Get all available recipes
 * @returns {Array} Array of recipe names
 */
export const getAllRecipes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/recipes`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to get recipes:', error);
    throw error;
  }
};
