import React, { useState } from 'react';
import { Phone, Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Copy, Download } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOfficerAuth } from '../../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

const PhonePrefillV2: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery, addTransaction, getOfficerEnabledAPIs } = useSupabaseData();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    contact: true,
    addresses: true,
    documents: true,
    raw: false,
  });

  const handlePhonePrefill = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    if (!officer) {
      toast.error('Officer not authenticated');
      return;
    }

    const enabledAPIs = getOfficerEnabledAPIs(officer.id);
    const phonePrefillAPI = enabledAPIs.find(api => 
      api.name.toLowerCase().includes('phone prefill v2') || 
      api.name.toLowerCase().includes('phone kyc') ||
      api.name.toLowerCase().includes('phonekyc') ||
      api.name.toLowerCase().includes('phone prefill')
    );

    if (!phonePrefillAPI) {
      toast.error('Phone Prefill V2 API not configured. Please contact admin.');
      return;
    }

    if (phonePrefillAPI.key_status !== 'Active') {
      toast.error('Phone Prefill V2 API is currently inactive');
      return;
    }

    const creditCost = phonePrefillAPI.credit_cost || phonePrefillAPI.default_credit_charge || 1;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setSearchError(null);

    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const requestPayload = {
        mobileNumber: cleanPhoneNumber,
        fullName: officer.name, // Add this line
        consent: {
          consentFlag: true,
          consentTimestamp: Math.floor(Date.now() / 1000),
          consentIpAddress: '127.0.0.1',
          consentMessageId: `CM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      };

      const response = await fetch('/api/signzy/api/v3/phonekyc/phone-prefill-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': phonePrefillAPI.api_key,
          'x-client-unique-id': officer.email // Add this line
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data.response);

      const newCreditsRemaining = officer.credits_remaining - creditCost;
      updateOfficerState({ credits_remaining: newCreditsRemaining });

      await addTransaction({
        officer_id: officer.id,
        officer_name: officer.name,
        action: 'Deduction',
        credits: creditCost,
        payment_mode: 'Query Usage',
        remarks: `Phone Prefill V2 query for ${cleanPhoneNumber}`
      });

      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone Prefill V2',
        input_data: `Phone: ${cleanPhoneNumber}`,
        source: 'Signzy Phone Prefill V2',
        result_summary: `Found data for ${data.response.name?.fullName || 'Unknown'}`,
        full_result: data,
        credits_used: creditCost,
        status: 'Success'
      });

      toast.success('Phone prefill data retrieved successfully!');
    } catch (error) {
      console.error('Phone Prefill V2 search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Unknown error');
      
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone Prefill V2',
        input_data: `Phone: ${phoneNumber}`,
        source: 'Signzy Phone Prefill V2',
        result_summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        full_result: null,
        credits_used: 0,
        status: 'Failed'
      });

      toast.error(error instanceof Error ? error.message : 'Failed to retrieve phone prefill data');
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/^0+/, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned}`;
    }
    return phone;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'} shadow-md hover:shadow-cyber transition-shadow duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Phone className="w-6 h-6 text-neon-magenta" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Phone Prefill V2
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-neon-magenta" />
          <span className="text-xs bg-neon-magenta/20 text-neon-magenta px-2 py-1 rounded">PREMIUM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Phone Number *
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (e.g., +91 9876543210)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handlePhonePrefill}
            disabled={isSearching || !phoneNumber.trim()}
            className="w-full py-3 px-4 bg-cyber-gradient text-white font-medium rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                <span>Search Phone</span>
              </>
            )}
          </button>
        </div>
      </div>
      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
        * Required. Consumes {apis.find(api => api.name.toLowerCase().includes('phone prefill v2'))?.credit_cost || 1} credits per query.
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
                Phone Details Found
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                Verified {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-lg mb-6 border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
            <h5 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Overview
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Phones</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {searchResults.alternatePhone?.length || 0}
                </p>
              </div>
              <div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Emails</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {searchResults.email?.length || 0}
                </p>
              </div>
              <div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Addresses</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {searchResults.address?.length || 0}
                </p>
              </div>
              <div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Documents</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {(searchResults.PAN?.length || 0) + (searchResults.voterId?.length || 0) + 
                  (searchResults.drivingLicense?.length || 0) + (searchResults.passport?.length || 0)}
                </p>
              </div>
            </div>
          </div>

          {searchResults.name && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('personal')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
              >
                <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Personal Information
                </h5>
                {expandedSections.personal ? (
                  <ChevronUp className="w-5 h-5 text-cyber-teal" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyber-teal" />
                )}
              </button>
              {expandedSections.personal && (
                <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Full Name:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {searchResults.name.fullName || 'N/A'}
                        </span>
                        {searchResults.name.fullName && (
                          <button
                            onClick={() => copyToClipboard(searchResults.name.fullName)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                            title="Copy Full Name"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>First Name:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.name.firstName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Last Name:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.name.lastName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Age:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.age || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Gender:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.gender || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>DOB:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.dob || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Income:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {searchResults.income || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(searchResults.alternatePhone?.length > 0 || searchResults.email?.length > 0) && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('contact')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
              >
                <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Contact Information
                </h5>
                {expandedSections.contact ? (
                  <ChevronUp className="w-5 h-5 text-cyber-teal" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyber-teal" />
                )}
              </button>
              {expandedSections.contact && (
                <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                  {searchResults.alternatePhone?.length > 0 && (
                    <div className="mb-4">
                      <h6 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Alternate Phone Numbers
                      </h6>
                      <div className="space-y-2">
                        {searchResults.alternatePhone.map((phone: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              #{phone.serialNo}: {formatPhoneNumber(phone.phoneNumber)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(phone.phoneNumber)}
                              className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                              title="Copy Phone Number"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchResults.email?.length > 0 && (
                    <div>
                      <h6 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Email Addresses
                      </h6>
                      <div className="space-y-2">
                        {searchResults.email.map((email: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              #{email.serialNo}: {email.email}
                            </span>
                            <button
                              onClick={() => copyToClipboard(email.email)}
                              className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                              title="Copy Email"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {searchResults.address?.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('addresses')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
              >
                <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Address History
                </h5>
                {expandedSections.addresses ? (
                  <ChevronUp className="w-5 h-5 text-cyber-teal" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyber-teal" />
                )}
              </button>
              {expandedSections.addresses && (
                <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.address.map((address: any, index: number) => (
                      <div key={index} className={`p-3 rounded border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Address #{address.Seq}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Reported: {address.ReportedDate || 'N/A'}
                          </span>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {address.Address} ({address.Type})
                        </p>
                        <div className="flex justify-between mt-2 text-xs">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            State: {address.State}
                          </span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            Postal: {address.Postal}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`${address.Address}, ${address.State} - ${address.Postal}`)}
                          className="mt-2 p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          title="Copy Address"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(searchResults.PAN?.length > 0 || searchResults.voterId?.length > 0 || 
            searchResults.drivingLicense?.length > 0 || searchResults.passport?.length > 0) && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('documents')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
              >
                <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Identity Documents
                </h5>
                {expandedSections.documents ? (
                  <ChevronUp className="w-5 h-5 text-cyber-teal" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyber-teal" />
                )}
              </button>
              {expandedSections.documents && (
                <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {searchResults.PAN?.length > 0 && (
                      <div>
                        <h6 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          PAN Cards
                        </h6>
                        {searchResults.PAN.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between mb-2">
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              #{item.seq}: {item.IdNumber}
                            </span>
                            <button
                              onClick={() => copyToClipboard(item.IdNumber)}
                              className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                              title="Copy PAN"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.voterId?.length > 0 && (
                      <div>
                        <h6 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Voter IDs
                        </h6>
                        {searchResults.voterId.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between mb-2">
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              #{item.seq}: {item.IdNumber}
                            </span>
                            <button
                              onClick={() => copyToClipboard(item.IdNumber)}
                              className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                              title="Copy Voter ID"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.drivingLicense?.length > 0 && (
                      <div>
                        <h6 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Driving Licenses
                        </h6>
                        {searchResults.drivingLicense.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between mb-2">
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              #{item.seq}: {item.IdNumber}
                            </span>
                            <button
                              onClick={() => copyToClipboard(item.IdNumber)}
                              className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                              title="Copy Driving License"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.passport?.length > 0 && (
                      <div>
                        <h6 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Passports
                        </h6>
                        {searchResults.passport.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between mb-2">
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              #{item.seq}: {item.passport}
                            </span>
                            <button
                              onClick={() => copyToClipboard(item.passport)}
                              className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                              title="Copy Passport"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                link.download = `phone-prefill-${phoneNumber}-${Date.now()}.json`;
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

export default PhonePrefillV2;