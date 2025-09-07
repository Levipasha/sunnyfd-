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



  const getDisplayUnit = (record) => {
    return record.customPrimaryUnit || record.primaryUnit || record.unit || 'kg';
  };

  const renderBalance = (record) => {
    const opening = parseFloat(record.openingStock) || 0;
    const received = parseFloat(record.received) || 0;
    const consumed = parseFloat(record.consumed) || 0;
    const received2 = parseFloat(record.received2) || 0;
    const consumed2 = parseFloat(record.consumed2) || 0;
    const totalKgs = (opening + received - consumed) + (received2 - consumed2);

    const quantityPerBag = parseFloat(record.quantityPerSecondaryUnit) || 0;
    const hasBags = record.secondaryUnit && quantityPerBag > 0;
    if (hasBags) {
      const bags = Math.floor(totalKgs / quantityPerBag);
      const remaining = totalKgs - (bags * quantityPerBag);
      if (bags > 0 && remaining > 0) return `${bags} ${record.secondaryUnit}s + ${remaining.toFixed(2)} ${getDisplayUnit(record)}`;
      if (bags > 0) return `${bags} ${record.secondaryUnit}s`;
      return `${remaining.toFixed(2)} ${getDisplayUnit(record)}`;
    }
    return `${formatNumber(totalKgs)} ${getDisplayUnit(record)}`;
  };

  const renderBalanceFirst = (record) => {
    const opening = parseFloat(record.openingStock) || 0;
    const received = parseFloat(record.received) || 0;
    const consumed = parseFloat(record.consumed) || 0;
    const totalKgs = opening + received - consumed;

    const quantityPerBag = parseFloat(record.quantityPerSecondaryUnit) || 0;
    const hasBags = record.secondaryUnit && quantityPerBag > 0;
    if (hasBags) {
      const bags = Math.floor(totalKgs / quantityPerBag);
      const remaining = totalKgs - (bags * quantityPerBag);
      if (bags > 0 && remaining > 0) return `${bags} ${record.secondaryUnit}s + ${remaining.toFixed(2)} ${getDisplayUnit(record)}`;
      if (bags > 0) return `${bags} ${record.secondaryUnit}s`;
      return `${remaining.toFixed(2)} ${getDisplayUnit(record)}`;
    }
    return `${formatNumber(totalKgs)} ${getDisplayUnit(record)}`;
  };

  // Month view pivoted layout: rows = items, columns = dates, cells show combined Received and Consumed
  if (view === 'month') {
    // Collect unique dates (YYYY-MM-DD) in range
    const dateKey = (d) => {
      try {
        const dd = new Date(d);
        return dd.toISOString().split('T')[0];
      } catch (e) {
        return String(d).slice(0, 10);
      }
    };
    const uniqueDates = Array.from(new Set(data.map(r => dateKey(r.date)))).sort();
    // Group records by item name and date with combined values
    const itemMap = new Map();
    data.forEach(r => {
      const itemName = r.itemName || (r._id && r._id._id && r._id._id.item) || 'Unknown Item';
      const key = dateKey(r.date);
      const receivedCombined = (parseFloat(r.received) || 0) + (parseFloat(r.received2) || 0);
      const consumedCombined = (parseFloat(r.consumed) || 0) + (parseFloat(r.consumed2) || 0);
      if (!itemMap.has(itemName)) itemMap.set(itemName, {});
      const byDate = itemMap.get(itemName);
      if (!byDate[key]) byDate[key] = { received: 0, consumed: 0, unit: getDisplayUnit(r) };
      byDate[key].received += receivedCombined;
      byDate[key].consumed += consumedCombined;
      // Preserve a unit per item
      if (!byDate.__unit) byDate.__unit = getDisplayUnit(r);
    });

    const items = Array.from(itemMap.keys()).sort((a, b) => a.localeCompare(b));
    const grandTotals = { received: 0, consumed: 0 };

    items.forEach(item => {
      const byDate = itemMap.get(item);
      uniqueDates.forEach(d => {
        const cell = byDate[d] || { received: 0, consumed: 0 };
        grandTotals.received += cell.received;
        grandTotals.consumed += cell.consumed;
      });
    });

    return (
      <div className="records-table-container">
        <div className="table-wrapper">
          <table className="records-table">
            <thead>
              <tr>
                <th className="item-column">Item Name</th>
                {uniqueDates.map(d => (
                  <th key={d} className="number-column date-col">{formatDate(d)}</th>
                ))}
                <th className="number-column">Total Received</th>
                <th className="number-column">Total Consumed</th>
              </tr>
            </thead>
            <tbody>
              {items.map((itemName, rowIdx) => {
                const byDate = itemMap.get(itemName);
                const unit = byDate.__unit || (data[0] && getDisplayUnit(data[0])) || 'kg';
                let rowReceived = 0;
                let rowConsumed = 0;
                return (
                  <tr key={itemName} className={rowIdx % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="item-cell">{itemName}</td>
                    {uniqueDates.map(d => {
                      const cell = byDate[d] || { received: 0, consumed: 0 };
                      rowReceived += cell.received;
                      rowConsumed += cell.consumed;
                      return (
                        <td key={d} className="number-cell date-data" style={{whiteSpace: 'nowrap'}}>
                          <div className="rc-cell">
                            <span className="rc-part r">R: {formatNumber(cell.received)} {unit}</span>
                            <span className="rc-divider" aria-hidden="true"></span>
                            <span className="rc-part c">C: {formatNumber(cell.consumed)} {unit}</span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="number-cell totals-separator">{formatNumber(rowReceived)} {unit}</td>
                    <td className="number-cell">{formatNumber(rowConsumed)} {unit}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th>GRAND TOTAL</th>
                {uniqueDates.map(d => {
                  const col = data.filter(r => dateKey(r.date) === d);
                  const unit = col[0] ? getDisplayUnit(col[0]) : (data[0] && getDisplayUnit(data[0])) || 'kg';
                  const rcv = col.reduce((s, r) => s + ((parseFloat(r.received)||0)+(parseFloat(r.received2)||0)), 0);
                  const cns = col.reduce((s, r) => s + ((parseFloat(r.consumed)||0)+(parseFloat(r.consumed2)||0)), 0);
                  return (
                    <th key={d} className="number-column date-col" style={{whiteSpace:'nowrap'}}>
                      <div className="rc-cell">
                        <span className="rc-part r">R: {formatNumber(rcv)} {unit}</span>
                        <span className="rc-divider" aria-hidden="true"></span>
                        <span className="rc-part c">C: {formatNumber(cns)} {unit}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="number-column totals-separator">{formatNumber(grandTotals.received)} {getDisplayUnit(data[0] || {})}</th>
                <th className="number-column">{formatNumber(grandTotals.consumed)} {getDisplayUnit(data[0] || {})}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // Default simple table (day view or legacy)
  return (
    <div className="records-table-container">
      <div className="table-wrapper">
        <table className="records-table">
          <thead>
            <tr>
              <th className="item-column">Item Name</th>
              <th className="number-column">Opening Stock</th>
              <th className="number-column">Received</th>
              <th className="number-column">Consumed</th>
              <th className="number-column">Balance</th>
              <th className="number-column">Received</th>
              <th className="number-column">Consumed</th>
              <th className="number-column">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => (
              <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <td className="item-cell">{record.itemName || (record._id && record._id._id && record._id._id.item) || 'Unknown Item'}</td>
                <td className="number-cell">{formatNumber(record.openingStock)} {getDisplayUnit(record)}</td>
                <td className="number-cell">{formatNumber(record.received)} {getDisplayUnit(record)}</td>
                <td className="number-cell">{formatNumber(record.consumed)} {getDisplayUnit(record)}</td>
                <td className="number-cell">{renderBalanceFirst(record)}</td>
                <td className="number-cell">{formatNumber(record.received2)} {getDisplayUnit(record)}</td>
                <td className="number-cell">{formatNumber(record.consumed2)} {getDisplayUnit(record)}</td>
                <td className="number-cell">{renderBalance(record)}</td>
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
          {/* Total Opening stat hidden intentionally */}
          <span className="stat-item">
            <i className="fas fa-plus"></i>
            Total Received 1: {formatNumber(data.reduce((sum, r) => sum + (parseFloat(r.received) || 0), 0))} {getDisplayUnit(data[0] || {})}
          </span>
          <span className="stat-item">
            <i className="fas fa-minus"></i>
            Total Consumed 1: {formatNumber(data.reduce((sum, r) => sum + (parseFloat(r.consumed) || 0), 0))} {getDisplayUnit(data[0] || {})}
          </span>
          <span className="stat-item">
            <i className="fas fa-plus"></i>
            Total Received 2: {formatNumber(data.reduce((sum, r) => sum + (parseFloat(r.received2) || 0), 0))} {getDisplayUnit(data[0] || {})}
          </span>
          <span className="stat-item">
            <i className="fas fa-minus"></i>
            Total Consumed 2: {formatNumber(data.reduce((sum, r) => sum + (parseFloat(r.consumed2) || 0), 0))} {getDisplayUnit(data[0] || {})}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecordsTable;
