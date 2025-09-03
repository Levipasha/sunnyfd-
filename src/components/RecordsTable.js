import React from 'react';
import './RecordsTable.css';

const RecordsTable = ({ view, data }) => {
  
  if (!data || data.length === 0) {
    return (
      <div className="no-data">
        <i className="fas fa-table"></i>
        <p>No data available</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseFloat(num).toFixed(2);
  };



  return (
    <div className="records-table-container">
      <div className="table-wrapper">
        <table className="records-table">
          <thead>
            <tr>
              {view === 'day' && <th className="date-column">Date</th>}
              <th className="item-column">Item</th>
              <th className="number-column">Opening</th>
              <th className="number-column">Received</th>
              <th className="number-column">Consumed</th>
              <th className="number-column">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => (
              <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                {view === 'day' && (
                  <td className="date-cell">
                    {record._id && record._id._id && record._id._id.date 
                      ? formatDate(record._id._id.date) 
                      : formatDate(record.date)
                    }
                  </td>
                )}
                <td className="item-cell">
                  {view === 'day' 
                    ? (record._id && record._id._id && record._id._id.item 
                        ? record._id._id.item 
                        : record.itemName)
                    : (record.itemName || record._id || 'Unknown Item')
                  }
                </td>
                <td className="number-cell">{formatNumber(record.openingStock)} {record.unit || 'kg'}</td>
                <td className="number-cell">{formatNumber(record.received)} {record.unit || 'kg'}</td>
                <td className="number-cell">{formatNumber(record.consumed)} {record.unit || 'kg'}</td>
                <td className="number-cell" style={{minWidth: '180px', width: '180px'}}>
                  {(() => {
                    const totalKgs = parseFloat(record.total2 || record.total) || 0;
                    if (record.secondaryUnit && record.quantityPerSecondaryUnit > 0) {
                      const quantityPerBag = parseFloat(record.quantityPerSecondaryUnit) || 50;
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
                      return `${formatNumber(record.total2 || record.total)} ${record.unit || 'kg'}`;
                    }
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <div className="table-stats">
          <span className="stat-item">
            <i className="fas fa-list"></i>
            Total Records: {data.length}
          </span>
          <span className="stat-item">
            <i className="fas fa-cube"></i>
            Total Opening: {formatNumber(data.reduce((sum, r) => sum + (r.openingStock || 0), 0))} kgs
          </span>
          <span className="stat-item">
            <i className="fas fa-plus"></i>
            Total Received: {formatNumber(data.reduce((sum, r) => sum + (r.received || 0), 0))} kgs
          </span>
          <span className="stat-item">
            <i className="fas fa-minus"></i>
            Total Consumed: {formatNumber(data.reduce((sum, r) => sum + (r.consumed || 0), 0))} kgs
          </span>
        </div>
        

      </div>
    </div>
  );
};

export default RecordsTable;
