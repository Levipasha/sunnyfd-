import React, { useState, useEffect } from 'react';

const PrintButton = ({ onPrint, className }) => {
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [printCount, setPrintCount] = useState(0);

  // Load saved recipes from localStorage
  useEffect(() => {
    const loadSavedRecipes = () => {
      const saved = localStorage.getItem('savedRecipes');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedRecipes(parsed);
        setPrintCount(parsed.length);
      }
    };

    loadSavedRecipes();
    
    // Listen for storage changes (when recipes are saved)
    const handleStorageChange = () => {
      loadSavedRecipes();
    };

    // Listen for custom data refresh event
    const handleDataRefreshed = () => {
      loadSavedRecipes();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dataRefreshed', handleDataRefreshed);
    
    // Also check periodically for changes
    const interval = setInterval(loadSavedRecipes, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataRefreshed', handleDataRefreshed);
      clearInterval(interval);
    };
  }, []);

  // Function to refresh/reset all data after printing
  const refreshAllData = () => {
    // Clear all saved recipes from localStorage
    localStorage.removeItem('savedRecipes');
    
    // Clear order quantities for all categories
    const categories = ['crossUpdateCustomRecipes', 'mawaCustomRecipes', 'qameerCustomRecipes', 'osamaniaCustomRecipes', 'saltItemsCustomRecipes', 'showroomCustomRecipes'];
    
    categories.forEach(categoryKey => {
      const categoryData = localStorage.getItem(categoryKey);
      if (categoryData) {
        try {
          const recipes = JSON.parse(categoryData);
          // Reset all order quantities to 0
          const updatedRecipes = recipes.map(recipe => ({
            ...recipe,
            order: 0
          }));
          localStorage.setItem(categoryKey, JSON.stringify(updatedRecipes));
        } catch (error) {
          console.error(`Error updating ${categoryKey}:`, error);
        }
      }
    });
    
    // Clear order quantities from localStorage
    localStorage.removeItem('orderQuantities');
    
    // Reset local state
    setSavedRecipes([]);
    setPrintCount(0);
    
    // Dispatch custom event to notify other components to refresh
    window.dispatchEvent(new CustomEvent('dataRefreshed'));
    
    // Show confirmation message
    alert('Data has been refreshed! All values have been reset to zero.');
  };

  const handlePrint = () => {
    if (savedRecipes.length === 0) {
      alert('No saved recipes to print. Please save some recipes with values first.');
      return;
    }

    // Store the recipes to print before clearing
    const recipesToPrint = [...savedRecipes];

    // Group saved recipes by category
    const recipesByCategory = {};
    savedRecipes.forEach(recipe => {
      const category = recipe.categoryName || 'Unknown Category';
      if (!recipesByCategory[category]) {
        recipesByCategory[category] = [];
      }
      recipesByCategory[category].push(recipe);
    });

    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Saved Recipes Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .category { margin-bottom: 30px; }
          .category-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; background: #f8f9fa; padding: 10px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #007bff; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .totals-row { background-color: #e9ecef !important; font-weight: bold; }
          .subcategory { margin-bottom: 20px; }
          .subcategory-title { font-size: 16px; font-weight: bold; color: #495057; margin-bottom: 10px; }
          .timestamp { text-align: right; color: #6c757d; font-size: 12px; margin-top: 20px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Saved Recipes Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        ${Object.entries(recipesByCategory).map(([category, recipes]) => `
          <div class="category">
            <div class="category-title">${category}</div>
            ${Object.entries(groupBySubCategory(recipes)).map(([subCategory, subRecipes]) => `
              <div class="subcategory">
                <div class="subcategory-title">${subCategory}</div>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Order Qty</th>
                      <th>Per</th>
                      <th>Total Qty</th>
                      ${getAllIngredients(subRecipes).map(ingredient => `<th>${ingredient}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${subRecipes.map(recipe => `
                      <tr>
                        <td>${recipe.description}</td>
                        <td>${recipe.savedOrderQty}</td>
                        <td>1</td>
                        <td>${recipe.savedOrderQty}</td>
                        ${getAllIngredients(subRecipes).map(ingredient => {
                          const recipeIngredient = recipe.ingredients.find(ing => ing.name === ingredient);
                          const calculated = recipeIngredient ? (parseFloat(recipeIngredient.qty) || 0) * recipe.savedOrderQty : 0;
                          return `<td>${calculated.toFixed(2)}</td>`;
                        }).join('')}
                      </tr>
                    `).join('')}
                    <tr class="totals-row">
                      <td>TOTALS</td>
                      <td>${subRecipes.reduce((sum, r) => sum + r.savedOrderQty, 0)}</td>
                      <td>-</td>
                      <td>${subRecipes.reduce((sum, r) => sum + r.savedOrderQty, 0)}</td>
                      ${getAllIngredients(subRecipes).map(ingredient => {
                        const total = subRecipes.reduce((sum, recipe) => {
                          const recipeIngredient = recipe.ingredients.find(ing => ing.name === ingredient);
                          return sum + (recipeIngredient ? (parseFloat(recipeIngredient.qty) || 0) * recipe.savedOrderQty : 0);
                        }, 0);
                        return `<td>${total.toFixed(2)}</td>`;
                      }).join('')}
                    </tr>
                  </tbody>
                </table>
              </div>
            `).join('')}
          </div>
        `).join('')}
        
        <div class="timestamp">
          <p>Total saved recipes: ${savedRecipes.length}</p>
          <p>Report generated: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Helper functions
    function groupBySubCategory(recipes) {
      const grouped = {};
      recipes.forEach(recipe => {
        const subCategory = recipe.subCategory || 'Uncategorized';
        if (!grouped[subCategory]) {
          grouped[subCategory] = [];
        }
        grouped[subCategory].push(recipe);
      });
      return grouped;
    }

    function getAllIngredients(recipes) {
      const ingredientSet = new Set();
      recipes.forEach(recipe => {
        recipe.ingredients.forEach(ing => {
          ingredientSet.add(ing.name);
        });
      });
      return Array.from(ingredientSet);
    }

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
      
      // After printing, refresh/reset all data
      setTimeout(() => {
        refreshAllData();
      }, 500); // Small delay to ensure print window is closed
    };

    // Call parent's onPrint callback
    if (onPrint) {
      onPrint(recipesToPrint);
    }
  };

  return (
    <button
      className={className}
      onClick={handlePrint}
      style={{
        padding: '8px 16px',
        backgroundColor: '#17a2b8',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = '#138496';
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = '#17a2b8';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
      title={`Print ${printCount} saved recipe(s)`}
    >
      <i className="fas fa-print" style={{ fontSize: '14px' }}></i>
      Print ({printCount})
    </button>
  );
};

export default PrintButton;
