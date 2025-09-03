import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecordsTable from './RecordsTable';
import './DayRecordsPage.css';

const DayRecordsPage = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!date) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔍 Fetching records for date:', date);
      
      // First, check if there are existing records for this date
      const checkResponse = await fetch(`/inventory-records?view=day&date=${date}`);
      if (!checkResponse.ok) {
        throw new Error(`HTTP error! status: ${checkResponse.status}`);
      }
      
      const checkData = await checkResponse.json();
      const existingRecords = checkData.success ? checkData.data : [];
      
      console.log(`🔍 Found ${existingRecords.length} existing records for ${date}`);
      
      // Only generate missing records if there are no existing records
      if (existingRecords.length === 0) {
        console.log('🔍 No existing records found, generating missing records...');
        
        const generateResponse = await fetch('/inventory-records/generate-missing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ date }),
        });

        if (!generateResponse.ok) {
          console.warn('⚠️ Failed to generate missing records, continuing with existing records');
        } else {
          const generateData = await generateResponse.json();
          if (generateData.success) {
            console.log('✅ Auto-generated missing records:', generateData.data.generated || 0);
          }
        }
      } else {
        console.log('🔍 Records already exist, skipping generate-missing step');
      }

      // Use existing records if available, otherwise fetch fresh data
      if (existingRecords.length > 0) {
        console.log('🔍 Using existing records:', existingRecords.length);
        setRecords(existingRecords);
      } else {
        // Fetch fresh data after generating missing records
        console.log('🔍 Fetching fresh records for date:', date);
        const response = await fetch(`/inventory-records?view=day&date=${date}`);
        console.log('🔍 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('🔍 Response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('🔍 JSON parse error:', parseError);
          setError('Invalid response from server: ' + responseText.substring(0, 100));
          return;
        }
        
        if (data.success) {
          setRecords(data.data);
        } else {
          setError(data.message || 'Failed to fetch records');
        }
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
                  const generateResponse = await fetch('/inventory-records/generate-missing', {
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
