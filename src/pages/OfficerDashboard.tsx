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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'free' | 'pro' | 'tracklink' | 'history' | 'account'>('dashboard'); // Changed to number for decimal support
  const [activeFreeLookupSubTab, setActiveFreeLookupSubTab] = useState<'mobile-check' | 'email-check' | 'platform-scan'>('mobile-check'); // Changed to number for decimal support
  const [activeProLookupSubTab, setActiveProLookupSubTab] = useState<'phone-prefill-v2' | 'rc-imei-fasttag' | 'credit-history' | 'cell-id'>('phone-prefill-v2');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PhonePrefillV2Response | null>(null);
  const [showResults, setShowResults] = useState(false);

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
      toast.error('Phone Prefill V2 API not configured. Please contact admin.'); // Changed to number for decimal support
      return;
    }

    if (phonePrefillAPI.key_status !== 'Active') {
      toast.error('Phone Prefill V2 API is currently inactive');
      return;
    }

    // Check if officer has sufficient credits
    const creditCost = phonePrefillAPI.credit_cost || phonePrefillAPI.default_credit_charge || 1;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`); // Changed to number for decimal support
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

      const data: PhonePrefillV2Response = await response.json(); // Changed to number for decimal support
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
        officer_name: officer.name, // Changed to number for decimal support
        action: 'Deduction',
        credits: creditCost,
        payment_mode: 'Query Usage',
        remarks: `Phone Prefill V2 query for ${cleanPhoneNumber}`
      });

      // Update local officer state
      updateOfficerState({
        credits_remaining: officer.credits_remaining - creditCost, // Changed to number for decimal support
        total_queries: officer.total_queries + 1
      });

      // Log the query to database
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name, // Changed to number for decimal support
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
      console.error('Phone Prefill V2 search error:', error); // Changed to number for decimal support
      
      // Log failed query
      if (officer && phonePrefillAPI) {
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name, // Changed to number for decimal support
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
            onClick={() => setActiveProLookupSubTab('rc-imei-fasttag')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeProLookupSubTab === 'rc-imei-fasttag'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Car className="w-4 h-4" />
            <span className="font-medium">RC / IMEI / FastTag</span>
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

      {activeProLookupSubTab === 'rc-imei-fasttag' && (
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            RC / IMEI / FastTag Verification
          </h2>
          <div className="text-center py-12">
            <Car className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Coming Soon
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              RC, IMEI, and FastTag verification services will be available soon.
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
              Your credit transaction history will be displayed here.
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header with Officer Info */}
      <div className={`border-b border-cyber-teal/20 p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <Link to="/" className={`flex items-center space-x-2 transition-colors ${
            isDark ? 'text-gray-400 hover:text-cyber-teal' : 'text-gray-600 hover:text-cyber-teal'
          }`}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cyber-gradient rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Officer Portal
                </h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Intelligence Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-electric-blue rounded-full animate-pulse" />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                System Online
              </span>
            </div>

            <button
              onClick={logout}
              className={`p-2 transition-colors ${
                isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-400'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Officer Profile Bar */}
      <div className={`p-4 border-b border-cyber-teal/20 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-cyber-gradient rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {officer.name}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {officer.mobile}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCredits(officer.credits_remaining)} Credits
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                of {formatCredits(officer.total_credits)} {/* Changed to number for decimal support */}
              </p>
            </div>
            <div className={`w-full rounded-full h-2 ${isDark ? 'bg-crisp-black' : 'bg-gray-200'} w-24`}>
              <div 
                className="bg-cyber-gradient h-2 rounded-full transition-all duration-300"
                style={{ width: `${(officer.credits_remaining / officer.total_credits) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`border-b border-cyber-teal/20 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex space-x-1 p-4">
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
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                    : isDark 
                      ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                      : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'free' && renderFreeLookups()}
        {activeTab === 'pro' && renderPROLookups()}
        {activeTab === 'tracklink' && (
          <div className="text-center py-12">
            <LinkIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              TrackLink Coming Soon
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Link tracking functionality will be available soon.
            </p>
          </div>
        )}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'account' && (
          <div className="text-center py-12">
            <User className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Account Settings
            </h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Account management features coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};