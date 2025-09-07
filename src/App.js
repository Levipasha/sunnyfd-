import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Inventory from './components/Inventory';
import Orders from './components/Orders';

import InventoryRecords from './components/InventoryRecords';
import InventoryRecordsHome from './components/InventoryRecordsHome';
import DayRecordsPage from './components/DayRecordsPage';
import MonthRecordsPage from './components/MonthRecordsPage';

import MobileHeader from './components/MobileHeader';
import MobileSidebar from './components/MobileSidebar';
import Login from './components/Login';
import { initialInventory } from './data';
import { getAllInventoryItems, initializeInventory } from './services/inventoryService';
import './App.css';

// Wrapper component to handle mobile navigation logic
function AppContent({ inventory, setInventory, isAuthenticated, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Desktop Navigation */}
      <Navbar isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      {/* Mobile Navigation */}
      <MobileHeader isSidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main Content */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Inventory inventory={inventory} setInventory={setInventory} isAuthenticated={isAuthenticated} />} />
          <Route path="/orders" element={<Orders inventory={inventory} setInventory={setInventory} isAuthenticated={isAuthenticated} />} />
          <Route path="/inventory-records" element={<InventoryRecordsHome />} />
          <Route path="/inventory-records/day" element={<DayRecordsPage />} />
          <Route path="/inventory-records/month" element={<MonthRecordsPage />} />
          <Route path="/inventory-records/old" element={<InventoryRecords isAuthenticated={isAuthenticated} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  const [inventory, setInventory] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');

  useEffect(() => {
    // Load inventory from API or initialize with default data
    const loadInventory = async () => {
      try {
        // Try to get inventory from API
        const items = await getAllInventoryItems();
        
        if (items && items.length > 0) {
          // If items exist in the database, use them
          setInventory(items);
        } else {
          // If no items exist, initialize with default data
          const calculatedInventory = initialInventory.map(item => ({
            ...item,
            total: item.openingStock + item.received,
            balance: item.openingStock + item.received - item.consumed,
            currentStock: item.openingStock + item.received - item.consumed,
          }));
          
          // Save to database and update state
          const initializedItems = await initializeInventory(calculatedInventory);
          setInventory(initializedItems || calculatedInventory);
        }
      } catch (error) {
        console.error('Failed to load inventory from API:', error);
        
        // Fallback to local calculation if API fails
        const calculatedInventory = initialInventory.map(item => ({
          ...item,
          total: item.openingStock + item.received,
          balance: item.openingStock + item.received - item.consumed,
          currentStock: item.openingStock + item.received - item.consumed,
        }));
        setInventory(calculatedInventory);
      }
    };
    
    loadInventory();


  }, []);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);



  // Listen for auth change events or storage changes
  useEffect(() => {
    const syncAuth = () => {
      const authed = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(authed);
    };
    const onAuthChanged = () => syncAuth();
    const onStorage = (e) => {
      if (e.key === 'isAuthenticated') syncAuth();
    };
    window.addEventListener('auth-changed', onAuthChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Prevent scroll-wheel and arrow keys from changing number inputs globally; allow direct typing
  useEffect(() => {
    const handleWheel = (e) => {
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT' && active.type === 'number' && active === e.target) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });

    const enhanceNumberInputs = () => {
      const inputs = document.querySelectorAll('input[type="number"]');
      inputs.forEach((input) => {
        if (input.dataset.enhancedNumber === '1') return;
        input.step = input.step || 'any';
        const onKeyDown = (ev) => {
          if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
            ev.preventDefault();
          }
        };
        const onWheel = (ev) => {
          ev.preventDefault();
        };
        input.addEventListener('keydown', onKeyDown);
        input.addEventListener('wheel', onWheel, { passive: false });
        input.dataset.enhancedNumber = '1';
      });
    };

    // Initial enhance and observe for new inputs
    enhanceNumberInputs();
    const observer = new MutationObserver(enhanceNumberInputs);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      observer.disconnect();
    };
  }, []);

  return (
    <Router>
      <AppContent 
        inventory={inventory} 
        setInventory={setInventory} 
        isAuthenticated={isAuthenticated} 
        onLogout={() => { localStorage.removeItem('isAuthenticated'); setIsAuthenticated(false); }}
      />
    </Router>
  );
}

export default App;
