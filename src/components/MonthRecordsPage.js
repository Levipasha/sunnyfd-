import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RecordsTable from './RecordsTable';
import InventoryRecordService from '../services/inventoryRecordService';
import './MonthRecordsPage.css';

const MonthRecordsPage = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  const fetchData = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔍 Fetching records for date range:', startDate, 'to', endDate);
      
      const response = await InventoryRecordService.getRecords({
        startDate: startDate,
        endDate: endDate,
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

  const setQuickRange = (range) => {
    const today = new Date();
    const start = new Date();
    
    switch (range) {
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      const title = `Monthly Inventory Records (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`;
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; margin: 16px; }
          h2 { text-align: center; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px; font-size: 11px; }
          th { background: #007bff; color: #fff; position: sticky; top: 0; }
          .rc-cell { display: inline-flex; gap: 6px; align-items: center; }
          .rc-part { display: inline-block; padding: 2px 4px; border-radius: 4px; }
          .rc-part.r { background: #e3f2fd; color: #0d47a1; }
          .rc-part.c { background: #ffebee; color: #b71c1c; }
        </style>
      `;
      const tableEl = resultsRef.current ? resultsRef.current.querySelector('table') : null;
      const tableHtml = tableEl ? tableEl.outerHTML : '<p>No table content</p>';
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            ${styles}
          </head>
          <body>
            <h2>${title}</h2>
            ${tableHtml}
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    } catch (e) {
      console.error('Print failed:', e);
      alert('Failed to open print window.');
    }
  };

  return (
    <div className="month-records-page">
      <div className="page-header">
        <button className="back-button" onClick={handleBackClick}>
          <i className="fas fa-arrow-left"></i>
          Back to Records
        </button>
        <h2 className="page-title">Month Wise Records</h2>
      </div>

      <div className="page-content">
        <div className="controls-section">
          <div className="date-controls">
            <div className="input-group">
              <label htmlFor="start-date">Start Date:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="end-date">End Date:</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
              />
            </div>
            
            <button 
              onClick={fetchData} 
              className="show-button"
              disabled={loading || !startDate || !endDate}
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
          </div>
          
          <div className="quick-ranges">
            <label>Quick Ranges:</label>
            <div className="range-buttons">
              <button onClick={() => setQuickRange('week')} className="range-btn">
                Last 7 Days
              </button>
              <button onClick={() => setQuickRange('month')} className="range-btn">
                Last Month
              </button>
              <button onClick={() => setQuickRange('quarter')} className="range-btn">
                Last 3 Months
              </button>
              <button onClick={() => setQuickRange('year')} className="range-btn">
                Last Year
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {records.length > 0 && (
          <div className="results-section" ref={resultsRef}>
            <div className="results-header">
              <h3>
                Records from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </h3>
              <span className="record-count">{records.length} records found</span>
              <button className="print-btn" onClick={handlePrint} title="Print monthly records">
                <i className="fas fa-print"></i> Print
              </button>
            </div>
            <RecordsTable view="month" data={records} />
          </div>
        )}

        {!loading && startDate && endDate && records.length === 0 && !error && (
          <div className="no-records">
            <i className="fas fa-inbox"></i>
            <h3>No Records Found</h3>
            <p>No inventory records found for the selected date range.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthRecordsPage;
