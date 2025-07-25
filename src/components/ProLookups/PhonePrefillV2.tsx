import React, { useState } from 'react';
import { Phone, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { PhonePrefillV2Response, PhonePrefillV2Request } from '../../types';
import toast from 'react-hot-toast';

export const PhonePrefillV2: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { addTransaction, addQuery, getOfficerEnabledAPIs } = useSupabaseData();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!officer) {
      toast.error('Officer not authenticated.');
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setSearchError(null);

    const officerEnabledAPIs = await getOfficerEnabledAPIs(officer.id);
    const apiConfig = officerEnabledAPIs.find(api =>
      api.name.toLowerCase().includes('phone') && 
      api.name.toLowerCase().includes('prefill')
    );

    if (!apiConfig) {
      toast.error('Phone Prefill V2 API not enabled for your plan. Please contact admin.');
      setIsSearching(false);
      return;
    }

    if (apiConfig.key_status !== 'Active') {
      toast.error('Phone Prefill V2 API is currently inactive. Please contact admin.');
      setIsSearching(false);
      return;
    }

    const creditCost = apiConfig.default_credit_charge || 2;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      setIsSearching(false);
      return;
    }

    try {
      const requestPayload: PhonePrefillV2Request = {
        mobileNumber: phoneNumber,
        consent: {
          consentFlag: true,
          consentTimestamp: Date.now(),
          consentIpAddress: '127.0.0.1',
          consentMessageId: `consent_${Date.now()}`
        }
      };

      const response = await fetch('/api/signzy/api/v3/phoneprefillv2', {
        method: 'POST',
        headers: {
          'Authorization': apiConfig.api_key,
          'x-client-unique-id': officer.email,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PhonePrefillV2Response = await response.json();
      
      if (data.response) {
        setSearchResults(data.response);
        
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
          remarks: `Phone Prefill V2 for ${phoneNumber}`
        });

        // Log query
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name,
          type: 'PRO',
          category: 'Phone Prefill V2',
          input_data: phoneNumber,
          source: 'Signzy API',
          result_summary: `Phone details found for ${data.response.name?.fullName || 'Unknown'}`,
          full_result: data.response,
          credits_used: creditCost,
          status: 'Success'
        });
        
        toast.success('Phone details retrieved successfully!');
      } else {
        throw new Error('No phone data found');
      }
    } catch (error: any) {
      console.error('Phone Prefill V2 Error:', error);
      setSearchError(error.message || 'Search failed');
      toast.error('Search failed. Please try again.');
      
      // Log failed query
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone Prefill V2',
        input_data: phoneNumber,
        source: 'Signzy API',
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
        <Phone className="w-6 h-6 text-neon-magenta" />
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Phone Prefill V2
        </h3>
        <span className="text-xs px-2 py-1 bg-neon-magenta/20 text-neon-magenta rounded">PREMIUM</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Phone Number
          </label>
          <div className="flex space-x-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 9876543210"
              className={`flex-1 px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`px-4 py-2 bg-neon-magenta/20 text-neon-magenta rounded-lg hover:bg-neon-magenta/30 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50`}
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-neon-magenta border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search</span>
            </button>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Cost: 2 credits
          </p>
        </div>

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
            <h4 className="text-green-400 font-medium mb-3">Search Results</h4>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><span className="text-green-400">Name:</span> {searchResults.name?.fullName}</p>
                  <p><span className="text-green-400">Age:</span> {searchResults.age}</p>
                  <p><span className="text-green-400">Gender:</span> {searchResults.gender}</p>
                  <p><span className="text-green-400">DOB:</span> {searchResults.dob}</p>
                </div>
                <div>
                  <p><span className="text-green-400">Income:</span> {searchResults.income}</p>
                  <p><span className="text-green-400">Alt Phones:</span> {searchResults.alternatePhone?.length || 0}</p>
                  <p><span className="text-green-400">Emails:</span> {searchResults.email?.length || 0}</p>
                  <p><span className="text-green-400">Addresses:</span> {searchResults.address?.length || 0}</p>
                </div>
              </div>
              
              {searchResults.alternatePhone && searchResults.alternatePhone.length > 0 && (
                <div>
                  <h5 className="text-green-400 font-medium mb-1">Alternate Numbers:</h5>
                  {searchResults.alternatePhone.slice(0, 3).map((phone: any, index: number) => (
                    <p key={index} className="text-xs">• {phone.phoneNumber}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};