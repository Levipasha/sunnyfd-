# Recipe Block Multiplier Functionality

## Overview
The recipe block system now includes an automatic multiplier functionality that allows users to scale ingredient quantities based on Manda values. This feature automatically calculates ingredient quantities when users enter values in the Manda fields.

## How It Works

### 1. Creating a Recipe Block
- When you create a new recipe block, you define base ingredient quantities
- These base quantities serve as the foundation for all calculations

### 2. Using the Multiplier
- **Manda 1**: First multiplier value (e.g., number of orders)
- **Manda 2**: Second multiplier value (e.g., quantity per order)
- **Total Quantity**: Automatically calculated as Manda 1 × Manda 2
- **Ingredient Quantities**: Automatically calculated as Base Value × (Manda 1 × Manda 2)

### 3. Visual Indicators
- **Green Highlighted Fields**: Indicate calculated values
- **White Fields**: Indicate manual entries
- **Tooltips**: Show calculation details when hovering over fields

## Example Usage

### Scenario: Making 3 batches of cookies
1. **Base Recipe**: 1 kg flour, 0.5 kg sugar, 0.1 kg salt
2. **Manda 1**: 3 (number of batches)
3. **Manda 2**: 1 (quantity per batch)
4. **Total Quantity**: 3 × 1 = 3
5. **Calculated Ingredients**:
   - Flour: 1 kg × 3 = 3 kg
   - Sugar: 0.5 kg × 3 = 1.5 kg
   - Salt: 0.1 kg × 3 = 0.3 kg

## Available Actions

### Recalculate Button
- Manually triggers recalculation of all ingredients
- Useful when you want to ensure all values are up to date
- Updates all items in the recipe block

### Reset Base Button
- Resets base ingredient values to current values
- Useful when you want to change the base recipe
- Automatically recalculates all items with new base values

### Manual Override
- You can still manually edit ingredient quantities
- Manual entries are not automatically recalculated
- Use "Recalculate" to restore automatic calculations

## Tips for Best Results

1. **Set Base Values First**: Define your base recipe quantities before using multipliers
2. **Use Recalculate**: Click "Recalculate" if you notice any inconsistencies
3. **Check Visual Indicators**: Green fields show calculated values, white fields show manual entries
4. **Hover for Details**: Hover over fields to see calculation details
5. **Reset When Needed**: Use "Reset Base" if you want to change the base recipe

## Technical Details

### Calculation Formula
```
Total Quantity = Manda 1 × Manda 2
Ingredient Quantity = Base Ingredient Value × Total Quantity
```

### Data Storage
- Base ingredient values are stored in the recipe block
- Individual item values are calculated on-the-fly
- All calculations are performed client-side for immediate feedback

### Compatibility
- Works with all existing recipe blocks
- Backward compatible with manual entry mode
- No data migration required

## Troubleshooting

### Values Not Updating
- Check that both Manda 1 and Manda 2 have values
- Click "Recalculate" to force update
- Ensure you're editing the correct fields

### Incorrect Calculations
- Verify base ingredient values are correct
- Use "Reset Base" to update base values
- Check for manual overrides in ingredient fields

### Visual Issues
- Refresh the page if styling doesn't appear
- Check browser console for any JavaScript errors
- Ensure CSS is properly loaded
