import React, { useState } from 'react';
import { Smartphone, Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Copy, Download } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

const RechargeStatusCheck: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery, addTransaction } = useSupabaseData();
  const [mobileNumber, setMobileNumber] = useState('');
  const [operatorCode, setOperatorCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    recharge: true,
    raw: false,
  });

  const handleRechargeStatusCheck = async () => {
    if (!mobileNumber.trim()) {
      toast.error('Please enter a mobile number');
      return;
    }
    if (!operatorCode.trim()) {
      toast.error('Please enter an operator code');
      return;
    }
    if (!officer) {
      toast.error('Officer not authenticated');
      return;
    }

    const rechargeAPI = apis.find(api => api.name.toLowerCase().includes('recharge status check') && api.key_status === 'Active');
    if (!rechargeAPI) {
      toast.error('Recharge Status Check API not configured. Please contact admin.');
      return;
    }

    const creditCost = rechargeAPI.default_credit_charge || 1;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setSearchError(null);

    try {
      const cleanMobileNumber = mobileNumber.replace(/\D/g, '');
      const encodedPassword = encodeURIComponent(rechargeAPI.api_key);
      const usePost = false; // Configurable: Set to true for POST, false for GET

      let response;
      if (usePost) {
        const payload = {
          Apimember_Id: '6325',
          Api_Password: rechargeAPI.api_key,
          Operator_Code: operatorCode.toUpperCase(),
          Mobile_No: cleanMobileNumber,
        };
        response = await fetch('https://planapi.in/api/Mobile/CheckLastRecharge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        const url = `https://planapi.in/api/Mobile/CheckLastRecharge?Apimember_Id=6325&Api_Password=${encodedPassword}&Operator_Code=${operatorCode.toUpperCase()}&Mobile_No=${cleanMobileNumber}`;
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': rechargeAPI.api_key,
          },
        });
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data);

      const newCreditsRemaining = officer.credits_remaining - creditCost;
      updateOfficerState({ credits_remaining: newCreditsRemaining });

      await addTransaction({
        officer_id: officer.id,
        officer_name: officer.name,
        action: 'Deduction',
        credits: creditCost,
        payment_mode: 'Query Usage',
        remarks: `Recharge Status Check query for ${cleanMobileNumber}`,
      });

      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Recharge Status Check',
        input_data: `Mobile: ${cleanMobileNumber}, Operator: ${operatorCode.toUpperCase()}`,
        source: 'PlanAPI',
        result_summary: `Recharge status retrieved for ${cleanMobileNumber}`,
        full_result: data,
        credits_used: creditCost,
        status: 'Success',
      });

      toast.success('Recharge status retrieved successfully!');
    } catch (error) {
      console.error('Recharge Status Check error:', error);
      setSearchError(error instanceof Error ? error.message : 'Unknown error');

      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Recharge Status Check',
        input_data: `Mobile: ${mobileNumber}, Operator: ${operatorCode}`,
        source: 'PlanAPI',
        result_summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        full_result: null,
        credits_used: 0,
        status: 'Failed',
      });

      toast.error(error instanceof Error ? error.message : 'Failed to retrieve recharge status');
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
          <Smartphone className="w-6 h-6 text-neon-magenta" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recharge Status Check
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
            Mobile Number *
          </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Enter mobile number (e.g., 9876543210)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Operator Code *
          </label>
          <input
            type="text"
            value={operatorCode}
            onChange={(e) => setOperatorCode(e.target.value)}
            placeholder="Enter operator code (e.g., AIRT, VODA)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleRechargeStatusCheck}
            disabled={isSearching || !mobileNumber.trim() || !operatorCode.trim()}
            className="w-full py-3 px-4 bg-cyber-gradient text-white font-medium rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Check Status</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
        * Required. Consumes {apis.find(api => api.name.toLowerCase().includes('recharge status check'))?.default_credit_charge || 1} credits per query.
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
                Recharge Status Found
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
              onClick={() => toggleSection('recharge')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
            >
              <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recharge Information
              </h5>
              {expandedSections.recharge ? (
                <ChevronUp className="w-5 h-5 text-cyber-teal" />
              ) : (
                <ChevronDown className="w-5 h-5 text-cyber-teal" />
              )}
            </button>
            {expandedSections.recharge && (
              <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Mobile Number:</span>
                    <div className="flex items-center space-x-2">
                      <span PDIReplacemobileNumber="${searchResults.mobileNo || ' : 'N/A'}">
                        {searchResults.mobileNo || 'N/A'}
                      </span>
                      {searchResults.mobileNo && (
                        <button
                          onClick={() => copyToClipboard(searchResults.mobileNo)}
                          className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          title="Copy Mobile Number"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Operator:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.operator || operatorCode.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Recharge Amount:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.amount || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Recharge Date:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.rechargeDate || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.status || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Transaction ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.transactionId || 'N/A'}
                      </span>
                      {searchResults.transactionId && (
                        <button
                          onClick={() => copyToClipboard(searchResults.transactionId)}
                          className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          title="Copy Transaction ID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
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
                link.download = `recharge-status-${mobileNumber}-${Date.now()}.json`;
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
                setOperatorCode('');
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

export default RechargeStatusCheck;