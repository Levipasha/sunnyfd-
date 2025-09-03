# Block-Wise Printing System

## Overview

The block-wise printing system allows you to print individual recipe blocks with updated values for chef use. Each block prints on a single page with all recipe data, ingredient calculations, and totals.

## Features

### ✅ **Implemented Features**

1. **Individual Block Printing**: Each recipe block can be printed separately
2. **Updated Recipe Values**: Print shows current order quantities and calculated ingredient amounts
3. **Chef-Friendly Format**: Clean, professional layout optimized for kitchen use
4. **One Page Per Block**: Each block fits on a single page for easy handling
5. **Real-time Data**: Uses current order quantities and ingredient calculations

### 🎯 **How It Works**

1. **Add Recipes**: Create recipes in any block (Salt Items, Cross Update, Qameer, etc.)
2. **Set Order Quantities**: Enter order quantities for each recipe
3. **Click Print Block**: Use the green "Print Block" button in each block header
4. **Get Chef-Ready Printout**: Receive a formatted printout with all recipe data

## Available Blocks with Print Functionality

### ✅ **Completed Blocks**
- **Salt Items Block** - Print button added
- **Cross Update Block** - Print button added  
- **Qameer Block** - Print button added

### 🔄 **Remaining Blocks** (Need Print Functionality)
- **Mawa Block** - Needs print button
- **Osamania Block** - Needs print button
- **Showroom Block** - Needs print button
- **Dynamic Block** - Needs print button

## Print Output Format

### **Header Section**
- Block name (e.g., "SALT + ITEMS")
- Production date and time
- "Generated for Chef - Factory Use" label

### **Recipe Tables**
- **Item Name**: Recipe description
- **Order Qty**: Current order quantity
- **Per**: Base quantity (usually 1)
- **Total Qty**: Calculated total (Order Qty × Per)
- **Ingredient Columns**: All ingredients with calculated amounts
- **Actions**: Edit/Delete buttons (hidden in print)

### **Totals Row**
- **Order Total**: Sum of all order quantities
- **Total Qty Total**: Sum of all total quantities
- **Ingredient Totals**: Sum of each ingredient across all recipes

## Technical Implementation

### **Files Created/Modified**

1. **`src/utils/blockPrintUtils.js`** - New print utility functions
2. **`src/components/blocks/SaltItemsBlock.js`** - Added print functionality
3. **`src/components/blocks/CrossUpdateBlock.js`** - Added print functionality
4. **`src/components/blocks/QameerBlock.js`** - Added print functionality

### **Key Functions**

#### `printRecipeBlock(blockName, blockData, onPrintComplete)`
- Main function to print a recipe block
- Takes block name, recipe data, and completion callback
- Creates print-friendly HTML with proper styling

#### `handlePrintBlock()`
- Block-specific print handler
- Prepares data with current order quantities
- Calls the print utility function

### **Print Button Features**
- **Green Color**: Indicates print action
- **Disabled State**: When no recipes or currently printing
- **Loading State**: Shows spinner while printing
- **Tooltip**: "Print this block for chef"

## Usage Instructions

### **For Users**
1. Navigate to any recipe block (Salt Items, Cross Update, Qameer)
2. Add recipes and set order quantities
3. Click the green "Print Block" button in the block header
4. Print dialog will open with formatted content
5. Print or save as PDF for chef use

### **For Developers**
To add print functionality to remaining blocks:

1. **Import the utility**:
   ```javascript
   import { printRecipeBlock } from '../../utils/blockPrintUtils';
   ```

2. **Add state variables**:
   ```javascript
   const [isPrinting, setIsPrinting] = useState(false);
   const blockRef = useRef(null);
   ```

3. **Add print function**:
   ```javascript
   const handlePrintBlock = async () => {
     // Implementation (see updateRemainingBlocks.js for template)
   };
   ```

4. **Update UI header**:
   ```javascript
   // Replace existing header with print button layout
   ```

## Print Styling

### **CSS Features**
- **Print-optimized**: Uses `@media print` rules
- **Page breaks**: Prevents content from splitting across pages
- **Professional layout**: Clean tables with proper spacing
- **Color coding**: Different colors for different data types
- **Responsive**: Adapts to different paper sizes

### **Print Layout**
- **A4 Size**: Optimized for standard paper
- **Margins**: 0.5 inch margins for professional appearance
- **Font**: Arial, 12px for readability
- **Tables**: Full-width with proper borders and spacing

## Benefits

### **For Chefs**
- **Clear Instructions**: Easy-to-read recipe data
- **Accurate Quantities**: Real-time calculations
- **Professional Format**: Clean, organized layout
- **One Page Per Block**: Easy to handle and reference

### **For Management**
- **Consistent Format**: Standardized printouts across all blocks
- **Real-time Data**: Always shows current order quantities
- **Efficient Workflow**: Quick printing without complex setup
- **Professional Appearance**: High-quality printouts for kitchen use

## Future Enhancements

### **Planned Features**
1. **Batch Printing**: Print multiple blocks at once
2. **Custom Templates**: Different print formats for different needs
3. **Print History**: Track what was printed and when
4. **Email Integration**: Send printouts directly to chef email
5. **QR Codes**: Add QR codes for digital recipe access

### **Technical Improvements**
1. **Print Preview**: Show preview before printing
2. **Print Settings**: Customize margins, font size, etc.
3. **Export Options**: PDF, Word, Excel export
4. **Print Queue**: Queue multiple print jobs
5. **Print Logging**: Track print activity for audit

## Troubleshooting

### **Common Issues**

1. **Print Button Disabled**
   - **Cause**: No recipes in block
   - **Solution**: Add at least one recipe to the block

2. **Print Dialog Not Opening**
   - **Cause**: Popup blocker or browser settings
   - **Solution**: Allow popups for the application

3. **Print Layout Issues**
   - **Cause**: Browser print settings
   - **Solution**: Use "More settings" → "Options" → "Background graphics"

4. **Missing Data in Print**
   - **Cause**: Order quantities not set
   - **Solution**: Set order quantities for recipes before printing

### **Browser Compatibility**
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Support

For issues or questions about the block-wise printing system:
1. Check the browser console for error messages
2. Verify that recipes have order quantities set
3. Ensure popup blockers are disabled
4. Try refreshing the page and printing again

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Active Development
