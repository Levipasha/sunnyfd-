import React from 'react';
import { useNavigate } from 'react-router-dom';
import './InventoryRecordsHome.css';

const InventoryRecordsHome = () => {
  const navigate = useNavigate();

  const handleDayWiseClick = () => {
    navigate('/inventory-records/day');
  };

  const handleMonthWiseClick = () => {
    navigate('/inventory-records/month');
  };

  return (
    <div className="inventory-records-home">
      <div className="home-container">
        <h1 className="home-title">Inventory Records</h1>
        <div className="buttons-container">
          <button 
            className="record-button day-button" 
            onClick={handleDayWiseClick}
          >
            <div className="button-icon">
              <i className="fas fa-calendar-day"></i>
            </div>
            <div className="button-content">
              <h3>Day Wise Records</h3>
              <p>View records for a specific day</p>
            </div>
          </button>
          
          <button 
            className="record-button month-button" 
            onClick={handleMonthWiseClick}
          >
            <div className="button-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="button-content">
              <h3>Month Wise Records</h3>
              <p>View records for any date range</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryRecordsHome;
