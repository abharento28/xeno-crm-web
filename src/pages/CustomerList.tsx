import React, { useState, useEffect } from 'react';
import { 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  Loader,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define Customer type
interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  totalSpend: number;
  lastOrderDate: string | null;
  visitCount: number;
  createdAt: string;
}

// Production-ready API URL configuration
const isProduction = import.meta.env.PROD || process.env.NODE_ENV === 'production';
const API_URL = isProduction ? '/api' : 'http://localhost:3000/api';

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const fetchCustomers = async () => {
    console.log('CustomerList: Fetching customers...');
    setLoading(true);
    setError(null);
    setDeleteSuccess(null);
    setDeleteError(null);
    
    try {
      const response = await axios.get(`${API_URL}/customers`);
      console.log('CustomerList: Data received:', response.data);
      
      // Basic validation of the response
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      // Ensure we have an array
      if (!Array.isArray(response.data)) {
        console.error('Expected array, got:', typeof response.data);
        throw new Error('Invalid data format: expected an array');
      }
      
      setCustomers(response.data);
      setLoading(false);
      // Clear selection when new data is loaded
      setSelectedCustomers(new Set());
    } catch (err: any) {
      console.error('CustomerList: Failed to fetch customers:', err);
      setError(`Failed to load customers: ${err.message}`);
      setLoading(false);
      setCustomers([]); // Empty array to prevent rendering issues
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);
  
  // Refresh data when user clicks refresh button
  const handleRefresh = () => {
    fetchCustomers();
  };

  // Handle checkbox selection for a customer
  const handleSelectCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  // Handle "select all" checkbox
  const handleSelectAll = () => {
    if (selectedCustomers.size === sortedCustomers.length) {
      // If all are selected, deselect all
      setSelectedCustomers(new Set());
    } else {
      // Otherwise select all
      const allIds = new Set(sortedCustomers.map(customer => customer._id));
      setSelectedCustomers(allIds);
    }
  };

  // Handle delete selected customers
  const handleDeleteSelected = async () => {
    if (selectedCustomers.size === 0) return;
    
    // Clear any previous messages
    setDeleteError(null);
    setDeleteSuccess(null);
    setDeleteLoading(true);
    
    try {
      const customerIds = Array.from(selectedCustomers);
      const response = await axios.delete(`${API_URL}/customers`, { 
        data: { customerIds } 
      });
      
      console.log('Delete response:', response.data);
      setDeleteSuccess(`Successfully deleted ${response.data.deletedCount} customer(s)`);
      
      // Refresh the customer list
      fetchCustomers();
    } catch (err: any) {
      console.error('Failed to delete customers:', err);
      setDeleteError(`Failed to delete customers: ${err.response?.data?.error || err.message}`);
      setDeleteLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Safe data formatter for dates that handles missing or invalid data
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Error';
    }
  };
  
  // Safe formatter for currency that handles missing or invalid data
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === undefined || amount === null) return '$0';
    
    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (err) {
      console.error('Error formatting currency:', err);
      return '$0';
    }
  };

  const getSortedCustomers = () => {
    try {
      // Always work with a copy to avoid mutating the original
      let filteredCustomers = [...(customers || [])];
      
      console.log('Filtering customers:', filteredCustomers.length);
      
      // Filter by search term
      if (searchTerm) {
        filteredCustomers = filteredCustomers.filter(
          customer => 
            customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer?.phone?.includes(searchTerm)
        );
      }
      
      // Sort if a sort field is specified
      if (sortField) {
        filteredCustomers.sort((a, b) => {
          const aValue = a[sortField as keyof typeof a];
          const bValue = b[sortField as keyof typeof b];
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' 
              ? aValue.localeCompare(bValue) 
              : bValue.localeCompare(aValue);
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          return 0;
        });
      }
      
      console.log('Returning filtered customers:', filteredCustomers.length);
      return filteredCustomers;
    } catch (err) {
      console.error('Error in getSortedCustomers:', err);
      setError(`Error processing customer data: ${err}`);
      return []; // Return empty array on error
    }
  };

  // Try to safely get sorted customers, with error handling
  let sortedCustomers: Customer[] = [];
  try {
    sortedCustomers = getSortedCustomers();
  } catch (err) {
    console.error('Error getting sorted customers:', err);
    // Don't set error state here as it would cause a re-render loop
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-8 h-8 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 my-4">
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Bar */}
      <div className="sm:flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          {selectedCustomers.size > 0 && (
            <span className="ml-4 text-sm text-gray-600">
              {selectedCustomers.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {selectedCustomers.size > 0 ? (
            <button
              onClick={handleDeleteSelected}
              disabled={deleteLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleteLoading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Selected
            </button>
          ) : (
            <button
              onClick={() => navigate('/customers/add')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Customer
            </button>
          )}
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {deleteSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 my-4">
          <div className="flex">
            <CheckSquare className="h-5 w-5 text-green-400 mr-2" />
            <p>{deleteSuccess}</p>
          </div>
        </div>
      )}
      
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 my-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p>{deleteError}</p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white shadow-soft rounded-lg p-4">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search customers..."
            />
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white shadow-soft rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    onClick={handleSelectAll}
                    className="focus:outline-none"
                  >
                    {selectedCustomers.size === sortedCustomers.length && sortedCustomers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Customer</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('totalSpend')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Total Spend</span>
                    {sortField === 'totalSpend' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lastOrderDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Order</span>
                    {sortField === 'lastOrderDate' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('visitCount')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Visits</span>
                    {sortField === 'visitCount' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Customer Since</span>
                    {sortField === 'createdAt' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map((customer) => (
                <tr 
                  key={customer._id} 
                  className={`hover:bg-gray-50 ${selectedCustomers.has(customer._id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleSelectCustomer(customer._id)}
                      className="focus:outline-none"
                    >
                      {selectedCustomers.has(customer._id) ? (
                        <CheckSquare className="w-4 h-4 text-primary-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{customer.email}</div>
                        <div className="text-xs text-gray-500">{customer.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(customer.totalSpend)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(customer.lastOrderDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.visitCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedCustomers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-sm">No customers found matching your search criteria.</p>
          </div>
        )}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{sortedCustomers.length}</span> of{' '}
            <span className="font-medium">{customers.length}</span> customers
          </div>
          <div className="flex-1 flex justify-end">
            <button
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerList;