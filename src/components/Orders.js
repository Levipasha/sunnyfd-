import React, { useEffect, useState } from 'react';
import BlockSelector from './BlockSelector';
import { updateInventoryItem } from '../services/inventoryService';
import './Orders.css';
import './OrdersMobile.css';
import './OrdersMobileTable.css';

/** ---- Storage keys (versioned) ---- */


const Orders = ({ inventory, setInventory, records, setRecords, isAuthenticated }) => {

  const [activeTab, setActiveTab] = useState(() => {
    // Try to get from localStorage first
    const saved = localStorage.getItem('activeTab');
    return saved || 'crossUpdate';
  });
  
  // State management
  const [customCategories] = useState([]);
  
    const [customSubcategories] = useState([]);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  
  // Track deleted categories
  const [deletedCategories, setDeletedCategories] = useState(() => {
    const saved = localStorage.getItem('deletedCategories');
      return saved ? JSON.parse(saved) : [];
  });





  


  // Data state for different blocks
  const [crossData, setCrossData] = useState(() => {
    try {
      const saved = localStorage.getItem('crossData');
      return saved ? JSON.parse(saved) : {
        // Ties Items
        plainTie: { order: 10 },
        miniTie: { order: 10 },
        masalaTie: { order: 10 },
        
        // Fine Items
        panFine: { order: 10 },
        roundFine: { order: 10 },
        mediumFine: { order: 10 },
        smallFine: { order: 10 },
        
        // Puff Items
        eggPuff: { order: 10 },
        chickenPuff: { order: 10 },
        vegPuff: { order: 10 },
        paneerPuff: { order: 10 },
        
        // Cream Roll and Dil Pasand
        creamRoll: { order: 10 },
        dilPasand: { order: 10 },
        
        // DIL PASAND-1
        dilPasand1: { order: 20 }
      };
    } catch {
      return {
        // Ties Items
        plainTie: { order: 10 },
        miniTie: { order: 10 },
        masalaTie: { order: 10 },
        
        // Fine Items
        panFine: { order: 10 },
        roundFine: { order: 10 },
        mediumFine: { order: 10 },
        smallFine: { order: 10 },
        
        // Puff Items
        eggPuff: { order: 10 },
        chickenPuff: { order: 10 },
        vegPuff: { order: 10 },
        paneerPuff: { order: 10 },
        
        // Cream Roll and Dil Pasand
        creamRoll: { order: 10 },
        dilPasand: { order: 10 },
        
        // DIL PASAND-1
        dilPasand1: { order: 20 }
      };
    }
  });

  const [qameerData, setQameerData] = useState(() => {
    try {
      const saved = localStorage.getItem('qameerData');
      return saved ? JSON.parse(saved) : {
        mainProduction: {
          bun: { order: 150 },
          burgerBun: { order: 132 },
          creamBun: { order: 120 },
          sheermal: { order: 80 },
          donut: { order: 220 },
          samoli: { order: 160 },
          pizzaBase: { order: 100 },
          dilkush: { order: 24 }
        },
        tose: {
          fruitToast: { order: 1 },
          specialToast: { order: 1 }
        },
        bread: {
          bread: { order: 42 },
          milkBread: { order: 42 },
          sandwichBread: { order: 30 },
          longBread: { order: 20 },
          pau: { order: 80 }
        }
      };
    } catch {
      return {
        mainProduction: {
          bun: { order: 150 },
          burgerBun: { order: 132 },
          creamBun: { order: 120 },
          sheermal: { order: 80 },
          donut: { order: 220 },
          samoli: { order: 160 },
          pizzaBase: { order: 100 },
          dilkush: { order: 24 }
        },
        tose: {
          fruitToast: { order: 1 },
          specialToast: { order: 1 }
        },
        bread: {
          bread: { order: 42 },
          milkBread: { order: 42 },
          sandwichBread: { order: 30 },
          longBread: { order: 20 },
          pau: { order: 80 }
        }
      };
    }
  });

  const [mawaData, setMawaData] = useState(() => {
    try {
      const saved = localStorage.getItem('mawaData');
      return saved ? JSON.parse(saved) : {
        fatless: {
          ladiWhite: { order: 12 },
          ladiChocolate: { order: 12 },
          sanchaHalf: { order: 96 },
          sancha1kg: { order: 48 },
          sancha2kg: { order: 24 }
        },
        gheeMawa: {
          cakeRasLadi3: { order: 2 },
          kadiCakeLadi25: { order: 2 },
          containerSmall: { order: 98 },
          containerMedium: { order: 39 },
          roundCake: { order: 39 },
          cupCake: { order: 235 }
        },
        pillsbury: {
          chocSanchaHalf: { order: 36 },
          chocSancha1kg: { order: 18 },
          chocSancha2kg: { order: 9 },
          ladi: { order: 3.8 }
        }
      };
    } catch {
      return {
        fatless: {
          ladiWhite: { order: 12 },
          ladiChocolate: { order: 12 },
          sanchaHalf: { order: 96 },
          sancha1kg: { order: 48 },
          sancha2kg: { order: 24 }
        },
        gheeMawa: {
          cakeRasLadi3: { order: 2 },
          kadiCakeLadi25: { order: 2 },
          containerSmall: { order: 98 },
          containerMedium: { order: 39 },
          roundCake: { order: 39 },
          cupCake: { order: 235 }
        },
        pillsbury: {
          chocSanchaHalf: { order: 36 },
          chocSancha1kg: { order: 18 },
          chocSancha2kg: { order: 9 },
          ladi: { order: 3.8 }
        }
      };
    }
  });

  const [osmaniaData, setOsmaniaData] = useState(() => {
    try {
      const saved = localStorage.getItem('osmaniaData');
      return saved ? JSON.parse(saved) : {
        bakeCake: [
          {
            id: 1,
            name: 'BAKE CAKE(GHEE)',
            unit: 'box 15Kg.',
            order: 10,
            totQnty: 17500,
            bakeCakeGhee: 10.00,
            kkMaida: 15.00,
            gSugar: 4.00,
            mSugar: 2.50,
            milkMaid: 0.50,
            vanilla: 0.100,
            glocus: 0.30,
            goodlife: 1.00,
            amulSpray: 0.70,
            cornflor: 0.50,
            salt: 0.400,
            vanillaPowder: 0.06,
            oil: 0.50
          }
        ],
        alfa: [
          {
            id: 1,
            name: 'ALFA(GHEE)',
            unit: 'box/Kg.-15',
            order: 10,
            totQnty: 17500,
            alfaGhee: 10.0,
            kkMaida: 14.0,
            gSugar: 3.5,
            mSugar: 2.50,
            milkMaid: 0.50,
            vanilla: 0.100,
            glocus: 0.30,
            goodlife: 1.50,
            amulSpray: 0.70,
            cornflor: 0.50,
            salt: 0.350,
            vanillaPowder: 0.06,
            oil: 0.50
          }
        ]
      };
    } catch {
      return {
        bakeCake: [],
        alfa: []
      };
    }
  });

  const [saltItemsData, setSaltItemsData] = useState(() => {
    try {
      const saved = localStorage.getItem('saltItemsData');
      return saved ? JSON.parse(saved) : {
        khara: { order: 10 },
        nanKhatai: { order: 10 },
        badam: { order: 10 },
        macromi: { order: 10 },
        fruitBisc: { order: 10 },
        choclateKa: { order: 10 },
        honeyKaju: { order: 10 },
        whiteKaju: { order: 10 },
        chand: { order: 10 }
      };
    } catch {
      return {
        khara: { order: 10 },
        nanKhatai: { order: 10 },
        badam: { order: 10 },
        macromi: { order: 10 },
        fruitBisc: { order: 10 },
        choclateKa: { order: 10 },
        honeyKaju: { order: 10 },
        whiteKaju: { order: 10 },
        chand: { order: 10 }
      };
    }
  });

  const [showroomData, setShowroomData] = useState(() => {
    try {
      const saved = localStorage.getItem('showroomData');
      return saved ? JSON.parse(saved) : {
        fineItems: [],
        puffItems: [],
        totals: {
          greenLily: 0,
          b5Maida: 0,
          kkMaida: 0,
          mSugar: 0,
          vanillaPdr: 0,
          goldMore: 0,
          salt: 0,
          roseEssen: 0,
          eggs: 0
        }
      };
    } catch {
      return {
        fineItems: [],
        puffItems: [],
        totals: {
          greenLily: 0,
          b5Maida: 0,
          kkMaida: 0,
          mSugar: 0,
          vanillaPdr: 0,
          goldMore: 0,
          salt: 0,
          roseEssen: 0,
          eggs: 0
        }
      };
    }
  });

  // Main categories created from ONE section
  const [mainCategories, setMainCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('mainCategories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });



  // Category management state
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState('');

  // Persist activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);
  
  useEffect(() => {
    localStorage.setItem('customSubcategories', JSON.stringify(customSubcategories));
  }, [customSubcategories]);
  
  
  
  useEffect(() => {
    localStorage.setItem('crossData', JSON.stringify(crossData));
  }, [crossData]);
  
  useEffect(() => {
    localStorage.setItem('qameerData', JSON.stringify(qameerData));
  }, [qameerData]);
  
  useEffect(() => {
    localStorage.setItem('mawaData', JSON.stringify(mawaData));
  }, [mawaData]);
  
  useEffect(() => {
    localStorage.setItem('osmaniaData', JSON.stringify(osmaniaData));
  }, [osmaniaData]);
  
  useEffect(() => {
    localStorage.setItem('saltItemsData', JSON.stringify(saltItemsData));
  }, [saltItemsData]);
  
  useEffect(() => {
    localStorage.setItem('showroomData', JSON.stringify(showroomData));
  }, [showroomData]);
  
  useEffect(() => {
    localStorage.setItem('mainCategories', JSON.stringify(mainCategories));
  }, [mainCategories]);

  useEffect(() => {
    localStorage.setItem('deletedCategories', JSON.stringify(deletedCategories));
  }, [deletedCategories]);


  const handleMawaChange = (section, id, field, value) => {
    setMawaData(prev => {
      const updated = { ...prev };
      const list = Array.isArray(updated[section]) ? [...updated[section]] : [];
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], [field]: value };
      }
      return { ...updated, [section]: list };
    });
  };



  // Inventory names for suggestions
  const inventoryNames = inventory.map(item => item.name);

  return (
    <div className="container-fluid mt-4 mobile-optimized">

      
      {/* Inventory suggestions datalist */}
      <datalist id="inventory-suggestions">
        {inventoryNames.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>
      
      {/* Navigation Buttons */}
      <div className="d-flex justify-content-center mb-4 category-navigation">
        {!deletedCategories.includes('CROSS UPDATE') && (
        <button 
            className={`btn mx-2 category-btn ${activeTab === 'crossUpdate' ? 'btn-success' : 'btn-primary'}`} 
          onClick={() => setActiveTab('crossUpdate')}
          style={{ 
            transition: 'all 0.3s ease',
            transform: activeTab === 'crossUpdate' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: activeTab === 'crossUpdate' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
            border: activeTab === 'crossUpdate' ? '2px solid #28a745' : '1px solid transparent'
          }}
        >
          CROSS UPDATE
        </button>
        )}
        {!deletedCategories.includes('SHOWROOM') && (
        <button 
            className={`btn mx-2 category-btn ${activeTab === 'showroom' ? 'btn-success' : 'btn-primary'}`} 
          onClick={() => setActiveTab('showroom')}
          style={{ 
            transition: 'all 0.3s ease',
            transform: activeTab === 'showroom' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: activeTab === 'showroom' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
            border: activeTab === 'showroom' ? '2px solid #28a745' : '1px solid transparent'
          }}
        >
          SHOWROOM
        </button>
        )}
        {!deletedCategories.includes('QAMEER') && (
        <button 
            className={`btn mx-2 category-btn ${activeTab === 'qameer' ? 'btn-success' : 'btn-primary'}`} 
          onClick={() => setActiveTab('qameer')}
          style={{ 
            transition: 'all 0.3s ease',
            transform: activeTab === 'qameer' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: activeTab === 'qameer' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
            border: activeTab === 'qameer' ? '2px solid #28a745' : '1px solid transparent'
          }}
        >
          QAMEER
        </button>
        )}
        {!deletedCategories.includes('OSAMANIA') && (
        <button 
            className={`btn mx-2 category-btn ${activeTab === 'osamania' ? 'btn-success' : 'btn-primary'}`} 
          onClick={() => setActiveTab('osamania')}
          style={{ 
            transition: 'all 0.3s ease',
            transform: activeTab === 'osamania' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: activeTab === 'osamania' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
            border: activeTab === 'osamania' ? '2px solid #28a745' : '1px solid transparent'
          }}
        >
          OSAMANIA
        </button>
        )}
        {!deletedCategories.includes('salt +items') && (
        <button 
            className={`btn mx-2 category-btn ${activeTab === 'saltItems' ? 'btn-success' : 'btn-primary'}`} 
          onClick={() => setActiveTab('saltItems')}
          style={{ 
            transition: 'all 0.3s ease',
            transform: activeTab === 'saltItems' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: activeTab === 'saltItems' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
            border: activeTab === 'saltItems' ? '2px solid #28a745' : '1px solid transparent'
          }}
        >
          SALT + ITEMS
        </button>
        )}
        {!deletedCategories.includes('MAWA') && (
        <button 
            className={`btn mx-2 category-btn ${activeTab === 'mawa' ? 'btn-success' : 'btn-primary'}`} 
          onClick={() => setActiveTab('mawa')}
          style={{ 
            transition: 'all 0.3s ease',
            transform: activeTab === 'mawa' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: activeTab === 'mawa' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
            border: activeTab === 'mawa' ? '2px solid #28a745' : '1px solid transparent'
          }}
        >
          MAWA
        </button>
        )}
        
        {/* Main categories created from ONE section */}
        {mainCategories.map(cat => (
          <button 
            key={cat.id} 
            className={`btn mx-2 category-btn ${activeTab === `main:${cat.id}` ? 'btn-success' : 'btn-primary'}`} 
            onClick={() => setActiveTab(`main:${cat.id}`)}
            style={{ 
              transition: 'all 0.3s ease',
              transform: activeTab === `main:${cat.id}` ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeTab === `main:${cat.id}` ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
              border: activeTab === `main:${cat.id}` ? '2px solid #28a745' : '1px solid transparent'
            }}
          >
            {cat.name}
          </button>
        ))}
        
        {isAuthenticated && (
          <button 
            className="btn btn-primary mx-2 category-btn" 
            onClick={() => setActiveTab('one')}
            style={{ 
              transition: 'all 0.3s ease',
              transform: activeTab === 'one' ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeTab === 'one' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
              border: activeTab === 'one' ? '2px solid #28a745' : '1px solid transparent'
            }}
          >
            ONE
          </button>
        )}
        
        {customCategories.map(cat => (
          <button 
            key={cat.id} 
            className={`btn mx-2 ${activeTab === `custom:${cat.id}` ? 'btn-success' : 'btn-outline-secondary'}`} 
            onClick={() => setActiveTab(`custom:${cat.id}`)}
            style={{ 
              transition: 'all 0.3s ease',
              transform: activeTab === `custom:${cat.id}` ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeTab === `custom:${cat.id}` ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
              border: activeTab === `custom:${cat.id}` ? '2px solid #28a745' : '1px solid transparent'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Block Selector Component - Handles all block rendering */}
      <BlockSelector
        activeTab={activeTab}
        isAuthenticated={isAuthenticated}
        inventory={inventory}
        setInventory={setInventory}
        updateInventoryItem={updateInventoryItem}
        mawaData={mawaData}
        setMawaData={setMawaData}
        handleMawaChange={handleMawaChange}
        crossData={crossData}
        setCrossData={setCrossData}
        qameerData={qameerData}
        setQameerData={setQameerData}
        osmaniaData={osmaniaData}
        setOsmaniaData={setOsmaniaData}
        saltItemsData={saltItemsData}
        setSaltItemsData={setSaltItemsData}
        showroomData={showroomData}
        setShowroomData={setShowroomData}
        mainCategories={mainCategories}
      />



      {/* ONE Section - Category Management */}
      {activeTab === 'one' && (
        <div className="card">
          <div className="card-body">
            <div className="mb-3">
              <h2>ONE - Category Management</h2>
            </div>
            
            <div className="alert alert-info alert-sm mb-3" style={{ fontSize: '0.875rem' }}>
              <strong>Category Management:</strong> Use this section to manage existing categories and create new recipe blocks.
            </div>

            {/* Existing Categories Management */}
            <div className="card mb-4 mobile-card one-section">
              <div className="card-header">
                <h5 className="mb-0">Existing Categories</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Select Category to Delete</label>
                      <select 
                        className="form-control" 
                        value={selectedCategoryToDelete}
                        onChange={(e) => setSelectedCategoryToDelete(e.target.value)}
                      >
                        <option value="">Choose a category...</option>
                        <option value="CROSS UPDATE">CROSS UPDATE</option>
                        <option value="SHOWROOM">SHOWROOM</option>
                        <option value="QAMEER">QAMEER</option>
                        <option value="OSAMANIA">OSAMANIA</option>
                        <option value="salt +items">salt +items</option>
                        <option value="MAWA">MAWA</option>
                        {/* Dynamically created categories */}
                        {mainCategories.map(cat => (
                          <option key={cat.id} value={`NEW:${cat.name}`}>
                            {cat.name} (New)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Category Status</label>
                      <div className="alert alert-warning alert-sm mb-0 category-status-box" style={{ fontSize: '0.875rem' }}>
                        <div className="note"><strong>Note:</strong></div>
                        <p>Deleting a category will remove it from the navigation and hide its content. You can restore it later by re-adding the category.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    <i className="fas fa-info-circle me-1"></i>
                    Select a category from the dropdown above to delete it
                  </div>
                  <button 
                    className="btn btn-outline-danger"
                    disabled={!selectedCategoryToDelete}
                    title="Select a category first"
                    onClick={() => {
                      if (selectedCategoryToDelete) {
                        if (window.confirm(`Are you sure you want to delete the "${selectedCategoryToDelete}" category? This action cannot be undone.`)) {
                          // Handle deletion based on category type
                          if (selectedCategoryToDelete.startsWith('NEW:')) {
                            // Delete from mainCategories (dynamically created)
                            const categoryName = selectedCategoryToDelete.replace('NEW:', '');
                            const categoryToDelete = mainCategories.find(cat => cat.name === categoryName);
                            if (categoryToDelete) {
                              setMainCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
                              // Add to deletedCategories for restoration
                              setDeletedCategories(prev => [...prev, categoryName]);
                              // Switch to a different tab if the deleted category was active
                              if (activeTab === `main:${categoryToDelete.id}`) {
                                setActiveTab('crossUpdate');
                              }
                              window.alert(`Category "${categoryName}" has been deleted successfully!`);
                              setSelectedCategoryToDelete(''); // Reset selection
                            }
                          } else {
                            // Handle deletion of built-in categories
                            setDeletedCategories(prev => [...prev, selectedCategoryToDelete]);
                            // Switch to a different tab if the deleted category was active
                            if (activeTab === selectedCategoryToDelete.toLowerCase().replace(/\s+/g, '')) {
                              setActiveTab('crossUpdate');
                            }
                            window.alert(`Category "${selectedCategoryToDelete}" has been deleted successfully!`);
                            setSelectedCategoryToDelete(''); // Reset selection
                          }
                        }
                      }
                    }}
                  >
                    <i className="fas fa-trash"></i> Delete Selected Category
                  </button>
                </div>
              </div>
            </div>

            {/* Category Creation Section */}
            <div className="card mb-4 mobile-card one-section">
              <div className="card-header">
                <h5 className="mb-0">Create New Category</h5>
              </div>
              <div className="card-body">
                    <div className="form-group mb-3">
                      <label className="form-label">Category Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter category name..."
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                      />
                </div>
                
                <button 
                  className="btn btn-success"
                  disabled={!newSubcategoryName.trim()}
                  onClick={() => {
                    if (newSubcategoryName.trim()) {
                      const newCategory = {
                        id: Date.now(),
                        name: newSubcategoryName.trim(),
                        type: 'custom'
                      };
                      setMainCategories(prev => [...prev, newCategory]);
                      setNewSubcategoryName('');
                      window.alert(`Category "${newCategory.name}" has been created successfully!`);
                    }
                  }}
                >
                  <i className="fas fa-plus"></i> Create Category
                </button>
              </div>
            </div>

            {/* Restore Deleted Categories Section */}
            {deletedCategories.length > 0 && (
              <div className="card mb-4 mobile-card one-section">
                <div className="card-header">
                  <h5 className="mb-0">Restore Deleted Categories</h5>
          </div>
                <div className="card-body">
                  <div className="row deleted-categories-list">
                    {deletedCategories.map((categoryName, index) => (
                      <div key={index} className="col-md-6 mb-2">
                        <div className="d-flex justify-content-between align-items-center p-2 border rounded deleted-category-item">
                          <span className="text-muted deleted-category-name">{categoryName}</span>
                                                      <div className="d-flex gap-2 deleted-category-actions">
                            <button 
                              className="btn btn-sm btn-outline-success"
                              onClick={() => {
                                // Check if this is a built-in category or newly created
                                const builtInCategories = ['CROSS UPDATE', 'SHOWROOM', 'QAMEER', 'OSAMANIA', 'SALT + ITEMS', 'MAWA'];
                                
                                if (builtInCategories.includes(categoryName)) {
                                  // Built-in category - just remove from deletedCategories
                                  setDeletedCategories(prev => prev.filter(cat => cat !== categoryName));
                                } else {
                                  // Newly created category - add back to mainCategories with new ID
                                  const restoredCategory = {
                                    id: Date.now(),
                                    name: categoryName,
                                    type: 'custom'
                                  };
                                  setMainCategories(prev => [...prev, restoredCategory]);
                                  setDeletedCategories(prev => prev.filter(cat => cat !== categoryName));
                                }
                                window.alert(`Category "${categoryName}" has been restored successfully!`);
                              }}
                            >
                              <i className="fas fa-undo"></i> Restore
                            </button>
                <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to PERMANENTLY delete "${categoryName}"? This action cannot be undone.`)) {
                                  // Permanently remove from deletedCategories
                                  setDeletedCategories(prev => prev.filter(cat => cat !== categoryName));
                                  
                                  // Also clear any associated data from localStorage
                                  const categoryKey = categoryName.toLowerCase().replace(/\s+/g, '') + 'CustomRecipes';
                                  localStorage.removeItem(categoryKey);
                                  
                                  window.alert(`Category "${categoryName}" has been permanently deleted!`);
                                }
                              }}
                            >
                              <i className="fas fa-trash"></i> Delete Permanently
                </button>
              </div>
                </div>
                  </div>
                    ))}
                  </div>
                </div>
                </div>
            )}
          </div>
        </div>
      )}




    </div>
  );
};

export default Orders;
