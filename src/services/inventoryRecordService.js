const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sunny-b.onrender.com';

class InventoryRecordService {
  // Get all records with optional filtering
  static async getRecords(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.itemName) queryParams.append('itemName', params.itemName);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`${API_BASE_URL}/inventory-records?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch records');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching records:', error);
      throw error;
    }
  }

  // Get monthly records
  static async getMonthlyRecords(months = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory-records/monthly?months=${months}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch monthly records');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching monthly records:', error);
      throw error;
    }
  }

  // Create new record
  static async createRecord(recordData) {
    try {
      console.log('🔍 Debug: Creating inventory record with data:', JSON.stringify(recordData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/inventory-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });
      
      console.log('🔍 Debug: Response status:', response.status);
      console.log('🔍 Debug: Response ok:', response.ok);
      console.log('🔍 Debug: Response headers:', Object.fromEntries(response.headers.entries()));
      
      let data;
      try {
        data = await response.json();
        console.log('🔍 Debug: Response data:', data);
      } catch (parseError) {
        console.error('🔍 Debug: Could not parse response as JSON:', parseError);
        const errorText = await response.text();
        console.error('🔍 Debug: Response text:', errorText);
        throw new Error(`Server returned invalid JSON: ${errorText}`);
      }
      
      if (!response.ok) {
        let errorMessage = data.message || 'Failed to create record';
        
        // Add specific error handling for common HTTP status codes
        if (response.status === 400) {
          if (data.errors && Array.isArray(data.errors)) {
            errorMessage = `Validation failed: ${data.errors.join(', ')}`;
          } else {
            errorMessage = `Bad Request: ${errorMessage}`;
          }
        } else if (response.status === 401) {
          errorMessage = `Unauthorized: ${errorMessage}`;
        } else if (response.status === 403) {
          errorMessage = `Forbidden: ${errorMessage}`;
        } else if (response.status === 404) {
          errorMessage = `Not Found: ${errorMessage}`;
        } else if (response.status === 500) {
          errorMessage = `Server Error: ${errorMessage}`;
        } else if (response.status === 0) {
          errorMessage = `Network Error: Unable to connect to server. Check if server is running and accessible.`;
        }
        
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error creating record:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Update record
  static async updateRecord(id, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory-records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update record');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  // Delete record
  static async deleteRecord(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory-records/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete record');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  // Export records as CSV
  static async exportRecords(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.itemName) queryParams.append('itemName', params.itemName);

      const response = await fetch(`${API_BASE_URL}/inventory-records/export?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export records');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-records-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true, message: 'Export successful' };
    } catch (error) {
      console.error('Error exporting records:', error);
      throw error;
    }
  }

  // Export monthly records as Excel with daily sheets
  static async exportMonthlyRecords(month = null, year = null) {
    try {
      const queryParams = new URLSearchParams();
      
      if (month) queryParams.append('month', month);
      if (year) queryParams.append('year', year);

      const response = await fetch(`${API_BASE_URL}/inventory-records/export-monthly?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export monthly records');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename based on month/year
      const currentDate = new Date();
      const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();
      const monthName = new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' });
      
      a.download = `inventory-${monthName}-${targetYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true, message: 'Monthly Excel export successful' };
    } catch (error) {
      console.error('Error exporting monthly records:', error);
      throw error;
    }
  }

  // Get summary statistics
  static async getSummary(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await fetch(`${API_BASE_URL}/inventory-records/summary?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch summary');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  }
}

export default InventoryRecordService;
