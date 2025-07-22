import React, { useState, useEffect } from 'react';
import { Search, Phone, Mail, User, CreditCard, History, Shield, Zap, AlertCircle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useOfficerAuth } from '../contexts/OfficerAuthContext';
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
  const [searchType, setSearchType] = useState<'osint' | 'pro'>('osint');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);

  // Load recent queries on component mount
  useEffect(() => {
    if (officer) {
      loadRecentQueries();
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

  const handlePhonePrefillSearch = async (phoneNumber: string) => {
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

    // Check credit requirements
    const creditsRequired = Number(phonePrefillAPI.credit_cost) || 1;
    
    if (officer.credits_remaining < creditsRequired) {
      toast.error(`Insufficient credits. Required: ${creditsRequired}, Available: ${officer.credits_remaining}`);
      return;
    }

    setIsSearching(true);

    try {
      // Mock API response for demonstration
      const mockResponse: PhonePrefillResult = {
        name: {
          fullName: "Ramesh Kumar Singh",
          firstName: "Ramesh",
          lastName: "Singh"
        },
        alternatePhone: [
          { serialNo: "1", phoneNumber: "+91 9876543210" },
          { serialNo: "2", phoneNumber: "+91 8765432109" }
        ],
        email: [
          { serialNo: "1", email: "ramesh.kumar@email.com" },
          { serialNo: "2", email: "r.kumar@company.com" }
        ],
        address: [
          {
            Seq: "1",
            ReportedDate: "2023-01-15",
            Address: "123 MG Road, Bangalore",
            State: "Karnataka",
            Postal: "560001",
            Type: "Permanent"
          }
        ],
        voterId: [
          { seq: "1", IdNumber: "ABC1234567", ReportedDate: "2022-03-10" }
        ],
        passport: [
          { seq: "1", passport: "P1234567", ReportedDate: "2021-06-20" }
        ],
        drivingLicense: [
          { seq: "1", IdNumber: "KA01234567890", ReportedDate: "2020-08-15" }
        ],
        PAN: [
          { seq: "1", ReportedDate: "2019-12-05", IdNumber: "ABCDE1234F" }
        ],
        income: "5-10 Lakhs",
        gender: "Male",
        age: "35",
        dob: "1988-05-15"
      };

      // Deduct credits and record transaction
      let newCreditsRemaining = officer.credits_remaining - creditsRequired;

      // Update officer's state locally for immediate UI update
      updateOfficerState({ credits_remaining: newCreditsRemaining });

      // Record the query in database
      await supabase.from('queries').insert([{
        officer_id: officer.id,
        officer_name: officer.name,
        type: 'PRO',
        category: 'Phone Prefill V2',
        input_data: phoneNumber,
        source: 'Signzy API',
        result_summary: `Found data for ${mockResponse.name.fullName}`,
        full_result: mockResponse,
        credits_used: creditsRequired,
        status: 'Success'
      }]);

      // Record credit transaction
      await supabase.from('credit_transactions').insert([{
        officer_id: officer.id,
        officer_name: officer.name,
        action: 'Deduction',
        credits: -creditsRequired,
        payment_mode: 'Query Usage',
        remarks: `Phone Prefill V2 query for ${phoneNumber}`
      }]);

      setSearchResults(mockResponse);
      toast.success(`Search completed! ${creditsRequired} credits deducted.`);
      
      // Reload recent queries
      loadRecentQueries();

    } catch (error: any) {
      console.error('Phone Prefill V2 API Error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get officer's enabled APIs based on their rate plan
  const getOfficerEnabledAPIs = async (officerId: string) => {
    try {
      // This would normally fetch from your database
      // For now, return mock data
      return [
        {
          id: '1',
          name: 'Phone Prefill V2',
          type: 'PRO',
          credit_cost: 2, // This should come from plan_apis table
          buy_price: 3,
          sell_price: 10
        }
      ];
    } catch (error) {
      console.error('Error fetching enabled APIs:', error);
      return [];
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
      await supabase.from('queries').insert([{
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
      }]);

      setSearchResults(mockResults);
      toast.success('OSINT search completed!');
      
      // Reload recent queries
      loadRecentQueries();

    } catch (error) {
      console.error('OSINT Search Error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (searchType === 'pro') {
      // Validate phone number format for PRO search
      const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(searchQuery.replace(/\s+/g, ''))) {
        toast.error('Please enter a valid Indian phone number');
        return;
      }
      await handlePhonePrefillSearch(searchQuery);
    } else {
      await handleOSINTSearch(searchQuery);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  isDark ? 'text-gray-400 hover:text-cyber-teal' : 'text-gray-600 hover:text-cyber-teal'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-cyber-teal/30" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyber-gradient rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Officer Portal
                  </h1>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Intelligence & Investigation Tools
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
                  Credits: {officer.credits_remaining}/{officer.total_credits}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Available Credits
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {officer.credits_remaining}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-cyber-teal" />
            </div>
          </div>

          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Queries
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {recentQueries.length}
                </p>
              </div>
              <Search className="w-8 h-8 text-electric-blue" />
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
                  {recentQueries.length > 0 ? Math.round((recentQueries.filter(q => q.status === 'Success').length / recentQueries.length) * 100) : 0}%
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
                  Department
                </p>
                <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {officer.department || 'N/A'}
                </p>
              </div>
              <Shield className="w-8 h-8 text-neon-magenta" />
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className={`border border-cyber-teal/20 rounded-lg p-6 mb-8 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Intelligence Search
          </h2>

          {/* Search Type Selector */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setSearchType('osint')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                searchType === 'osint'
                  ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                  : isDark 
                    ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                    : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Free OSINT</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">FREE</span>
            </button>
            <button
              onClick={() => setSearchType('pro')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                searchType === 'pro'
                  ? 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30'
                  : isDark 
                    ? 'text-gray-400 hover:text-neon-magenta hover:bg-neon-magenta/10' 
                    : 'text-gray-600 hover:text-neon-magenta hover:bg-neon-magenta/10'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Phone Prefill V2</span>
              <span className="text-xs bg-neon-magenta/20 text-neon-magenta px-2 py-1 rounded">PRO</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchType === 'pro' ? 'Enter phone number (e.g., +91 9876543210)' : 'Enter search query (name, email, etc.)'}
              className={`flex-1 px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
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

          {searchType === 'pro' && (
            <div className={`mt-4 p-4 rounded-lg ${
              isDark ? 'bg-neon-magenta/10 border border-neon-magenta/30' : 'bg-pink-50 border border-pink-200'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-neon-magenta mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    PRO Search - Credits Required
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    This search will deduct 2 credits from your account. You have {officer.credits_remaining} credits remaining.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="mb-8">
            <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Search Results
            </h3>
            {searchType === 'pro' ? renderPhonePrefillResults(searchResults) : renderOSINTResults(searchResults)}
          </div>
        )}

        {/* Recent Queries */}
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h3 className={`text-xl font-semibold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <History className="w-5 h-5 mr-2 text-cyber-teal" />
            Recent Queries
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
            <div className="text-center py-8">
              <History className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No queries performed yet. Start your first search above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};