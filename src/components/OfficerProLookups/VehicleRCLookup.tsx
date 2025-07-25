import React, { useState } from 'react';
import { Car, Search, CheckCircle, XCircle } from 'lucide-react';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

export const VehicleRCLookup: React.FC = () => {
  const { officer, updateOfficerState } = useOfficerAuth();
  const { isDark } = useTheme();
  const { apis, addQuery } = useSupabaseData();
  
  const [rcNumber, setRcNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleRCSearch = async () => {
    if (!rcNumber.trim()) {
      toast.error('Please enter a vehicle registration number');
      return;
    }

    if (!officer) {
      toast.error('Officer not authenticated');
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
      const response = await fetch('/api/signzy/v3/vehicle/detailedsearches', {
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

  const clearResults = () => {
    setSearchResults(null);
    setSearchError(null);
    setShowResults(false);
  };

  return (
    <div className="space-y-6">
      {/* Vehicle RC Search Input */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          <Car className="w-6 h-6 text-electric-blue" />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Vehicle RC Search
          </h3>
          <span className="text-xs px-2 py-1 bg-electric-blue/20 text-electric-blue rounded">PREMIUM</span>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Vehicle Registration Number
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
              className="px-4 py-2 bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search</span>
            </button>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Cost: 3 credits
          </p>
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

              <details className="mt-4">
                <summary className={`cursor-pointer text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} hover:text-cyber-teal`}>
                  View Raw JSON Response
                </summary>
                <pre className={`mt-2 p-4 rounded-lg overflow-x-auto text-xs ${isDark ? 'bg-crisp-black text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <code>{JSON.stringify(searchResults, null, 2)}</code>
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

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