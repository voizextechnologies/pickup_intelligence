import React, { useState } from 'react';
import { Smartphone, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

export const RechargeStatusCheck: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { addTransaction, addQuery, getOfficerEnabledAPIs } = useSupabaseData();
  const [mobileNumber, setMobileNumber] = useState('');
  const [operatorCode, setOperatorCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const operatorCodes = [
    { code: 'JIO', name: 'Jio' },
    { code: 'AIRTEL', name: 'Airtel' },
    { code: 'VI', name: 'Vi (Vodafone Idea)' },
    { code: 'BSNL', name: 'BSNL' },
    { code: 'MTNL', name: 'MTNL' }
  ];

  const handleSearch = async () => {
    if (!officer) {
      toast.error('Officer not authenticated.');
      return;
    }

    if (!mobileNumber.trim() || !operatorCode.trim()) {
      toast.error('Please enter mobile number and select operator');
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setSearchError(null);

    const officerEnabledAPIs = await getOfficerEnabledAPIs(officer.id);
    const apiConfig = officerEnabledAPIs.find(api =>
      api.name.toLowerCase().includes('recharge') && 
      api.name.toLowerCase().includes('expiry')
    );

    if (!apiConfig) {
      toast.error('Recharge Expiry Check API not enabled for your plan. Please contact admin.');
      setIsSearching(false);
      return;
    }

    if (apiConfig.key_status !== 'Active') {
      toast.error('Recharge Expiry Check API is currently inactive. Please contact admin.');
      setIsSearching(false);
      return;
    }

    const creditCost = apiConfig.default_credit_charge || 1;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      setIsSearching(false);
      return;
    }

    // Get credentials from environment variables
    const apiMemberId = import.meta.env.VITE_PLANAPI_MEMBER_ID;
    const apiPassword = import.meta.env.VITE_PLANAPI_PASSWORD;

    if (!apiMemberId || !apiPassword) {
      toast.error('API credentials not configured. Please contact admin.');
      setIsSearching(false);
      return;
    }

    try {
      const requestPayload = {
        Apimember_Id: apiMemberId,
        Api_Password: apiPassword,
        Operator_Code: operatorCode,
        Mobile_No: mobileNumber.replace(/\D/g, '') // Remove non-digits
      };

      const response = await fetch('/api/planapi/Mobile/CheckLastRecharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.Status === 'Success') {
        setSearchResults(data);
        
        // Deduct credits
        const newCredits = officer.credits_remaining - creditCost;
        updateOfficerState({ credits_remaining: newCredits });
        
        // Log transaction
        await addTransaction({
          officer_id: officer.id,
          officer_name: officer.name,
          action: 'Deduction',
          credits: creditCost,
          payment_mode: 'Query Usage',
          remarks: `Recharge Status Check for ${mobileNumber} (${operatorCode})`
        });

        // Log query
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name,
          type: 'PRO',
          category: 'Recharge Expiry Check',
          input_data: `${mobileNumber} (${operatorCode})`,
          source: 'PlanAPI',
          result_summary: `Last recharge: ${data.Last_Recharge_Date} - ${data.Last_Recharge_Amount}`,
          full_result: data,
          credits_used: creditCost,
          status: 'Success'
        });
        
        toast.success('Recharge details retrieved successfully!');
      } else {
        throw new Error(data?.Message || 'No recharge data found');
      }
    } catch (error: any) {
      console.error('Recharge Status Check Error:', error);
      setSearchError(error.message || 'Search failed');
      toast.error('Search failed. Please try again.');
      
      // Log failed query
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Recharge Expiry Check',
        input_data: `${mobileNumber} (${operatorCode})`,
        source: 'PlanAPI',
        result_summary: `Search failed: ${error.message}`,
        credits_used: 0,
        status: 'Failed'
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
      isDark ? 'bg-muted-graphite' : 'bg-white'
    }`}>
      <div className="flex items-center space-x-3 mb-4">
        <Smartphone className="w-6 h-6 text-cyber-teal" />
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recharge Expiry Check
        </h3>
        <span className="text-xs px-2 py-1 bg-cyber-teal/20 text-cyber-teal rounded">PREMIUM</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Mobile Number
          </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="9876543210"
            className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white placeholder-gray-500' 
                : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Operator
          </label>
          <select
            value={operatorCode}
            onChange={(e) => setOperatorCode(e.target.value)}
            className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            <option value="">Select Operator</option>
            {operatorCodes.map((op) => (
              <option key={op.code} value={op.code}>
                {op.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching}
          className={`w-full px-4 py-2 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50`}
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Check Recharge Status</span>
        </button>

        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Cost: 1 credit
        </p>

        {/* Results Display */}
        {searchError && (
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-red-900/10 border-red-500/30' : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-red-400 text-sm">{searchError}</p>
          </div>
        )}

        {searchResults && (
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-green-900/10 border-green-500/30' : 'bg-green-50 border-green-200'
          }`}>
            <h4 className="text-green-400 font-medium mb-3">Recharge Details</h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-green-400">Mobile Number:</span> {searchResults.Mobile_No}</p>
              <p><span className="text-green-400">Operator:</span> {searchResults.Operator_Name}</p>
              <p><span className="text-green-400">Circle:</span> {searchResults.Circle}</p>
              <p><span className="text-green-400">Last Recharge Date:</span> {searchResults.Last_Recharge_Date}</p>
              <p><span className="text-green-400">Last Recharge Amount:</span> ₹{searchResults.Last_Recharge_Amount}</p>
              <p><span className="text-green-400">Validity:</span> {searchResults.Validity}</p>
              <p><span className="text-green-400">Balance:</span> ₹{searchResults.Balance}</p>
              {searchResults.Plan_Name && (
                <p><span className="text-green-400">Plan:</span> {searchResults.Plan_Name}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};