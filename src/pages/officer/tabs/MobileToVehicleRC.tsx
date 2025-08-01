import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Copy, Download, Search, Car, Phone } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOfficerAuth } from '../../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

interface MobileToVehicleRCResult {
  code: number;
  timestamp: number;
  transaction_id: string;
  sub_code: string;
  message: string;
  data?: {
    rc_number?: string;
    owner_name?: string;
    vehicle_model?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const MobileToVehicleRC: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery, addTransaction, getOfficerEnabledAPIs } = useSupabaseData();
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MobileToVehicleRCResult | null>(null);
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

  /**
   * Authenticates with Deepvue API to get an access token.
   * @param clientId The client ID for Deepvue API.
   * @param clientSecret The client secret for Deepvue API.
   * @returns The access token string or null if authentication fails.
   */
  const getDeepvueAccessToken = async (clientId: string, clientSecret: string): Promise<string | null> => {
    try {
      const authUrl = '/api/deepvue/v1/authorize';
      const formData = new URLSearchParams();
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      if (data.access_token) {
        return data.access_token;
      } else {
        throw new Error('Access token not found in authentication response.');
      }
    } catch (error) {
      console.error('Deepvue authentication error:', error);
      toast.error(`Deepvue authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const handleSearch = async () => {
    if (!mobileNumber.trim()) {
      toast.error('Please enter a mobile number');
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
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
    const deepvueAPI = enabledAPIs.find(api =>
      api.name.toLowerCase().includes('mobile to vehicle rc deepvue') && api.key_status === 'Active'
    );

    if (!deepvueAPI) {
      toast.error('Mobile to Vehicle RC Deepvue API not configured or inactive. Please contact admin.');
      setSearchError('Mobile to Vehicle RC Deepvue API not configured or inactive');
      return;
    }

    const creditCost = deepvueAPI.default_credit_charge || 5.00;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      setSearchError(`Insufficient credits: ${creditCost} required`);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      // Extract client_secret and client_id from the api_key field
      // Assuming format is client_secret:client_id based on provided curl example
      const apiKeyValue = deepvueAPI.api_key;
      const apiParts = apiKeyValue.split(':');
      if (apiParts.length !== 2) {
        throw new Error('Invalid API key format for Deepvue API. Expected client_secret:client_id.');
      }
      const clientSecret = apiParts[0];
      const clientId = apiParts[1];

      // Step 1: Get Access Token
      const accessToken = await getDeepvueAccessToken(clientId, clientSecret);
      if (!accessToken) {
        throw new Error('Failed to obtain Deepvue access token.');
      }

      // Step 2: Make the main API call using the obtained token
      const cleanMobileNumber = mobileNumber.trim();
      const baseUrl = `/api/deepvue/v1/mobile-intelligence/mobile-to-vehicle-rc?mobile_number=${encodeURIComponent(cleanMobileNumber)}`;

      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`, // Use the obtained access token
          'x-api-key': clientSecret, // Use the client_secret as x-api-key
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Main API request failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorBody,
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const data: MobileToVehicleRCResult = await response.json();
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
          remarks: `Mobile to Vehicle RC query for ${cleanMobileNumber}`,
        });
      }

      if (addQuery) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name || 'Unknown',
          type: 'PRO',
          category: 'Mobile to Vehicle RC',
          input_data: `Mobile Number: ${cleanMobileNumber}`,
          source: 'Deepvue',
          result_summary: `Mobile to Vehicle RC for ${cleanMobileNumber}: ${data.message || 'Success'}`,
          full_result: data,
          credits_used: creditCost,
          status: data.code === 200 ? 'Success' : 'Failed',
        });
      }

      if (data.code === 200) {
        toast.success('Mobile to Vehicle RC details retrieved successfully!');
      } else {
        toast.error(`Mobile to Vehicle RC search failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Mobile to Vehicle RC error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSearchError(errorMessage);

      if (addQuery) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name || 'Unknown',
          type: 'PRO',
          category: 'Mobile to Vehicle RC',
          input_data: `Mobile Number: ${mobileNumber}`,
          source: 'Deepvue',
          result_summary: `Search failed: ${errorMessage}`,
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
          <Car className="w-6 h-6 text-electric-blue" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Mobile to Vehicle RC
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
            Mobile Number *
          </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Enter 10-digit mobile number"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'}`}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={isSearching || !mobileNumber.trim()}
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
                <span>Search Vehicle RC</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
        * Required. Consumes {apis.find(api => api.name.toLowerCase().includes('mobile to vehicle rc deepvue'))?.default_credit_charge || 5.00} credits per query.
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
              ) : searchError.includes('API request failed') ? (
                <span> Please verify the API configuration or check your network connection.</span>
              ) : (
                <span> Please try again or contact support.</span>
              )}
            </p>
          </div>
        </div>
      )}

      {searchResults && searchResults.data && (
        <div className={`p-6 rounded-lg border ${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Vehicle RC Details Found
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                Verified {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => toggleSection('details')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
            >
              <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Vehicle Information
              </h5>
              {expandedSections.details ? (
                <ChevronUp className="w-5 h-5 text-cyber-teal" />
              ) : (
                <ChevronDown className="w-5 h-5 text-cyber-teal" />
              )}
            </button>
            {expandedSections.details && (
              <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>RC Number:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.data.rc_number || 'N/A'}
                      </span>
                      {searchResults.data.rc_number && (
                        <button
                          onClick={() => copyToClipboard(searchResults.data.rc_number)}
                          className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          title="Copy RC Number"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Owner Name:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.data.owner_name || 'N/A'}
                      </span>
                      {searchResults.data.owner_name && (
                        <button
                          onClick={() => copyToClipboard(searchResults.data.owner_name)}
                          className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          title="Copy Owner Name"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Vehicle Model:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.data.vehicle_model || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Message:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.message || 'N/A'}
                    </span>
                  </div>
                  {/* Add more fields from searchResults.data as needed */}
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <button
              onClick={() => toggleSection('raw')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
            >
              <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Raw JSON Response
              </h5>
              {expandedSections.raw ? (
                <ChevronUp className="w-5 h-5 text-cyber-teal" />
              ) : (
                <ChevronDown className="w-5 h-5 text-cyber-teal" />
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
                link.download = `mobile-to-vehicle-rc-${mobileNumber}-${Date.now()}.json`;
                link.click();
                URL.revokeObjectURL(url);
                toast.success('Results exported successfully!');
              }}
              className="px-4 py-2 bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 transition-all duration-200 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </button>
            <button
              onClick={() => {
                setSearchResults(null);
                setSearchError(null);
                setMobileNumber('');
              }}
              className="px-4 py-2 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200"
            >
              New Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileToVehicleRC;