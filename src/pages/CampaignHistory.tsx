import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  BarChart3, 
  ChevronDown,
  ChevronUp,
  Users,
  TrendingUp,
  Tag,
  Zap,
  AlertCircle,
  Check,
  Loader,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

// Define Campaign type
interface Rule {
  field: string;
  operator: string;
  value: string;
  logicGate?: string;
}
interface Campaign {
  _id: string;
  name: string;
  audienceQuery: Rule[];
  createdAt: string;
  summary?: string;
}

// Production-ready API URL configuration
const isProduction = import.meta.env.PROD || process.env.NODE_ENV === 'production';
const API_URL = isProduction ? '/api' : 'http://localhost:3000/api';

const CampaignHistory: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/campaigns`);
      console.log('CampaignHistory: Data received:', response.data);
      
      // Basic validation of the response
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      // Ensure we have an array
      if (!Array.isArray(response.data)) {
        console.error('Expected array, got:', typeof response.data);
        throw new Error('Invalid data format: expected an array');
      }
      
      setCampaigns(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('CampaignHistory: Failed to fetch campaigns:', err);
      setError(`Failed to load campaigns: ${err.message}`);
      setLoading(false);
      setCampaigns([]); // Empty array to prevent rendering issues
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchCampaigns();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedCampaigns = () => {
    try {
      let filteredCampaigns = [...campaigns];
      
      // Filter by search term
      if (searchTerm) {
        filteredCampaigns = filteredCampaigns.filter(
          campaign => campaign?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Sort
      filteredCampaigns.sort((a, b) => {
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
      
      return filteredCampaigns;
    } catch (err) {
      console.error('Error sorting campaigns:', err);
      return [];
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (err) {
      return 'Error formatting date';
    }
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'percent', 
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  const getCampaignTypeColor = (campaign: Campaign) => {
    // Simple logic to assign different colors based on name patterns
    const name = campaign.name.toLowerCase();
    if (name.includes('discount') || name.includes('sale')) return 'bg-blue-500';
    if (name.includes('engagement') || name.includes('re-engagement')) return 'bg-purple-500';
    if (name.includes('appreciation') || name.includes('loyalty')) return 'bg-emerald-500';
    if (name.includes('recovery')) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  const getCampaignStatusBadge = (campaign: Campaign) => {
    // Decide status based on summary content for demo purposes
    const summary = campaign.summary?.toLowerCase() || '';
    
    if (summary.includes('ongoing')) {
      return (
        <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          <Loader className="w-3 h-3 mr-1 animate-spin" />
          In Progress
        </span>
      );
    }
    
    return (
      <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        <Check className="w-3 h-3 mr-1" />
        Completed
      </span>
    );
  };

  const sortedCampaigns = getSortedCampaigns();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-8 h-8 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading campaigns...</p>
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaign History</h1>
        <button 
          onClick={handleRefresh}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search campaigns..."
          />
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Campaign</span>
                    {sortField === 'name' && (
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
                    <span>Date</span>
                    {sortField === 'createdAt' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('audienceSize')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Audience</span>
                    {sortField === 'audienceSize' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCampaigns.map((campaign) => (
                <React.Fragment key={campaign._id}>
                  <tr className={`hover:bg-gray-50 transition-colors duration-150 ${expandedCampaign === campaign._id ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center text-white ${getCampaignTypeColor(campaign)}`}>
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(campaign.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <div className="text-sm text-gray-900">{campaign.audienceQuery.length} customers</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCampaignStatusBadge(campaign)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setExpandedCampaign(expandedCampaign === campaign._id ? null : campaign._id)}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md ${
                          expandedCampaign === campaign._id
                            ? 'text-white bg-primary-600 hover:bg-primary-700' 
                            : 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                        } transition-colors duration-200`}
                      >
                        {expandedCampaign === campaign._id ? 'Hide Details' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedCampaign === campaign._id && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-5">
                        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform animate-fade-in">
                          <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                                <p className="text-sm text-gray-500">Created on {formatDate(campaign.createdAt)}</p>
                              </div>
                              {getCampaignStatusBadge(campaign)}
                            </div>
                          </div>
                          
                          <div className="p-6 grid md:grid-cols-2 gap-6">
                            <div>
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg border border-indigo-100 mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                  <BarChart3 className="w-4 h-4 text-primary-500 mr-2" />
                                  Performance Summary
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {campaign.summary || "No summary available for this campaign."}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                  <Tag className="w-4 h-4 text-primary-500 mr-2" />
                                  Target Audience
                                </h4>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                    <div className="flex items-center space-x-2">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-700">
                                        {campaign.audienceQuery.length} Segment Rules
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <div className="space-y-3">
                                      {campaign.audienceQuery.map((rule, index) => (
                                        <div key={index} className="flex items-center p-2 rounded-md bg-gray-50 border border-gray-100">
                                          {index > 0 && (
                                            <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-indigo-800 bg-indigo-100 rounded">
                                              {rule.logicGate}
                                            </span>
                                          )}
                                          <div className="flex items-center">
                                            <span className="text-gray-700 font-medium">{rule.field}</span>
                                            <span className="mx-2 text-gray-500 font-mono">{rule.operator}</span>
                                            <span className="text-gray-700">{rule.value}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                                  <TrendingUp className="w-4 h-4 text-primary-500 mr-2" />
                                  Campaign Analytics
                                </h4>
                                
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-700">Delivery Rate</span>
                                      <span className="text-xs font-semibold text-gray-900">94%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-700">Open Rate</span>
                                      <span className="text-xs font-semibold text-gray-900">67%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="flex justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-700">Click Rate</span>
                                      <span className="text-xs font-semibold text-gray-900">35%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                      <div className="text-2xl font-bold text-gray-900">
                                        {(campaign.audienceQuery.length * 0.12).toFixed(0)}
                                      </div>
                                      <div className="text-xs text-gray-500">Conversions</div>
                                    </div>
                                    <div>
                                      <div className="text-2xl font-bold text-gray-900">
                                        ${(campaign.audienceQuery.length * 3.24).toFixed()}
                                      </div>
                                      <div className="text-xs text-gray-500">Revenue</div>
                                    </div>
                                    <div>
                                      <div className="text-2xl font-bold text-gray-900">
                                        ${(3.24 / 0.12).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-500">Avg. Value</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 p-4">
                                <div className="flex items-start">
                                  <AlertCircle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h5 className="text-sm font-medium text-amber-800 mb-1">Optimization Tip</h5>
                                    <p className="text-xs text-amber-700">
                                      This campaign could benefit from more specific targeting criteria. Consider adding more segment rules to increase conversion rates.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <button 
                              onClick={() => setExpandedCampaign(null)}
                              className="text-sm text-gray-500 hover:text-gray-700">
                              Close Details
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {sortedCampaigns.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-sm">No campaigns found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignHistory;