# New Recipe Flow System

## Overview
The New Recipe Flow system allows users to create and manage recipes in the Sunny Backreys application. It provides a step-by-step wizard interface for creating both single-item recipes (like BAKE CAKE) and multiple-item recipes (like TIE ITEMS).

## Features

### 🎯 **Recipe Types**
- **Single Item Recipe**: One recipe with multiple ingredients (e.g., BAKE CAKE)
- **Multiple Items Recipe**: Multiple recipes in one category (e.g., TIE ITEMS)

### 📁 **Category Management**
- **Add to Existing Category**: Add recipes to existing categories like CROSS UPDATE, MAWA, OSAMANIA
- **Create New Category**: Create completely new categories with custom names

### 🔧 **Recipe Management**
- **Fully Editable**: All recipe fields are editable
- **Inventory Integration**: Select ingredients directly from available inventory
- **Unit Support**: Specify units for each ingredient
- **Quantity Management**: Set precise quantities for each ingredient

## How to Use

### 1. **Access the New Recipe Flow**
- Click the **"NEW RECIPE"** button (yellow button) in the Orders page
- Ensure you are logged in (authentication required)

### 2. **Choose Your Path**
- **Add Recipe to Existing Category**: Add to existing categories
- **Create New Category**: Create a brand new category

### 3. **Select Recipe Type**
- **Single Item Recipe**: Like BAKE CAKE with multiple ingredients
- **Multiple Items Recipe**: Like TIE ITEMS with multiple products

### 4. **Fill Recipe Details**
- **Recipe Name**: Enter the name of your recipe
- **Category Name**: (if creating new category)
- **Unit**: Specify the unit (e.g., "box 15Kg.")
- **Base Quantity**: Set the base quantity for calculations

### 5. **Add Ingredients**
- **Item Name**: Select from inventory or type custom names
- **Unit**: Specify unit for each ingredient
- **Quantity**: Set the quantity needed per recipe
- **Add/Remove**: Add or remove ingredients as needed

### 6. **Save Recipe**
- Click **"Create Recipe"** to save
- Recipe will be automatically added to the selected category

## Recipe Structure

### Single Item Recipe (BAKE CAKE style)
```javascript
{
  id: 1234567890,
  name: "BAKE CAKE",
  type: "single",
  unit: "box 15Kg.",
  value: 1.000,
  ingredients: [
    { name: "KK MAIDA", unit: "kg", quantity: 1.500 },
    { name: "G.SUGAR", unit: "kg", quantity: 1.000 },
    { name: "M.SUGAR", unit: "kg", quantity: 0.400 }
  ]
}
```

### Multiple Items Recipe (TIE ITEMS style)
```javascript
{
  id: 1234567890,
  name: "PLAIN TIE",
  type: "multiple",
  ingredients: [
    { name: "65 MAIDA", unit: "kg", quantity: 0.650 },
    { name: "KK MAIDA", unit: "kg", quantity: 0.650 },
    { name: "M.SUGAR", unit: "kg", quantity: 0.250 }
  ]
}
```

## Integration Points

### Existing Categories
- **CROSS UPDATE**: Automatically adds to tieItems section
- **OSAMANIA**: Adds to osamania data structure
- **MAWA**: Integrates with mawa data
- **QAMEER**: Integrates with qameer data

### Data Persistence
- All recipes are saved to localStorage
- Recipes persist between browser sessions
- Custom categories are automatically added as new tabs

## Technical Details

### Component Structure
- **NewRecipeFlow.js**: Main wizard component
- **NewRecipeFlow.css**: Styling and animations
- **Orders.js**: Integration and state management

### State Management
- Uses React hooks for state management
- Local storage for persistence
- Real-time validation and form handling

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls

## Example Workflows

### Creating a BAKE CAKE Recipe
1. Click "NEW RECIPE"
2. Choose "Add Recipe to Existing Category"
3. Select "OSAMANIA" as category
4. Choose "Single Item Recipe"
5. Enter recipe name: "BAKE CAKE"
6. Set unit: "box 15Kg."
7. Set base quantity: 1.000
8. Add ingredients:
   - KK MAIDA: 1.500 kg
   - G.SUGAR: 1.000 kg
   - M.SUGAR: 0.400 kg
   - MILK MAID: 0.300 L
   - VANILLA: 0.010 L
9. Click "Create Recipe"

### Creating a New Category
1. Click "NEW RECIPE"
2. Choose "Create New Category"
3. Select "Multiple Items Recipe"
4. Enter category name: "SPECIAL BISCUITS"
5. Add recipes:
   - Recipe 1: "CHOCO SPECIAL"
   - Recipe 2: "VANILLA SPECIAL"
6. Click "Create Category"

## Benefits

### For Users
- **Easy Recipe Creation**: Step-by-step wizard interface
- **Flexible Categories**: Create new categories or add to existing ones
- **Inventory Integration**: Direct access to available ingredients
- **Data Persistence**: Recipes saved automatically

### For Developers
- **Modular Design**: Clean, maintainable code structure
- **Scalable Architecture**: Easy to add new features
- **Reusable Components**: Components can be used elsewhere
- **Type Safety**: Clear data structures and validation

## Future Enhancements

### Planned Features
- **Recipe Templates**: Pre-built recipe templates
- **Bulk Import**: Import recipes from Excel/CSV
- **Recipe Sharing**: Share recipes between users
- **Version Control**: Track recipe changes over time
- **Advanced Calculations**: More sophisticated quantity calculations

### Integration Opportunities
- **API Integration**: Connect to external recipe databases
- **Print Support**: Generate recipe cards and labels
- **Mobile App**: Native mobile application
- **Cloud Sync**: Sync recipes across devices

## Support

For questions or issues with the New Recipe Flow system:
1. Check this documentation
2. Review the component code
3. Test with different recipe types
4. Verify authentication status

---

**Note**: This system is designed to be non-intrusive and won't affect existing functionality. All existing recipes and categories remain unchanged.
