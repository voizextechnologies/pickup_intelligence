import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Phone, 
  User, 
  CreditCard, 
  Activity, 
  Shield, 
  Zap, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Download,
  Eye,
  EyeOff,
  ArrowLeft,
  LogOut,
  Link as LinkIcon,
  Mail,
  Globe,
  Car,
  Smartphone,
  MapPin,
  History as HistoryIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOfficerAuth } from '../contexts/OfficerAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { PhonePrefillV2Response, PhonePrefillV2Request } from '../types';
import toast from 'react-hot-toast';
import { formatCredits } from '../utils/formatters';

export const OfficerDashboard: React.FC = () => {
  const { officer, logout, updateOfficerState } = useOfficerAuth();
  const { isDark } = useTheme();
  const { apis, queries, addQuery, addTransaction, getOfficerEnabledAPIs } = useSupabaseData();
  
  // State for search functionality
  const [activeTab, setActiveTab] = useState<'dashboard' | 'free' | 'pro' | 'tracklink' | 'history' | 'account'>('dashboard');
  const [activeFreeLookupSubTab, setActiveFreeLookupSubTab] = useState<'mobile-check' | 'email-check' | 'platform-scan'>('mobile-check');
  const [activeProLookupSubTab, setActiveProLookupSubTab] = useState<'phone-prefill-v2' | 'rc' | 'imei' | 'fasttag' | 'credit-history' | 'cell-id'>('rc');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PhonePrefillV2Response | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar state

  // RC Search states
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [rcSearchData, setRcSearchData] = useState<any>(null);
  const [rcSearchLoading, setRcSearchLoading] = useState(false);
  const [rcSearchError, setRcSearchError] = useState<string | null>(null);

  // Get client IP address (simplified approach)
  const [clientIP, setClientIP] = useState('127.0.0.1');

  useEffect(() => {
    // Try to get client IP address
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setClientIP(data.ip))
      .catch(() => setClientIP('127.0.0.1')); // Fallback IP
  }, []);

  // Get Phone Prefill V2 API from database
  const getPhonePrefillAPI = () => {
    return apis.find(api => 
      api.name.toLowerCase().includes('phone prefill v2') || 
      api.name.toLowerCase().includes('phone kyc') ||
      api.name.toLowerCase().includes('phonekyc') ||
      api.name.toLowerCase().includes('phone prefill')
    );
  };

  const handlePhonePrefillSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    
    if (!officer) {
      toast.error('Officer not authenticated');
      return;
    }

    // Get officer's enabled APIs with plan-specific pricing
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

    // Check if officer has sufficient credits
    const creditCost = phonePrefillAPI.credit_cost || phonePrefillAPI.default_credit_charge || 1;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setShowResults(false);

    try {
      // Clean phone number - remove any non-digits
      const cleanPhoneNumber = searchQuery.replace(/\D/g, '');
      
      // Prepare request payload for Phone Prefill V2
      const requestPayload: PhonePrefillV2Request = {
        mobileNumber: cleanPhoneNumber,
        ...(fullName.trim() && { fullName: fullName.trim() }),
        consent: {
          consentFlag: true,
          consentTimestamp: Math.floor(Date.now() / 1000), // Convert to seconds
          consentIpAddress: clientIP,
          consentMessageId: `CM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      };

      console.log('Making API request with payload:', requestPayload);
      console.log('Using API key:', phonePrefillAPI.api_key);

      // Make direct API call to Signzy (not through proxy)
      const response = await fetch('/api/signzy/api/v3/phonekyc/phone-prefill-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': phonePrefillAPI.api_key
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: PhonePrefillV2Response = await response.json();
      console.log('API Response data:', data);

      setSearchResults(data);
      setShowResults(true);

      // Deduct credits and record transaction
      const newCreditsRemaining = officer.credits_remaining - creditCost;
      
      // Update officer's state locally for immediate UI update
      updateOfficerState({ credits_remaining: newCreditsRemaining });

      // Record credit deduction transaction in database
      await addTransaction({
        officer_id: officer.id,
        officer_name: officer.name,
        action: 'Deduction',
        credits: creditCost,
        payment_mode: 'Query Usage',
        remarks: `Phone Prefill V2 query for ${cleanPhoneNumber}`
      });

      // Update local officer state
      updateOfficerState({
        credits_remaining: officer.credits_remaining - creditCost,
        total_queries: officer.total_queries + 1
      });

      // Log the query to database
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone Prefill V2',
        input_data: `Phone: ${cleanPhoneNumber}${fullName ? `, Name: ${fullName}` : ''}`,
        source: 'Signzy Phone Prefill V2',
        result_summary: `Found data for ${data.response.name?.fullName || 'Unknown'}`,
        full_result: data,
        credits_used: creditCost,
        status: 'Success'
      });

      toast.success('Phone prefill data retrieved successfully!');

    } catch (error) {
      console.error('Phone Prefill V2 search error:', error);
      
      // Log failed query
      if (officer && phonePrefillAPI) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name,
          type: 'PRO',
          category: 'Phone Prefill V2',
          input_data: `Phone: ${searchQuery}${fullName ? `, Name: ${fullName}` : ''}`,
          source: 'Signzy Phone Prefill V2',
          result_summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          full_result: null,
          credits_used: 0, // No credits deducted for failed queries
          status: 'Failed'
        });
      }

      toast.error(error instanceof Error ? error.message : 'Failed to retrieve phone prefill data');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRCSearch = async () => {
    if (!vehicleNumber.trim()) {
      toast.error('Please enter a vehicle registration number');
      return;
    }

    if (!officer) {
      toast.error('Officer information not available');
      return;
    }

    // Find the RC API configuration
    const rcAPI = apis.find(api => api.name.toLowerCase().includes('vehicle rc') || api.name.toLowerCase().includes('rc search'));
    if (!rcAPI || rcAPI.key_status !== 'Active') {
      toast.error('Vehicle RC search service is not available');
      return;
    }

    // Check if officer has sufficient credits
    const creditCost = rcAPI.default_credit_charge;
    if (officer.credits_remaining < creditCost) {
      toast.error('Insufficient credits for this search');
      return;
    }

    setRcSearchLoading(true);
    setRcSearchError(null);
    setRcSearchData(null);

    try {
      const response = await fetch('/api/signzy/api/v3/vehicle/detailedsearches', {
        method: 'POST',
        headers: {
          'Authorization': rcAPI.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleNumber: vehicleNumber.toUpperCase(),
          blacklistCheck: true,
          signzyID: officer.id,
          splitAddress: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch vehicle details');
      }

      if (data.result) {
        setRcSearchData(data.result);
        
        // Log successful query
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name,
          type: 'PRO',
          category: 'Vehicle RC',
          input_data: vehicleNumber.toUpperCase(),
          source: 'Signzy Vehicle RC API',
          result_summary: `Vehicle found: ${data.result.regNo} - ${data.result.owner}`,
          full_result: data.result,
          credits_used: creditCost,
          status: 'Success'
        });

        // Deduct credits
        await addTransaction({
          officer_id: officer.id,
          officer_name: officer.name,
          action: 'Deduction',
          credits: creditCost,
          payment_mode: 'Query Usage',
          remarks: `Vehicle RC search for ${vehicleNumber.toUpperCase()}`
        });

        // Update officer credits in context
        updateOfficerState({
          credits_remaining: officer.credits_remaining - creditCost
        });

        toast.success('Vehicle details retrieved successfully!');
      } else {
        throw new Error('No vehicle data found');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to search vehicle details';
      setRcSearchError(errorMessage);
      
      // Log failed query
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Vehicle RC',
        input_data: vehicleNumber.toUpperCase(),
        source: 'Signzy Vehicle RC API',
        result_summary: `Search failed: ${errorMessage}`,
        credits_used: 0,
        status: 'Failed'
      });

      toast.error(errorMessage);
    } finally {
      setRcSearchLoading(false);
    }
  };

  const handleOSINTSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    try {
      // Simulate OSINT search
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log the query
      if (officer) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name,
          type: 'OSINT',
          category: 'General Search',
          input_data: searchQuery,
          source: 'Open Source Intelligence',
          result_summary: 'OSINT search completed',
          full_result: { query: searchQuery, results: 'Mock OSINT data' },
          credits_used: 0,
          status: 'Success'
        });
      }

      toast.success('OSINT search completed!');
    } catch (error) {
      toast.error('OSINT search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove leading zeros and format
    const cleaned = phone.replace(/^0+/, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned}`;
    }
    return phone;
  };

  // Calculate real-time statistics for the officer
  const calculateOfficerStats = () => {
    if (!officer) return { todayQueries: 0, successRate: 0, creditsUsed: 0 };

    // Filter queries for this officer
    const officerQueries = queries.filter(q => q.officer_id === officer.id);
    
    // Today's queries
    const today = new Date().toDateString();
    const todayQueries = officerQueries.filter(q => {
      return new Date(q.created_at).toDateString() === today;
    }).length;

    // Success rate
    const successfulQueries = officerQueries.filter(q => q.status === 'Success').length;
    const successRate = officerQueries.length > 0 ? Math.round((successfulQueries / officerQueries.length) * 100) : 0;

    // Credits used (total credits - remaining credits)
    const creditsUsed = officer.total_credits - officer.credits_remaining;

    return { todayQueries, successRate, creditsUsed };
  };

  if (!officer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyber-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderDashboard = () => (
    (() => {
      const { todayQueries, successRate, creditsUsed } = calculateOfficerStats();
      return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Today's Queries
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCredits(todayQueries, 0)}
              </p>
            </div>
            <Search className="w-8 h-8 text-cyber-teal" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Success Rate
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCredits(successRate)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Credits Used
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCredits(creditsUsed)}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-neon-magenta" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Active Links
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                0
              </p>
            </div>
            <LinkIcon className="w-8 h-8 text-electric-blue" />
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('pro')}
            className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-cyber ${
              isDark ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40' : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40'
            }`}
          >
            <Phone className="w-8 h-8 text-cyber-teal mx-auto mb-2" />
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Mobile Check</p>
          </button>

          <button
            onClick={() => setActiveTab('free')}
            className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-cyber ${
              isDark ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40' : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40'
            }`}
          >
            <Search className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Check</p>
          </button>

          <button
            onClick={() => setActiveTab('pro')}
            className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-cyber ${
              isDark ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40' : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40'
            }`}
          >
            <Shield className="w-8 h-8 text-neon-magenta mx-auto mb-2" />
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Phone Prefill</p>
          </button>

          <button
            onClick={() => setActiveTab('tracklink')}
            className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-cyber ${
              isDark ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40' : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40'
            }`}
          >
            <LinkIcon className="w-8 h-8 text-electric-blue mx-auto mb-2" />
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>TrackLink</p>
          </button>
        </div>
      </div>
    </div>
      );
    })()
  );

  const renderFreeLookups = () => (
    <div className="space-y-6">
      {/* Sub-navigation for Free Lookups */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveFreeLookupSubTab('mobile-check')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeFreeLookupSubTab === 'mobile-check'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="font-medium">Mobile Check</span>
          </button>
          <button
            onClick={() => setActiveFreeLookupSubTab('email-check')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeFreeLookupSubTab === 'email-check'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span className="font-medium">Email Check</span>
          </button>
          <button
            onClick={() => setActiveFreeLookupSubTab('platform-scan')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeFreeLookupSubTab === 'platform-scan'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="font-medium">Platform Scan</span>
          </button>
        </div>
      </div>

      {/* Content based on active sub-tab */}
      {activeFreeLookupSubTab === 'mobile-check' && (
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Mobile Check (Free)
          </h2>
          <div className="space-y-4">
            <input
              type="tel"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter mobile number..."
              className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
            <button
              onClick={handleOSINTSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="w-full py-3 px-4 bg-cyber-gradient text-white font-medium rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  <span>Check Mobile</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeFreeLookupSubTab === 'email-check' && (
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Email Check (Free)
        </h2>
        <div className="space-y-4">
          <input
            type="email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter email address..."
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
              isDark 
                ? 'bg-crisp-black text-white placeholder-gray-500' 
                : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
          <button
            onClick={handleOSINTSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="w-full py-3 px-4 bg-cyber-gradient text-white font-medium rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Check Email</span>
              </>
            )}
          </button>
        </div>
      </div>
      )}

      {activeFreeLookupSubTab === 'platform-scan' && (
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Platform Scan (Free)
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter username or profile URL..."
              className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
            <button
              onClick={handleOSINTSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="w-full py-3 px-4 bg-cyber-gradient text-white font-medium rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  <span>Scan Platforms</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPROLookups = () => (
    <div className="space-y-6">
      {/* Sub-navigation for PRO Lookups */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setActiveProLookupSubTab('phone-prefill-v2')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeProLookupSubTab === 'phone-prefill-v2'
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
            onClick={() => setActiveProLookupSubTab('rc')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeProLookupSubTab === 'rc'
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
            onClick={() => setActiveProLookupSubTab('imei')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeProLookupSubTab === 'imei'
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
            onClick={() => setActiveProLookupSubTab('fasttag')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeProLookupSubTab === 'fasttag'
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
            onClick={() => setActiveProLookupSubTab('credit-history')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeProLookupSubTab === 'credit-history'
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
            onClick={() => setActiveProLookupSubTab('cell-id')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeProLookupSubTab === 'cell-id'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="font-medium">Cell ID</span>
          </button>
        </div>
      </div>

      {/* Content based on active PRO sub-tab */}
      {activeProLookupSubTab === 'phone-prefill-v2' && (
    <div className="space-y-6">
      {/* Phone Prefill V2 Search */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Phone Prefill V2 Search
          </h2>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-neon-magenta" />
            <span className="text-xs bg-neon-magenta/20 text-neon-magenta px-2 py-1 rounded">PREMIUM</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="9502444055"
              className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
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
              Full Name (Optional)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="RAMBABU DARA"
              className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
          <div></div>
        </div>

        <button
          onClick={handlePhonePrefillSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="w-full py-3 px-4 bg-cyber-gradient text-white font-medium rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSearching ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Searching Phone Prefill V2...</span>
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              <span>Search Phone Prefill V2</span>
            </>
          )}
        </button>
        <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          * Phone number is required. Full name is optional but may improve results. This will consume credits from your account.
        </p>
      </div>

      {/* Search Results */}
      {showResults && searchResults && (
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Phone Prefill V2 Results
            </h3>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400">Success</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Personal Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Full Name:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.response.name?.fullName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Age:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.response.age || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>DOB:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.response.dob || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Gender:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {searchResults.response.gender || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Contact Information
              </h4>
              <div className="space-y-3">
                {searchResults.response.alternatePhone?.length > 0 && (
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Phone Numbers:
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.response.alternatePhone.map((phone, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatPhoneNumber(phone.phoneNumber)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(phone.phoneNumber)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.response.email?.length > 0 && (
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Email Addresses:
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.response.email.map((email, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {email.email}
                          </span>
                          <button
                            onClick={() => copyToClipboard(email.email)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            {searchResults.response.address?.length > 0 && (
              <div className={`lg:col-span-2 p-4 rounded-lg border ${
                isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Address History
                </h4>
                <div className="space-y-3">
                  {searchResults.response.address.map((addr, index) => (
                    <div key={index} className={`p-3 rounded border ${
                      isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Address {addr.Seq}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {addr.ReportedDate}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {addr.Address}
                      </p>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          State: {addr.State}
                        </span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          Postal: {addr.Postal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Identity Documents */}
            <div className={`lg:col-span-2 p-4 rounded-lg border ${
              isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Identity Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PAN Cards */}
                {searchResults.response.PAN?.length > 0 && (
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      PAN Cards:
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.response.PAN.map((pan, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {pan.IdNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(pan.IdNumber)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voter IDs */}
                {searchResults.response.voterId?.length > 0 && (
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Voter IDs:
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.response.voterId.map((voter, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {voter.IdNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(voter.IdNumber)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Driving Licenses */}
                {searchResults.response.drivingLicense?.length > 0 && (
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Driving Licenses:
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.response.drivingLicense.map((dl, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {dl.IdNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(dl.IdNumber)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passports */}
                {searchResults.response.passport?.length > 0 && (
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Passports:
                    </span>
                    <div className="mt-1 space-y-1">
                      {searchResults.response.passport.map((passport, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {passport.passport}
                          </span>
                          <button
                            onClick={() => copyToClipboard(passport.passport)}
                            className="p-1 text-cyber-teal hover:text-electric-blue transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-cyber-teal/20">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(searchResults, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `phone-prefill-${searchQuery}-${Date.now()}.json`;
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
                setShowResults(false);
                setSearchResults(null);
                setSearchQuery('');
                setFullName('');
              }}
              className="px-4 py-2 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200"
            >
              New Search
            </button>
          </div>
        </div>
      )}
    </div>
      )}

      {/* RC Search Content */}
      {activeProLookupSubTab === 'rc' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-lg border ${
            isDark ? 'bg-crisp-black/50 border-cyber-teal/20' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <Car className="w-6 h-6 text-neon-magenta" />
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Vehicle RC Search
              </h4>
            </div>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Get detailed vehicle registration and owner information using vehicle registration number
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Vehicle Registration Number *
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., KA01JZ4031"
                  className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal font-mono ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <button
                onClick={handleRCSearch}
                disabled={rcSearchLoading || !vehicleNumber.trim()}
                className="w-full py-3 px-4 bg-neon-magenta text-white font-medium rounded-lg hover:bg-neon-magenta/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {rcSearchLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search Vehicle Details</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {rcSearchError && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Search Failed</span>
              </div>
              <p className="text-red-400 text-sm mt-2">{rcSearchError}</p>
            </div>
          )}

          {/* Results Display */}
          {rcSearchData && (
            <div className={`p-6 rounded-lg border ${
              isDark ? 'bg-muted-graphite border-cyber-teal/20' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Vehicle Details Found
                  </h4>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(rcSearchData, null, 2))}
                  className="flex items-center space-x-2 px-3 py-1 bg-cyber-teal/20 text-cyber-teal rounded-lg hover:bg-cyber-teal/30 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy Data</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Vehicle Information */}
                <div className="space-y-4">
                  <h5 className={`font-semibold text-cyber-teal`}>Basic Information</h5>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Registration Number:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.regNo}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Owner Name:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.owner}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Father's Name:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.ownerFatherName}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Vehicle Class:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.class}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rcSearchData.status === 'ACTIVE' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {rcSearchData.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Specifications */}
                <div className="space-y-4">
                  <h5 className={`font-semibold text-cyber-teal`}>Vehicle Specifications</h5>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manufacturer:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.vehicleManufacturerName}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Model:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.model}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Color:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.vehicleColour}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fuel Type:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.type}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Engine Number:</span>
                      <p className={`font-medium font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.engine}</p>
                    </div>
                  </div>
                </div>

                {/* Registration Details */}
                <div className="space-y-4">
                  <h5 className={`font-semibold text-cyber-teal`}>Registration Details</h5>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Registration Date:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.regDate}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>RC Expiry Date:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.rcExpiryDate}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Registration Authority:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.regAuthority}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tax Valid Upto:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.vehicleTaxUpto}</p>
                    </div>
                  </div>
                </div>

                {/* Insurance Details */}
                <div className="space-y-4">
                  <h5 className={`font-semibold text-cyber-teal`}>Insurance Details</h5>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Insurance Company:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.vehicleInsuranceCompanyName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Insurance Valid Upto:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.vehicleInsuranceUpto || 'N/A'}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Policy Number:</span>
                      <p className={`font-medium font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.vehicleInsurancePolicyNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Financer:</span>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.rcFinancer || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mt-6 pt-6 border-t border-cyber-teal/20">
                <h5 className={`font-semibold text-cyber-teal mb-4`}>Address Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Present Address:</span>
                    <p className={`font-medium mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.presentAddress}</p>
                  </div>
                  <div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Permanent Address:</span>
                    <p className={`font-medium mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{rcSearchData.permanentAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {(activeProLookupSubTab === 'imei' || activeProLookupSubTab === 'fasttag') && (
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {activeProLookupSubTab === 'imei' ? 'IMEI Verification' : 'FastTag Verification'}
          </h2>
          <div className="text-center py-12">
            <Car className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Coming Soon
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {activeProLookupSubTab === 'imei' ? 'IMEI' : 'FastTag'} verification services will be available soon.
            </p>
          </div>
        </div>
      )}

      {activeProLookupSubTab === 'credit-history' && (
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Credit History
          </h2>
          <div className="text-center py-12">
            <CreditCard className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Credit History
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Your credit transaction history will be available soon.
            </p>
          </div>
        </div>
      )}

      {activeProLookupSubTab === 'cell-id' && (
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Cell ID Lookup
          </h2>
          <div className="text-center py-12">
            <MapPin className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Coming Soon
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Cell ID lookup functionality will be available soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => {
    const officerQueries = queries.filter(q => q.officer_id === officer?.id);

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'Success':
          return <CheckCircle className="w-4 h-4 text-green-400" />;
        case 'Failed':
          return <XCircle className="w-4 h-4 text-red-400" />;
        case 'Pending':
          return <AlertCircle className="w-4 h-4 text-yellow-400" />;
        case 'Processing':
          return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
        default:
          return <AlertCircle className="w-4 h-4 text-gray-400" />;
      }
    };

    return (
      <div className={`border border-cyber-teal/20 rounded-lg overflow-hidden ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b border-cyber-teal/20 ${
              isDark ? 'bg-crisp-black/50' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Type</th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Category</th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Input Data</th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Credits Used</th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Status</th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {officerQueries.length > 0 ? (
                officerQueries.map((query) => (
                  <tr key={query.id} className={`border-b border-cyber-teal/10 transition-colors ${
                    isDark ? 'hover:bg-crisp-black/50' : 'hover:bg-gray-50'
                  }`}>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        query.type === 'PRO' 
                          ? 'bg-neon-magenta/20 text-neon-magenta' 
                          : 'bg-cyber-teal/20 text-cyber-teal'
                      }`}>
                        {query.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {query.category}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {query.input_data}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${
                      query.credits_used > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {query.credits_used > 0 ? `-${query.credits_used}` : '0'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(query.status)}
                        <span className={`text-sm ${
                          query.status === 'Success' ? 'text-green-400' :
                          query.status === 'Failed' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {query.status}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(query.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={`px-6 py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <HistoryIcon className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p>No queries found in your history.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-200 ease-in-out w-64 p-4 ${isDark ? 'bg-crisp-black' : 'bg-white'} border-r border-cyber-teal/20 z-50`}>
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="mb-4 p-2 text-cyber-teal hover:text-electric-blue transition-colors"
      >
        <ArrowLeft className={`w-5 h-5 ${isSidebarOpen ? 'rotate-180' : ''}`} />
      </button>
      <nav>
        {[
          { id: 'dashboard', name: 'Dashboard', icon: Zap },
          { id: 'free', name: 'Free Lookups', icon: Search },
          { id: 'pro', name: 'PRO Lookups', icon: Phone },
          { id: 'tracklink', name: 'TrackLink', icon: LinkIcon },
          { id: 'history', name: 'History', icon: Clock },
          { id: 'account', name: 'Account', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (window.innerWidth < 1024) setIsSidebarOpen(false); // Auto-close on mobile
              }}
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg w-full text-left transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                  : isDark 
                    ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                    : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'} flex`}>
      {renderSidebar()}
      <div className="flex-1 ml-0 transition-all duration-200 lg:ml-64">
        {/* Header with Officer Info */}
        <div className={return (
  <div className={`min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'} flex`}>
    {renderSidebar()}
    <div className="flex-1 ml-0 transition-all duration-200 lg:ml-64">
      {/* Header with Officer Info */}
      <div className={`border-b border-cyber-teal/20 p-4 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-cyber-teal/20' : 'bg-gray-200'}`}>
              <User className={`w-6 h-6 ${isDark ? 'text-cyber-teal' : 'text-gray-600'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {officer.name}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Officer ID: {officer.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full ${isDark ? 'bg-cyber-teal/20 text-cyber-teal' : 'bg-gray-200 text-gray-800'}`}>
              <span className="text-sm font-medium">
                Credits: {formatCredits(officer.credits_remaining)}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'free' && renderFreeLookups()}
        {activeTab === 'pro' && renderPROLookups()}
        {activeTab === 'tracklink' && (
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              TrackLink
            </h2>
            <div className="text-center py-12">
              <LinkIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Coming Soon
              </h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                TrackLink feature will be available soon.
              </p>
            </div>
          </div>
        )}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'account' && (
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Account Settings
            </h2>
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={officer.email || ''}
                  disabled
                  className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg ${isDark ? 'bg-crisp-black text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Theme
                </label>
                <select
                  value={isDark ? 'dark' : 'light'}
                  onChange={(e) => {
                    const theme = e.target.value === 'dark' ? true : false;
                    // This assumes ThemeContext has a setTheme function
                    // You would need to implement this in your ThemeContext
                    // useTheme().setTheme(theme);
                  }}
                  className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg ${isDark ? 'bg-crisp-black text-white' : 'bg-white text-gray-900'}`}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
);