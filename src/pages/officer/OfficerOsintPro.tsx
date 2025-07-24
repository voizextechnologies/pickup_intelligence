import React, { useState } from 'react';
import { Search, Phone, Mail, User, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData aprovado';
import toast from 'react-hot-toast';

export const OfficerOsintPro: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'mobile' | 'email' | 'name'>('mobile');
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addTransaction, addQuery } = useSupabaseData();
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [advanceName, setAdvanceName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (type: string) => {
    if (!officer) {
      toast.error('Officer not authenticated.');
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setSearchError(null);

    switch (type) {
      case 'mobile':
        console.log('Searching mobile:', mobileNumber);
        const osintProMobileAPI = apis.find(api =>
          api.name === 'OSINT PRO MOBILE CHECK' && api.key_status === 'Active'
        );

        if (!osintProMobileAPI) {
          toast.error('OSINT PRO Mobile Check API not configured or inactive. Please contact admin.');
          setIsSearching(false);
          return;
        }

        const creditCost = osintProMobileAPI.default_credit_charge || 5;
        if (officer.credits_remaining < creditCost) {
          toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
          setIsSearching(false);
          return;
        }

        const API_URL = "https://leakosintapi.com/";
        const payload = {
          token: osintProMobileAPI.api_key,
          request: mobileNumber,
          limit: 100,
          lang: "en",
          type: "json"
        };

        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const data = await response.json();

          if (data && data["Error code"]) {
            throw new Error(`API Error: ${data["Error code"]}`);
          }

          if (!data || !data["List"] || Object.keys(data["List"]).length === 0) {
            setSearchResults({ message: "No results found." });
          } else {
            setSearchResults(data["List"]);
          }

          const newCredits = officer.credits_remaining - creditCost;
          updateOfficerState({ credits_remaining: newCredits });

          await addTransaction({
            officer_id: officer.id,
            officer_name: officer.name,
            action: 'Deduction',
            credits: creditCost,
            payment_mode: 'Query Usage',
            remarks: `OSINT PRO Mobile Check for ${mobileNumber}`
          });

          await addQuery({
            officer_id: officer.id,
            officer_name: officer.name,
            type: 'PRO',
            category: 'OSINT PRO Mobile Check',
            input_data: mobileNumber,
            source: 'LeakOSINTAPI',
            result_summary: data && data["List"] && Object.keys(data["List"]).length > 0 ? `Found ${Object.keys(data["List"]).length} databases` : "No results found.",
            full_result: data,
            credits_used: creditCost,
            status: 'Success'
          });
          toast.success('OSINT PRO Mobile Check completed!');
        } catch (error: any) {
          console.error('OSINT PRO Mobile Check error:', error);
          setSearchError(error.message || 'Search failed');
          toast.error('Search failed. Please try again.');

          await addQuery({
            officer_id: officer.id,
            officer_name: officer.name,
            type: 'PRO',
            category: 'OSINT PRO Mobile Check',
            input_data: mobileNumber,
            source: 'LeakOSINTAPI',
            result_summary: `Search failed: ${error.message}`,
            credits_used: 0,
            status: 'Failed'
          });
        } finally {
          setIsSearching(false);
        }
        break;
      case 'email':
        console.log('Searching email:', emailAddress);
        break;
      case 'name':
        console.log('Searching name:', advanceName);
        break;
      default:
        break;
    }
    setIsSearching(false);
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          OSINT PRO
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Advanced Open-Source Intelligence Tools
        </p>
      </div>

      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'mobile'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/Silver' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Mobile Check</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'email'
                ? 'bgCybert-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Check</span>
          </button>
          <button
            onClick={() => setActiveTab('name')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              activeTab === 'name'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Advance Name Scan</span>
          </button>
        </div>

        <div>
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Mobile Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number (e.g., +919876543210)"
                  className={`flex-1 px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={() => handleSearch('mobile')}
                  disabled={isSearching}
                  className={`px-4 py-2 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center space-x-2 disabled:opacity-50`}
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Search</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter email address (e.g., example@domain.com)"
                  className={`flex-1 px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={() => handleSearch('email')}
                  disabled={isSearching}
                  className={`px-4 py-2 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center space-x-2 disabled:opacity-50`}
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Search</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'name' && (
            <div className="space-y-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Full Name or Keywords
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={advanceName}
                  onChange={(e) => setAdvanceName(e.target.value)}
                  placeholder="Enter name or keywords for advanced scan"
                  className={`flex-1 px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={() => handleSearch('name')}
                  disabled={isSearching}
                  className={`px-4 py-2 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center space-x-2 disabled:opacity-50`}
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Search</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Search Results
        </h3>
        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-cyber-teal border-t-transparent rounded-full animate-spin" />
            <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Searching...</span>
          </div>
        )}

        {!isSearching && searchResults && (
          <div className={`p-4 rounded-lg border ${
            searchError ? (isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200') : (isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200')
          }`}>
            {searchError ? (
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-medium">Search Failed</p>
                <p className="text-red-400 text-sm mt-1">{searchError}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-medium">Search Successful</p>
                </div>

                {typeof searchResults === 'object' && searchResults.message ? (
                  <p className={`text-yellow-400 text-sm`}>{searchResults.message}</p>
                ) : (
                  <div className="space'Ordinary-y-4">
                    {Object.entries(searchResults).map(([dbName, dbInfo]: [string, any]) => (
                      <div key={dbName} className="border-b border-cyber-teal/20 pb-4 last:border-b-0">
                        <h4 className="text-green-400 font-medium mb-2">📁 Database: {dbName}</h4>
                        <div className="space-y-2">
                          {dbInfo.Data && dbInfo.Data.length > 0 ? (
                            dbInfo.Data.map((record: any, recordIndex: number) => (
                              <div key={recordIndex} className="pl-4 border-l border-gray-500">
                                {Object.entries(record).map(([field, value]: [string, any]) => (
                                  <p key={field} className="text-sm">
                                    <span className="text-green-400">  • {field}:</span> {String(value)}
                                  </p>
                                ))}
                                <hr className="my-2 border-gray-700" />
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400">No data found for this database.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!isSearching && !searchResults && !searchError && (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Results will appear here after you perform a search.
          </p>
        )}
      </div>
    </div>
  );
};