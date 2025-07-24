import React, { useState } from 'react';
import { Shield, Database, Phone, Car, CreditCard, FileText, Search, Smartphone, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

export const OfficerProLookups: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery } = useSupabaseData();
  const [activeTab, setActiveTab] = useState<'phone-prefill-v2' | 'rc' | 'imei' | 'fasttag' | 'credit-history' | 'cell-id'>('phone-prefill-v2');
  const [rcNumber, setRcNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleRCSearch = async () => {
    if (!rcNumber.trim()) {
      toast.error('Please enter a vehicle registration number');
      return;
    }

    // Find RC API
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

  const handlePhonePrefill = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    // Find Phone Prefill API
    const phoneAPI = apis.find(api => api.name.toLowerCase().includes('phone') && api.key_status === 'Active');
    
    if (!phoneAPI) {
      toast.error('Phone verification service is currently unavailable');
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
      const requestPayload = {
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

      const data = await response.json();
      
      setSearchResults(data.response);
      
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
        source: 'Signzy API', // Assuming Signzy is the provider
        result_summary: `Phone details found for ${data.response.name?.fullName || 'Unknown'}`,
        full_result: data.response,
        credits_used: phoneAPI.default_credit_charge,
        status: 'Success'
      });
      
      toast.success('Phone details retrieved successfully!');
    } catch (error: any) {
      console.error('Phone Search Error:', error);
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

  const renderPhonePrefillV2 = () => (
    <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
      isDark ? 'bg-muted-graphite' : 'bg-white'
    }`}>
      <div className="flex items-center space-x-3 mb-4">
        <Phone className="w-6 h-6 text-neon-magenta" />
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Phone Prefill V2
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number (e.g., +91 9876543210)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white placeholder-gray-500' 
                : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <button
          onClick={handlePhonePrefill}
          disabled={isSearching || !phoneNumber.trim()}
          className="px-6 py-3 bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30 rounded-lg hover:bg-neon-magenta/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSearching ? (
            <>
              <div className="w-4 h-4 border-2 border-neon-magenta border-t-transparent rounded-full animate-spin" />
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

      {searchError && (
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-red-400 text-sm">{searchError}</p>
        </div>
      )}

      {searchResults && searchResults.name && (
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
        }`}>
          <h4 className="text-green-400 font-medium mb-2">Phone Details Found</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="text-green-400">Name:</span> {searchResults.name.fullName}</p>
              <p><span className="text-green-400">Age:</span> {searchResults.age}</p>
              <p><span className="text-green-400">Gender:</span> {searchResults.gender}</p>
              <p><span className="text-green-400">DOB:</span> {searchResults.dob}</p>
            </div>
            <div>
              <p><span className="text-green-400">Alt Phones:</span> {searchResults.alternatePhone?.length || 0}</p>
              <p><span className="text-green-400">Emails:</span> {searchResults.email?.length || 0}</p>
              <p><span className="text-green-400">Addresses:</span> {searchResults.address?.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRCSearch = () => (
    <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
      isDark ? 'bg-muted-graphite' : 'bg-white'
    }`}>
      <div className="flex items-center space-x-3 mb-4">
        <Car className="w-6 h-6 text-electric-blue" />
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Vehicle RC Search
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <input
            type="text"
            value={rcNumber}
            onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
            placeholder="Enter vehicle registration number (e.g., KA01JZ4031)"
            className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white placeholder-gray-500' 
                : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <button
          onClick={handleRCSearch}
          disabled={isSearching || !rcNumber.trim()}
          className="px-6 py-3 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

      {searchError && (
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-red-400 text-sm">{searchError}</p>
        </div>
      )}

      {searchResults && searchResults.regNo && (
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
        }`}>
          <h4 className="text-green-400 font-medium mb-2">Search Results</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="text-green-400">Registration:</span> {searchResults.regNo}</p>
              <p><span className="text-green-400">Owner:</span> {searchResults.owner}</p>
              <p><span className="text-green-400">Model:</span> {searchResults.model}</p>
              <p><span className="text-green-400">Color:</span> {searchResults.vehicleColour}</p>
            </div>
            <div>
              <p><span className="text-green-400">Status:</span> {searchResults.status}</p>
              <p><span className="text-green-400">Reg Date:</span> {searchResults.regDate}</p>
              <p><span className="text-green-400">RC Expiry:</span> {searchResults.rcExpiryDate}</p>
              <p><span className="text-green-400">Insurance:</span> {searchResults.vehicleInsuranceUpto}</p>
            </div>
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
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          PRO Verification Services
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Premium API-based verification and intelligence services
        </p>
      </div>

      {/* Tabs */}
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
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'phone-prefill-v2' && renderPhonePrefillV2()}
      {activeTab === 'rc' && renderRCSearch()}
      {activeTab === 'imei' && renderComingSoon('IMEI Verification', Smartphone)}
      {activeTab === 'fasttag' && renderComingSoon('FastTag Verification', Car)}
      {activeTab === 'credit-history' && renderComingSoon('Credit History', CreditCard)}
      {activeTab === 'cell-id' && renderComingSoon('Cell ID Lookup', MapPin)}

      {/* Service Categories */}
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