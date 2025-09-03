// Enhanced block-wise printing utilities for recipe blocks
import { printBlock } from './printUtils';

// Print a specific recipe block with updated values for chef
export const printRecipeBlock = async (blockName, blockData, onPrintComplete = null) => {
  try {
    console.log('🖨️ Starting print process for block:', blockName);
    console.log('📊 Block data:', blockData);
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Popup blocked! Please allow popups for this site.');
    }
    
    // Create print-friendly HTML for the recipe block
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${blockName} - Recipe Block</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #333;
            padding-bottom: 15px;
          }
          
          .print-header h1 {
            margin: 0;
            color: #333;
            font-size: 28px;
            font-weight: bold;
          }
          
          .print-header .block-info {
            margin: 10px 0;
            color: #666;
            font-size: 14px;
          }
          
          .print-header .production-info {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
          }
          
          .subcategory-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          
          .subcategory-title {
            background: #007bff;
            color: white;
            padding: 12px 15px;
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: bold;
            border-radius: 5px 5px 0 0;
          }
          
          .recipe-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          
          .recipe-table th {
            background: #f8f9fa;
            border: 1px solid #ddd;
            padding: 8px 6px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
          }
          
          .recipe-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: center;
            vertical-align: middle;
          }
          
          .recipe-table .item-name {
            text-align: left;
            font-weight: bold;
            background: #f8f9fa;
            min-width: 120px;
          }
          
          .recipe-table .order-qty {
            background: #e3f2fd;
            font-weight: bold;
            color: #1976d2;
          }
          
          .recipe-table .ingredient-value {
            background: #fff3e0;
            font-weight: bold;
            color: #f57c00;
          }
          
          .recipe-table .total-row {
            background: #e8f5e8 !important;
            font-weight: bold;
            border-top: 2px solid #4caf50;
          }
          
          .recipe-table .total-row td {
            background: #e8f5e8 !important;
            color: #2e7d32;
          }
          
          .no-recipes {
            text-align: center;
            padding: 40px;
            color: #666;
            font-style: italic;
          }
          
          .print-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 15px;
            }
            .subcategory-section { 
              page-break-inside: avoid; 
              margin-bottom: 30px;
            }
            .recipe-table { 
              page-break-inside: avoid; 
            }
            .print-header {
              margin-bottom: 20px;
            }
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${blockName}</h1>
          <div class="block-info">
            Recipe Production Block - Chef Instructions
          </div>
          <div class="production-info">
            <strong>Production Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Generated Time:</strong> ${new Date().toLocaleTimeString()}<br>
            <strong>Block Type:</strong> ${blockName}
          </div>
        </div>
        
        ${generateBlockContent(blockData)}
        
        <div class="print-footer">
          <p>This document contains updated recipe values for chef production use.</p>
          <p>Generated by Sunny Backery Production System</p>
        </div>
      </body>
      </html>
    `;

    console.log('📝 Generated print HTML, writing to print window...');
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      console.log('🖨️ Print window loaded, initiating print...');
      
      // Small delay to ensure content is fully rendered
      setTimeout(() => {
        try {
          printWindow.print();
          console.log('✅ Print dialog opened successfully');
          
          // Close window after a delay to allow print dialog to complete
          setTimeout(() => {
            printWindow.close();
            console.log('✅ Print window closed');
            
            // Call the completion callback after printing
            if (onPrintComplete && typeof onPrintComplete === 'function') {
              onPrintComplete();
            }
          }, 2000);
        } catch (printError) {
          console.error('❌ Error during print:', printError);
          printWindow.close();
          throw new Error('Print failed: ' + printError.message);
        }
      }, 500);
    };
    
    // Handle errors in print window
    printWindow.onerror = (error) => {
      console.error('❌ Print window error:', error);
      printWindow.close();
      throw new Error('Print window error: ' + error.message);
    };
    
  } catch (error) {
    console.error('❌ Error in printRecipeBlock:', error);
    throw error;
  }
};

// Generate HTML content for the recipe block
const generateBlockContent = (blockData) => {
  if (!blockData || Object.keys(blockData).length === 0) {
    return '<div class="no-recipes">No recipes found in this block.</div>';
  }

  let content = '';
  
  Object.entries(blockData).forEach(([subCategory, recipes]) => {
    if (!recipes || recipes.length === 0) return;
    
    content += `
      <div class="subcategory-section">
        <div class="subcategory-title">${subCategory}</div>
        ${generateRecipeTable(recipes)}
      </div>
    `;
  });
  
  return content;
};

// Generate recipe table for a subcategory
const generateRecipeTable = (recipes) => {
  if (!recipes || recipes.length === 0) {
    return '<div class="no-recipes">No recipes in this subcategory.</div>';
  }

  // Get all unique ingredients across all recipes
  const allIngredients = new Set();
  recipes.forEach(recipe => {
    if (recipe.ingredients) {
      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => allIngredients.add(ingredient.name));
      } else if (typeof recipe.ingredients === 'object') {
        Object.keys(recipe.ingredients).forEach(ingredientName => allIngredients.add(ingredientName));
      }
    }
    // Check for MongoDB structure
    if (recipe.items && recipe.items[0] && recipe.items[0].ingredientValues) {
      Object.keys(recipe.items[0].ingredientValues).forEach(ingredientName => allIngredients.add(ingredientName));
    }
  });

  const ingredientList = Array.from(allIngredients);
  
  // Calculate totals
  const totals = {
    orderTotal: 0,
    totalQtyTotal: 0,
    ingredientTotals: {}
  };
  
  ingredientList.forEach(ingredientName => {
    totals.ingredientTotals[ingredientName] = 0;
  });

  let tableHTML = `
    <table class="recipe-table">
      <thead>
        <tr>
          <th style="width: 150px;">Item Name</th>
          <th style="width: 80px;">Order Qty</th>
          <th style="width: 60px;">Per</th>
          <th style="width: 80px;">Total Qty</th>
          ${ingredientList.map(ingredientName => `<th style="width: 80px;">${ingredientName}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  recipes.forEach(recipe => {
    const orderQty = parseFloat(recipe.orderQty || recipe.savedOrderQty || 1) || 1;
    const per = 1;
    const totalQty = orderQty * per;
    
    totals.orderTotal += orderQty;
    totals.totalQtyTotal += totalQty;
    
    tableHTML += `
      <tr>
        <td class="item-name">${recipe.description || recipe.name || 'Untitled'}</td>
        <td class="order-qty">${orderQty}</td>
        <td>${per}</td>
        <td>${totalQty}</td>
                 ${ingredientList.map(ingredientName => {
           let ingredientValue = 0;
           
           // Calculate ingredient value based on recipe structure
           if (recipe.ingredients) {
             if (Array.isArray(recipe.ingredients)) {
               const ingredient = recipe.ingredients.find(i => i.name === ingredientName);
               ingredientValue = ingredient ? (parseFloat(ingredient.qty) || 0) * orderQty : 0;
             } else if (typeof recipe.ingredients === 'object') {
               ingredientValue = (parseFloat(recipe.ingredients[ingredientName]) || 0) * orderQty;
             }
           }
           // Check MongoDB structure
           else if (recipe.items && recipe.items[0] && recipe.items[0].ingredientValues) {
             ingredientValue = (parseFloat(recipe.items[0].ingredientValues[ingredientName]) || 0) * orderQty;
           }
           
           totals.ingredientTotals[ingredientName] += ingredientValue;
           
           return `<td class="ingredient-value">${ingredientValue.toFixed(2)}</td>`;
         }).join('')}
      </tr>
    `;
  });

  // Add totals row
  tableHTML += `
      <tr class="total-row">
        <td class="item-name"><strong>TOTALS</strong></td>
        <td><strong>${totals.orderTotal.toFixed(2)}</strong></td>
        <td><strong>${recipes.length}</strong></td>
        <td><strong>${totals.totalQtyTotal.toFixed(2)}</strong></td>
        ${ingredientList.map(ingredientName => 
          `<td><strong>${totals.ingredientTotals[ingredientName].toFixed(2)}</strong></td>`
        ).join('')}
      </tr>
    </tbody>
  </table>
  `;

  return tableHTML;
};



// Print multiple blocks in sequence
export const printMultipleBlocks = async (blocks, onComplete = null) => {
  let currentIndex = 0;
  
  const printNext = async () => {
    if (currentIndex >= blocks.length) {
      if (onComplete) onComplete();
      return;
    }
    
    const block = blocks[currentIndex];
    await printRecipeBlock(block.name, block.data, () => {
      currentIndex++;
      setTimeout(printNext, 2000); // 2 second delay between prints
    });
  };
  
  printNext();
};

// Print all blocks for a specific category
export const printAllBlocksForCategory = async (categoryName, blockData, onComplete = null) => {
  const blocks = Object.entries(blockData).map(([subCategory, recipes]) => ({
    name: `${categoryName} - ${subCategory}`,
    data: { [subCategory]: recipes }
  }));
  
  await printMultipleBlocks(blocks, onComplete);
};
