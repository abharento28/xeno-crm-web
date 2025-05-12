import React, { useState } from 'react';

const CampaignBuilder: React.FC = () => {
  const [nlPrompt, setNlPrompt] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [rules, setRules] = useState([]);
  const [messageSuggestion, setMessageSuggestion] = useState('');
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);

  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
    } catch (error) {
      console.error('Error generating message:', error);
      if (error instanceof Error) alert(`Error: ${error.message}`);
    } finally {
      setLoadingMessage(false);
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
            </div>
          </div>

          {/* Right Column - Generated Rules */}
          <div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100 h-full">
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
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg">No rules generated yet</p>
                  <p className="text-sm mt-2">Describe your target audience and click "Generate Rules"</p>
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