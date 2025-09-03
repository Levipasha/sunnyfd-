import React, { useMemo, useState, useEffect } from 'react';
import { inventoryOrder } from '../data';
import { 
  updateInventoryItem, 
  addInventoryItem, 
  deleteInventoryItem,
  prepareForNextDay
} from '../services/inventoryService';
import { initializeDailyRollover, getCurrentCycleDate } from '../utils/inventoryConsumption';
import InventoryRecordService from '../services/inventoryRecordService';
import './Inventory.css';
import './InventoryMobile.css';

const Inventory = ({ inventory, setInventory, isAuthenticated }) => {

  const [newItem, setNewItem] = useState({ 
    name: '', 
    openingStock: 0, 
    unit: 'kg', // Legacy field
    primaryUnit: 'kg',
    customPrimaryUnit: '',
    secondaryUnit: '',
    quantityPerSecondaryUnit: 0,
    minimumQuantity: 0 
  });
  const [editingConsumed, setEditingConsumed] = useState({});
  
  // Edit panel state
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [tempUnits, setTempUnits] = useState({
    primaryUnit: 'kg',
    customPrimaryUnit: '',
    secondaryUnit: '',
    quantityPerSecondaryUnit: 0
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Save records state
  const [savingToRecords, setSavingToRecords] = useState(false);



  // Helper function to get display unit for an item
  const getDisplayUnit = (item) => {
    if (item.primaryUnit === 'custom' && item.customPrimaryUnit) {
      return item.customPrimaryUnit;
    }
    return item.primaryUnit || item.unit || 'kg';
  };



  const handleValueChange = async (id, field, value) => {
    try {
      // First update local state for immediate UI feedback
      const newInventory = inventory.map(item => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value };
          
          // Handle MongoDB schema with split units
          if (newItem.hasOwnProperty('openingStockPrimary') && newItem.hasOwnProperty('receivedPrimary')) {
            const quantityPerSecondary = parseFloat(newItem.quantityPerSecondaryUnit) || 0;
            
            // Update the specific field that was changed
            if (field === 'openingStock') {
              newItem.openingStockPrimary = value;
              newItem.openingStockSecondary = 0;
            } else if (field === 'received') {
              newItem.receivedPrimary = value;
              newItem.receivedSecondary = 0;
            } else if (field === 'consumed') {
              newItem.consumedPrimary = value;
              newItem.consumedSecondary = 0;
            } else if (field === 'received2') {
              newItem.received2Primary = value;
              newItem.received2Secondary = 0;
            } else if (field === 'consumed2') {
              newItem.consumed2Primary = value;
              newItem.consumed2Secondary = 0;
            }
            
            // Calculate totals from split units
            const openingStock = (parseFloat(newItem.openingStockPrimary) || 0) + 
                               ((parseFloat(newItem.openingStockSecondary) || 0) * quantityPerSecondary);
            const received = (parseFloat(newItem.receivedPrimary) || 0) + 
                           ((parseFloat(newItem.receivedSecondary) || 0) * quantityPerSecondary);
            const consumed = (parseFloat(newItem.consumedPrimary) || 0) + 
                           ((parseFloat(newItem.consumedSecondary) || 0) * quantityPerSecondary);
            const received2 = (parseFloat(newItem.received2Primary) || 0) + 
                            ((parseFloat(newItem.received2Secondary) || 0) * quantityPerSecondary);
            const consumed2 = (parseFloat(newItem.consumed2Primary) || 0) + 
                            ((parseFloat(newItem.consumed2Secondary) || 0) * quantityPerSecondary);
            
            // Update legacy fields
            newItem.openingStock = openingStock;
            newItem.received = received;
            newItem.consumed = consumed;
            newItem.received2 = received2;
            newItem.consumed2 = consumed2;
            
            // Calculate derived fields
            newItem.total = openingStock + received;
            newItem.balance = newItem.total - consumed;
            newItem.total2 = newItem.balance + received2;
            newItem.finalStock = newItem.total2 - consumed2;
            newItem.currentStock = newItem.finalStock;
            
            // Calculate split balance and final stock fields
            newItem.balancePrimary = Math.max(0, (parseFloat(newItem.openingStockPrimary) || 0) + (parseFloat(newItem.receivedPrimary) || 0) - (parseFloat(newItem.consumedPrimary) || 0));
            newItem.balanceSecondary = Math.max(0, (parseFloat(newItem.openingStockSecondary) || 0) + (parseFloat(newItem.receivedSecondary) || 0) - (parseFloat(newItem.consumedSecondary) || 0));
            newItem.finalStockPrimary = Math.max(0, newItem.balancePrimary + (parseFloat(newItem.received2Primary) || 0) - (parseFloat(newItem.consumed2Primary) || 0));
            newItem.finalStockSecondary = Math.max(0, newItem.balanceSecondary + (parseFloat(newItem.received2Secondary) || 0) - (parseFloat(newItem.consumed2Secondary) || 0));
          } else {
            // Legacy schema - simple calculations
            const received = parseFloat(newItem.received) || 0;
            const consumed = parseFloat(newItem.consumed) || 0;
            const received2 = parseFloat(newItem.received2) || 0;
            const consumed2 = parseFloat(newItem.consumed2) || 0;

            newItem.total = (newItem.openingStock || 0) + received;
            newItem.balance = newItem.total - consumed;
            newItem.total2 = newItem.balance + received2;
            newItem.finalStock = newItem.total2 - consumed2;
            newItem.currentStock = newItem.finalStock;
          }
          
          return newItem;
        }
        return item;
      });
      setInventory(newInventory);
      
      // Update backend for all field changes
      const itemToUpdate = newInventory.find(item => item.id === id);
      if (itemToUpdate) {
        await updateInventoryItem(id, itemToUpdate);
      }
    } catch (error) {
      console.error(`Failed to update item with ID ${id}:`, error);
      // Could add error handling/notification here
    }
  };

  // Function to recalculate all inventory items (useful after Prepare Next Day)
  const recalculateAllItems = () => {
    console.log('🔄 Recalculating all inventory items...');
    
    const recalculatedInventory = inventory.map(item => {
      const newItem = { ...item };
      
      // Ensure all numeric fields are properly parsed
      newItem.openingStock = parseFloat(newItem.openingStock) || 0;
      newItem.received = parseFloat(newItem.received) || 0;
      newItem.consumed = parseFloat(newItem.consumed) || 0;
      newItem.received2 = parseFloat(newItem.received2) || 0;
      newItem.consumed2 = parseFloat(newItem.consumed2) || 0;
      
      // Recalculate all derived fields
      newItem.total = newItem.openingStock + newItem.received;
      newItem.balance = newItem.total - newItem.consumed;
      newItem.total2 = newItem.balance + newItem.received2;
      newItem.finalStock = newItem.total2 - newItem.consumed2;
      newItem.currentStock = newItem.finalStock;
      
      console.log(`🔄 Recalculated ${newItem.name}:`, {
        openingStock: newItem.openingStock,
        received: newItem.received,
        consumed: newItem.consumed,
        total: newItem.total,
        balance: newItem.balance,
        total2: newItem.total2,
        finalStock: newItem.finalStock
      });
      
      return newItem;
    });
    
    setInventory(recalculatedInventory);
    console.log('✅ All inventory items recalculated');
  };

  // Initialize daily rollover system with automatic record saving
  useEffect(() => {
    // Only initialize rollover once when component mounts, not every time inventory changes
    const cleanup = initializeDailyRollover(inventory, setInventory);
    
    // Set up automatic record saving at 6 AM
    const checkAndSaveRecords = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if it's exactly 6 AM (cycle change time)
      if (currentHour === 6 && currentMinute === 0) {
        console.log('🕕 6 AM detected - Automatically saving inventory to records...');
        
        try {
          // Get yesterday's date (end of previous cycle) - ensure proper date handling
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          // Create a new date object with local timezone to avoid timezone issues
          const yesterdayLocal = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 12, 0, 0, 0);
          console.log(`🔍 Auto-saving inventory records for yesterday: ${yesterdayLocal.toISOString()}`);
          console.log(`🔍 Local date: ${yesterdayLocal.toLocaleDateString()}`);
          
          // Create records for each inventory item
          const recordsToCreate = inventory.map(item => ({
            date: yesterdayLocal,
            itemName: item.name,
            openingStock: parseFloat(item.openingStock) || 0,
            received: parseFloat(item.received) || 0,
            consumed: parseFloat(item.consumed) || 0,
            total: parseFloat(item.total) || 0,
            received2: parseFloat(item.received2) || 0,
            consumed2: parseFloat(item.consumed2) || 0,
            total2: parseFloat(item.total2) || 0,
            unit: item.unit || 'kg',
            // New unit system fields
            primaryUnit: item.primaryUnit || 'kg',
            customPrimaryUnit: item.customPrimaryUnit || '',
            secondaryUnit: item.secondaryUnit || '',
            quantityPerSecondaryUnit: item.quantityPerSecondaryUnit || 0,
            // Split fields for all quantities
            openingStockPrimary: parseFloat(item.openingStockPrimary) || 0,
            openingStockSecondary: parseFloat(item.openingStockSecondary) || 0,
            receivedPrimary: parseFloat(item.receivedPrimary) || 0,
            receivedSecondary: parseFloat(item.receivedSecondary) || 0,
            consumedPrimary: parseFloat(item.consumedPrimary) || 0,
            consumedSecondary: parseFloat(item.consumedSecondary) || 0,
            received2Primary: parseFloat(item.received2Primary) || 0,
            received2Secondary: parseFloat(item.received2Secondary) || 0,
            consumed2Primary: parseFloat(item.consumed2Primary) || 0,
            consumed2Secondary: parseFloat(item.consumed2Secondary) || 0,
            balancePrimary: parseFloat(item.balancePrimary) || 0,
            balanceSecondary: parseFloat(item.balanceSecondary) || 0,
            finalStockPrimary: parseFloat(item.finalStockPrimary) || 0,
            finalStockSecondary: parseFloat(item.finalStockSecondary) || 0
          }));
          
          // Check if records already exist for yesterday
          const existingRecords = await InventoryRecordService.getRecords({
            startDate: yesterdayLocal.toISOString(),
            endDate: yesterdayLocal.toISOString()
          });
          
          if (existingRecords.data && existingRecords.data.length > 0) {
            console.log('📊 Records for yesterday already exist, skipping automatic save');
            return;
          }
          
          // Save each record
          let savedCount = 0;
          for (const record of recordsToCreate) {
            try {
              await InventoryRecordService.createRecord(record);
              savedCount++;
            } catch (error) {
              console.error(`❌ Failed to auto-save record for ${record.itemName}:`, error);
            }
          }
          
          console.log(`✅ Automatically saved ${savedCount} inventory items to records for ${yesterdayLocal.toLocaleDateString()}`);
          
        } catch (error) {
          console.error('❌ Error during automatic record saving:', error);
        }
      }
    };
    
    // Check every minute for 6 AM
    const recordInterval = setInterval(checkAndSaveRecords, 60000);
    
    return () => {
      cleanup();
      clearInterval(recordInterval);
    };
  }, []); // Remove inventory and setInventory dependencies to prevent reinitialization

  // Reset all inventory values to zero
  const resetAllInventoryToZero = async () => {
    if (!window.confirm('⚠️ Are you sure you want to reset ALL inventory values to zero?\n\nThis will clear:\n• Opening Stock (all values)\n• Received (all cycles)\n• Consumed (all cycles)\n• Minimum Quantity\n• All split unit values\n\nThis action cannot be undone!')) {
      return;
    }
    
    try {
      const updatedInventory = inventory.map(item => ({
        ...item,
        // Reset all quantity fields to zero
        openingStock: 0,
        openingStockPrimary: 0,
        openingStockSecondary: 0,
        received: 0,
        receivedPrimary: 0,
        receivedSecondary: 0,
        consumed: 0,
        consumedPrimary: 0,
        consumedSecondary: 0,
        received2: 0,
        received2Primary: 0,
        received2Secondary: 0,
        consumed2: 0,
        consumed2Primary: 0,
        consumed2Secondary: 0,
        minimumQuantity: 0,
        // Reset calculated fields
        total: 0,
        balance: 0,
        total2: 0,
        finalStock: 0,
        balancePrimary: 0,
        balanceSecondary: 0,
        finalStockPrimary: 0,
        finalStockSecondary: 0,
        currentStock: 0
      }));
      
      // Update local state immediately
      setInventory(updatedInventory);
      
      // Update backend for each item
      const updatePromises = updatedInventory.map(async (item) => {
        try {
          await updateInventoryItem(item.id, item);
          console.log(`✅ Reset item ${item.name} to zero`);
        } catch (error) {
          console.error(`❌ Failed to reset item ${item.name}:`, error);
        }
      });
      
      await Promise.all(updatePromises);
      
      alert(`✅ Successfully reset all ${inventory.length} inventory items to zero!\n\nAll values have been cleared and saved to the database.`);
      
    } catch (error) {
      console.error('❌ Failed to reset inventory:', error);
      alert('❌ Error resetting inventory: ' + error.message);
    }
  };

  // Debug calculations function
  const debugCalculations = () => {
    const testItem = inventory.find(item => 
      item.secondaryUnit && item.quantityPerSecondaryUnit > 0
    );
    
    if (!testItem) {
      alert('No items with multiple units found. Please add an item with both primary and secondary units first.');
      return;
    }
    
    const {
      openingStockPrimary = 0,
      openingStockSecondary = 0,
      receivedPrimary = 0,
      receivedSecondary = 0,
      consumedPrimary = 0,
      consumedSecondary = 0,
      received2Primary = 0,
      received2Secondary = 0,
      consumed2Primary = 0,
      consumed2Secondary = 0,
      quantityPerSecondaryUnit = 0
    } = testItem;
    
    const quantityPerSecondary = parseFloat(quantityPerSecondaryUnit) || 0;
    
    // Calculate totals
    const openingStock = openingStockPrimary + (openingStockSecondary * quantityPerSecondary);
    const received = receivedPrimary + (receivedSecondary * quantityPerSecondary);
    const consumed = consumedPrimary + (consumedSecondary * quantityPerSecondary);
    const received2 = received2Primary + (received2Secondary * quantityPerSecondary);
    const consumed2 = consumed2Primary + (consumed2Secondary * quantityPerSecondary);
    
    const total = openingStock + received;
    const balance = total - consumed;
    const total2 = balance + received2;
    const finalStock = total2 - consumed2;
    
    // Calculate split values
    const balancePrimary = Math.max(0, openingStockPrimary + receivedPrimary - consumedPrimary);
    const balanceSecondary = Math.max(0, openingStockSecondary + receivedSecondary - consumedSecondary);
    const finalStockPrimary = Math.max(0, balancePrimary + received2Primary - consumed2Primary);
    const finalStockSecondary = Math.max(0, balanceSecondary + received2Secondary - consumed2Secondary);
    
    console.log('🔍 Debug Calculations for:', testItem.name);
    console.log('📊 Split Values:');
    console.log('  Opening Stock:', { primary: openingStockPrimary, secondary: openingStockSecondary, total: openingStock });
    console.log('  Received:', { primary: receivedPrimary, secondary: receivedSecondary, total: received });
    console.log('  Consumed:', { primary: consumedPrimary, secondary: consumedSecondary, total: consumed });
    console.log('  Received2:', { primary: received2Primary, secondary: received2Secondary, total: received2 });
    console.log('  Consumed2:', { primary: consumed2Primary, secondary: consumed2Secondary, total: consumed2 });
    console.log('📈 Calculated Totals:');
    console.log('  Total:', total);
    console.log('  Balance:', balance);
    console.log('  Total2:', total2);
    console.log('  Final Stock:', finalStock);
    console.log('🔢 Split Results:');
    console.log('  Balance Primary:', balancePrimary);
    console.log('  Balance Secondary:', balanceSecondary);
    console.log('  Final Stock Primary:', finalStockPrimary);
    console.log('  Final Stock Secondary:', finalStockSecondary);
    
    alert(`🔍 Debug info logged to console for ${testItem.name}\n\nCheck console for detailed calculations.`);
  };



  // Auto-refresh calculations for existing items
  useEffect(() => {
    if (inventory.length > 0) {
      const updatedInventory = inventory.map(item => {
        if (item.secondaryUnit && item.quantityPerSecondaryUnit > 0) {
          // Recalculate all values for items with split units
          const quantityPerSecondary = parseFloat(item.quantityPerSecondaryUnit) || 0;
          
          // Calculate totals from split inputs
          const openingStock = (parseFloat(item.openingStockPrimary) || 0) + 
                             ((parseFloat(item.openingStockSecondary) || 0) * quantityPerSecondary);
          const received = (parseFloat(item.receivedPrimary) || 0) + 
                         ((parseFloat(item.receivedSecondary) || 0) * quantityPerSecondary);
          const consumed = (parseFloat(item.consumedPrimary) || 0) + 
                         ((parseFloat(item.consumedSecondary) || 0) * quantityPerSecondary);
          const received2 = (parseFloat(item.received2Primary) || 0) + 
                          ((parseFloat(item.received2Secondary) || 0) * quantityPerSecondary);
          const consumed2 = (parseFloat(item.consumed2Primary) || 0) + 
                          ((parseFloat(item.consumed2Secondary) || 0) * quantityPerSecondary);
          
          // Update legacy fields
          const updatedItem = {
            ...item,
            openingStock: openingStock,
            received: received,
            consumed: consumed,
            received2: received2,
            consumed2: consumed2,
            total: openingStock + received,
            balance: (openingStock + received) - consumed,
            total2: ((openingStock + received) - consumed) + received2,
            finalStock: (((openingStock + received) - consumed) + received2) - consumed2
          };
          
          return updatedItem;
        }
        return item;
      });
      
      // Only update if there are changes
      const hasChanges = JSON.stringify(updatedInventory) !== JSON.stringify(inventory);
      if (hasChanges) {
        console.log('🔄 Auto-refreshing calculations for split unit items...');
        setInventory(updatedInventory);
      }
    }
  }, [inventory.length]); // Only run when inventory length changes

  // Auto-convert items to use new unit system
  useEffect(() => {
    if (inventory.length > 0) {
      const needsUpdate = inventory.some(item => 
        !item.hasOwnProperty('primaryUnit') || 
        !item.hasOwnProperty('receivedPrimary')
      );
      
      if (needsUpdate) {
        const updatedInventory = inventory.map(item => ({
          ...item,
          primaryUnit: item.primaryUnit || 'kg',
          customPrimaryUnit: item.customPrimaryUnit || '',
          secondaryUnit: item.secondaryUnit || '',
          quantityPerSecondaryUnit: item.quantityPerSecondaryUnit || 0,
          minimumQuantity: item.minimumQuantity || 0,
          // Initialize split fields
          receivedPrimary: item.receivedPrimary || 0,
          receivedSecondary: item.receivedSecondary || 0,
          consumedPrimary: item.consumedPrimary || 0,
          consumedSecondary: item.consumedSecondary || 0,
          received2Primary: item.received2Primary || 0,
          received2Secondary: item.received2Secondary || 0,
          consumed2Primary: item.consumed2Primary || 0,
          consumed2Secondary: item.consumed2Secondary || 0
        }));
        setInventory(updatedInventory);
      }
    }
  }, [inventory.length]); // Only run when inventory length changes (items loaded)

  // Functions for edit panel
  const openEditPanel = (item) => {
    setEditingItem(item);
    setTempUnits({
      primaryUnit: item.primaryUnit || 'kg',
      customPrimaryUnit: item.customPrimaryUnit || '',
      secondaryUnit: item.secondaryUnit || '',
      quantityPerSecondaryUnit: item.quantityPerSecondaryUnit || 0
    });
    setEditPanelOpen(true);
  };

  const closeEditPanel = () => {
    setEditPanelOpen(false);
    setEditingItem(null);
    setTempUnits({
      primaryUnit: 'kg',
      customPrimaryUnit: '',
      secondaryUnit: '',
      quantityPerSecondaryUnit: 0
    });
  };

  const saveUnits = async () => {
    if (!editingItem) return;
    
    try {
      const updatedItem = {
        ...editingItem,
        primaryUnit: tempUnits.primaryUnit,
        customPrimaryUnit: tempUnits.customPrimaryUnit,
        secondaryUnit: tempUnits.secondaryUnit,
        quantityPerSecondaryUnit: tempUnits.quantityPerSecondaryUnit,
        unit: tempUnits.primaryUnit === 'custom' ? tempUnits.customPrimaryUnit : tempUnits.primaryUnit
      };
      
      setInventory(inventory.map(it => 
        it.id === editingItem.id ? updatedItem : it
      ));
      
      // Update backend
      await updateInventoryItem(editingItem.id, updatedItem);
      closeEditPanel();
      alert('Units updated successfully!');
    } catch (error) {
      console.error('Failed to update units:', error);
      alert('Failed to update units: ' + error.message);
    }
  };

  // Function to save current inventory to records
  const handleSaveToRecords = async () => {
    try {
      setSavingToRecords(true);
      
      // Get today's date - ensure proper date handling
      const today = new Date();
      // Create a new date object with local timezone to avoid timezone issues
      const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
      console.log(`🔍 Saving inventory records for date: ${todayLocal.toISOString()}`);
      console.log(`🔍 Local date: ${todayLocal.toLocaleDateString()}`);
      
      // Create records for each inventory item with EXACT values from inventory table
      const recordsToCreate = inventory.map((item, index) => {
        // Get EXACT values as they appear in the inventory table - NO CALCULATIONS!
        const openingStock = parseFloat(item.openingStock) || 0;
        const received = parseFloat(item.received) || 0;
        const consumed = parseFloat(item.consumed) || 0;
        const total = parseFloat(item.total) || 0;        // Use ACTUAL total from inventory
        const received2 = parseFloat(item.received2) || 0;
        const consumed2 = parseFloat(item.consumed2) || 0;
        const total2 = parseFloat(item.total2) || 0;      // Use ACTUAL total2 from inventory
        
        console.log(`Creating record for ${item.name}:`, {
          openingStock, received, consumed, total, received2, consumed2, total2,
          unit: item.unit || 'kg'
        });
        
        // Only send the basic fields that the backend model expects
        return {
          date: todayLocal.toISOString().split('T')[0], // Send as YYYY-MM-DD string
          itemName: item.name,
          openingStock: openingStock,
          received: received,
          consumed: consumed,
          total: total,        // ACTUAL total from inventory
          received2: received2,
          consumed2: consumed2,
          total2: total2,      // ACTUAL total2 from inventory
          unit: item.unit || 'kg'
        };
      });
      
      console.log(`Total inventory items: ${inventory.length}`);
      console.log(`Records to create: ${recordsToCreate.length}`);
      console.log('Sample record:', recordsToCreate[0]);
      
      // Show summary of what will be saved
      const summary = recordsToCreate.reduce((acc, record) => {
        acc.totalOpeningStock += record.openingStock;
        acc.totalReceived += record.received + record.received2;
        acc.totalConsumed += record.consumed + record.consumed2;
        return acc;
      }, { totalOpeningStock: 0, totalReceived: 0, totalConsumed: 0 });
      
      console.log('Summary of values to save:', summary);
      
      // Check for duplicate item names
      const itemNames = inventory.map(item => item.name);
      const uniqueNames = [...new Set(itemNames)];
      const duplicateNames = itemNames.filter((name, index) => itemNames.indexOf(name) !== index);
      
      console.log(`Unique item names: ${uniqueNames.length}`);
      if (duplicateNames.length > 0) {
        console.log('Duplicate item names found:', [...new Set(duplicateNames)]);
      }
      
      // Check if there are any actual values to save
      const hasValues = recordsToCreate.some(record => 
        record.openingStock > 0 || record.received > 0 || record.consumed > 0 || 
        record.received2 > 0 || record.consumed2 > 0
      );
      
      if (!hasValues) {
        alert('❌ No inventory values to save. Please make changes to your inventory first.');
        return;
      }
      
      // Check if records already exist for today
      const existingRecords = await InventoryRecordService.getRecords({
        startDate: todayLocal.toISOString(),
        endDate: todayLocal.toISOString()
      });
      
      if (existingRecords.data && existingRecords.data.length > 0) {
        const shouldOverwrite = window.confirm(`Records for ${todayLocal.toLocaleDateString()} already exist. Do you want to overwrite them? This will delete existing records and save new ones.`);
        if (shouldOverwrite) {
          // Delete existing records for today
          for (const existingRecord of existingRecords.data) {
            try {
              await InventoryRecordService.deleteRecord(existingRecord._id);
              console.log(`Deleted existing record for ${existingRecord.itemName}`);
            } catch (error) {
              console.error(`Failed to delete existing record for ${existingRecord.itemName}:`, error);
            }
          }
        } else {
          alert('Save cancelled. Records already exist for today.');
          return;
        }
      }
      
      // Save each record
      let savedCount = 0;
      let errorCount = 0;
      const errorDetails = [];
      for (const record of recordsToCreate) {
        try {
          console.log(`Saving record for ${record.itemName}...`);
          console.log('Record data being sent:', JSON.stringify(record, null, 2));
          console.log('Record data types:', {
            date: typeof record.date,
            itemName: typeof record.itemName,
            openingStock: typeof record.openingStock,
            received: typeof record.received,
            consumed: typeof record.consumed,
            total: typeof record.total,
            received2: typeof record.received2,
            consumed2: typeof record.consumed2,
            total2: typeof record.total2,
            unit: typeof record.unit
          });
          await InventoryRecordService.createRecord(record);
          savedCount++;
          console.log(`✅ Successfully saved record for ${record.itemName}`);
        } catch (error) {
          errorCount++;
          errorDetails.push({ record, error: error.message });
          console.error(`❌ Failed to save record for ${record.itemName}:`, error);
        }
      }
      
      console.log(`Save process completed: ${savedCount} saved, ${errorCount} failed`);
      
      // Show detailed error information if there are failures
      if (errorCount > 0) {
        console.error('Failed records details:', errorDetails);
        
        // Check for common validation errors
        const validationErrors = errorDetails.filter(error => 
          error.error.includes('validation') || 
          error.error.includes('enum') ||
          error.error.includes('required')
        );
        
        if (validationErrors.length > 0) {
          console.error('Validation errors found:', validationErrors);
          alert(`⚠️ ${errorCount} records failed to save due to validation errors.\n\nCheck the browser console for detailed error information.\n\nCommon issues:\n- Missing required fields\n- Data type mismatches\n- Invalid numeric values`);
        } else {
          alert(`⚠️ ${errorCount} records failed to save.\n\nCheck the browser console for detailed error information.`);
        }
      }
      
      // Show success message
      if (savedCount > 0) {
        alert(`✅ Successfully saved ${savedCount} inventory items to records for ${todayLocal.toLocaleDateString()}\n\nTotal inventory items: ${inventory.length}\nSuccessfully saved: ${savedCount}\nFailed to save: ${errorCount}\nUnique item names: ${uniqueNames.length}\nDuplicate names: ${duplicateNames.length > 0 ? duplicateNames.length : 'None'}`);
      } else {
        alert('❌ Failed to save any records. Please check the console for errors.');
      }
      
    } catch (error) {
      console.error('Failed to save inventory to records:', error);
      alert('❌ Error saving to records: ' + error.message);
    } finally {
      setSavingToRecords(false);
    }
  };

  // Function to prepare inventory for next day
  const handlePrepareNextDay = async () => {
    try {
      const shouldProceed = window.confirm(
        'This will prepare your inventory for the next day.\n\n' +
        '✅ Final stock will become opening stock for tomorrow\n' +
        '✅ Received and consumed fields will be reset to 0\n' +
        '✅ New inventory records will be created for tomorrow\n\n' +
        'Do you want to proceed?'
      );
      
      if (!shouldProceed) {
        return;
      }

      // Call the backend to prepare for next day
      const updatedItems = await prepareForNextDay();
      
      // Update local state with the new values
      setInventory(updatedItems);
      
      // Recalculate all items to ensure calculations are correct
      setTimeout(() => {
        recalculateAllItems();
      }, 100);
      
      alert(
        '✅ Inventory prepared for next day successfully!\n\n' +
        `Updated ${updatedItems.length} items.\n` +
        '✅ Today\'s balance has been set as tomorrow\'s opening stock\n' +
        '✅ All received and consumed fields have been reset to 0\n' +
        '✅ New inventory records have been created for tomorrow\n\n' +
        'You can now start entering new transactions for tomorrow!'
      );
      
    } catch (error) {
      console.error('Failed to prepare inventory for next day:', error);
      alert('❌ Error preparing inventory for next day: ' + error.message);
    }
  };

  const filteredInventory = useMemo(() => {
    const orderMap = new Map();
    (inventoryOrder || []).forEach((name, idx) => {
      orderMap.set(name.trim().toLowerCase(), idx);
    });
    return inventory
      .slice()
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const aKey = a.name.trim().toLowerCase();
        const bKey = b.name.trim().toLowerCase();
        const aIdx = orderMap.has(aKey) ? orderMap.get(aKey) : Number.MAX_SAFE_INTEGER;
        const bIdx = orderMap.has(bKey) ? orderMap.get(bKey) : Number.MAX_SAFE_INTEGER;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.name.localeCompare(b.name);
      });
  }, [inventory, searchTerm]);

  return (
    <div className="mobile-optimized">
      {/* Debug Information */}

      
      <div className="d-flex justify-content-between align-items-center mb-3 inventory-header">
        <div>
          <h2>Inventory Management</h2>
          <p className="text-muted mb-0">
            <strong>Current Cycle:</strong> {getCurrentCycleDate()} (6 AM to 6 AM)
          </p>
          <p className="permission-indicator mb-0">
            {isAuthenticated ? 
              "🔓 Logged In: Can edit Opening Stock, Received, and Consumed" : 
              "🔒 Logged Out: Can only edit Received fields"
            }
            <br />

                        </p>

            <p className="text-muted mb-0" style={{fontSize: '12px'}}>
            💾 Records are automatically saved at 6 AM daily (end of each cycle)
          </p>
        </div>
        
        {isAuthenticated && (
          <div className="header-actions">
            <button
              className="btn btn-success btn-sm"
              onClick={handlePrepareNextDay}
              title="Prepare inventory for next day (today's balance becomes tomorrow's opening stock)"
            >
              <i className="fas fa-calendar-plus me-2"></i>
              Prepare Next Day
            </button>
            <div className="text-muted mt-2" style={{fontSize: '12px'}}>
              💡 <strong>How it works:</strong> Today's balance in the "Balance" column will become tomorrow's opening stock
            </div>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div className="card mb-3 add-item-card mobile-card">
          <div className="card-body">
            <h5 className="card-title mb-3">Add New Item</h5>
            <div className="row g-2 align-items-end add-item-form">
              <div className="col-12 col-md-4">
                <label className="form-label">Item Name</label>
                <input
                  className="form-control"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Sugar"
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Opening Stock</label>
                <input
                  className="form-control"
                  type="text"
                  inputMode="decimal"
                  value={newItem.openingStock}
                  onChange={(e) => setNewItem({ ...newItem, openingStock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label">Minimum Quantity</label>
                <input
                  className="form-control"
                  type="text"
                  inputMode="decimal"
                  value={newItem.minimumQuantity}
                  onChange={(e) => setNewItem({ ...newItem, minimumQuantity: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 10"
                />
              </div>
              
              {/* Primary Unit Selection (Required) */}
              <div className="col-6 col-md-2">
                <label className="form-label">Primary Unit <span className="text-danger">*</span></label>
                <select
                  className="form-control"
                  value={newItem.primaryUnit}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewItem({ 
                      ...newItem, 
                      primaryUnit: value,
                      customPrimaryUnit: value !== 'custom' ? '' : newItem.customPrimaryUnit,
                      unit: value !== 'custom' ? value : newItem.customPrimaryUnit || 'custom'
                    });
                  }}
                >
                  <option value="kg">Kg</option>
                  <option value="lit">Liter</option>
                  <option value="piece">Piece</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {/* Custom Primary Unit (only shown when custom is selected) */}
              {newItem.primaryUnit === 'custom' && (
                <div className="col-6 col-md-2">
                  <label className="form-label">Custom Unit</label>
                  <input
                    className="form-control"
                    value={newItem.customPrimaryUnit}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewItem({ 
                        ...newItem, 
                        customPrimaryUnit: value,
                        unit: value || 'custom'
                      });
                    }}
                    placeholder="e.g., box, bottle"
                  />
                </div>
              )}
              
              {/* Secondary Unit Selection (Optional) */}
              <div className="col-6 col-md-2">
                <label className="form-label">Secondary Unit <span className="text-muted">(Optional)</span></label>
                <select
                  className="form-control"
                  value={newItem.secondaryUnit}
                  onChange={(e) => setNewItem({ ...newItem, secondaryUnit: e.target.value })}
                >
                  <option value="">None</option>
                  <option value="bag">Bag</option>
                  <option value="carton">Carton</option>
                  <option value="tin">Tin</option>
                  <option value="packets">Packets</option>
                </select>
              </div>
              
              {/* Quantity per Secondary Unit (only shown when secondary unit is selected) */}
              {newItem.secondaryUnit && (
                <div className="col-6 col-md-2">
                  <label className="form-label">
                    {newItem.primaryUnit === 'custom' ? newItem.customPrimaryUnit || 'Unit' : newItem.primaryUnit} per {newItem.secondaryUnit}
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    inputMode="decimal"
                    value={newItem.quantityPerSecondaryUnit}
                    onChange={(e) => setNewItem({ ...newItem, quantityPerSecondaryUnit: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 50"
                  />
                </div>
              )}
              
              <div className="col-12 col-md-2">
                <button
                  className="btn btn-success add-item-btn w-100"
                  onClick={async () => {
                    if (!newItem.name.trim()) {
                      alert('Please enter an item name');
                      return;
                    }
                    if (newItem.primaryUnit === 'custom' && !newItem.customPrimaryUnit.trim()) {
                      alert('Please enter a custom unit name');
                      return;
                    }
                    
                    try {
                      const nextId = (inventory.reduce((max, it) => Math.max(max, it.id), 0) || 0) + 1;
                      const base = {
                        id: nextId,
                        name: newItem.name.trim(),
                        openingStock: newItem.openingStock || 0,
                        openingStockPrimary: newItem.openingStock || 0,
                        openingStockSecondary: 0,
                        minimumQuantity: newItem.minimumQuantity || 0,
                        received: 0,
                        receivedPrimary: 0,
                        receivedSecondary: 0,
                        consumed: 0,
                        consumedPrimary: 0,
                        consumedSecondary: 0,
                        received2: 0,
                        received2Primary: 0,
                        received2Secondary: 0,
                        consumed2: 0,
                        consumed2Primary: 0,
                        consumed2Secondary: 0,
                        unit: newItem.primaryUnit === 'custom' ? newItem.customPrimaryUnit : newItem.primaryUnit,
                        primaryUnit: newItem.primaryUnit,
                        customPrimaryUnit: newItem.customPrimaryUnit || '',
                        secondaryUnit: newItem.secondaryUnit || '',
                        quantityPerSecondaryUnit: newItem.quantityPerSecondaryUnit || 0,
                      };
                      
                      // Calculate derived fields
                      const total = base.openingStock + base.received;
                      const balance = total - base.consumed;
                      const total2 = balance + base.received2;
                      const finalStock = total2 - base.consumed2;
                      const currentStock = finalStock;
                      
                      // Calculate split balance and final stock fields
                      const balancePrimary = Math.max(0, base.openingStockPrimary + base.receivedPrimary - base.consumedPrimary);
                      const balanceSecondary = Math.max(0, base.openingStockSecondary + base.receivedSecondary - base.consumedSecondary);
                      const finalStockPrimary = Math.max(0, balancePrimary + base.received2Primary - base.consumed2Primary);
                      const finalStockSecondary = Math.max(0, balanceSecondary + base.received2Secondary - base.consumed2Secondary);
                      
                      const newRow = { 
                        ...base, 
                        total, 
                        balance, 
                        total2, 
                        finalStock, 
                        currentStock,
                        balancePrimary,
                        balanceSecondary,
                        finalStockPrimary,
                        finalStockSecondary
                      };
                      
                      // First update local state for immediate UI feedback
                      setInventory([ ...inventory, newRow ]);
                      setNewItem({ 
                        name: '', 
                        openingStock: 0, 
                        unit: 'kg',
                        primaryUnit: 'kg',
                        customPrimaryUnit: '',
                        secondaryUnit: '',
                        quantityPerSecondaryUnit: 0,
                        minimumQuantity: 0 
                      });
                      
                      // Then add to backend
                      const addedItem = await addInventoryItem(newRow);
                      if (addedItem) {
                        // Update with the server response if needed
                        setInventory(prevInventory => 
                          prevInventory.map(item => 
                            item.id === nextId ? { ...addedItem } : item
                          )
                        );
                      }
                    } catch (error) {
                      console.error('Failed to add new inventory item:', error);
                      alert('Failed to add item: ' + error.message);
                    }
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>
            
            {/* Unit System Explanation */}
            {(newItem.secondaryUnit || newItem.primaryUnit === 'custom') && (
              <div className="mt-3 p-2 bg-light rounded">
                <small className="text-muted">
                  <strong>Example:</strong> 
                  {newItem.secondaryUnit ? (
                    <>
                      {' '}If you receive 5 {newItem.secondaryUnit}s and each {newItem.secondaryUnit} contains {newItem.quantityPerSecondaryUnit || 0} {newItem.primaryUnit === 'custom' ? newItem.customPrimaryUnit || 'units' : newItem.primaryUnit}, 
                      your total received will be {(newItem.quantityPerSecondaryUnit || 0) * 5} {newItem.primaryUnit === 'custom' ? newItem.customPrimaryUnit || 'units' : newItem.primaryUnit}.
                    </>
                  ) : (
                    <>
                      {' '}All quantities will be tracked in {newItem.customPrimaryUnit || 'custom units'}.
                    </>
                  )}
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="card mb-3 search-bar-card">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h6 className="mb-2">🔍 Search Inventory Items</h6>
              <input
                type="text"
                className="form-control"
                placeholder="Search by item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
            </div>
            <div className="col-md-6">
              <div className="text-muted">
                <small>
                  {searchTerm ? 
                    `Found ${inventory.filter(item => 
                      item.name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length} items matching "${searchTerm}"` : 
                    `Showing all ${inventory.length} items`
                  }
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>


      
      <div className="table-responsive inventory-table-container">
        <table className="table table-bordered table-hover table-sm inventory-table">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Opening Stock</th>
              <th>Min Qty</th>
              <th>Received</th>
              <th>Consumed</th>
              <th>Total</th>
              <th>Received</th>
              <th>Consumed</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item, index) => {
              // Check if current stock is below minimum quantity
              const currentStock = item.finalStock ?? ((item.balance + (item.received2 || 0)) - (item.consumed2 || 0));
              const minimumQty = item.minimumQuantity || 0;
              const isLowStock = currentStock < minimumQty;
              
              return (
                <tr key={item.id} className={isLowStock ? 'table-danger low-stock-warning' : ''}>
                  <td>{index + 1}</td>
                  <td className="item-name-cell">
                    <span className="item-name-text">{item.name}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        className="form-control form-control-sm inventory-input"
                        value={parseFloat(item.openingStock) || 0}

                        onChange={e => {
                          const value = parseFloat(e.target.value) || 0;
                          console.log('Opening Stock changed:', value);
                          handleValueChange(item.id, 'openingStock', value);
                        }}
                        onWheel={e => e.currentTarget.blur()}
                        readOnly={false}
                        disabled={false}
                        style={{backgroundColor: 'white !important', border: '1px solid #dee2e6 !important', pointerEvents: 'auto !important', cursor: 'text !important'}}

                      />
                      <span className="ms-2 text-muted" style={{fontSize: '12px', fontWeight: '500'}}>
                        {getDisplayUnit(item)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                                            <input
                        type="number"
                        inputMode="decimal"
                        className="form-control form-control-sm inventory-input"
                        value={parseFloat(minimumQty) || 0}
                        onChange={e => handleValueChange(item.id, 'minimumQuantity', parseFloat(e.target.value) || 0)}
                        onWheel={e => e.currentTarget.blur()}
                        readOnly={false}
                        disabled={false}
                        style={{backgroundColor: 'white !important', border: '1px solid #dee2e6 !important', pointerEvents: 'auto !important', cursor: 'text !important'}}

                      />
                    <span className="ms-2 text-muted" style={{fontSize: '12px', fontWeight: '500'}}>
                      {getDisplayUnit(item)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      className="form-control form-control-sm inventory-input"
                      value={parseFloat(item.received) || 0}
                      onChange={e => {
                        const value = parseFloat(e.target.value) || 0;
                        console.log('Received changed:', value);
                        handleValueChange(item.id, 'received', value);
                      }}
                      onWheel={e => e.currentTarget.blur()}
                      readOnly={false}
                      disabled={false}
                      style={{backgroundColor: 'white !important', border: '1px solid #dee2e6 !important', pointerEvents: 'auto !important', cursor: 'text !important'}}
                      placeholder="Enter received"

                    />
                    <span className="ms-2 text-muted" style={{fontSize: '12px', fontWeight: '500'}}>
                      {getDisplayUnit(item)}
                    </span>
                  </div>
                </td>
                                <td>
                  <div className="d-flex align-items-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      className="form-control form-control-sm inventory-input"
                      value={parseFloat(item.consumed) || 0}
                      onChange={e => {
                        const value = parseFloat(e.target.value) || 0;
                        console.log('Consumed changed:', value);
                        handleValueChange(item.id, 'consumed', value);
                      }}
                      onWheel={e => e.currentTarget.blur()}
                      readOnly={false}
                      disabled={false}
                      style={{backgroundColor: 'white !important', border: '1px solid #dee2e6 !important', pointerEvents: 'auto !important', cursor: 'text !important'}}

                    />
                    <span className="ms-2 text-muted" style={{fontSize: '12px', fontWeight: '500'}}>
                      {getDisplayUnit(item)}
                    </span>
                  </div>
                </td>
                <td className="calculated-value total-value" style={{minWidth: '180px', width: '180px'}}>
                  <div className="d-flex align-items-center justify-content-center">
                    <span>
                      {(() => {
                        const totalKgs = ((item.openingStock || 0) + (item.received || 0)) - (item.consumed || 0);
                        if (item.secondaryUnit && item.quantityPerSecondaryUnit > 0) {
                          const quantityPerBag = parseFloat(item.quantityPerSecondaryUnit) || 50;
                          const bags = Math.floor(totalKgs / quantityPerBag);
                          const remainingKgs = totalKgs - (bags * quantityPerBag);
                          
                          if (bags > 0 && remainingKgs > 0) {
                            return `${bags} bags + ${remainingKgs.toFixed(2)} kgs`;
                          } else if (bags > 0) {
                            return `${bags} bags`;
                          } else {
                            return `${remainingKgs.toFixed(2)} kgs`;
                          }
                        } else {
                          return totalKgs;
                        }
                      })()}
                    </span>
                    <span className="ms-2 text-muted" style={{fontSize: '12px', fontWeight: '500'}}>
                      {item.secondaryUnit && item.quantityPerSecondaryUnit > 0 ? '' : getDisplayUnit(item)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      className="form-control form-control-sm inventory-input"
                      value={parseFloat(item.received2) || 0}
                      onChange={e => handleValueChange(item.id, 'received2', parseFloat(e.target.value) || 0)}
                      onWheel={e => e.currentTarget.blur()}
                      readOnly={false}
                      disabled={false}
                      style={{backgroundColor: 'white !important', border: '1px solid #dee2e6 !important', pointerEvents: 'auto !important', cursor: 'text !important'}}

                    />
                    <span className="ms-2 text-muted" style={{fontSize: '12px', fontWeight: '500'}}>
                      {getDisplayUnit(item)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      className="form-control form-control-sm inventory-input"
                      value={parseFloat(item.consumed2) || 0}
                      onChange={e => handleValueChange(item.id, 'consumed2', parseFloat(e.target.value) || 0)}
                      onWheel={e => e.currentTarget.blur()}
                      readOnly={false}
                      disabled={false}
                      style={{backgroundColor: 'white !important', border: '1px solid #dee2e6 !important', pointerEvents: 'auto !important', cursor: 'text !important'}}

                    />
                    <span className="ms-2 text-muted" style={{fontSize: '12px', fontWeight: '500'}}>
                      {getDisplayUnit(item)}
                    </span>
                  </div>
                </td>
                <td className="calculated-value total-value" style={{minWidth: '180px', width: '180px'}}>
                  <div className="d-flex align-items-center justify-content-center">
                    <span>
                      {(() => {
                        const totalKgs = ((item.openingStock || 0) + (item.received || 0) + (item.received2 || 0)) - ((item.consumed || 0) + (item.consumed2 || 0));
                        if (item.secondaryUnit && item.quantityPerSecondaryUnit > 0) {
                          const quantityPerBag = parseFloat(item.quantityPerSecondaryUnit) || 50;
                          const bags = Math.floor(totalKgs / quantityPerBag);
                          const remainingKgs = totalKgs - (bags * quantityPerBag);
                          
                          if (bags > 0 && remainingKgs > 0) {
                            return `${bags} bags + ${remainingKgs.toFixed(2)} kgs`;
                          } else if (bags > 0) {
                            return `${bags} bags`;
                          } else {
                            return `${remainingKgs.toFixed(2)} kgs`;
                          }
                        } else {
                          return totalKgs;
                        }
                      })()}
                    </span>
                    <span className="ms-2 text-muted" style={{fontSize: '12px', fontWeight: '500'}}>
                      {item.secondaryUnit && item.quantityPerSecondaryUnit > 0 ? '' : getDisplayUnit(item)}
                    </span>
                  </div>
                </td>
                <td className="actions-cell">
                  {isAuthenticated && (
                    <div className="d-flex gap-1 justify-content-center">
                        <button
                        className="btn btn-sm btn-outline-info"
                        onClick={() => openEditPanel(item)}
                        title="Edit units for this item"
                      >
                        ⚙️
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                            try {
                              // First update local state for immediate UI feedback
                              setInventory(inventory.filter((it) => it.id !== item.id));
                              
                              // Then delete from backend
                              await deleteInventoryItem(item.id);
                            } catch (error) {
                              console.error(`Failed to delete item with ID ${item.id}:`, error);
                              // Could add error handling/notification here
                            }
                          }
                        }}
                        title="Delete this item"
                      >
                        🗑️
                        </button>
                      </div>
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
      

      
      {/* Save Records Section - For Testing Today's Records */}
      <div className="card mb-3 save-records-card">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h5 className="card-title mb-1">💾 Save Today's Inventory Records</h5>
              <p className="card-text text-muted mb-0">
                Save current inventory state to daily records for {new Date().toLocaleDateString()}. 
                This will create a snapshot of today's inventory for future reference.
              </p>
            </div>
            <div className="col-md-4 text-end">
              <button
                className="btn btn-success btn-lg"
                onClick={handleSaveToRecords}
                disabled={savingToRecords}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  if (!savingToRecords) {
                    e.target.style.backgroundColor = '#218838';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!savingToRecords) {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.1)';
                  }
                }}
                title={savingToRecords ? 'Saving records...' : 'Save current inventory to daily records'}
              >
                <i className={`fas ${savingToRecords ? 'fa-spinner fa-spin' : 'fa-save'}`} style={{ marginRight: '8px' }}></i>
                {savingToRecords ? 'Saving...' : 'Save Records'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Units Panel - Consistent with Edit Recipe styling */}
      {editPanelOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#f8f9fa',
            border: '2px solid #007bff',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 2px 10px rgba(0, 123, 255, 0.1)'
          }}>
            {/* Edit Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h4 style={{ margin: 0, color: '#007bff', fontSize: '18px', fontWeight: 'bold' }}>
                Edit Units - {editingItem?.name}
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
          <button
                  onClick={saveUnits}
                  style={{
                    padding: '8px 16px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#218838'}
                  onMouseOut={(e) => e.target.style.background = '#28a745'}
                >
                  <i className="fas fa-save"></i> Save Changes
          </button>
                <button 
                  onClick={closeEditPanel}
                  style={{
                    padding: '8px 16px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#5a6268'}
                  onMouseOut={(e) => e.target.style.background = '#6c757d'}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
          </div>
        </div>

            {/* Unit Configuration Section */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                  Primary Unit <span style={{color: '#dc3545'}}>*</span>
                </label>
                <select
                  value={tempUnits.primaryUnit}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTempUnits({ 
                      ...tempUnits, 
                      primaryUnit: value,
                      customPrimaryUnit: value !== 'custom' ? '' : tempUnits.customPrimaryUnit
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="lit">Liter (L)</option>
                  <option value="piece">Piece (pc)</option>
                  <option value="custom">Custom Unit</option>
                </select>
      </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                  Secondary Unit (Optional)
                </label>
                <select
                  value={tempUnits.secondaryUnit}
                  onChange={(e) => setTempUnits({ ...tempUnits, secondaryUnit: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                >
                  <option value="">No secondary unit</option>
                  <option value="bag">Bag</option>
                  <option value="carton">Carton</option>
                  <option value="tin">Tin</option>
                  <option value="packets">Packets</option>
                </select>
              </div>
            </div>

            {/* Custom Unit Input */}
            {tempUnits.primaryUnit === 'custom' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                  Custom Unit Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., box, bottle, sheet"
                  value={tempUnits.customPrimaryUnit}
                  onChange={(e) => setTempUnits({ 
                    ...tempUnits, 
                    customPrimaryUnit: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s ease'
                  }}
                />
              </div>
            )}

            {/* Quantity per Secondary Unit */}
            {tempUnits.secondaryUnit && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                  Quantity per {tempUnits.secondaryUnit}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="50"
                    min="0"
                    step="0.01"
                    value={tempUnits.quantityPerSecondaryUnit}
                    onChange={(e) => setTempUnits({ 
                      ...tempUnits, 
                      quantityPerSecondaryUnit: parseFloat(e.target.value) || 0
                    })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px',
                      transition: 'border-color 0.3s ease'
                    }}
                  />
                  <span style={{
                    color: '#6c757d',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {tempUnits.primaryUnit === 'custom' ? tempUnits.customPrimaryUnit || 'units' : tempUnits.primaryUnit}
                  </span>
                </div>
              </div>
            )}

            {/* Preview Section */}
            <div style={{ marginTop: '20px' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                Unit Configuration Preview:
              </h5>
              <div style={{
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                padding: '15px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#007bff' }}>Primary Unit:</strong> 
                  <span style={{ marginLeft: '10px' }}>
                    {tempUnits.primaryUnit === 'custom' ? tempUnits.customPrimaryUnit || 'custom unit' : tempUnits.primaryUnit}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#007bff' }}>Secondary Unit:</strong> 
                  <span style={{ marginLeft: '10px' }}>
                    {tempUnits.secondaryUnit ? 
                      `${tempUnits.secondaryUnit} (${tempUnits.quantityPerSecondaryUnit} ${tempUnits.primaryUnit === 'custom' ? tempUnits.customPrimaryUnit || 'units' : tempUnits.primaryUnit} per ${tempUnits.secondaryUnit})` : 
                      'None'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
