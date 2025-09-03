// Print utility functions for blocks
export const printBlock = async (blockName, contentRef, onPrintComplete = null) => {
  if (!contentRef.current) return;

  const printWindow = window.open('', '_blank');
  const content = contentRef.current.cloneNode(true);

  // Remove print buttons from the cloned content
  const printButtons = content.querySelectorAll('.print-btn, .btn-print');
  printButtons.forEach(btn => btn.remove());

  // Create print-friendly HTML
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${blockName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .print-header h1 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }
        .print-header p {
          margin: 5px 0;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 11px;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .card {
          border: 1px solid #ddd;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .card-header {
          background-color: #f8f9fa;
          padding: 10px;
          border-bottom: 1px solid #ddd;
          font-weight: bold;
        }
        .card-body {
          padding: 10px;
        }
        .bg-success {
          background-color: #d4edda !important;
        }
        .bg-warning {
          background-color: #fff3cd !important;
        }
        .text-white {
          color: #000 !important;
        }
        .fw-bold {
          font-weight: bold;
        }
        .text-center {
          text-align: center;
        }
        .table-responsive {
          overflow: visible;
        }
        @media print {
          body { margin: 0; }
          .card { page-break-inside: avoid; }
          table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>${blockName}</h1>
        <p>Production Date: ${new Date().toLocaleDateString()}</p>
        <p>Generated for Chef - Factory Use</p>
      </div>
      ${content.innerHTML}
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
    
    // Call the completion callback after printing
    if (onPrintComplete && typeof onPrintComplete === 'function') {
      setTimeout(onPrintComplete, 1000); // Small delay to ensure print dialog is closed
    }
  };
};

export const printTable = (tableName, tableRef) => {
  if (!tableRef.current) return;

  const printWindow = window.open('', '_blank');
  const table = tableRef.current.cloneNode(true);

  // Remove print buttons from the cloned table
  const printButtons = table.querySelectorAll('.print-btn, .btn-print');
  printButtons.forEach(btn => btn.remove());

  // Create print-friendly HTML for table
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${tableName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
        }
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .print-header h1 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }
        .print-header p {
          margin: 5px 0;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 6px;
          text-align: left;
          font-size: 10px;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .bg-success {
          background-color: #d4edda !important;
        }
        .bg-warning {
          background-color: #fff3cd !important;
        }
        .text-white {
          color: #000 !important;
        }
        .fw-bold {
          font-weight: bold;
        }
        .text-center {
          text-align: center;
        }
        @media print {
          body { margin: 0; }
          table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>${tableName}</h1>
        <p>Production Date: ${new Date().toLocaleDateString()}</p>
        <p>Generated for Chef - Factory Use</p>
      </div>
      ${table.outerHTML}
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};
