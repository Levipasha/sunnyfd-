# Recipe Editing Guide

## Overview
The recipe editing system allows you to modify existing recipes and automatically recalculates ingredient quantities based on your changes.

## How to Edit a Recipe

### 1. Access Recipe Editing
- Navigate to any recipe section (Cross Update, Qameer, Mawa, Salt Items, etc.)
- Click on any recipe item to open the editing modal
- The modal will show the current recipe values pre-filled

### 2. Edit Recipe Values
You can edit the following fields:
- **Recipe Name**: Change the name of the recipe
- **Manda 1**: Primary quantity value (e.g., number of orders)
- **Manda 2**: Secondary quantity value (e.g., quantity per order)
- **Total Quantity**: Automatically calculated as Manda 1 × Manda 2
- **Order**: For order-based recipes
- **Quantity**: For quantity-based recipes
- **Individual Ingredients**: All ingredient quantities are editable

### 3. Auto-Calculation Features

#### Manda-Based Recipes (Cross Update)
When you change Manda 1 or Manda 2:
- Total Quantity is automatically calculated
- All ingredient quantities are recalculated proportionally
- Different calculation formulas apply based on recipe type:
  - **Tie Items**: Uses specific ratios for each ingredient
  - **Fine Items**: Uses different ratios optimized for fine items
  - **Puff Items**: Uses ratios specific to puff recipes

#### Order-Based Recipes (Qameer, Mawa)
When you change the Order value:
- Ingredient quantities are recalculated based on order size
- Maintains the same proportions as the base recipe

### 4. Available Actions

#### Reset to Original
- Click "Reset to Original" to restore the original recipe values
- Useful if you want to start over with editing

#### Recalculate
- Click "Recalculate" to force recalculation of all ingredients
- Ensures all values are consistent with current base values

#### Save Changes
- Click "Save Changes" to apply your modifications
- Only enabled when changes have been detected
- Shows a summary of what was changed

### 5. Visual Indicators

#### Change Detection
- A warning message appears when changes are detected
- Save button is disabled when no changes are made
- Save button text shows "(No Changes)" when appropriate

#### Formula Validation
- For manda-based recipes, shows the calculation formula
- Displays current vs. calculated values
- Highlights any mismatches between formula and actual values

## Recipe Types and Calculations

### Cross Update Recipes
- **Tie Items**: Manda-based with specific ingredient ratios
- **Fine Items**: Manda-based with different ingredient ratios
- **Puff Items**: Manda-based with puff-specific ratios
- **Roll Items**: Manda-based with roll-specific ratios

### Qameer Recipes
- **Buns**: Order-based with yeast and flour calculations
- **Toast**: Order-based with bread-specific ratios
- **Bread**: Order-based with traditional bread ratios

### Mawa Recipes
- **Fatless**: Order-based with cake ratios
- **Ghee Mawa**: Order-based with ghee-specific ratios
- **Pillsbury**: Order-based with Pillsbury-specific ratios

### Salt Items
- **Quantity-based**: All ingredients scale proportionally with quantity
- **Fixed ratios**: Maintains consistent ingredient proportions

## Tips for Effective Editing

1. **Start with Base Values**: Change Manda 1/2 or Order first, then review calculated ingredients
2. **Use Auto-Calculation**: Let the system calculate ingredient quantities automatically
3. **Verify Totals**: Check that Total Quantity matches your expected calculations
4. **Save Regularly**: Save changes frequently to avoid losing work
5. **Reset if Needed**: Use Reset to Original if you need to start over

## Troubleshooting

### Recipe Not Saving
- Ensure you're authenticated (logged in)
- Check that changes have been made
- Verify the recipe category is supported

### Calculations Not Updating
- Try clicking "Recalculate" button
- Check that Manda 1 and Manda 2 are both set
- Verify the recipe type supports auto-calculation

### Modal Not Opening
- Check browser console for errors
- Ensure you're clicking on a valid recipe item
- Verify the recipe has the required data structure

## Technical Details

### State Management
- `editingRecipe`: Holds the current editing state
- `selectedRecipe`: References the original recipe being edited
- `isRecipeModified()`: Function to detect changes

### Auto-Calculation Logic
- Triggered on field changes
- Uses predefined ratios for each recipe type
- Maintains ingredient proportions
- Updates dependent fields automatically

### Save Process
- Updates the appropriate data structure
- Maintains data consistency
- Provides detailed change summary
- Handles errors gracefully
