import React, { useState } from 'react';
import { CreditCard, Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Copy, Download, Search } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOfficerAuth } from '../../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

const PhoneToCreditAndBusinessDetails: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery, addTransaction, getOfficerEnabledAPIs } = useSupabaseData();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    credit: true,
    business: true,
    raw: false,
  });

  const handleSearch = async () => {
    if (!phoneNumber.trim() || !name.trim()) {
      toast.error('Please enter both phone number and name');
      return;
    }

    if (!officer) {
      toast.error('Officer not authenticated');
      return;
    }

    const enabledAPIs = getOfficerEnabledAPIs(officer.id);
    const creditBusinessAPI = enabledAPIs.find(api =>
      api.name.toLowerCase().includes('phone to credit')
    );

    if (!creditBusinessAPI) {
      toast.error('Phone to Credit and Business Details API not configured. Please contact admin.');
      return;
    }

    if (creditBusinessAPI.key_status !== 'Active') {
      toast.error('Phone to Credit and Business Details API is currently inactive');
      return;
    }

    const creditCost = creditBusinessAPI.default_credit_charge || 100;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const response = await fetch('https://api.signzy.app/api/v3/nca/phoneToCreditAndBusinessDetails', {
        method: 'POST',
        headers: {
          'Authorization': creditBusinessAPI.api_key,
          'x-client-unique-id': officer.email,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: cleanPhoneNumber,
          name: name.toUpperCase(),
          nddSearchType: 'entity',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('No credit or business data found');
      }

      setSearchResults(data.result);
      const newCredits = officer.credits_remaining - creditCost;
      updateOfficerState({ credits_remaining: newCredits });

      await addTransaction({
        officer_id: officer.id,
        officer_name: officer.name,
        action: 'Deduction',
        credits: creditCost,
        payment_mode: 'Query Usage',
        remarks: `Phone to Credit and Business Details query for ${cleanPhoneNumber}, ${name.toUpperCase()}`,
      });

      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone to Credit and Business Details',
        input_data: `Phone: ${cleanPhoneNumber}, Name: ${name.toUpperCase()}`,
        source: 'Signzy Phone to Credit and Business Details',
        result_summary: `Found data for ${data.result.name || 'Unknown'}`,
        full_result: data.result,
        credits_used: creditCost,
        status: 'Success',
      });

      toast.success('Credit and business details retrieved successfully!');
    } catch (error: any) {
      console.error('Credit and Business Details Search Error:', error);
      setSearchError(error.message || 'Unknown error');

      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone to Credit and Business Details',
        input_data: `Phone: ${phoneNumber}, Name: ${name}`,
        source: 'Signzy Phone to Credit and Business Details',
        result_summary: `Error: ${error.message || 'Unknown error'}`,
        full_result: null,
        credits_used: 0,
        status: 'Failed',
      });

      toast.error(error.message || 'Failed to retrieve credit and business details');
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

  return (
    <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'} shadow-md hover:shadow-cyber transition-shadow duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-6 h-6 text-neon-magenta" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Phone to Credit and Business Details
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-neon-magenta" />
          <span className="text-xs bg-neon-magenta/20 text-neon-magenta px-2 py-1 rounded">PREMIUM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Phone Number *
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (e.g., 9876543210)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name (e.g., SANTOSH)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={isSearching || !phoneNumber.trim() || !name.trim()}
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
                <span>Search Details</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
        * Required. Consumes {apis.find(api => api.name.toLowerCase().includes('phone to credit and business details'))?.default_credit_charge || 100} credits per query.
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
                <span> Please try again or check your network connection.</span>
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
                Credit and Business Details Found
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                Verified {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {searchResults.creditDetails && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('credit')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
              >
                <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Credit Details
                </h5>
                {expandedSections.credit ? (
                  <ChevronUp className="w-5 h-5 text-cyber-teal" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyber-teal" />
                )}
              </button>
              {expandedSections.credit && (
                <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Credit Score:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.creditDetails.creditScore || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Credit Limit:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.creditDetails.creditLimit || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Outstanding Balance:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.creditDetails.outstandingBalance || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Last Reported:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.creditDetails.lastReported || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {searchResults.businessDetails && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('business')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
              >
                <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Business Details
                </h5>
                {expandedSections.business ? (
                  <ChevronUp className="w-5 h-5 text-cyber-teal" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyber-teal" />
                )}
              </button>
              {expandedSections.business && (
                <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Business Name:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {searchResults.businessDetails.businessName || 'N/A'}
                        </span>
                        {searchResults.businessDetails.businessName && (
                          <button
                            onClick={() => copyToClipboard(searchResults.businessDetails.businessName)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                            title="Copy Business Name"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Business Type:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.businessDetails.businessType || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Registration Number:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {searchResults.businessDetails.registrationNumber || 'N/A'}
                        </span>
                        {searchResults.businessDetails.registrationNumber && (
                          <button
                            onClick={() => copyToClipboard(searchResults.businessDetails.registrationNumber)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                            title="Copy Registration Number"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Address:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.businessDetails.address || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
              <div className={`mt-2 p-4 rounded-lg border ${isDark ? 'bg-crisp-black text-white' : 'bg-gray-100 text-gray-800'} overflow-x-auto`}>
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
                link.download = `credit-business-${phoneNumber}-${Date.now()}.json`;
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
                setPhoneNumber('');
                setName('');
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

export default PhoneToCreditAndBusinessDetails;