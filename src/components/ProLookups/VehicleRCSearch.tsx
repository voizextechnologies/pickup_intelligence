import React, { useState } from 'react';
import { Car, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import toast from 'react-hot-toast';

export const VehicleRCSearch: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { addTransaction, addQuery, getOfficerEnabledAPIs } = useSupabaseData();
  const [rcNumber, setRcNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!officer) {
      toast.error('Officer not authenticated.');
      return;
    }

    if (!rcNumber.trim()) {
      toast.error('Please enter a vehicle registration number');
      return;
    }

    setIsSearching(true);
    setSearchResults(null);
    setSearchError(null);

    const officerEnabledAPIs = await getOfficerEnabledAPIs(officer.id);
    const apiConfig = officerEnabledAPIs.find(api =>
      api.name.toLowerCase().includes('vehicle') || 
      api.name.toLowerCase().includes('rc')
    );

    if (!apiConfig) {
      toast.error('Vehicle RC Search API not enabled for your plan. Please contact admin.');
      setIsSearching(false);
      return;
    }

    if (apiConfig.key_status !== 'Active') {
      toast.error('Vehicle RC Search API is currently inactive. Please contact admin.');
      setIsSearching(false);
      return;
    }

    const creditCost = apiConfig.default_credit_charge || 3;
    if (officer.credits_remaining < creditCost) {
      toast.error(`Insufficient credits. Required: ${creditCost}, Available: ${officer.credits_remaining}`);
      setIsSearching(false);
      return;
    }

    try {
      const response = await fetch('/api/signzy/api/v3/vehicle/detailedsearches', {
        method: 'POST',
        headers: {
          'Authorization': apiConfig.api_key,
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
        const newCredits = officer.credits_remaining - creditCost;
        updateOfficerState({ credits_remaining: newCredits });
        
        // Log transaction
        await addTransaction({
          officer_id: officer.id,
          officer_name: officer.name,
          action: 'Deduction',
          credits: creditCost,
          payment_mode: 'Query Usage',
          remarks: `Vehicle RC Search for ${rcNumber.toUpperCase()}`
        });

        // Log query
        await addQuery({
          officer_id: officer.id,
          officer_name: officer.name,
          type: 'PRO',
          category: 'Vehicle RC Search',
          input_data: rcNumber.toUpperCase(),
          source: 'Signzy API',
          result_summary: `Vehicle found: ${data.result.model} - ${data.result.owner}`,
          full_result: data.result,
          credits_used: creditCost,
          status: 'Success'
        });
        
        toast.success('Vehicle details retrieved successfully!');
      } else {
        throw new Error('No vehicle data found');
      }
    } catch (error: any) {
      console.error('Vehicle RC Search Error:', error);
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

  return (
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

      <div className="space-y-4">
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
              onClick={handleSearch}
              disabled={isSearching}
              className={`px-4 py-2 bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50`}
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

        {/* Results Display */}
        {searchError && (
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-red-900/10 border-red-500/30' : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-red-400 text-sm">{searchError}</p>
          </div>
        )}

        {searchResults && (
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-green-900/10 border-green-500/30' : 'bg-green-50 border-green-200'
          }`}>
            <h4 className="text-green-400 font-medium mb-3">Vehicle Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
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
    </div>
  );
};