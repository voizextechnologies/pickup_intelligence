import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Copy, Download, Search, CreditCard } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOfficerAuth } from '../../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

interface UpiInfoResult {
  Errorcode?: number;
  Status?: string;
  Message?: string;
  BankName?: string;
  UPI_Handel?: string;
  TPAP?: string;
  UpiId?: string;
  [key: string]: any;
}

const UpiInfoCheck: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  // const { apis, addQuery, addTransaction } = useSupabaseData();
  const { apis, addQuery, addTransaction, getOfficerEnabledAPIs } = useSupabaseData();

  const [upiId, setUpiId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UpiInfoResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    upi: true,
    raw: false,
  });

  useEffect(() => {
    if (apis && officer) {
      setIsLoading(false);
    }
  }, [apis, officer]);

  const handleUpiInfoCheck = async () => {
    if (!upiId.trim()) {
      toast.error('Please enter a UPI ID');
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

    const enabledAPIs = getOfficerEnabledAPIs(officer.id); // Get APIs enabled for this officer's plan

    const upiAPI = enabledAPIs.find(api =>
      api.name.toLowerCase().includes('upi info api') &&
      api.key_status === 'Active'
    );


    if (!upiAPI) {
      toast.error('UPI Info API not configured. Please contact admin.');
      setSearchError('UPI Info API not configured');
      return;
    }

    const creditCost = upiAPI.default_credit_charge || 1.80;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      setSearchError(`Insufficient credits: ${creditCost} required`);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const apiParts = upiAPI.api_key.split(':');
      if (apiParts.length < 3) {
        throw new Error('Invalid API key format: Expected ApiUserID:ApiPassword:TokenID');
      }
      const apiUserId = apiParts[0];
      const apiPassword = apiParts[1];
      const tokenId = apiParts[2];

      const cleanUpiId = upiId.trim();
      const baseUrl = '/api/planapi/api/Ekyc/VPA_Info';

      const payload = {
        UpiId: cleanUpiId,
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
        body: JSON.stringify(payload),
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

      const data: UpiInfoResult = await response.json();
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
          remarks: `UPI Info query for ${cleanUpiId}`,
        });
      }

      if (addQuery) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name || 'Unknown',
          type: 'PRO',
          category: 'UPI Info Check',
          input_data: `UPI ID: ${cleanUpiId}`,
          source: 'RapidAPI',
          result_summary: `UPI info retrieved for ${cleanUpiId}`,
          full_result: data,
          credits_used: creditCost,
          status: 'Success',
        });
      }

      toast.success('UPI info retrieved successfully!');
    } catch (error) {
      console.error('UPI Info Check error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSearchError(errorMessage);

      if (addQuery) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name || 'Unknown',
          type: 'PRO',
          category: 'UPI Info Check',
          input_data: `UPI ID: ${upiId}`,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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
          <CreditCard className="w-6 h-6 text-electric-blue" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            UPI Info Check
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
            UPI ID *
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="Enter UPI ID (e.g., example@upi)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'}`}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleUpiInfoCheck}
            disabled={isSearching || !upiId.trim()}
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
                <span>Check UPI Info</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
        * Required. Consumes {apis.find(api => api.name.toLowerCase().includes('upi info api'))?.default_credit_charge || 1.80} credits per query.
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
                UPI Info Found
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                Verified 7/30/2025, 2:45 PM
              </span>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => toggleSection('upi')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-gray-800/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
            >
              <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                UPI Information
              </h5>
              {expandedSections.upi ? (
                <ChevronUp className="w-5 h-5 text-cyan-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-cyan-500" />
              )}
            </button>
            {expandedSections.upi && (
              <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-gray-700/50 border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>UPI ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.UpiId || 'N/A'}
                      </span>
                      {searchResults.UpiId && (
                        <button
                          onClick={() => copyToClipboard(searchResults.UpiId || '')}
                          className="p-1 text-cyan-500 hover:text-cyan-400 transition-colors"
                          title="Copy UPI ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Name:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.Message?.includes('Bank Details Found!') ? 'Available' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Bank:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.BankName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.Status || 'N/A'}
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
                link.download = `upi-info-${upiId}-${Date.now()}.json`;
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
                setUpiId('');
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

export default UpiInfoCheck;