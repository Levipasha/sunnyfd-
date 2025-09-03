import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  DatePicker, 
  Space, 
  message, 
  Card, 
  Row, 
  Col, 
  Statistic,
  Typography,
  Table,
  Drawer,
  Badge
} from 'antd';
import { 
  DownloadOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  FilterOutlined,
  FileExcelOutlined,
  FolderOpenOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import InventoryRecordService from '../services/inventoryRecordService';
import DateSpecificRecords from './DateSpecificRecords';

import './InventoryRecords.css';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const InventoryRecords = ({ isAuthenticated }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    itemName: ''
  });

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthlyData, setMonthlyData] = useState({});
  const [excelDrawerVisible, setExcelDrawerVisible] = useState(false);
  const [autoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  
  // Date-specific view state
  const [dateSpecificVisible, setDateSpecificVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);


  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalReceived: 0,
    totalConsumed: 0,
    totalOpeningStock: 0,
    totalFinalStock: 0,
    uniqueItems: 0
  });

  // Auto-save timer
  useEffect(() => {
    if (autoSaveEnabled) {
      const interval = setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Auto-save every hour between 6 AM and 6 PM
        if (currentHour >= 6 && currentHour < 18) {
          handleAutoSave();
        }
      }, 3600000); // Check every hour

      return () => clearInterval(interval);
    }
  }, [autoSaveEnabled, records]);

  // Load records on component mount
  useEffect(() => {
    loadRecords();
    loadSummary();
    generateMonthlyFiles();
  }, [filters]);



  // Load records based on filters
  const loadRecords = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
        limit: 10000
      };
      
      const response = await InventoryRecordService.getRecords(params);
      setRecords(response.data);
    } catch (error) {
      message.error('Failed to load records: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load summary statistics
  const loadSummary = async () => {
    try {
      const params = {
        startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString() : undefined
      };
      
      const response = await InventoryRecordService.getSummary(params);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  // Generate monthly files with item-based layout
  const generateMonthlyFiles = () => {
    const monthlyFiles = {};
    
    // Group records by month
    records.forEach(record => {
      const date = dayjs(record.date);
      const monthKey = `${date.format('YYYY-MM')}`;
      const monthName = date.format('MMMM YYYY');
      
      if (!monthlyFiles[monthKey]) {
        monthlyFiles[monthKey] = {
          name: monthName,
          key: monthKey,
          records: [],
          items: new Set(),
          dates: new Set(),
          itemData: {},
          totalItems: 0,
          totalReceived: 0,
          totalConsumed: 0,
          totalFinal: 0,
          lastUpdated: null,
          isEmpty: false
        };
      }
      
      monthlyFiles[monthKey].records.push(record);
      monthlyFiles[monthKey].items.add(record.itemName);
      monthlyFiles[monthKey].dates.add(date.format('YYYY-MM-DD'));
      
      // Store item data by date
      if (!monthlyFiles[monthKey].itemData[record.itemName]) {
        monthlyFiles[monthKey].itemData[record.itemName] = {};
      }
      monthlyFiles[monthKey].itemData[record.itemName][date.format('YYYY-MM-DD')] = {
        received1: record.received || 0,
        consumed1: record.consumed || 0,
        received2: record.received2 || 0,
        consumed2: record.consumed2 || 0,
        total: record.total2 || record.total || 0,
        unit: record.unit || 'kg',
        saved: true,
        _id: record._id // Add record ID for reference
      };
      
      const recordDate = dayjs(record.date);
      if (!monthlyFiles[monthKey].lastUpdated || recordDate.isAfter(monthlyFiles[monthKey].lastUpdated)) {
        monthlyFiles[monthKey].lastUpdated = recordDate;
      }
    });
    
    // Process each month to fill missing data and add all dates
    Object.keys(monthlyFiles).forEach(monthKey => {
      const month = monthlyFiles[monthKey];
      
      // Generate all dates for the month
      const [year, monthNum] = monthKey.split('-');
      const startOfMonth = dayjs(`${year}-${monthNum}-01`);
      const endOfMonth = startOfMonth.endOf('month');
      const allDates = [];
      
      let currentDate = startOfMonth;
      while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth, 'day')) {
        allDates.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(1, 'day');
      }
      
      // Add all dates to the month
      allDates.forEach(date => {
        month.dates.add(date);
      });
      
      const sortedDates = Array.from(month.dates).sort();
      
      // Fill missing data for each item for all dates
      Array.from(month.items).forEach(itemName => {
        sortedDates.forEach((date) => {
          if (!month.itemData[itemName][date]) {
            // Fill with empty data for missing dates
            month.itemData[itemName][date] = {
              received1: 0,
              consumed1: 0,
              received2: 0,
              consumed2: 0,
              total: 0,
              unit: 'kg',
              saved: false,
              editable: true
            };
          } else {
            // Mark existing data as saved and not editable
            month.itemData[itemName][date].saved = true;
            month.itemData[itemName][date].editable = false;
          }
        });
      });
      
      // Calculate totals
      month.totalItems = month.items.size;
      month.totalReceived = month.records.reduce((sum, r) => sum + (r.received || 0) + (r.received2 || 0), 0);
      month.totalConsumed = month.records.reduce((sum, r) => sum + (r.consumed || 0) + (r.consumed2 || 0), 0);
      month.totalFinal = month.records.reduce((sum, r) => sum + (r.total2 || r.total || 0), 0);
    });
    
    // Add current month if it doesn't exist
    const currentMonthKey = dayjs().format('YYYY-MM');
    const currentMonthName = dayjs().format('MMMM YYYY');
    
    if (!monthlyFiles[currentMonthKey]) {
      monthlyFiles[currentMonthKey] = {
        name: currentMonthName,
        key: currentMonthKey,
        records: [],
        items: new Set(),
        dates: new Set(),
        itemData: {},
        totalItems: 0,
        totalReceived: 0,
        totalConsumed: 0,
        totalFinal: 0,
        lastUpdated: null,
        isEmpty: true
      };
      
      // Generate all dates for current month
      const startOfMonth = dayjs().startOf('month');
      const endOfMonth = dayjs().endOf('month');
      const allDates = [];
      
      let currentDate = startOfMonth;
      while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth, 'day')) {
        allDates.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(1, 'day');
      }
      
      allDates.forEach(date => {
        monthlyFiles[currentMonthKey].dates.add(date);
      });
    }
    

    
    setMonthlyData(monthlyFiles);
  };

  // Handle auto-save
  const handleAutoSave = async () => {
    try {
      const now = new Date();
      
      // Auto-save is now completely automatic - no manual intervention needed
      // The system will automatically sync with inventory items and save data
      setLastAutoSave(now);
      
      // Reload data to ensure latest inventory items are included
      await loadRecords();
      await loadSummary();
      generateMonthlyFiles();
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };











  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Open Excel-like view for a month
  const openMonthData = (monthKey) => {
    const monthData = monthlyData[monthKey];
    if (monthData) {
      setSelectedMonth(monthData);
      setExcelDrawerVisible(true);
    }
  };

  // Open date-specific view for a month
  const openDateSpecificView = (monthKey) => {
    // Set the first day of the month as default selected date
    const [year, month] = monthKey.split('-');
    const defaultDate = dayjs(`${year}-${month}-01`);
    setSelectedDate(defaultDate);
    setDateSpecificVisible(true);
  };

  // Export month data
  const exportMonthData = async (monthKey) => {
    try {
      const monthData = monthlyData[monthKey];
      if (monthData) {
        const [year, month] = monthKey.split('-');
        await InventoryRecordService.exportMonthlyRecords(parseInt(month), parseInt(year));
        message.success(`Exported ${monthData.name} successfully`);
      }
    } catch (error) {
      message.error('Failed to export month data: ' + error.message);
    }
  };

  // Helper function to render data cells
  const renderDataCell = (value, record, date, className = '') => {
    const dateData = record[date];
    const isSaved = dateData && dateData.saved;
    const isEditable = dateData && dateData.editable;
    const isFutureDate = dayjs(date).isAfter(dayjs(), 'day');
    
    return (
      <span 
        className={`${className} ${isSaved ? 'saved-data' : isEditable ? 'editable-data' : 'future-data'}`} 
        style={{ 
          fontSize: '11px',
          opacity: isSaved ? 0.7 : isFutureDate ? 0.4 : 1,
          backgroundColor: isSaved ? '#f5f5f5' : isFutureDate ? '#f0f0f0' : 'transparent',
          padding: isSaved || isFutureDate ? '2px 4px' : '0',
          borderRadius: isSaved || isFutureDate ? '2px' : '0',
          border: isFutureDate ? '1px dashed #d9d9d9' : 'none',
          cursor: isEditable && !isFutureDate ? 'pointer' : 'default'
        }}
        title={isFutureDate ? 'Future date - data will be available from 6 AM' : isSaved ? 'Saved data - cannot be modified' : 'Editable data'}
      >
        {value || 0}
      </span>
    );
  };

  // Generate item-based table columns
  const generateItemBasedColumns = (monthData) => {
    if (!monthData) return [];
    
    const sortedDates = Array.from(monthData.dates).sort();
    const baseColumns = [
      {
        title: 'S.No',
        dataIndex: 'serialNo',
        key: 'serialNo',
        width: 60,
        fixed: 'left',
        render: (_, __, index) => index + 1
      },
      {
        title: 'Item Name',
        dataIndex: 'itemName',
        key: 'itemName',
        width: 150,
        fixed: 'left',
        render: (text) => <strong>{text}</strong>
      }
    ];

    const dateColumns = sortedDates.map(date => ({
      title: dayjs(date).format('DD/MM'),
      dataIndex: date,
      key: date,
      width: 200,
      children: [
        {
          title: 'R1',
          dataIndex: [date, 'received1'],
          key: `${date}-received1`,
          width: 50,
          align: 'center',
          render: (value, record) => renderDataCell(value, record, date, 'positive-value')
        },
        {
          title: 'C1',
          dataIndex: [date, 'consumed1'],
          key: `${date}-consumed1`,
          width: 50,
          align: 'center',
          render: (value, record) => renderDataCell(value, record, date, 'negative-value')
        },
        {
          title: 'R2',
          dataIndex: [date, 'received2'],
          key: `${date}-received2`,
          width: 50,
          align: 'center',
          render: (value, record) => renderDataCell(value, record, date, 'positive-value')
        },
        {
          title: 'C2',
          dataIndex: [date, 'consumed2'],
          key: `${date}-consumed2`,
          width: 50,
          align: 'center',
          render: (value, record) => renderDataCell(value, record, date, 'negative-value')
        },
        {
          title: 'Total',
          dataIndex: [date, 'total'],
          key: `${date}-total`,
          width: 60,
          align: 'center',
          render: (value, record) => renderDataCell(value, record, date, 'total-value')
        }
      ]
    }));

    const actionColumn = []; // Removed actions column completely

    return [...baseColumns, ...dateColumns, ...actionColumn];
  };

  // Generate item-based data source
  const generateItemBasedDataSource = (monthData) => {
    if (!monthData) return [];
    
    const sortedDates = Array.from(monthData.dates).sort();
    
    // Get all items from records
    let items = Array.from(monthData.items).sort();
    
    // If no items exist, fetch from inventory or use empty array
    if (items.length === 0) {
      items = [];
    }
    
    return items.map((itemName, index) => {
      const itemData = {
        key: itemName,
        itemName: itemName,
        serialNo: index + 1
      };
      
      sortedDates.forEach(date => {
        const dateData = monthData.itemData[itemName]?.[date] || {
          received1: 0,
          consumed1: 0,
          received2: 0,
          consumed2: 0,
          total: 0,
          unit: 'kg',
          saved: false,
          editable: false // No data is editable
        };
        
        itemData[date] = dateData;
      });
      
      return itemData;
    });
  };

  // Render monthly file card
  const renderMonthlyFile = (monthKey, monthData) => {
    const isCurrentMonth = dayjs().format('YYYY-MM') === monthKey;
    const hasTodayData = monthData.records.some(record => 
      dayjs(record.date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    );
    const isEmpty = monthData.isEmpty || monthData.records.length === 0;

    return (
      <Card 
        key={monthKey} 
        className={`monthly-file-card ${isEmpty ? 'empty-month-card' : ''}`}
        style={{ 
          marginBottom: 16,
          border: isEmpty ? '2px dashed #d9d9d9' : '1px solid #e8e8e8',
          backgroundColor: isEmpty ? '#fafafa' : 'white'
        }}
      >
        <Row align="middle" justify="space-between">
          <Col span={10}>
            <div className="monthly-file-info">
              <Title level={4} style={{ 
                margin: 0, 
                color: isEmpty ? '#999' : '#1890ff' 
              }}>
                {monthData.name}
                {isEmpty && <Text type="secondary" style={{ fontSize: '14px', marginLeft: 8 }}>(Empty)</Text>}
              </Title>
              <Space size="small">
                <Text type="secondary">
                  {monthData.totalItems} items • {monthData.records.length} records • 
                  {isEmpty ? ' No data yet' : ` Last updated: ${monthData.lastUpdated ? dayjs(monthData.lastUpdated).format('DD/MM/YYYY') : 'N/A'}`}
                </Text>
                {isCurrentMonth && <Badge status="processing" text="Current Month" />}
                {hasTodayData && <Badge status="success" text="Today's Data" />}
                {isEmpty && <Badge status="warning" text="Empty" />}
              </Space>
            </div>
          </Col>
          <Col span={6}>
            <Row gutter={8} justify="end">
              <Col span={6}>
                <div className="monthly-summary">
                  <Text type="secondary" style={{ fontSize: '10px' }}>Items</Text>
                  <br />
                  <Text strong style={{ fontSize: '12px' }}>{monthData.totalItems}</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="monthly-summary">
                  <Text type="secondary" style={{ fontSize: '10px' }}>Received</Text>
                  <br />
                  <Text strong style={{ fontSize: '12px', color: '#52c41a' }}>{monthData.totalReceived}</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="monthly-summary">
                  <Text type="secondary" style={{ fontSize: '10px' }}>Consumed</Text>
                  <br />
                  <Text strong style={{ fontSize: '12px', color: '#fa8c16' }}>{monthData.totalConsumed}</Text>
                </div>
              </Col>
              <Col span={6}>
                <div className="monthly-summary">
                  <Text type="secondary" style={{ fontSize: '10px' }}>Final</Text>
                  <br />
                  <Text strong style={{ fontSize: '12px', color: '#722ed1' }}>{monthData.totalFinal}</Text>
                </div>
              </Col>
            </Row>
          </Col>
          <Col span={6}>
            <Space>
              <Button
                type="primary"
                icon={<FolderOpenOutlined />}
                onClick={() => openMonthData(monthKey)}
                size="small"
              >
                Open
              </Button>
              <Button
                type="default"
                icon={<CalendarOutlined />}
                onClick={() => openDateSpecificView(monthKey)}
                size="small"
                style={{ borderColor: '#52c41a', color: '#52c41a' }}
              >
                Date View
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => exportMonthData(monthKey)}
                size="small"
                disabled={isEmpty}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const monthlyFilesList = Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
    .map(([monthKey, monthData]) => renderMonthlyFile(monthKey, monthData));

  return (
    <div className="inventory-records">
      {/* Header */}
      <div className="page-header">
        <h1>Inventory Records</h1>
        <p>Automatic inventory tracking system - Data syncs with inventory items and saves automatically (6 AM - 6 PM daily cycle)</p>
      </div>



      {/* Auto-save Status */}
      <Card className="auto-save-status" style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <ClockCircleOutlined style={{ color: '#52c41a' }} />
              <Text strong>Automatic System: Active</Text>
              {lastAutoSave && (
                <Text type="secondary">
                  Last sync: {dayjs(lastAutoSave).format('DD/MM/YYYY HH:mm')}
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <Text type="secondary">
              Data syncs automatically with inventory items
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16} className="summary-stats">
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Records"
              value={summary.totalRecords}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Opening Stock"
              value={summary.totalOpeningStock}
              valueStyle={{ color: '#1890ff' }}
              suffix="units"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Received"
              value={summary.totalReceived}
              valueStyle={{ color: '#52c41a' }}
              suffix="units"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Consumed"
              value={summary.totalConsumed}
              valueStyle={{ color: '#fa8c16' }}
              suffix="units"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Final Stock"
              value={summary.totalFinalStock}
              valueStyle={{ color: '#722ed1' }}
              suffix="units"
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Unique Items"
              value={summary.uniqueItems}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className="filters-card">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              value={[filters.startDate, filters.endDate]}
              onChange={(dates) => {
                setFilters(prev => ({
                  ...prev,
                  startDate: dates ? dates[0] : null,
                  endDate: dates ? dates[1] : null
                }));
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="Search item name"
              value={filters.itemName}
              onChange={(e) => handleFilterChange('itemName', e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Button
              icon={<FilterOutlined />}
              onClick={loadRecords}
              loading={loading}
            >
              Filter
            </Button>
          </Col>
          <Col span={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({
                  startDate: null,
                  endDate: null,
                  itemName: ''
                });
              }}
            >
              Clear Filters
            </Button>
          </Col>


        </Row>
      </Card>

      {/* Monthly Files Display */}
      <div className="monthly-files-container">
        {loading ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="ant-spin ant-spin-lg ant-spin-spinning">
                <span className="ant-spin-dot ant-spin-dot-spin">
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                </span>
              </div>
              <div style={{ marginTop: 16 }}>Loading monthly files...</div>
            </div>
          </Card>
        ) : monthlyFilesList.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: 16 }}>📁</div>
              <Title level={4} style={{ color: '#999' }}>Loading monthly files...</Title>
              <Text type="secondary">Please wait while the system generates monthly files</Text>
            </div>
          </Card>
        ) : (
          <div>
            {monthlyFilesList}
          </div>
        )}
      </div>

      {/* Item-based Excel-like Drawer */}
      <Drawer
        title={
          <div>
            <FileExcelOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            {selectedMonth?.name} - Item-based View
          </div>
        }
        placement="right"
        width="95%"
        onClose={() => setExcelDrawerVisible(false)}
        open={excelDrawerVisible}
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => selectedMonth && exportMonthData(selectedMonth.key)}
            >
              Export Excel
            </Button>
          </Space>
        }
      >
        <Table
          columns={generateItemBasedColumns(selectedMonth)}
          dataSource={generateItemBasedDataSource(selectedMonth)}
          rowKey="itemName"
          pagination={false}
          scroll={{ x: 1500, y: 600 }}
          size="small"
          bordered
          className="excel-table"
        />
      </Drawer>

      {/* Date-specific Records View */}
      <DateSpecificRecords
        isVisible={dateSpecificVisible}
        onClose={() => setDateSpecificVisible(false)}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

    </div>
  );
};

export default InventoryRecords;
