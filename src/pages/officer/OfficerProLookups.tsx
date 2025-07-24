import React, { useState, useEffect } from 'react';
import { 
  Search, Phone, Car, CreditCard, Clock, CheckCircle, XCircle, AlertCircle,
  Smartphone, Mail, User
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import toast from 'react-hot-toast';
import { formatCredits } from '../../utils/formatters';

export const OfficerProLookups: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'phone-prefill-v2' | 'rc' | 'imei' | 'fasttag' | 'credit-history' | 'cell-id'>('phone-prefill-v2');
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery, addTransaction, getOfficerEnabledAPIs } = useSupabaseData();
  const { isDark } = useTheme();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [imeiNumber, setImeiNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [clientIP, setClientIP] = useState('127.0.0.1'); // Placeholder for client IP

  // Mock data for demonstration

  // Function to get client IP (for consent)
  useEffect(() => {
    // In a real implementation, you would fetch the client IP
    // For now, we'll use a placeholder
    setClientIP('127.0.0.1');
  }, []);

  const clearResults = () => {
    setSearchResults(null);
    setSearchError(null);
    setShowResults(false);
  };

  const handlePhonePrefillV2 = async () => {
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
    setShowResults(false);

    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const requestPayload = {
        mobileNumber: cleanPhoneNumber,
        consent: {
          consentFlag: true,
          consentTimestamp: Math.floor(Date.now() / 1000),
          consentIpAddress: clientIP,
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
      setShowResults(true);

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
      setShowResults(true);
      
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
    setShowResults(false);

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
        setShowResults(true);
        
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
      setShowResults(true);
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

  const handleIMEISearch = async () => {
    if (!imeiNumber.trim()) {
      toast.error('Please enter an IMEI number');
      return;
    }

    // Mock IMEI search for demonstration
    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);
    setShowResults(false);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful response
      const mockResults = {
        imei: imeiNumber,
        brand: 'Samsung',
        model: 'Galaxy S21',
        status: 'Valid',
        blacklisted: false,
        carrier: 'Airtel',
        lastSeen: '2024-01-15'
      };

      setSearchResults(mockResults);
      setShowResults(true);
      
      // Deduct credits (mock)
      const creditCost = 2;
      const newCredits = officer.credits_remaining - creditCost;
      updateOfficerState({ credits_remaining: newCredits });
      
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'IMEI Search',
        input_data: imeiNumber,
        source: 'Mock IMEI API',
        result_summary: `IMEI found: ${mockResults.brand} ${mockResults.model}`,
        full_result: mockResults,
        credits_used: creditCost,
        status: 'Success'
      });
      
      toast.success('IMEI details retrieved successfully!');
    } catch (error: any) {
      console.error('IMEI Search Error:', error);
      setSearchError(error.message || 'Search failed');
      setShowResults(true);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'phone-prefill-v2':
        return (
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <div className="flex items-center space-x-3 mb-6">
              <Phone className="w-6 h-6 text-neon-magenta" />
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Phone Prefill V2
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Phone Number</label>
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
                  onClick={handlePhonePrefillV2}
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
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Consumes 2 credits per query. Provides comprehensive phone intelligence including alternate numbers, emails, addresses, and identity documents.
            </p>
          </div>
        );

      case 'rc':
        return (
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <div className="flex items-center space-x-3 mb-6">
              <Car className="w-6 h-6 text-electric-blue" />
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Vehicle RC Search
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Vehicle Registration Number</label>
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
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Consumes 3 credits per query. Provides detailed vehicle information including owner details, registration info, and insurance status.
            </p>
          </div>
        );

      case 'imei':
        return (
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <div className="flex items-center space-x-3 mb-6">
              <Smartphone className="w-6 h-6 text-cyber-teal" />
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                IMEI Verification
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>IMEI Number</label>
                <input
                  type="text"
                  value={imeiNumber}
                  onChange={(e) => setImeiNumber(e.target.value)}
                  placeholder="Enter IMEI number (15 digits)"
                  className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleIMEISearch}
                  disabled={isSearching || !imeiNumber.trim()}
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
                      <span>Verify IMEI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Consumes 2 credits per query. Provides device information, blacklist status, and carrier details.
            </p>
          </div>
        );

      default:
        return (
          <div className={`border border-cyber-teal/20 rounded-lg p-8 text-center ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <Clock className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Feature Coming Soon
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              We're actively developing this feature. Stay tuned for updates!
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          PRO Verification Services
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Premium API-based verification and intelligence services
        </p>
      </div>

      {/* Credits Display */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyber-teal/10">
              <CreditCard className="w-5 h-5 text-cyber-teal" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Available Credits</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCredits(officer?.credits_remaining || 0)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Officer</p>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {officer?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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
            <Search className="w-4 h-4" />
            <span className="font-medium">Cell ID</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Loading Overlay */}
      {isSearching && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-lg border ${
            isDark ? 'bg-muted-graphite border-cyber-teal/30' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 border-4 border-cyber-teal border-t-transparent rounded-full animate-spin" />
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Processing Search...
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Please wait while we retrieve the information
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};