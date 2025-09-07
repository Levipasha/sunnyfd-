const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sunny-bd.onrender.com';

export const recipeService = {
  // Save a recipe to MongoDB (creates new or updates existing)
  async saveRecipe(recipeData) {
    try {
      // Determine if this is a new recipe or an update to existing recipe
      const isUpdate = recipeData._id || recipeData.mongoId;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `${API_BASE_URL}/recipes/${recipeData._id || recipeData.mongoId}`
        : `${API_BASE_URL}/recipes`;
      
      console.log('🔍 Debug: Recipe Service - Method:', method, 'URL:', url, 'Is Update:', isUpdate);
      console.log('🔍 Debug: Recipe Data being sent:', JSON.stringify(recipeData, null, 2));
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipeData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('🔍 Debug: Response status:', response.status);
        console.log('🔍 Debug: Response ok:', response.ok);
        console.log('🔍 Debug: Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error('🔍 Debug: Error response data:', errorData);
          } catch (parseError) {
            console.error('🔍 Debug: Could not parse error response:', parseError);
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
              console.error('🔍 Debug: Error response text:', errorText);
            } catch (textError) {
              console.error('🔍 Debug: Could not read error response text:', textError);
            }
          }
          
          // Add specific error handling for common HTTP status codes
          if (response.status === 400) {
            errorMessage = `Bad Request: ${errorMessage}`;
          } else if (response.status === 401) {
            errorMessage = `Unauthorized: ${errorMessage}`;
          } else if (response.status === 403) {
            errorMessage = `Forbidden: ${errorMessage}`;
          } else if (response.status === 404) {
            errorMessage = `Not Found: ${errorMessage}`;
          } else if (response.status === 500) {
            errorMessage = `Server Error: ${errorMessage}`;
          } else if (response.status === 0) {
            errorMessage = `Network Error: Unable to connect to server. Check if server is running and accessible.`;
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('🔍 Debug: Success response:', result);
        return result;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 15 seconds. Server may be slow or unresponsive.');
        } else if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to server. Check if server is running and accessible.');
        } else if (fetchError.name === 'TypeError' && fetchError.message.includes('CORS')) {
          throw new Error('CORS error: Server is blocking requests from this origin.');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error saving recipe:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  // Create a new recipe (explicitly for new recipes)
  async createRecipe(recipeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  },

  // Update an existing recipe (explicitly for updates)
  async updateRecipe(recipeId, recipeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  },

  // Fetch all recipes from MongoDB
  async getRecipes() {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  },

  // Fetch a single recipe by ID
  async getRecipeById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      throw error;
    }
  }
};
