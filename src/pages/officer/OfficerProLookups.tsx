import React, { useState } from 'react';
import { Shield, Database, Phone, Car, CreditCard, FileText, Search, Smartphone, MapPin, Copy, Download, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

export const OfficerProLookups: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery, addTransaction, getOfficerEnabledAPIs } = useSupabaseData();
  const [activeTab, setActiveTab] = useState<'phone-prefill-v2' | 'rc' | 'imei' | 'fasttag' | 'credit-history' | 'cell-id' | 'mobile-check' | 'email-check' | 'advance-name-scan'>('phone-prefill-v2');
  const [rcNumber, setRcNumber] = useState('');
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
    vehicle: true,
    owner: true,
  });

  const handleRCSearch = async () => {
    if (!rcNumber.trim()) {
      toast.error('Please enter a vehicle registration number');
      return;
    }

    const rcAPI = apis.find(api => api.name.toLowerCase().includes('vehicle') && api.key_status === 'Active');
    
    if (!rcAPI) {
      toast.error('RC search service is currently unavailable');
      return;
    }

    if (officer.credits_remaining < rcAPI.default_credit_charge) {
      toast.error('Insufficient credits for this search');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const response = await fetch('/api/signzy/api/v3/vehicle/detailedsearches', {
        method: 'POST',
        headers: {
          'Authorization': rcAPI.api_key,
          'x-client-unique-id': officer.email,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleNumber: rcNumber.toUpperCase(),
          splitAddress: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result) {
        setSearchResults(data.result);
        
        const newCredits = officer.credits_remaining - rcAPI.default_credit_charge;
        updateOfficerState({ credits_remaining: newCredits });
        
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name,
          type: 'PRO',
          category: 'Vehicle RC Search',
          input_data: rcNumber.toUpperCase(),
          source: 'Signzy API',
          result_summary: `Vehicle found: ${data.result.model} - ${data.result.owner}`,
          full_result: data.result,
          credits_used: rcAPI.default_credit_charge,
          status: 'Success'
        });
        
        toast.success('Vehicle details retrieved successfully!');
      } else {
        throw new Error('No vehicle data found');
      }
    } catch (error: any) {
      console.error('RC Search Error:', error);
      setSearchError(error.message || 'Search failed');
      toast.error('Search failed. Please try again.');
      
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Vehicle RC Search',
        input_data: rcNumber.toUpperCase(),
        source: 'Signzy API',
        result_summary: `Search failed: ${error.message}`,
        credits_used: 0,
        status: 'Failed'
      });
    } finally {
      setIsSearching(false);
    }
  };

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
        consent: {
          consentFlag: true,
          consentTimestamp: Math.floor(Date.now() / 1000),
          consentIpAddress: '127.0.0.1',
          consentMessageId: `CM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      };

      console.log('Making API request with payload:', requestPayload);
      console.log('Using API key:', phonePrefillAPI.api_key);

      const response = await fetch('/api/signzy/api/v3/phonekyc/phone-prefill-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': phonePrefillAPI.api_key
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);

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

  const renderPhonePrefillV2 = () => (
    <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
      isDark ? 'bg-muted-graphite' : 'bg-white'
    } shadow-md hover:shadow-cyber transition-shadow duration-300`}>
      {/* Header */}
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

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>Phone Number *</label>
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

      {/* Error Display */}
      {searchError && (
        <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
          isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        } mb-6`}>
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

      {/* Search Results */}
      {searchResults && (
        <div className={`p-6 rounded-lg border ${
          isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Phone Details Found
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${
                isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
              }`}>
                Verified {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Summary Card */}
          <div className={`p-4 rounded-lg mb-6 border ${
            isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-white border-gray-200'
          }`}>
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

          {/* Personal Information */}
          {searchResults.name && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('personal')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${
                  isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
                }`}
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
                <div className={`p-4 mt-2 rounded-lg border ${
                  isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'
                }`}>
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

          {/* Contact Information */}
          {(searchResults.alternatePhone?.length > 0 || searchResults.email?.length > 0) && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('contact')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${
                  isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
                }`}
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
                <div className={`p-4 mt-2 rounded-lg border ${
                  isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'
                }`}>
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

          {/* Address History */}
          {searchResults.address?.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('addresses')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${
                  isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
                }`}
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
                <div className={`p-4 mt-2 rounded-lg border ${
                  isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.address.map((address: any, index: number) => (
                      <div key={index} className={`p-3 rounded border ${
                        isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
                      }`}>
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

          {/* Identity Documents */}
          {(searchResults.PAN?.length > 0 || searchResults.voterId?.length > 0 || 
            searchResults.drivingLicense?.length > 0 || searchResults.passport?.length > 0) && (
            <div className="mb-6">
              <button
                onClick={() => toggleSection('documents')}
                className={`w-full flex items-center justify-between p-4 rounded-lg border ${
                  isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
                }`}
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
                <div className={`p-4 mt-2 rounded-lg border ${
                  isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'
                }`}>
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

          {/* Raw JSON Response */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('raw')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${
                isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
              }`}
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
              <div className={`mt-2 p-4 rounded-lg border ${
                isDark ? 'bg-crisp-black text-white' : 'bg-gray-100 text-gray-800'
              } overflow-x-auto`}>
                <pre className="text-xs">
                  <code>{JSON.stringify(searchResults, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Action Buttons */}
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

  const renderRCSearch = () => (
  <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
    isDark ? 'bg-muted-graphite' : 'bg-white'
  } shadow-md hover:shadow-cyber transition-shadow duration-300`}>
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <Car className="w-6 h-6 text-electric-blue" />
        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Vehicle RC Search
        </h3>
      </div>
      <div className="flex items-center space-x-2">
        <Shield className="w-5 h-5 text-electric-blue" />
        <span className="text-xs bg-electric-blue/20 text-electric-blue px-2 py-1 rounded">PREMIUM</span>
      </div>
    </div>

    {/* Input Form */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="md:col-span-2">
        <label className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>Vehicle Registration Number *</label>
        <input
          type="text"
          value={rcNumber}
          onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
          placeholder="Enter vehicle registration number (e.g., TN09CP9879)"
          className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
            isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
          }`}
        />
      </div>
      <div className="flex items-end">
        <button
          onClick={handleRCSearch}
          disabled={isSearching || !rcNumber.trim()}
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
              <span>Search RC</span>
            </>
          )}
        </button>
      </div>
    </div>
    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
      * Required. Consumes {apis.find(api => api.name.toLowerCase().includes('vehicle'))?.default_credit_charge || 3} credits per query.
    </p>

    {/* Error Display */}
    {searchError && (
      <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
        isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
      } mb-6`}>
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

    {/* Search Results */}
    {searchResults && searchResults.regNo && (
      <div className={`p-6 rounded-lg border ${
        isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Vehicle Details Found
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${
              isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              Verified {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('vehicle')}
            className={`w-full flex items-center justify-between p-4 rounded-lg border ${
              isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Vehicle Information
            </h5>
            {expandedSections.vehicle ? (
              <ChevronUp className="w-5 h-5 text-cyber-teal" />
            ) : (
              <ChevronDown className="w-5 h-5 text-cyber-teal" />
            )}
          </button>
          {expandedSections.vehicle && (
            <div className={`p-4 mt-2 rounded-lg border ${
              isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Registration No:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.regNo || 'N/A'}
                    </span>
                    {searchResults.regNo && (
                      <button
                        onClick={() => copyToClipboard(searchResults.regNo)}
                        className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                        title="Copy Registration No"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Vehicle Number:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Model:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.model || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Make:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleManufacturerName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Color:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleColour || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Fuel Type:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.type || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Vehicle Type:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.bodyType || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Vehicle Class:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.class || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Vehicle Category:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleCategory || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Seating Capacity:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleSeatCapacity || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Sleeper Capacity:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleSleeperCapacity || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Standing Capacity:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleStandingCapacity || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cylinders:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleCylindersNo || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cubic Capacity:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleCubicCapacity || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Gross Vehicle Weight:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.grossVehicleWeight || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Unladen Weight:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.unladenWeight || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Wheelbase:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.wheelbase || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Engine No:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.engine || 'N/A'}
                    </span>
                    {searchResults.engine && (
                      <button
                        onClick={() => copyToClipboard(searchResults.engine)}
                        className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                        title="Copy Engine No"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Chassis No:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.chassis || 'N/A'}
                    </span>
                    {searchResults.chassis && (
                      <button
                        onClick={() => copyToClipboard(searchResults.chassis)}
                        className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                        title="Copy Chassis No"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Emission Norms:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.normsType || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manufacturing Month/Year:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleManufacturingMonthYear || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Owner and Registration Information */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('owner')}
            className={`w-full flex items-center justify-between p-4 rounded-lg border ${
              isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Owner and Registration Information
            </h5>
            {expandedSections.owner ? (
              <ChevronUp className="w-5 h-5 text-cyber-teal" />
            ) : (
              <ChevronDown className="w-5 h-5 text-cyber-teal" />
            )}
          </button>
          {expandedSections.owner && (
            <div className={`p-4 mt-2 rounded-lg border ${
              isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Owner Name:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.owner || 'N/A'}
                    </span>
                    {searchResults.owner && (
                      <button
                        onClick={() => copyToClipboard(searchResults.owner)}
                        className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                        title="Copy Owner Name"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Owner Father Name:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.ownerFatherName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Owner Count:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.ownerCount || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Mobile Number:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.mobileNumber || 'N/A'}
                    </span>
                    {searchResults.mobileNumber && (
                      <button
                        onClick={() => copyToClipboard(searchResults.mobileNumber)}
                        className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                        title="Copy Mobile Number"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.status || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Status As On:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.statusAsOn || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Registration Date:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.regDate || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>RC Expiry:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.rcExpiryDate || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tax Upto:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleTaxUpto || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Insurance Company:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleInsuranceCompanyName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Insurance Upto:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.vehicleInsuranceUpto || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Insurance Policy Number:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {searchResults.vehicleInsurancePolicyNumber || 'N/A'}
                    </span>
                    {searchResults.vehicleInsurancePolicyNumber && (
                      <button
                        onClick={() => copyToClipboard(searchResults.vehicleInsurancePolicyNumber)}
                        className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                        title="Copy Insurance Policy Number"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Financier:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.rcFinancer || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>RTO:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.regAuthority || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>RTO Code:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.rtoCode || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>PUCC Number:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.puccNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>PUCC Upto:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.puccUpto || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Blacklist Status:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.blacklistStatus || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Blacklist Details:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.blacklistDetails?.length > 0 ? JSON.stringify(searchResults.blacklistDetails) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Challan Details:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.challanDetails?.length > 0 ? JSON.stringify(searchResults.challanDetails) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Permit Number:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.permitNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Permit Type:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.permitType || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Permit Issue Date:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.permitIssueDate || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Permit Valid From:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.permitValidFrom || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Permit Valid Upto:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.permitValidUpto || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>National Permit Number:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.nationalPermitNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>National Permit Upto:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.nationalPermitUpto || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>National Permit Issued By:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.nationalPermitIssuedBy || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Non-Use Status:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.nonUseStatus || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Non-Use From:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.nonUseFrom || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Non-Use To:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.nonUseTo || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Is Commercial:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.isCommercial !== undefined ? String(searchResults.isCommercial) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>NOC Details:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.nocDetails || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>RC Standard Capacity:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.rcStandardCap || 'N/A'}
                  </span>
                </div>
                {searchResults.splitPresentAddress && (
                  <div className="col-span-2">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Present Address:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {[
                          searchResults.splitPresentAddress.addressLine,
                          searchResults.splitPresentAddress.city?.[0],
                          searchResults.splitPresentAddress.district?.[0],
                          searchResults.splitPresentAddress.state?.[0]?.[0],
                          searchResults.splitPresentAddress.pincode,
                          searchResults.splitPresentAddress.country?.[0]
                        ].filter(Boolean).join(', ') || 'N/A'}
                      </span>
                      {searchResults.splitPresentAddress.addressLine && (
                        <button
                          onClick={() => copyToClipboard([
                            searchResults.splitPresentAddress.addressLine,
                            searchResults.splitPresentAddress.city?.[0],
                            searchResults.splitPresentAddress.district?.[0],
                            searchResults.splitPresentAddress.state?.[0]?.[0],
                            searchResults.splitPresentAddress.pincode,
                            searchResults.splitPresentAddress.country?.[0]
                          ].filter(Boolean).join(', '))}
                          className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          title="Copy Present Address"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {searchResults.splitPermanentAddress && (
                  <div className="col-span-2">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Permanent Address:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {[
                          searchResults.splitPermanentAddress.addressLine,
                          searchResults.splitPermanentAddress.city?.[0],
                          searchResults.splitPermanentAddress.district?.[0],
                          searchResults.splitPermanentAddress.state?.[0]?.[0],
                          searchResults.splitPermanentAddress.pincode,
                          searchResults.splitPermanentAddress.country?.[0]
                        ].filter(Boolean).join(', ') || 'N/A'}
                      </span>
                      {searchResults.splitPermanentAddress.addressLine && (
                        <button
                          onClick={() => copyToClipboard([
                            searchResults.splitPermanentAddress.addressLine,
                            searchResults.splitPermanentAddress.city?.[0],
                            searchResults.splitPermanentAddress.district?.[0],
                            searchResults.splitPermanentAddress.state?.[0]?.[0],
                            searchResults.splitPermanentAddress.pincode,
                            searchResults.splitPermanentAddress.country?.[0]
                          ].filter(Boolean).join(', '))}
                          className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          title="Copy Permanent Address"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Raw JSON Response */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('raw')}
            className={`w-full flex items-center justify-between p-4 rounded-lg border ${
              isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
            }`}
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
            <div className={`mt-2 p-4 rounded-lg border ${
              isDark ? 'bg-crisp-black text-white' : 'bg-gray-100 text-gray-800'
            } overflow-x-auto`}>
              <pre className="text-xs">
                <code>{JSON.stringify(searchResults, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-cyber-teal/20">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(searchResults, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `rc-details-${rcNumber}-${Date.now()}.json`;
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
              setRcNumber('');
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

  const renderComingSoon = (title: string, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <div className="text-center py-12">
          <Icon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Coming Soon
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {title} functionality will be available soon.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          PRO Verification Services
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Premium API-based verification and intelligence services
        </p>
      </div>

      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('phone-prefill-v2')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'phone-prefill-v2'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="font-medium">Phone Prefill V2</span>
          </button>
          <button
            onClick={() => setActiveTab('rc')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'rc'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Car className="w-4 h-4" />
            <span className="font-medium">RC</span>
          </button>
          <button
            onClick={() => setActiveTab('imei')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'imei'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="font-medium">IMEI</span>
          </button>
          <button
            onClick={() => setActiveTab('fasttag')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'fasttag'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Car className="w-4 h-4" />
            <span className="font-medium">FastTag</span>
          </button>
          <button
            onClick={() => setActiveTab('credit-history')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'credit-history'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">Credit History</span>
          </button>
          <button
            onClick={() => setActiveTab('cell-id')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'cell-id'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="font-medium">Cell ID</span>
          </button>
          <button
  onClick={() => setActiveTab('recharge-status')}
  className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
    activeTab === 'recharge-status'
      ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
      : isDark 
        ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
        : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
  }`}
>
  <Smartphone className="w-4 h-4" />
  <span className="font-medium">Recharge Status Check</span>
</button>
<button
  onClick={() => setActiveTab('recharge-expiry')}
  className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
    activeTab === 'recharge-expiry'
      ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
      : isDark 
        ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
        : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
  }`}
>
  <FileText className="w-4 h-4" />
  <span className="font-medium">Recharge Expiry Check</span>
</button>
<button
  onClick={() => setActiveTab('operator-check')}
  className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
    activeTab === 'operator-check'
      ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
      : isDark 
        ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
        : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
  }`}
>
  <Search className="w-4 h-4" />
  <span className="font-medium">Operator Check</span>
</button>
        </div>
      </div>

      {activeTab === 'phone-prefill-v2' && renderPhonePrefillV2()}
      {activeTab === 'rc' && renderRCSearch()}
      {activeTab === 'imei' && renderComingSoon('IMEI Verification', Smartphone)}
      {activeTab === 'fasttag' && renderComingSoon('FastTag Verification', Car)}
      {activeTab === 'credit-history' && renderComingSoon('Credit History', CreditCard)}
      {activeTab === 'cell-id' && renderComingSoon('Cell ID Lookup', MapPin)}
      {activeTab === 'mobile-check' && renderComingSoon('Mobile Check', Smartphone)}
      {activeTab === 'email-check' && renderComingSoon('Email Check', FileText)}
      {activeTab === 'advance-name-scan' && renderComingSoon('Advance Name Scan', Search)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-neon-magenta/10 border-neon-magenta/30 text-neon-magenta">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Phone Verification
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Advanced phone intelligence
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Phone Prefill V2</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Carrier Lookup</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Number Validation</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-electric-blue/10 border-electric-blue/30 text-electric-blue">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Vehicle Verification
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                RC and vehicle details
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>RC Detailed Search</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Vehicle History</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Ownership Check</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-cyber-teal/10 border-cyber-teal/30 text-cyber-teal">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Document Verification
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                ID and document checks
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>PAN Verification</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Aadhaar Check</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Passport Verify</span>
              <span className="text-cyber-teal">4 credits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};