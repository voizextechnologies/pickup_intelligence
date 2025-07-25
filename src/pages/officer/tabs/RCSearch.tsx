import React, { useState } from 'react';
import { Car, Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Copy, Download, Search } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOfficerAuth } from '../../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

const RCSearch: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery } = useSupabaseData();
  const [rcNumber, setRcNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    vehicle: true,
    owner: true,
    raw: false,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'} shadow-md hover:shadow-cyber transition-shadow duration-300`}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Vehicle Registration Number *
          </label>
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

      {searchResults && searchResults.regNo && (
        <div className={`p-6 rounded-lg border ${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Vehicle Details Found
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                Verified {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => toggleSection('vehicle')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
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
              <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
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

          <div className="mb-6">
            <button
              onClick={() => toggleSection('owner')}
              className={`w-full flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}
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
              <div className={`p-4 mt-2 rounded-lg border ${isDark ? 'bg-muted-graphite border-cyber-teal/10' : 'bg-white border-gray-200'}`}>
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
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>