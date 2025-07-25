import React, { useState } from 'react';
import { Phone, Search, CheckCircle, XCircle } from 'lucide-react';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { PhonePrefillV2Response, PhonePrefillV2Request } from '../../types';
import toast from 'react-hot-toast';

export const PhonePrefillV2Lookup: React.FC = () => {
  const { officer, updateOfficerState } = useOfficerAuth();
  const { isDark } = useTheme();
  const { apis, addQuery } = useSupabaseData();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handlePhonePrefillV2 = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!officer) {
      toast.error('Officer not authenticated');
      return;
    }

    // Find Phone Prefill V2 API
    const phoneAPI = apis.find(api => 
      api.name.toLowerCase().includes('phone') && 
      api.name.toLowerCase().includes('prefill') &&
      api.key_status === 'Active'
    );
    
    if (!phoneAPI) {
      toast.error('Phone Prefill V2 service is currently unavailable');
      return;
    }

    if (officer.credits_remaining < phoneAPI.default_credit_charge) {
      toast.error('Insufficient credits for this search');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

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

      const response = await fetch('/api/signzy/v3/phoneprefillv2', {
      const response = await fetch('/api/signzy/phoneprefillv2', {
        method: 'POST',
        headers: {
          'Authorization': phoneAPI.api_key,
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
        setShowResults(true);
        
        // Deduct credits
        const newCredits = officer.credits_remaining - phoneAPI.default_credit_charge;
        updateOfficerState({ credits_remaining: newCredits });
        
        // Log the query
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name,
          type: 'PRO',
          category: 'Phone Prefill V2',
          input_data: phoneNumber,
          source: 'Signzy API',
          result_summary: `Phone details found for ${data.response.name?.fullName || 'Unknown'}`,
          full_result: data.response,
          credits_used: phoneAPI.default_credit_charge,
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

  const clearResults = () => {
    setSearchResults(null);
    setSearchError(null);
    setShowResults(false);
  };

  return (
    <div className="space-y-6">
      {/* Phone Prefill V2 Input */}
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
              onClick={handlePhonePrefillV2}
              disabled={isSearching}
              className="px-4 py-2 bg-neon-magenta/20 text-neon-magenta rounded-lg hover:bg-neon-magenta/30 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
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
      </div>

      {/* Search Results */}
      {(showResults || searchError) && (
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Search Results
            </h3>
            <button
              onClick={clearResults}
              className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              Clear
            </button>
          </div>

          {searchError && (
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-medium">Search Failed</p>
              </div>
              <p className="text-red-400 text-sm mt-1">{searchError}</p>
            </div>
          )}

          {searchResults && (
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-medium">Search Successful</p>
              </div>

              {/* Phone Prefill V2 Results */}
              {searchResults.name && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Personal Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-green-400">Name:</span> {searchResults.name.fullName}</p>
                        <p><span className="text-green-400">Age:</span> {searchResults.age}</p>
                        <p><span className="text-green-400">Gender:</span> {searchResults.gender}</p>
                        <p><span className="text-green-400">DOB:</span> {searchResults.dob}</p>
                        <p><span className="text-green-400">Income:</span> {searchResults.income}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Contact Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-green-400">Alternate Phones Count:</span> {searchResults.alternatePhone?.length || 0}</p>
                        <p><span className="text-green-400">Emails Count:</span> {searchResults.email?.length || 0}</p>
                        <p><span className="text-green-400">Addresses Count:</span> {searchResults.address?.length || 0}</p>
                        <p><span className="text-green-400">Voter IDs Count:</span> {searchResults.voterId?.length || 0}</p>
                        <p><span className="text-green-400">Passports Count:</span> {searchResults.passport?.length || 0}</p>
                        <p><span className="text-green-400">Driving Licenses Count:</span> {searchResults.drivingLicense?.length || 0}</p>
                        <p><span className="text-green-400">PAN Cards Count:</span> {searchResults.PAN?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {searchResults.alternatePhone && searchResults.alternatePhone.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Alternate Phone Numbers</h4>
                      <div className="space-y-1">
                        {searchResults.alternatePhone.map((phone: any, index: number) => (
                          <p key={index} className="text-sm">
                            <span className="text-green-400">#{phone.serialNo}:</span> {phone.phoneNumber}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.email && searchResults.email.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Email Addresses</h4>
                      <div className="space-y-1">
                        {searchResults.email.map((email: any, index: number) => (
                          <p key={index} className="text-sm">
                            <span className="text-green-400">#{email.serialNo}:</span> {email.email}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.address && searchResults.address.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Addresses</h4>
                      <div className="space-y-1">
                        {searchResults.address.map((address: any, index: number) => (
                          <p key={index} className="text-sm">
                            <span className="text-green-400">#{address.Seq}:</span> {address.Address}, {address.State} - {address.Postal} ({address.Type})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.voterId && searchResults.voterId.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Voter IDs</h4>
                      <div className="space-y-1">
                        {searchResults.voterId.map((item: any, index: number) => (
                          <p key={index} className="text-sm">
                            <span className="text-green-400">#{item.seq}:</span> {item.IdNumber} (Reported: {item.ReportedDate})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.passport && searchResults.passport.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Passports</h4>
                      <div className="space-y-1">
                        {searchResults.passport.map((item: any, index: number) => (
                          <p key={index} className="text-sm">
                            <span className="text-green-400">#{item.seq}:</span> {item.passport} (Reported: {item.ReportedDate || 'N/A'})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.drivingLicense && searchResults.drivingLicense.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Driving Licenses</h4>
                      <div className="space-y-1">
                        {searchResults.drivingLicense.map((item: any, index: number) => (
                          <p key={index} className="text-sm">
                            <span className="text-green-400">#{item.seq}:</span> {item.IdNumber} (Reported: {item.ReportedDate})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.PAN && searchResults.PAN.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">PAN Cards</h4>
                      <div className="space-y-1">
                        {searchResults.PAN.map((item: any, index: number) => (
                          <p key={index} className="text-sm">
                            <span className="text-green-400">#{item.seq}:</span> {item.IdNumber} (Reported: {item.ReportedDate})
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <details className="mt-4">
                    <summary className={`cursor-pointer text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} hover:text-cyber-teal`}>
                      View Raw JSON Response
                    </summary>
                    <pre className={`mt-2 p-4 rounded-lg overflow-x-auto text-xs ${isDark ? 'bg-crisp-black text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <code>{JSON.stringify(searchResults, null, 2)}</code>
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isSearching && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-cyber-teal border-t-transparent rounded-full animate-spin" />
              <span className={isDark ? 'text-white' : 'text-gray-900'}>
                Processing your request...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};