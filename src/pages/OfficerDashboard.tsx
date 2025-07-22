import React, { useState, useEffect } from 'react';
import { Search, Phone, Mail, User, CreditCard, History, Shield, Zap, AlertCircle, CheckCircle, Clock, ArrowLeft, Link as LinkIcon, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useOfficerAuth } from '../contexts/OfficerAuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PhonePrefillResult {
  name: {
    fullName: string;
    firstName: string;
    lastName: string;
  };
  alternatePhone: Array<{
    serialNo: string;
    phoneNumber: string;
  }>;
  email: Array<{
    serialNo: string;
    email: string;
  }>;
  address: Array<{
    Seq: string;
    ReportedDate: string;
    Address: string;
    State: string;
    Postal: string;
    Type: string;
  }>;
  voterId: Array<{
    seq: string;
    IdNumber: string;
    ReportedDate: string;
  }>;
  passport: Array<{
    seq: string;
    passport: string;
    ReportedDate?: string;
  }>;
  drivingLicense: Array<{
    seq: string;
    IdNumber: string;
    ReportedDate: string;
  }>;
  PAN: Array<{
    seq: string;
    ReportedDate: string;
    IdNumber: string;
  }>;
  income: string;
  gender: string;
  age: string;
  dob: string;
}

export const OfficerDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, logout, updateOfficerState } = useOfficerAuth();
  const { getOfficerEnabledAPIs, addQuery, apis } = useSupabaseData();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'free' | 'pro' | 'tracklink' | 'history' | 'account'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullNameQuery, setFullNameQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [todaysQueries, setTodaysQueries] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [activeLinks, setActiveLinks] = useState(0);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Zap },
    { id: 'free', name: 'Free Lookups', icon: Search },
    { id: 'pro', name: 'PRO Lookups', icon: Shield },
    { id: 'tracklink', name: 'TrackLink', icon: LinkIcon },
    { id: 'history', name: 'History', icon: History },
    { id: 'account', name: 'Account', icon: User }
  ];

  // Load recent queries and calculate stats on component mount
  useEffect(() => {
    if (officer) {
      loadRecentQueries();
      calculateStats();
    }
  }, [officer]);

  const loadRecentQueries = async () => {
    if (!officer) return;

    try {
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .eq('officer_id', officer.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentQueries(data || []);
    } catch (error) {
      console.error('Error loading recent queries:', error);
    }
  };

  const calculateStats = async () => {
    if (!officer) return;

    try {
      // Get today's queries
      const today = new Date().toISOString().split('T')[0];
      const { data: todayQueries, error: todayError } = await supabase
        .from('queries')
        .select('*')
        .eq('officer_id', officer.id)
        .gte('created_at', today);

      if (todayError) throw todayError;

      const todayCount = todayQueries?.length || 0;
      const successCount = todayQueries?.filter(q => q.status === 'Success').length || 0;
      const usedCredits = todayQueries?.reduce((sum, q) => sum + q.credits_used, 0) || 0;

      setTodaysQueries(todayCount);
      setSuccessRate(todayCount > 0 ? Math.round((successCount / todayCount) * 100) : 0);
      setCreditsUsed(usedCredits);
      setActiveLinks(2); // Mock data for now
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const handlePhonePrefillSearch = async (phoneNumber: string) => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!officer) {
      toast.error('Officer authentication required');
      return;
    }

    // Get officer's enabled APIs based on their rate plan
    const enabledAPIs = await getOfficerEnabledAPIs(officer.id);
    const phonePrefillAPI = enabledAPIs.find(api => api.name === 'Phone Prefill V2');

    if (!phonePrefillAPI) {
      toast.error('Phone Prefill V2 API not available in your plan');
      return;
    }

    // Check credit requirements - use the credit_cost from the plan configuration
    const creditsRequired = Number(phonePrefillAPI.credit_cost) || 1;
    
    if (officer.credits_remaining < creditsRequired) {
      toast.error(`Insufficient credits. Required: ${creditsRequired}, Available: ${officer.credits_remaining}`);
      return;
    }

    setIsSearching(true);

    try {
      // Find Signzy API key
      const signzyAPI = apis.find(api => 
        api.name.toLowerCase().includes('phone prefill') || 
        api.service_provider.toLowerCase().includes('signzy')
      );

      if (!signzyAPI || !signzyAPI.api_key) {
        toast.error('Signzy API key not configured. Please contact admin.');
        return;
      }

      if (signzyAPI.key_status !== 'Active') {
        toast.error('Signzy API is currently inactive. Please contact admin.');
        return;
      }

      // Prepare request body according to Signzy API documentation
      const requestBody = {
        mobileNumber: phoneNumber.replace(/\D/g, ''), // Remove non-digits
        ...(fullNameQuery.trim() && { fullName: fullNameQuery.trim() }),
        consent: {
          consentFlag: true,
          consentTimestamp: Math.floor(Date.now() / 1000),
          consentIpAddress: "127.0.0.1", // Placeholder IP
          consentMessageId: "CM_1"
        }
      };

      // Make API call to Signzy through proxy
      const response = await fetch('/api/signzy/api/v3/phonekyc/phone-prefill-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_SIGNZY_API_KEY_HERE' // Replace with actual Signzy API key
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
            consentFlag: "true",
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const result = await response.json();

      // Deduct credits and record transaction
      const newCreditsRemaining = officer.credits_remaining - creditsRequired;

      // Update officer's state locally for immediate UI update
      updateOfficerState({ credits_remaining: newCreditsRemaining });

      // Record the query in database
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone Prefill V2',
        input_data: `Phone: ${phoneNumber}${fullNameQuery.trim() ? `, Name: ${fullNameQuery.trim()}` : ''}`,
        source: 'Signzy Phone Prefill V2',
        result_summary: `Phone prefill data retrieved for ${phoneNumber}`,
        full_result: result,
        credits_used: creditsRequired,
        status: 'Success'
      });

      // Record credit transaction
      await supabase.from('credit_transactions').insert([{
        officer_id: officer.id,
        officer_name: officer.name,
        action: 'Deduction',
        credits: -creditsRequired,
        payment_mode: 'Query Usage',
        remarks: `Phone Prefill V2 query for ${phoneNumber}`
      }]);

      setSearchResults(result);
      toast.success(`Search completed! ${creditsRequired} credits deducted.`);
      
      // Reload recent queries and stats
      loadRecentQueries();
      calculateStats();

    } catch (error: any) {
      console.error('Phone Prefill V2 API Error:', error);
      
      // Record failed query
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone Prefill V2',
        input_data: `Phone: ${phoneNumber}${fullNameQuery.trim() ? `, Name: ${fullNameQuery.trim()}` : ''}`,
        source: 'Signzy Phone Prefill V2',
        result_summary: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        full_result: null,
        credits_used: 0,
        status: 'Failed'
      });

      toast.error(`Phone Prefill V2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOSINTSearch = async (query: string) => {
    if (!officer) return;

    setIsSearching(true);

    try {
      // Mock OSINT search - free service
      const mockResults = {
        socialMedia: [
          { platform: 'Twitter', username: '@rameshk', followers: 1250 },
          { platform: 'LinkedIn', profile: 'Ramesh Kumar - Software Engineer' }
        ],
        publicRecords: [
          { type: 'Business Registration', details: 'Tech Solutions Pvt Ltd' },
          { type: 'Property Record', details: 'Residential property in Bangalore' }
        ],
        webPresence: [
          { type: 'Website', url: 'rameshkumar.dev' },
          { type: 'Blog', url: 'techblog.ramesh.com' }
        ]
      };

      // Record the query (no credits deducted for OSINT)
      await addQuery({
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'OSINT',
        category: 'General Search',
        input_data: query,
        source: 'Open Sources',
        result_summary: 'Found social media and public records',
        full_result: mockResults,
        credits_used: 0,
        status: 'Success'
      });

      setSearchResults(mockResults);
      toast.success('OSINT search completed!');
      
      // Reload recent queries and stats
      loadRecentQueries();
      calculateStats();

    } catch (error) {
      console.error('OSINT Search Error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'mobile':
        setActiveTab('pro');
        setSearchQuery('');
        break;
      case 'email':
        setActiveTab('free');
        setSearchQuery('');
        break;
      case 'phone':
        setActiveTab('pro');
        setSearchQuery('');
        break;
      case 'tracklink':
        setActiveTab('tracklink');
        break;
      default:
        break;
    }
  };

  const renderPhonePrefillResults = (results: PhonePrefillResult) => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <User className="w-5 h-5 mr-2 text-cyber-teal" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Full Name
            </label>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {results.name.fullName}
            </p>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Age
            </label>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {results.age} years
            </p>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Gender
            </label>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {results.gender}
            </p>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Date of Birth
            </label>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {results.dob}
            </p>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Income Range
            </label>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ₹{results.income}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <Phone className="w-5 h-5 mr-2 text-cyber-teal" />
          Contact Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Alternate Phone Numbers
            </label>
            <div className="mt-2 space-y-2">
              {results.alternatePhone.map((phone) => (
                <p key={phone.serialNo} className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {phone.phoneNumber}
                </p>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Email Addresses
            </label>
            <div className="mt-2 space-y-2">
              {results.email.map((email) => (
                <p key={email.serialNo} className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {email.email}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <Mail className="w-5 h-5 mr-2 text-cyber-teal" />
          Address Information
        </h3>
        <div className="space-y-4">
          {results.address.map((addr) => (
            <div key={addr.Seq} className={`p-4 rounded-lg ${
              isDark ? 'bg-crisp-black/50' : 'bg-gray-50'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Address
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {addr.Address}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    State & Postal
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {addr.State} - {addr.Postal}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Type
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {addr.Type}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Reported Date
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {addr.ReportedDate}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Identity Documents */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <Shield className="w-5 h-5 mr-2 text-cyber-teal" />
          Identity Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              PAN Card
            </label>
            <div className="mt-2 space-y-2">
              {results.PAN.map((pan) => (
                <div key={pan.seq} className={`p-3 rounded ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
                  <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {pan.IdNumber}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Reported: {pan.ReportedDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Voter ID
            </label>
            <div className="mt-2 space-y-2">
              {results.voterId.map((voter) => (
                <div key={voter.seq} className={`p-3 rounded ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
                  <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {voter.IdNumber}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Reported: {voter.ReportedDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Driving License
            </label>
            <div className="mt-2 space-y-2">
              {results.drivingLicense.map((dl) => (
                <div key={dl.seq} className={`p-3 rounded ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
                  <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {dl.IdNumber}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Reported: {dl.ReportedDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Passport
            </label>
            <div className="mt-2 space-y-2">
              {results.passport.map((passport) => (
                <div key={passport.seq} className={`p-3 rounded ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
                  <p className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {passport.passport}
                  </p>
                  {passport.ReportedDate && (
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Reported: {passport.ReportedDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOSINTResults = (results: any) => (
    <div className="space-y-6">
      {/* Social Media */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Social Media Presence
        </h3>
        <div className="space-y-3">
          {results.socialMedia.map((social: any, index: number) => (
            <div key={index} className={`p-3 rounded ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {social.platform}: {social.username || social.profile}
              </p>
              {social.followers && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Followers: {social.followers}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Public Records */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Public Records
        </h3>
        <div className="space-y-3">
          {results.publicRecords.map((record: any, index: number) => (
            <div key={index} className={`p-3 rounded ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {record.type}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {record.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Web Presence */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Web Presence
        </h3>
        <div className="space-y-3">
          {results.webPresence.map((web: any, index: number) => (
            <div key={index} className={`p-3 rounded ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {web.type}: {web.url}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!officer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access the officer dashboard</p>
          <Link to="/officer/login" className="text-cyber-teal hover:text-electric-blue">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <header className={`border-b border-cyber-teal/20 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  isDark ? 'text-gray-400 hover:text-cyber-teal' : 'text-gray-600 hover:text-cyber-teal'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyber-gradient rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    PickMe Intelligence
                  </h1>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Officer Portal
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {officer.name}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {officer.mobile}
                </p>
              </div>
              <button
                onClick={logout}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-300 hover:text-red-400' : 'text-gray-700 hover:text-red-400'
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Officer Profile Section */}
        <div className={`border border-cyber-teal/20 rounded-lg p-6 mb-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-cyber-gradient rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {officer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {officer.name}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {officer.mobile}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {officer.credits_remaining} Credits
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                of {officer.total_credits}
              </p>
            </div>
          </div>
          
          {/* Credit Progress Bar */}
          <div className="mt-4">
            <div className={`w-full rounded-full h-3 ${isDark ? 'bg-crisp-black' : 'bg-gray-200'}`}>
              <div 
                className="bg-cyber-gradient h-3 rounded-full transition-all duration-300"
                style={{ width: `${(officer.credits_remaining / officer.total_credits) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`border border-cyber-teal/20 rounded-lg mb-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-cyber-teal text-cyber-teal bg-cyber-teal/10'
                      : `border-transparent ${isDark ? 'text-gray-400 hover:text-cyber-teal' : 'text-gray-600 hover:text-cyber-teal'}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
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
                      {todaysQueries}
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
                      {successRate}%
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
                      {creditsUsed}
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
                      {activeLinks}
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
                  onClick={() => handleQuickAction('mobile')}
                  className={`p-6 rounded-lg border border-cyber-teal/20 transition-all duration-200 hover:shadow-cyber ${
                    isDark ? 'bg-crisp-black/50 hover:bg-cyber-teal/10' : 'bg-gray-50 hover:bg-cyber-teal/10'
                  }`}
                >
                  <Phone className="w-8 h-8 text-cyber-teal mx-auto mb-3" />
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Mobile Check
                  </p>
                </button>

                <button
                  onClick={() => handleQuickAction('email')}
                  className={`p-6 rounded-lg border border-cyber-teal/20 transition-all duration-200 hover:shadow-cyber ${
                    isDark ? 'bg-crisp-black/50 hover:bg-cyber-teal/10' : 'bg-gray-50 hover:bg-cyber-teal/10'
                  }`}
                >
                  <Mail className="w-8 h-8 text-cyber-teal mx-auto mb-3" />
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Email Check
                  </p>
                </button>

                <button
                  onClick={() => handleQuickAction('phone')}
                  className={`p-6 rounded-lg border border-neon-magenta/20 transition-all duration-200 hover:shadow-neon ${
                    isDark ? 'bg-crisp-black/50 hover:bg-neon-magenta/10' : 'bg-gray-50 hover:bg-neon-magenta/10'
                  }`}
                >
                  <Shield className="w-8 h-8 text-neon-magenta mx-auto mb-3" />
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Phone Prefill
                  </p>
                </button>

                <button
                  onClick={() => handleQuickAction('tracklink')}
                  className={`p-6 rounded-lg border border-electric-blue/20 transition-all duration-200 hover:shadow-electric ${
                    isDark ? 'bg-crisp-black/50 hover:bg-electric-blue/10' : 'bg-gray-50 hover:bg-electric-blue/10'
                  }`}
                >
                  <LinkIcon className="w-8 h-8 text-electric-blue mx-auto mb-3" />
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    TrackLink
                  </p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
              isDark ? 'bg-muted-graphite' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Activity
              </h3>
              
              {recentQueries.length > 0 ? (
                <div className="space-y-3">
                  {recentQueries.slice(0, 5).map((query) => (
                    <div key={query.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? 'bg-crisp-black/50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          query.type === 'PRO' 
                            ? 'bg-neon-magenta/20 text-neon-magenta' 
                            : 'bg-cyber-teal/20 text-cyber-teal'
                        }`}>
                          {query.category}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {query.input_data}
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(query.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No recent activity. Start your first search.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'free' && (
          <div className="space-y-6">
            <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
              isDark ? 'bg-muted-graphite' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Free OSINT Lookups
              </h3>
              <div className="flex space-x-4 mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search query (name, email, etc.)"
                  className={`flex-1 px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={() => handleOSINTSearch(searchQuery)}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-3 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-cyber-teal/10 border border-cyber-teal/30' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <Search className="w-5 h-5 text-cyber-teal mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Free OSINT Search
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Search public records, social media, and web presence. No credits required.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {searchResults && activeTab === 'free' && renderOSINTResults(searchResults)}
          </div>
        )}

        {activeTab === 'pro' && (
          <div className="space-y-6">
            <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
              isDark ? 'bg-muted-graphite' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                PRO Lookups - Phone Prefill V2
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter phone number (e.g., +91 9876543210)"
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
                    value={fullNameQuery}
                    onChange={(e) => setFullNameQuery(e.target.value)}
                    placeholder="Enter full name for better accuracy (optional)"
                    className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                      isDark 
                        ? 'bg-crisp-black text-white placeholder-gray-500' 
                        : 'bg-white text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <button
                  onClick={() => handlePhonePrefillSearch(searchQuery)}
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full px-6 py-3 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      <span>Search Phone Prefill V2</span>
                    </>
                  )}
                </button>
              </div>

              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-neon-magenta/10 border border-neon-magenta/30' : 'bg-pink-50 border border-pink-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-neon-magenta mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      PRO Search - Credits Required
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      This search will deduct credits based on your plan configuration. You have {officer.credits_remaining} credits remaining.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {searchResults && activeTab === 'pro' && renderPhonePrefillResults(searchResults)}
          </div>
        )}

        {activeTab === 'tracklink' && (
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              TrackLink
            </h3>
            <div className="text-center py-12">
              <LinkIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                TrackLink Coming Soon
              </p>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Advanced link tracking and analysis features will be available here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Query History
            </h3>
            
            {recentQueries.length > 0 ? (
              <div className="space-y-4">
                {recentQueries.map((query) => (
                  <div key={query.id} className={`p-4 rounded-lg border ${
                    isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          query.type === 'PRO' 
                            ? 'bg-neon-magenta/20 text-neon-magenta' 
                            : 'bg-cyber-teal/20 text-cyber-teal'
                        }`}>
                          {query.type}
                        </span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {query.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {query.status === 'Success' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : query.status === 'Failed' ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className={`text-xs ${
                          query.status === 'Success' ? 'text-green-400' :
                          query.status === 'Failed' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {query.status}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Query: {query.input_data}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Result: {query.result_summary}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(query.created_at).toLocaleString()}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Credits: {query.credits_used}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  No Query History
                </p>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your search history will appear here once you start performing queries.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Full Name
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {officer.name}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Mobile Number
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {officer.mobile}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email Address
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {officer.email}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Department
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {officer.department || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Rank
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {officer.rank || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Badge Number
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {officer.badge_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Credits Remaining
                  </label>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {officer.credits_remaining} / {officer.total_credits}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Account Status
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    officer.status === 'Active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {officer.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};