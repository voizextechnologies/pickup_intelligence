import React from 'react';
import { Car, Copy, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface RCSearchTabProps {
  isDark: boolean;
  officer: any;
  apis: any[];
  addQuery: (queryData: any) => Promise<any>;
  addTransaction: (transactionData: any) => Promise<any>;
  updateOfficerState: (updates: any) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  searchResults: any;
  setSearchResults: (results: any) => void;
  searchError: string | null;
  setSearchError: (error: string | null) => void;
  rcNumber: string;
  setRcNumber: (rc: string) => void;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: (sections: { [key: string]: boolean }) => void;
  copyToClipboard: (text: string) => void;
  toggleSection: (section: string) => void;
}

export const RCSearchTab: React.FC<RCSearchTabProps> = ({
  isDark,
  officer,
  apis,
  addQuery,
  addTransaction,
  updateOfficerState,
  isSearching,
  setIsSearching,
  searchResults,
  setSearchResults,
  searchError,
  setSearchError,
  rcNumber,
  setRcNumber,
  expandedSections,
  setExpandedSections,
  copyToClipboard,
  toggleSection
}) => {
  const handleRCSearch = async () => {
    if (!rcNumber.trim()) {
      toast.error('Please enter a vehicle registration number');
      return;
    }

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
        
        const newCredits = officer.credits_remaining - rcAPI.default_credit_charge;
        updateOfficerState({ credits_remaining: newCredits });
        
        await addTransaction({
          officer_id: officer.id,
          officer_name: officer.name,
          action: 'Deduction',
          credits: rcAPI.default_credit_charge,
          payment_mode: 'Query Usage',
          remarks: `Vehicle RC Search for ${rcNumber.toUpperCase()}`
        });

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

  return (
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
            onClick={handleRCSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
            ) : (
              <Car className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>
        </div>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Cost: 3 credits per search
        </p>
      </div>

      {/* Results Display */}
      {searchResults && (
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
        }`}>
          <h4 className="text-green-400 font-medium mb-4">Vehicle RC Search Results</h4>
          
          {/* Vehicle Details */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('vehicleDetails')}
              className="flex items-center space-x-2 w-full text-left"
            >
              {expandedSections.vehicleDetails ? (
                <ChevronDown className="w-4 h-4 text-green-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-green-400" />
              )}
              <h5 className="text-green-400 font-medium">Vehicle Details</h5>
            </button>
            
            {expandedSections.vehicleDetails && (
              <div className="mt-2 ml-6 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-400">Registration No:</span>
                    <div className="flex items-center space-x-2">
                      <span>{searchResults.regNo || 'N/A'}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.regNo || '')}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Owner:</span>
                    <div className="flex items-center space-x-2">
                      <span>{searchResults.owner || 'N/A'}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.owner || '')}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Model:</span>
                    <div className="flex items-center space-x-2">
                      <span>{searchResults.model || 'N/A'}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.model || '')}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Color:</span>
                    <span>{searchResults.vehicleColour || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Engine No:</span>
                    <div className="flex items-center space-x-2">
                      <span>{searchResults.engineNo || 'N/A'}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.engineNo || '')}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Chassis No:</span>
                    <div className="flex items-center space-x-2">
                      <span>{searchResults.chassisNo || 'N/A'}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.chassisNo || '')}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registration Information */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('registrationInfo')}
              className="flex items-center space-x-2 w-full text-left"
            >
              {expandedSections.registrationInfo ? (
                <ChevronDown className="w-4 h-4 text-green-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-green-400" />
              )}
              <h5 className="text-green-400 font-medium">Registration Information</h5>
            </button>
            
            {expandedSections.registrationInfo && (
              <div className="mt-2 ml-6 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-400">Status:</span>
                    <span>{searchResults.status || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Reg Date:</span>
                    <span>{searchResults.regDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">RC Expiry:</span>
                    <span>{searchResults.rcExpiryDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Insurance Upto:</span>
                    <span>{searchResults.vehicleInsuranceUpto || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Fitness Upto:</span>
                    <span>{searchResults.fitnessUpto || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Tax Upto:</span>
                    <span>{searchResults.taxUpto || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Owner Address */}
          {searchResults.ownerAddress && (
            <div className="mb-4">
              <button
                onClick={() => toggleSection('ownerAddress')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.ownerAddress ? (
                  <ChevronDown className="w-4 h-4 text-green-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-green-400" />
                )}
                <h5 className="text-green-400 font-medium">Owner Address</h5>
              </button>
              
              {expandedSections.ownerAddress && (
                <div className="mt-2 ml-6">
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-green-400">Address:</span>
                    <div className="flex items-center space-x-2 flex-1 ml-2">
                      <span className="text-right">{searchResults.ownerAddress}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.ownerAddress)}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON Toggle */}
          <div className="mt-4">
            <button
              onClick={() => toggleSection('rawJson')}
              className="flex items-center space-x-2 text-sm font-medium text-cyber-teal hover:text-electric-blue"
            >
              {expandedSections.rawJson ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{expandedSections.rawJson ? 'Hide' : 'Show'} Raw JSON Response</span>
            </button>
            
            {expandedSections.rawJson && (
              <pre className={`mt-2 p-4 rounded-lg overflow-x-auto text-xs ${
                isDark ? 'bg-crisp-black text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                <code>{JSON.stringify(searchResults, null, 2)}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};