import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Download, Search, Building } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOfficerAuth } from '../../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

interface MCACINResult {
  [key: string]: any;
}

const MCACINSearch: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery, addTransaction, getOfficerEnabledAPIs } = useSupabaseData();
  const [cin, setCin] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MCACINResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    raw: false,
  });

  useEffect(() => {
    if (apis && officer) {
      setIsLoading(false);
    }
  }, [apis, officer]);

  const handleMCACINSearch = async () => {
    if (!cin.trim()) {
      toast.error('Please enter a CIN');
      return;
    }
    if (!/^[LUu]\d{5}[A-Za-z]{2}\d{4}[A-Za-z]{3}\d{6}$/.test(cin)) {
      toast.error('Please enter a valid CIN (e.g., U12345MH2020PLC123456)');
      return;
    }

    if (!officer) {
      toast.error('Officer not authenticated');
      setSearchError('Officer not authenticated');
      return;
    }

    if (!apis) {
      toast.error('API configuration not loaded');
      setSearchError('API configuration not loaded');
      return;
    }

    const enabledAPIs = getOfficerEnabledAPIs(officer.id);
    const mcaAPI = enabledAPIs.find(api =>
      api.name.toLowerCase().includes('mca cin') && api.key_status === 'Active'
    );

    if (!mcaAPI) {
      toast.error('MCA CIN API not configured. Please contact admin.');
      setSearchError('MCA CIN API not configured');
      return;
    }

    const creditCost = mcaAPI.default_credit_charge || 2.10;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      setSearchError(`Insufficient credits: ${creditCost} required`);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const apiParts = mcaAPI.api_key.split(':');
      if (apiParts.length < 3) {
        throw new Error('Invalid API key format: Expected ApiUserID:ApiPassword:TokenID');
      }
      const apiUserId = apiParts[0];
      const apiPassword = apiParts[1];
      const tokenId = apiParts[2];

      const cleanCin = cin.trim().toUpperCase();
      const baseUrl = '/api/planapi/api/Ekyc/MCACinSearch';

      const payload = {
        CIN: cleanCin,
        ApiMode: '1',
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TokenID': tokenId,
          'ApiUserID': apiUserId,
          'ApiPassword': apiPassword,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: text,
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Invalid response content type:', {
          contentType,
          responseText: text.substring(0, 100),
        });
        throw new Error('Invalid response format: Expected JSON');
      }

      const data: MCACINResult = await response.json();
      setSearchResults(data);

      const newCreditsRemaining = officer.credits_remaining - creditCost;
      updateOfficerState({ credits_remaining: newCreditsRemaining });

      if (addTransaction) {
        await addTransaction({
          officer_id: officer.id,
          officer_name: officer.name || 'Unknown',
          action: 'Deduction',
          credits: creditCost,
          payment_mode: 'Query Usage',
          remarks: `MCA CIN Search query for ${cleanCin}`,
        });
      }

      if (addQuery) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name || 'Unknown',
          type: 'PRO',
          category: 'MCA CIN Search',
          input_data: `CIN: ${cleanCin}, ApiMode: 1`,
          source: 'RapidAPI',
          result_summary: `MCA CIN Search for ${cleanCin}: ${data.status === 'Success' ? 'Successful' : 'Failed'}`,
          full_result: data,
          credits_used: creditCost,
          status: data.status === 'Success' ? 'Success' : 'Failed',
        });
      }

      if (data.status === 'Success') {
        toast.success('MCA CIN search successful!');
      } else {
        toast.error(`MCA CIN search failed: ${data.msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('MCA CIN Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSearchError(errorMessage);

      if (addQuery) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name || 'Unknown',
          type: 'PRO',
          category: 'MCA CIN Search',
          input_data: `CIN: ${cin}, ApiMode: 1`,
          source: 'RapidAPI',
          result_summary: `Error: ${errorMessage}`,
          full_result: null,
          credits_used: 0,
          status: 'Failed',
        });
      }

      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'} text-center`}>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</p>
      </div>
    );
  }

  if (!officer || !apis) {
    return (
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-red-400 text-sm font-medium">Error</p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Required data not loaded. Please try refreshing or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'} shadow-md hover:shadow-cyber transition-shadow duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building className="w-6 h-6 text-electric-blue" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            MCA CIN Search
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-electric-blue" />
          <span className="text-xs bg-electric-blue/20 text-electric-blue px-2 py-1 rounded">PREMIUM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            CIN *
          </label>
          <input
            type="text"
            value={cin}
            onChange={(e) => setCin(e.target.value.toUpperCase())}
            placeholder="Enter CIN (e.g., U12345MH2020PLC123456)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'}`}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleMCACINSearch}
            disabled={isSearching || !cin.trim()}
            className="w-full py-3 px-4 bg-cyber-gradient text-white font-medium rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search CIN</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
        * Required. Consumes {apis.find(api => api.name.toLowerCase().includes('mca cin'))?.default_credit_charge || 2.10} credits per query.
      </p>

      {searchError && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'} mb-6`}>
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-red-400 text-sm font-medium">Error</p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {searchError}
              {searchError.includes('Insufficient credits') ? (
                <span> Contact admin to top up your credits.</span>
              ) : searchError.includes('API request failed') || searchError.includes('Invalid response format') ? (
                <span> Please verify the API configuration or check your network connection.</span>
              ) : (
                <span> Please try again or contact support.</span>
              )}
            </p>
          </div>
        </div>
      )}

      {searchResults && (
        <div className={`p-6 rounded-lg border ${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                MCA CIN Search Results
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                Verified 7/30/2025, 9:38 PM
              </span>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => toggleSection('details')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-gray-800/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
            >
              <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Company Details
              </h5>
              {expandedSections.details ? (
                <ChevronUp className="w-5 h-5 text-cyan-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-cyan-500" />
              )}
            </button>
            {expandedSections.details && (
              <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-gray-700/50 border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>CIN:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.cin || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Company Name:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.company_name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>ROC Code:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.roc_code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Registration No:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.registration_no || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Company Category:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.company_category || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Company Subcategory:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.company_subcategory || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Aclass:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.Aclass || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Authorized Capital:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.authorized_capital || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Paidup Capital:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.paidup_capital || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Incorporation Date:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.incorporation_date || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Registered Address:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.registered_address || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Email Address:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.email_address || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Listing Status:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.listing_status || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Last AGM Date:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.last_agm_date || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Last Balance Sheet Date:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.last_balance_sheet_date || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Company Status:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.company_status || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Charges:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.charges || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Directors:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.response?.Directors?.length || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <button
              onClick={() => toggleSection('raw')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-gray-800/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
            >
              <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Raw JSON Response
              </h5>
              {expandedSections.raw ? (
                <ChevronUp className="w-5 h-5 text-cyan-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-cyan-500" />
              )}
            </button>
            {expandedSections.raw && (
              <div className={`mt-2 p-4 rounded-lg border ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'} overflow-x-auto`}>
                <pre className="text-xs">
                  <code>{JSON.stringify(searchResults, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-cyber-teal/20">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(searchResults, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `mca-cin-search-${cin}-${Date.now()}.json`;
                link.click();
                URL.revokeObjectURL(url);
                toast.success('Results exported successfully!');
              }}
              className="px-4 py-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-all duration-200 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </button>
            <button
              onClick={() => {
                setSearchResults(null);
                setSearchError(null);
                setCin('');
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              New Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCACINSearch;