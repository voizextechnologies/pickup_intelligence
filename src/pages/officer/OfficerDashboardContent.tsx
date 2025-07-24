import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  CreditCard, 
  Clock, 
  TrendingUp, 
  Activity, 
  Phone, 
  Car, 
  FileText, 
  User,
  Mail,
  Globe,
  Database,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { StatusBadge } from '../../components/UI/StatusBadge';
import { PhonePrefillV2Response, PhonePrefillV2Request } from '../../types';
import toast from 'react-hot-toast';
import { formatCredits } from '../../utils/formatters';

export const OfficerDashboardContent: React.FC = () => {
  const { officer, updateOfficerState } = useOfficerAuth();
  const { isDark } = useTheme();
  const { apis, addQuery, getOfficerEnabledAPIs } = useSupabaseData();
  
  // State for different lookup types
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  if (!officer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyber-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handlePhonePrefillV2 = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
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

      const response = await fetch('/api/signzy/api/v3/phoneprefillv2', {
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

  const handleRCSearch = async () => {
    if (!rcNumber.trim()) {
      toast.error('Please enter a vehicle registration number');
      return;
    }

    // Find RC API
    const rcAPI = apis.find(api => 
      api.name.toLowerCase().includes('vehicle') && 
      api.key_status === 'Active'
    );
    
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
        setShowResults(true);
        
        // Deduct credits
        const newCredits = officer.credits_remaining - rcAPI.default_credit_charge;
        updateOfficerState({ credits_remaining: newCredits });
        
        // Log the query
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
      
      // Log failed query
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

  const handleOSINTSearch = async (type: 'email' | 'social') => {
    const input = type === 'email' ? emailAddress : socialHandle;
    
    if (!input.trim()) {
      toast.error(`Please enter ${type === 'email' ? 'an email address' : 'a social media handle'}`);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      // Simulate OSINT search (free)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = {
        type,
        input,
        found: Math.random() > 0.3, // 70% success rate
        details: type === 'email' 
          ? {
              breaches: Math.floor(Math.random() * 5),
              socialAccounts: Math.floor(Math.random() * 3),
              lastSeen: '2024-01-15'
            }
          : {
              platform: 'Twitter',
              followers: Math.floor(Math.random() * 10000),
              verified: Math.random() > 0.8,
              lastPost: '2024-01-20'
            }
      };
      
      setSearchResults(mockResult);
      setShowResults(true);
      
      // Log the query (free, no credits deducted)
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'OSINT',
        category: type === 'email' ? 'Email Investigation' : 'Social Media Search',
        input_data: input,
        source: 'OSINT Tools',
        result_summary: mockResult.found ? `${type} found with details` : `No data found for ${type}`,
        full_result: mockResult,
        credits_used: 0,
        status: mockResult.found ? 'Success' : 'Failed'
      });
      
      toast.success(mockResult.found ? 'OSINT search completed!' : 'No data found');
    } catch (error: any) {
      console.error('OSINT Search Error:', error);
      setSearchError(error.message || 'Search failed');
      toast.error('Search failed. Please try again.');
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
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {officer.name.split(' ')[0]}!
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {officer.rank} - {officer.department}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Badge Number</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {officer.badge_number}
            </p>
          </div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Credits Remaining
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCredits(officer.credits_remaining)}
              </p>
              <p className="text-xs mt-1 text-green-400">
                of {formatCredits(officer.total_credits)} total
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyber-teal/10 border-cyber-teal/30 text-cyber-teal">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Queries Today
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                12
              </p>
              <p className="text-xs mt-1 text-green-400">
                +3 from yesterday
              </p>
            </div>
            <div className="p-3 rounded-lg bg-electric-blue/10 border-electric-blue/30 text-electric-blue">
              <Search className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Success Rate
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                96%
              </p>
              <p className="text-xs mt-1 text-green-400">
                Excellent performance
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border-green-500/30 text-green-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Avg Response Time
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                1.2s
              </p>
              <p className="text-xs mt-1 text-green-400">
                Fast & reliable
              </p>
            </div>
            <div className="p-3 rounded-lg bg-neon-magenta/10 border-neon-magenta/30 text-neon-magenta">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => clearResults()}
            className="p-4 rounded-lg border border-cyber-teal/20 hover:bg-cyber-teal/10 transition-all duration-200 text-left"
          >
            <Search className="w-6 h-6 text-cyber-teal mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Free OSINT Lookup
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Search public records and social media
            </p>
          </button>

          <button 
            onClick={() => clearResults()}
            className="p-4 rounded-lg border border-cyber-teal/20 hover:bg-cyber-teal/10 transition-all duration-200 text-left"
          >
            <Shield className="w-6 h-6 text-neon-magenta mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              PRO Verification
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Premium API-based verification
            </p>
          </button>

          <button 
            onClick={() => clearResults()}
            className="p-4 rounded-lg border border-cyber-teal/20 hover:bg-cyber-teal/10 transition-all duration-200 text-left"
          >
            <Activity className="w-6 h-6 text-electric-blue mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              View History
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Check your query history
            </p>
          </button>
        </div>
      </div>

      {/* Search Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Free OSINT Tools */}
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <Search className="w-6 h-6 text-cyber-teal" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Free OSINT Lookups
            </h3>
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">FREE</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Investigation
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="suspect@example.com"
                  className={`flex-1 px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={() => handleOSINTSearch('email')}
                  disabled={isSearching}
                  className="px-4 py-2 bg-cyber-teal/20 text-cyber-teal rounded-lg hover:bg-cyber-teal/30 transition-all duration-200 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Social Media Search
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  placeholder="@username or profile URL"
                  className={`flex-1 px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={() => handleOSINTSearch('social')}
                  disabled={isSearching}
                  className="px-4 py-2 bg-cyber-teal/20 text-cyber-teal rounded-lg hover:bg-cyber-teal/30 transition-all duration-200 disabled:opacity-50"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PRO Verification Tools */}
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-neon-magenta" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              PRO Verification
            </h3>
            <span className="text-xs px-2 py-1 bg-neon-magenta/20 text-neon-magenta rounded">PREMIUM</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Phone Prefill V2
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
                  className="px-4 py-2 bg-neon-magenta/20 text-neon-magenta rounded-lg hover:bg-neon-magenta/30 transition-all duration-200 disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Cost: 2 credits
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Vehicle RC Search
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                  placeholder="KA01JZ4031"
                  className={`flex-1 px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={handleRCSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 transition-all duration-200 disabled:opacity-50"
                >
                  <Car className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Cost: 3 credits
              </p>
            </div>
          </div>
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
                      </div>
                    </div>
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Contact Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-green-400">Alt Phones:</span> {searchResults.alternatePhone?.length || 0}</p>
                        <p><span className="text-green-400">Emails:</span> {searchResults.email?.length || 0}</p>
                        <p><span className="text-green-400">Addresses:</span> {searchResults.address?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {searchResults.alternatePhone && searchResults.alternatePhone.length > 0 && (
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Alternate Phone Numbers</h4>
                      <div className="space-y-1">
                        {searchResults.alternatePhone.slice(0, 3).map((phone: any, index: number) => (
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
                        {searchResults.email.slice(0, 3).map((email: any, index: number) => (
                          <p key={index} className="text-sm">
                            <span className="text-green-400">#{email.serialNo}:</span> {email.email}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle RC Results */}
              {searchResults.regNo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-green-400 font-medium mb-2">Vehicle Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-green-400">Registration:</span> {searchResults.regNo}</p>
                      <p><span className="text-green-400">Owner:</span> {searchResults.owner}</p>
                      <p><span className="text-green-400">Model:</span> {searchResults.model}</p>
                      <p><span className="text-green-400">Color:</span> {searchResults.vehicleColour}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-medium mb-2">Registration Info</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-green-400">Status:</span> {searchResults.status}</p>
                      <p><span className="text-green-400">Reg Date:</span> {searchResults.regDate}</p>
                      <p><span className="text-green-400">RC Expiry:</span> {searchResults.rcExpiryDate}</p>
                      <p><span className="text-green-400">Insurance:</span> {searchResults.vehicleInsuranceUpto}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* OSINT Results */}
              {searchResults.type && (
                <div>
                  <h4 className="text-green-400 font-medium mb-2">
                    {searchResults.type === 'email' ? 'Email Investigation' : 'Social Media Search'} Results
                  </h4>
                  {searchResults.found ? (
                    <div className="space-y-1 text-sm">
                      {searchResults.type === 'email' ? (
                        <>
                          <p><span className="text-green-400">Data Breaches:</span> {searchResults.details.breaches}</p>
                          <p><span className="text-green-400">Social Accounts:</span> {searchResults.details.socialAccounts}</p>
                          <p><span className="text-green-400">Last Seen:</span> {searchResults.details.lastSeen}</p>
                        </>
                      ) : (
                        <>
                          <p><span className="text-green-400">Platform:</span> {searchResults.details.platform}</p>
                          <p><span className="text-green-400">Followers:</span> {searchResults.details.followers.toLocaleString()}</p>
                          <p><span className="text-green-400">Verified:</span> {searchResults.details.verified ? 'Yes' : 'No'}</p>
                          <p><span className="text-green-400">Last Post:</span> {searchResults.details.lastPost}</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-yellow-400 text-sm">No data found for this {searchResults.type}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Vehicle RC Search
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  KA01JZ4031 - Success
                </p>
              </div>
              <span className="text-xs text-green-400">2 min ago</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Phone Verification
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  +91 9876543210 - Success
                </p>
              </div>
              <span className="text-xs text-green-400">15 min ago</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Email Lookup
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  suspect@example.com - Success
                </p>
              </div>
              <span className="text-xs text-green-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>

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