// Utility script to update all recipe blocks with print functionality
// This is a helper script to add print functionality to all blocks

export const addPrintFunctionalityToBlock = (blockName, blockComponent) => {
  // This function would be used to programmatically add print functionality
  // to any block component. For now, we'll update each block manually.
  
  const printFunction = `
  // Print block functionality
  const handlePrintBlock = async () => {
    if (Object.keys(recipesBySubCategory).length === 0) {
      alert('No recipes to print. Please add some recipes first.');
      return;
    }

    setIsPrinting(true);
    
    try {
      // Prepare block data with updated order quantities
      const blockDataWithQuantities = {};
      
      Object.entries(recipesBySubCategory).forEach(([subCategory, recipes]) => {
        blockDataWithQuantities[subCategory] = recipes.map(recipe => ({
          ...recipe,
          orderQty: orderQuantities[recipe.id] || 1
        }));
      });

      await printRecipeBlock('${blockName.toUpperCase()}', blockDataWithQuantities, () => {
        setIsPrinting(false);
        console.log('✅ ${blockName} block printed successfully');
      });
    } catch (error) {
      console.error('Error printing block:', error);
      setIsPrinting(false);
      alert('Error printing block: ' + error.message);
    }
  };
  `;

  return printFunction;
};

// List of all blocks that need print functionality
export const BLOCKS_TO_UPDATE = [
  'QameerBlock',
  'MawaBlock', 
  'OsamaniaBlock',
  'ShowroomBlock',
  'DynamicBlock'
];

// Print button JSX template
export const PRINT_BUTTON_JSX = (blockName) => `
          <button
            onClick={handlePrintBlock}
            disabled={isPrinting || Object.keys(recipesBySubCategory).length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: isPrinting ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isPrinting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Print this block for chef"
          >
            <i className={\`fas \${isPrinting ? 'fa-spinner fa-spin' : 'fa-print'}\`}></i>
            {isPrinting ? 'Printing...' : 'Print Block'}
          </button>
`;

// Header template with print button
export const HEADER_WITH_PRINT_BUTTON = (blockName) => `
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>${blockName}</h2>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          ${PRINT_BUTTON_JSX(blockName)}
          
          <button
            onClick={refreshRecipes}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Refresh data from MongoDB"
          >
            <i className="fas fa-sync-alt"></i>
            Refresh Data
          </button>
        </div>
      </div>
`;
