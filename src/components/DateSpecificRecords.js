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
  Typography,
  Table,
  Drawer,
  Spin,
  Empty
} from 'antd';
import { 
  DownloadOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import InventoryRecordService from '../services/inventoryRecordService';
import './DateSpecificRecords.css';

const { Text, Title } = Typography;

const DateSpecificRecords = ({ 
  isVisible, 
  onClose, 
  selectedDate = null,
  onDateChange = null 
}) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate || dayjs());
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalReceived: 0,
    totalConsumed: 0,
    totalOpeningStock: 0,
    totalFinalStock: 0
  });

  // Load records for specific date
  const loadDateRecords = async (date) => {
    if (!date) return;
    
    try {
      setLoading(true);
      const startDate = date.startOf('day').toISOString();
      const endDate = date.endOf('day').toISOString();
      
      const response = await InventoryRecordService.getRecords({
        startDate,
        endDate,
        limit: 1000
      });
      
      setRecords(response.data || []);
      calculateSummary(response.data || []);
    } catch (error) {
      message.error('Failed to load records: ' + error.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary for the date
  const calculateSummary = (dateRecords) => {
    if (!dateRecords || dateRecords.length === 0) {
      setSummary({
        totalItems: 0,
        totalReceived: 0,
        totalConsumed: 0,
        totalOpeningStock: 0,
        totalFinalStock: 0
      });
      return;
    }

    const summary = dateRecords.reduce((acc, record) => {
      acc.totalItems++;
      acc.totalOpeningStock += parseFloat(record.openingStock || 0);
      acc.totalReceived += parseFloat(record.received || 0) + parseFloat(record.received2 || 0);
      acc.totalConsumed += parseFloat(record.consumed || 0) + parseFloat(record.consumed2 || 0);
      acc.totalFinalStock += parseFloat(record.total2 || record.total || 0);
      return acc;
    }, {
      totalItems: 0,
      totalReceived: 0,
      totalConsumed: 0,
      totalOpeningStock: 0,
      totalFinalStock: 0
    });

    setSummary(summary);
  };

  // Handle date change
  const handleDateChange = (date) => {
    if (date) {
      setCurrentDate(date);
      if (onDateChange) {
        onDateChange(date);
      }
      loadDateRecords(date);
    }
  };

  // Export data for specific date
  const exportDateData = async () => {
    try {
      const dateStr = currentDate.format('YYYY-MM-DD');
      await InventoryRecordService.exportMonthlyRecords(
        currentDate.month() + 1, 
        currentDate.year()
      );
      message.success(`Exported ${dateStr} data successfully`);
    } catch (error) {
      message.error('Failed to export data: ' + error.message);
    }
  };

  // Filter records based on search term
  const filteredRecords = records.filter(record =>
    record.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate table columns
  const generateColumns = () => [
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
      width: 200,
      fixed: 'left',
      render: (text) => <strong>{text}</strong>
    },
    // Opening Stock column hidden intentionally
    {
      title: 'Received',
      children: [
        {
          title: 'R1',
          dataIndex: 'received',
          key: 'received',
          width: 80,
          align: 'right',
          render: (value) => (
            <span className="positive-value">
              {parseFloat(value || 0).toFixed(2)}
            </span>
          )
        },
        {
          title: 'R2',
          dataIndex: 'received2',
          key: 'received2',
          width: 80,
          align: 'right',
          render: (value) => (
            <span className="positive-value">
              {parseFloat(value || 0).toFixed(2)}
            </span>
          )
        }
      ]
    },
    {
      title: 'Consumed',
      children: [
        {
          title: 'C1',
          dataIndex: 'consumed',
          key: 'consumed',
          width: 80,
          align: 'right',
          render: (value) => (
            <span className="negative-value">
              {parseFloat(value || 0).toFixed(2)}
            </span>
          )
        },
        {
          title: 'C2',
          dataIndex: 'consumed2',
          key: 'consumed2',
          width: 80,
          align: 'right',
          render: (value) => (
            <span className="negative-value">
              {parseFloat(value || 0).toFixed(2)}
            </span>
          )
        }
      ]
    },
    // First Total column hidden intentionally
    {
      title: 'Final Stock',
      dataIndex: 'total2',
      key: 'total2',
      width: 120,
      align: 'right',
      render: (value, record) => (
        <span className="final-stock">
          {parseFloat(value || record.total || 0).toFixed(2)}
        </span>
      )
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center',
      render: (value) => (
        <span className="unit-text">
          {value || 'kg'}
        </span>
      )
    }
  ];

  // Load records when component mounts or date changes
  useEffect(() => {
    if (isVisible && currentDate) {
      loadDateRecords(currentDate);
    }
  }, [isVisible, currentDate]);

  // Update current date when selectedDate prop changes
  useEffect(() => {
    if (selectedDate && !selectedDate.isSame(currentDate, 'day')) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>Records for {currentDate.format('DD MMMM YYYY')}</span>
        </div>
      }
      placement="right"
      width="95%"
      onClose={onClose}
      open={isVisible}
      extra={
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={exportDateData}
            type="primary"
          >
            Export Excel
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={onClose}
          >
            Close
          </Button>
        </Space>
      }
    >
      <div style={{ padding: '0 16px' }}>
        {/* Date Selector */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: '500' }}>Select Date:</span>
              </div>
            </Col>
            <Col span={8}>
              <DatePicker
                value={currentDate}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                allowClear={false}
              />
            </Col>
            <Col span={8}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadDateRecords(currentDate)}
                loading={loading}
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Summary Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {summary.totalItems}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Items</div>
              </div>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {summary.totalOpeningStock.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Opening Stock</div>
              </div>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {summary.totalReceived.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Received</div>
              </div>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {summary.totalConsumed.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Consumed</div>
              </div>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  {summary.totalFinalStock.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Final Stock</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Search Bar */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Input
                placeholder="Search item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col span={8}>
              <Text type="secondary">
                Showing {filteredRecords.length} of {records.length} items
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Records Table */}
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Loading records...</div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <Empty
              description={
                <div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    {searchTerm ? 'No items found matching your search' : 'No records for this date'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {searchTerm ? 'Try adjusting your search terms' : 'Records will appear here once data is saved for this date'}
                  </div>
                </div>
              }
            />
          ) : (
            <Table
              columns={generateColumns()}
              dataSource={filteredRecords}
              rowKey="itemName"
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} items`
              }}
              scroll={{ x: 1200, y: 600 }}
              size="small"
              bordered
              className="date-records-table"
            />
          )}
        </Card>
      </div>
    </Drawer>
  );
};

export default DateSpecificRecords;
