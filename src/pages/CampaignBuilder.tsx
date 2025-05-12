import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

const CampaignBuilder: React.FC = () => {
  const [nlPrompt, setNlPrompt] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [rules, setRules] = useState<any[]>([]);
  const [messageSuggestion, setMessageSuggestion] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const WEBHOOK_URL = 'https://hook.eu2.make.com/1n09xpp8jso7gnqv3lndna60ymdev2rt';

  // Fetch customers from API using the same method as CustomerList.tsx
  const fetchCustomers = async () => {
    console.log('CampaignBuilder: Fetching customers...');
    setLoadingCustomers(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/customers`);
      console.log('CampaignBuilder: Data received:', response.data);
      
      // Basic validation of the response
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      // Ensure we have an array
      if (!Array.isArray(response.data)) {
        console.error('Expected array, got:', typeof response.data);
        throw new Error('Invalid data format: expected an array');
      }
      
      setAllCustomers(response.data);
      setFilteredCustomers(response.data); // Show all customers
      console.log(`Loaded ${response.data.length} customers from database`);
    } catch (err: any) {
      console.error('CampaignBuilder: Failed to fetch customers:', err);
      setError(`Failed to load customers: ${err.message}`);
      setAllCustomers([]); // Empty array to prevent rendering issues
      setFilteredCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const fetchFromGroq = async (messages: any[]) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error('API key is missing.');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  };

  const handleGenerateFromNL = async () => {
    setLoadingRules(true);
    try {
      const messages = [
        {
          role: 'system',
          content:
            'You are a helpful assistant that converts marketing descriptions into structured targeting rules in strict JSON format. Return only JSON and follow this format exactly:\n{\n  "rules": [\n    {\n      "field": "string",\n      "operator": "string",\n      "value": "any",\n      "logicGate": "AND/OR/NOT"\n    }\n  ]\n}',
        },
        {
          role: 'user',
          content: `Generate targeting rules for this description:\n"${nlPrompt}"`,
        },
      ];

      const content = await fetchFromGroq(messages);
      console.log('Raw response for rules:', content);

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        throw new Error('Failed to parse JSON. Model response was not valid JSON.');
      }

      const generatedRules = parsed.rules.map((rule: any, index: number) => ({
        id: `rule-${index + 1}`,
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
        logicGate: rule.logicGate,
      }));

      setRules(generatedRules);
      
      // Per request, we're keeping all customers visible regardless of rules
      // filterCustomers(generatedRules);
    } catch (error) {
      console.error('Error generating rules:', error);
      if (error instanceof Error) alert(`Error: ${error.message}`);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleGenerateMessage = async () => {
    setLoadingMessage(true);
    try {
      const messages = [
        {
          role: 'system',
          content:
            'You are a creative assistant that writes short, catchy marketing messages based on campaign names. Keep it under 20 words.',
        },
        {
          role: 'user',
          content: `Generate a campaign message for this campaign name: "${campaignName}"`,
        },
      ];

      const content = await fetchFromGroq(messages);
      console.log('Raw message suggestion:', content);
      setMessageSuggestion(content.trim());
      
      // Generate email body after generating the subject
      await generateEmailBody(content.trim());
    } catch (error) {
      console.error('Error generating message:', error);
      if (error instanceof Error) alert(`Error: ${error.message}`);
    } finally {
      setLoadingMessage(false);
    }
  };

  const generateEmailBody = async (subject: string) => {
    try {
      const rulesText = rules.map((rule: any) => 
        `${rule.field} ${rule.operator} ${rule.value}`
      ).join(', ');
      
      const messages = [
        {
          role: 'system',
          content:
            'You are a skilled email copywriter who creates personalized marketing emails. Write a 3-4 paragraph email body that is engaging and persuasive.',
        },
        {
          role: 'user',
          content: `Write an email body for a marketing campaign with the subject: "${subject}". 
          The campaign targets customers who match these criteria: ${rulesText}. 
          The campaign name is: "${campaignName}".
          Make it personal and persuasive, encouraging action.`,
        },
      ];

      const content = await fetchFromGroq(messages);
      console.log('Raw email body:', content);
      setEmailBody(content.trim());
    } catch (error) {
      console.error('Error generating email body:', error);
      if (error instanceof Error) alert(`Error generating email body: ${error.message}`);
    }
  };

  const filterCustomers = (generatedRules: any[]) => {
    // As requested, we're now showing all customers regardless of rules
    // The function is kept for future use if needed
    console.log(`Showing all ${allCustomers.length} customers from database`);
  };

  const handleSelectCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSendToSelected = async () => {
    if (!messageSuggestion || !emailBody || selectedCustomers.size === 0) {
      alert('Please generate a message, email body, and select at least one customer.');
      return;
    }

    setSendingEmail(true);
    try {
      // Get only the selected customers
      const selectedCustomersList = filteredCustomers.filter(customer => 
        selectedCustomers.has(customer._id)
      );

      // Send individual emails to each selected customer
      const sendPromises = selectedCustomersList.map(async (customer) => {
        const data = {
          subject: messageSuggestion,
          body: emailBody,
          to: customer.email,
        };

        return fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      });

      // Wait for all requests to complete
      const responses = await Promise.all(sendPromises);
      
      // Check if all requests were successful
      const allSuccessful = responses.every(response => response.ok);
      
      if (allSuccessful) {
        alert(`Campaign sent successfully to ${selectedCustomersList.length} selected customers!`);
        console.log('All webhook requests sent successfully');
        // Clear selection after successful send
        setSelectedCustomers(new Set());
      } else {
        console.error('Some webhook requests failed');
        alert('Some emails failed to send. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error making the request:', error);
      if (error instanceof Error) alert(`Error: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!messageSuggestion || !emailBody || filteredCustomers.length === 0) {
      alert('Please generate a message, email body, and ensure there are customers to send to.');
      return;
    }

    setSendingEmail(true);
    try {
      // Send individual emails to each customer
      const sendPromises = filteredCustomers.map(async (customer) => {
        const data = {
          subject: messageSuggestion,
          body: emailBody,
          to: customer.email,
        };

        return fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      });

      // Wait for all requests to complete
      const responses = await Promise.all(sendPromises);
      
      // Check if all requests were successful
      const allSuccessful = responses.every(response => response.ok);
      
      if (allSuccessful) {
        alert(`Campaign sent successfully to ${filteredCustomers.length} customers!`);
        console.log('All webhook requests sent successfully');
      } else {
        console.error('Some webhook requests failed');
        alert('Some emails failed to send. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error making the request:', error);
      if (error instanceof Error) alert(`Error: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-indigo-800 mb-2">Campaign Builder</h1>
          <p className="text-gray-600 text-lg">Create targeted marketing campaigns with AI assistance</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Campaign Details */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100 transform transition-all hover:shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Campaign Details</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Enter campaign name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Describe Your Target Audience</label>
                  <textarea
                    value={nlPrompt}
                    onChange={(e) => setNlPrompt(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder='e.g., "Customers who spent over $5,000 last quarter in California"'
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleGenerateFromNL}
                  className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
                  disabled={loadingRules}
                >
                  {loadingRules ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Rules...
                    </span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Rules
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100 transform transition-all hover:shadow-xl">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Message Suggestion</h2>
              </div>
              
              <button
                onClick={handleGenerateMessage}
                className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center mb-4"
                disabled={loadingMessage || !campaignName}
              >
                {loadingMessage ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Message...
                  </span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Generate Message
                  </>
                )}
              </button>
              
              {messageSuggestion ? (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-gray-800 italic">"{messageSuggestion}"</p>
                </div>
              ) : (
                <div className="text-center text-gray-500 p-4">
                  {campaignName ? 
                    "Click the button to generate a message" : 
                    "Enter a campaign name first to generate a message"}
                </div>
              )}
              
              {emailBody && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Email Body</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-gray-800 whitespace-pre-line">{emailBody}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Generated Rules and Filtered Customers */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Generated Rules</h2>
              </div>
              
              {rules.length > 0 ? (
                <ul className="space-y-3">
                  {rules.map((rule: any) => (
                    <li key={rule.id} className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                      <div className="mr-3 mt-1 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        {rule.logicGate && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full mb-1">
                            {rule.logicGate}
                          </span>
                        )}
                        <div className="text-gray-800">
                          <span className="font-medium">{rule.field}</span>{' '}
                          <span className="text-indigo-600">{rule.operator}</span>{' '}
                          <span className="font-medium">{rule.value}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg">No rules generated yet</p>
                  <p className="text-sm mt-1">Describe your target audience and click "Generate Rules"</p>
                </div>
              )}
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Customer List</h2>
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {allCustomers.length > 0 ? `${filteredCustomers.length} total` : 'Loading...'}
                </span>
              </div>
              
              {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  <p>{error}</p>
                </div>
              )}
              
              {loadingCustomers ? (
                <div className="flex justify-center py-6">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : filteredCustomers.length > 0 ? (
                <>
                  <div className="overflow-auto max-h-60">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer: Customer) => (
                          <tr 
                            key={customer._id} 
                            onClick={() => handleSelectCustomer(customer._id)}
                            className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedCustomers.has(customer._id) ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-5 h-5 mr-2 border rounded flex items-center justify-center ${
                                  selectedCustomers.has(customer._id) 
                                    ? 'bg-indigo-600 border-indigo-600' 
                                    : 'border-gray-300'
                                }`}>
                                  {selectedCustomers.has(customer._id) && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                  )}
                                </div>
                                {customer.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">{customer.email}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{customer.phone}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(customer.totalSpend)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    {selectedCustomers.size > 0 && (
                      <button
                        onClick={handleSendToSelected}
                        className={`w-full py-3 px-6 flex items-center justify-center font-medium rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                          !messageSuggestion || !emailBody 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
                        }`}
                        disabled={!messageSuggestion || !emailBody || sendingEmail}
                      >
                        {sendingEmail ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending Campaign...
                          </span>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send to {selectedCustomers.size} Selected Customer{selectedCustomers.size > 1 ? 's' : ''}
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={handleSendCampaign}
                      className={`w-full py-3 px-6 flex items-center justify-center font-medium rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                        !messageSuggestion || !emailBody 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                      }`}
                      disabled={!messageSuggestion || !emailBody || sendingEmail}
                    >
                      {sendingEmail ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending Campaign...
                        </span>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Send to All {filteredCustomers.length} Customers
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-lg">No customers available</p>
                  <p className="text-sm mt-1">Please check your database connection</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;