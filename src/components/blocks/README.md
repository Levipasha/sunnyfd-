# Block Components Structure

This directory contains individual React components for each recipe block in the application. The components have been extracted from the main `Orders.js` file to improve code organization and maintainability.

## Components

### 1. CrossUpdateBlock
- **Purpose**: Handles the "CROSS UPDATE" recipe block
- **Features**: Custom subcategories, recipe creation, ingredient management
- **Props**: Standard block props + authentication state

### 2. QameerBlock
- **Purpose**: Handles the "QAMEER" recipe block
- **Features**: Custom subcategories, recipe creation, ingredient management
- **Props**: Standard block props + authentication state

### 3. MawaBlock
- **Purpose**: Handles the "MAWA" recipe block
- **Features**: Custom subcategories, recipe creation, ingredient management, FATLESS section
- **Props**: Standard block props + mawaData, setMawaData, handleMawaChange

### 4. OsamaniaBlock
- **Purpose**: Handles the "OSAMANIA" recipe block
- **Features**: Custom subcategories, recipe creation, ingredient management
- **Props**: Standard block props + authentication state

### 5. SaltItemsBlock
- **Purpose**: Handles the "SALT + ITEMS" recipe block
- **Features**: Custom subcategories, recipe creation, ingredient management
- **Props**: Standard block props + authentication state

### 6. ShowroomBlock
- **Purpose**: Handles the "SHOWROOM" recipe block
- **Features**: Custom subcategories, recipe creation, ingredient management
- **Props**: Standard block props + authentication state

## BlockSelector Component

The `BlockSelector` component (located in `../BlockSelector.js`) acts as a router that renders the appropriate block component based on the `activeTab` state.

## Usage

### In Orders.js
Replace the large conditional rendering sections with:

```jsx
import BlockSelector from './BlockSelector';

// In the render method, replace all the conditional blocks with:
<BlockSelector
  activeTab={activeTab}
  isAuthenticated={isAuthenticated}
  customSubcategories={customSubcategories}
  customRecipeBlocks={customRecipeBlocks}
  inventory={inventory}
  addRecipeForm={addRecipeForm}
  setAddRecipeForm={setAddRecipeForm}
  newSubcategoryName={newSubcategoryName}
  setNewSubcategoryName={setNewSubcategoryName}
  showCategoryAddRecipeForm={showCategoryAddRecipeForm}
  setShowCategoryAddRecipeForm={setShowCategoryAddRecipeForm}
  handleCreateRecipeBlock={handleCreateRecipeBlock}
  handleAddItemToBlock={handleAddItemToBlock}
  handleDeleteRecipeBlock={handleDeleteRecipeBlock}
  handleUpdateItemInBlock={handleUpdateItemInBlock}
  handleUpdateItemIngredient={handleUpdateItemIngredient}
  handleDeleteItemFromBlock={handleDeleteItemFromBlock}
  showRecipeDetails={showRecipeDetails}
  clearManualOverrides={clearManualOverrides}
  calculateUniversalMultiplier={calculateUniversalMultiplier}
  mawaData={mawaData}
  setMawaData={setMawaData}
  handleMawaChange={handleMawaChange}
/>
```

## Benefits

1. **Modularity**: Each block is now a separate, focused component
2. **Maintainability**: Easier to find and modify specific block functionality
3. **Reusability**: Components can be reused or extended independently
4. **Performance**: Smaller components can be optimized individually
5. **Testing**: Each block can be tested in isolation
6. **Code Organization**: Clear separation of concerns

## File Structure

```
src/components/
├── blocks/
│   ├── index.js              # Exports all block components
│   ├── CrossUpdateBlock.js   # Cross Update block component
│   ├── QameerBlock.js        # Qameer block component
│   ├── MawaBlock.js          # Mawa block component
│   ├── OsamaniaBlock.js      # Osamania block component
│   ├── SaltItemsBlock.js     # Salt Items block component
│   ├── ShowroomBlock.js      # Showroom block component
│   └── README.md             # This documentation
├── BlockSelector.js          # Router component for blocks
└── Orders.js                 # Main component (simplified)
```

## Adding New Blocks

To add a new block:

1. Create a new component file in the `blocks/` directory
2. Follow the naming convention: `{BlockName}Block.js`
3. Export the component from `index.js`
4. Add the case to `BlockSelector.js`
5. Update this README

## Standard Props

All block components expect these standard props:

- `isAuthenticated`: Boolean for user authentication state
- `customSubcategories`: Array of custom subcategories
- `customRecipeBlocks`: Array of custom recipe blocks
- `inventory`: Array of inventory items
- `addRecipeForm`: Form state for adding recipes
- `setAddRecipeForm`: Function to update recipe form
- `newSubcategoryName`: New subcategory name state
- `setNewSubcategoryName`: Function to update subcategory name
- `showCategoryAddRecipeForm`: State for showing add recipe forms
- `setShowCategoryAddRecipeForm`: Function to update form visibility
- `handleCreateRecipeBlock`: Function to create recipe blocks
- `handleAddItemToBlock`: Function to add items to blocks
- `handleDeleteRecipeBlock`: Function to delete recipe blocks
- `handleUpdateItemInBlock`: Function to update items in blocks
- `handleUpdateItemIngredient`: Function to update ingredients
- `handleDeleteItemFromBlock`: Function to delete items from blocks
- `showRecipeDetails`: Function to show recipe details
- `clearManualOverrides`: Function to clear manual overrides
- `calculateUniversalMultiplier`: Function to calculate multipliers
- `activeTab`: Current active tab identifier
