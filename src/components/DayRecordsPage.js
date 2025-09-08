import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecordsTable from './RecordsTable';
import InventoryRecordService from '../services/inventoryRecordService';
import './DayRecordsPage.css';

const DayRecordsPage = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper: add days to YYYY-MM-DD string and return YYYY-MM-DD
  const addDaysToDateString = (dateString, daysToAdd) => {
    const base = new Date(dateString);
    base.setDate(base.getDate() + daysToAdd);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchData = async () => {
    if (!date) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Shift to next day for fetching while keeping UI date unchanged
      const shiftedDate = addDaysToDateString(date, 1);
      console.log('🔍 Fetching records for date (day view, shifted +1):', shiftedDate, '(selected:', date, ')');

      // New API usage: view=day with exact date string (YYYY-MM-DD)
      const response = await InventoryRecordService.getRecords({
        view: 'day',
        date: shiftedDate,
        limit: 10000
      });
      
      if (response.success) {
        setRecords(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch records');
      }
    } catch (err) {
      console.error('🔍 Fetch error:', err);
      setError('Error fetching records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };



  const handleBackClick = () => {
    navigate('/inventory-records');
  };

  return (
    <div className="day-records-page">
      <div className="page-header">
        <button className="back-button" onClick={handleBackClick}>
          <i className="fas fa-arrow-left"></i>
          Back to Records
        </button>
        <h2 className="page-title">Day Wise Records</h2>
      </div>

      <div className="page-content">
        <div className="controls-section">
          <div className="date-controls">
            <div className="input-group">
              <label htmlFor="date-input">Select Date:</label>
              <input
                id="date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="date-input"
              />
            </div>
            <button 
              onClick={fetchData} 
              className="show-button"
              disabled={loading || !date}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Loading...
                </>
              ) : (
                <>
                  <i className="fas fa-search"></i>
                  Show Records
                </>
              )}
            </button>
            
            <button 
              onClick={async () => {
                if (!date) {
                  setError('Please select a date');
                  return;
                }
                setLoading(true);
                setError('');
                try {
                  console.log('🔄 Force generating missing records for date:', date);
                  const generateResponse = await fetch('https://sunny-bd.onrender.com/inventory-records/generate-missing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date }),
                  });
                  if (generateResponse.ok) {
                    const generateData = await generateResponse.json();
                    console.log('✅ Force generated records:', generateData);
                    await fetchData(); // Refresh the data
                  } else {
                    setError('Failed to generate missing records');
                  }
                } catch (err) {
                  console.error('🔄 Force generate error:', err);
                  setError('Error generating records: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="refresh-button"
              disabled={loading || !date}
              title="Force generate missing records for newly added items"
            >
              <i className="fas fa-sync-alt"></i>
              Refresh Records
            </button>
          </div>
        </div>



        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {records.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h3>Records for {new Date(date).toLocaleDateString()}</h3>
              <span className="record-count">{records.length} records found</span>
            </div>
            <RecordsTable view="day" data={records} />
          </div>
        )}

        {!loading && date && records.length === 0 && !error && (
          <div className="no-records">
            <i className="fas fa-inbox"></i>
            <h3>No Records Found</h3>
            <p>No inventory records found for the selected date.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayRecordsPage;
