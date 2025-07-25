import React from 'react';
import { Phone, Copy, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface PhonePrefillV2TabProps {
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
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: (sections: { [key: string]: boolean }) => void;
  copyToClipboard: (text: string) => void;
  formatPhoneNumber: (phone: string) => string;
  toggleSection: (section: string) => void;
}

export const PhonePrefillV2Tab: React.FC<PhonePrefillV2TabProps> = ({
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
  phoneNumber,
  setPhoneNumber,
  expandedSections,
  setExpandedSections,
  copyToClipboard,
  formatPhoneNumber,
  toggleSection
}) => {
  const handlePhonePrefillV2 = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

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
      
      if (data.response) {
        setSearchResults(data.response);
        
        const newCredits = officer.credits_remaining - phoneAPI.default_credit_charge;
        updateOfficerState({ credits_remaining: newCredits });
        
        await addTransaction({
          officer_id: officer.id,
          officer_name: officer.name,
          action: 'Deduction',
          credits: phoneAPI.default_credit_charge,
          payment_mode: 'Query Usage',
          remarks: `Phone Prefill V2 for ${phoneNumber}`
        });

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

  return (
    <div className="space-y-4">
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Mobile Number
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
            className="px-4 py-2 bg-neon-magenta/20 text-neon-magenta rounded-lg hover:bg-neon-magenta/30 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-neon-magenta border-t-transparent rounded-full animate-spin" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>
        </div>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Cost: 2 credits per search
        </p>
      </div>

      {/* Results Display */}
      {searchResults && (
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
        }`}>
          <h4 className="text-green-400 font-medium mb-4">Phone Prefill V2 Results</h4>
          
          {/* Personal Information */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection('personal')}
              className="flex items-center space-x-2 w-full text-left"
            >
              {expandedSections.personal ? (
                <ChevronDown className="w-4 h-4 text-green-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-green-400" />
              )}
              <h5 className="text-green-400 font-medium">Personal Information</h5>
            </button>
            
            {expandedSections.personal && (
              <div className="mt-2 ml-6 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-400">Full Name:</span>
                    <div className="flex items-center space-x-2">
                      <span>{searchResults.name?.fullName || 'N/A'}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.name?.fullName || '')}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">First Name:</span>
                    <div className="flex items-center space-x-2">
                      <span>{searchResults.name?.firstName || 'N/A'}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.name?.firstName || '')}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Last Name:</span>
                    <div className="flex items-center space-x-2">
                      <span>{searchResults.name?.lastName || 'N/A'}</span>
                      <button
                        onClick={() => copyToClipboard(searchResults.name?.lastName || '')}
                        className="text-cyber-teal hover:text-electric-blue"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Age:</span>
                    <span>{searchResults.age || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Gender:</span>
                    <span>{searchResults.gender || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">DOB:</span>
                    <span>{searchResults.dob || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Income:</span>
                    <span>{searchResults.income || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Alternate Phone Numbers */}
          {searchResults.alternatePhone && searchResults.alternatePhone.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => toggleSection('alternatePhones')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.alternatePhones ? (
                  <ChevronDown className="w-4 h-4 text-green-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-green-400" />
                )}
                <h5 className="text-green-400 font-medium">
                  Alternate Phone Numbers ({searchResults.alternatePhone.length})
                </h5>
              </button>
              
              {expandedSections.alternatePhones && (
                <div className="mt-2 ml-6 space-y-1">
                  {searchResults.alternatePhone.map((phone: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-green-400">#{phone.serialNo}:</span>
                      <div className="flex items-center space-x-2">
                        <span>{formatPhoneNumber(phone.phoneNumber)}</span>
                        <button
                          onClick={() => copyToClipboard(phone.phoneNumber)}
                          className="text-cyber-teal hover:text-electric-blue"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email Addresses */}
          {searchResults.email && searchResults.email.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => toggleSection('emails')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.emails ? (
                  <ChevronDown className="w-4 h-4 text-green-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-green-400" />
                )}
                <h5 className="text-green-400 font-medium">
                  Email Addresses ({searchResults.email.length})
                </h5>
              </button>
              
              {expandedSections.emails && (
                <div className="mt-2 ml-6 space-y-1">
                  {searchResults.email.map((email: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-green-400">#{email.serialNo}:</span>
                      <div className="flex items-center space-x-2">
                        <span>{email.email}</span>
                        <button
                          onClick={() => copyToClipboard(email.email)}
                          className="text-cyber-teal hover:text-electric-blue"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses */}
          {searchResults.address && searchResults.address.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => toggleSection('addresses')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.addresses ? (
                  <ChevronDown className="w-4 h-4 text-green-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-green-400" />
                )}
                <h5 className="text-green-400 font-medium">
                  Addresses ({searchResults.address.length})
                </h5>
              </button>
              
              {expandedSections.addresses && (
                <div className="mt-2 ml-6 space-y-2">
                  {searchResults.address.map((address: any, index: number) => (
                    <div key={index} className="text-sm border-l-2 border-green-400/30 pl-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p><span className="text-green-400">#{address.Seq}:</span> {address.Address}</p>
                          <p><span className="text-green-400">State:</span> {address.State}</p>
                          <p><span className="text-green-400">Postal:</span> {address.Postal}</p>
                          <p><span className="text-green-400">Type:</span> {address.Type}</p>
                          <p><span className="text-green-400">Reported:</span> {address.ReportedDate}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(`${address.Address}, ${address.State} - ${address.Postal}`)}
                          className="text-cyber-teal hover:text-electric-blue ml-2"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Identity Documents */}
          {(searchResults.voterId?.length > 0 || searchResults.passport?.length > 0 || 
            searchResults.drivingLicense?.length > 0 || searchResults.PAN?.length > 0) && (
            <div className="mb-4">
              <button
                onClick={() => toggleSection('documents')}
                className="flex items-center space-x-2 w-full text-left"
              >
                {expandedSections.documents ? (
                  <ChevronDown className="w-4 h-4 text-green-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-green-400" />
                )}
                <h5 className="text-green-400 font-medium">Identity Documents</h5>
              </button>
              
              {expandedSections.documents && (
                <div className="mt-2 ml-6 space-y-3">
                  {searchResults.voterId && searchResults.voterId.length > 0 && (
                    <div>
                      <h6 className="text-green-400 font-medium text-sm mb-1">Voter IDs ({searchResults.voterId.length})</h6>
                      {searchResults.voterId.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>#{item.seq}: {item.IdNumber} (Reported: {item.ReportedDate})</span>
                          <button
                            onClick={() => copyToClipboard(item.IdNumber)}
                            className="text-cyber-teal hover:text-electric-blue"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.passport && searchResults.passport.length > 0 && (
                    <div>
                      <h6 className="text-green-400 font-medium text-sm mb-1">Passports ({searchResults.passport.length})</h6>
                      {searchResults.passport.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>#{item.seq}: {item.passport} (Reported: {item.ReportedDate || 'N/A'})</span>
                          <button
                            onClick={() => copyToClipboard(item.passport)}
                            className="text-cyber-teal hover:text-electric-blue"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.drivingLicense && searchResults.drivingLicense.length > 0 && (
                    <div>
                      <h6 className="text-green-400 font-medium text-sm mb-1">Driving Licenses ({searchResults.drivingLicense.length})</h6>
                      {searchResults.drivingLicense.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>#{item.seq}: {item.IdNumber} (Reported: {item.ReportedDate})</span>
                          <button
                            onClick={() => copyToClipboard(item.IdNumber)}
                            className="text-cyber-teal hover:text-electric-blue"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.PAN && searchResults.PAN.length > 0 && (
                    <div>
                      <h6 className="text-green-400 font-medium text-sm mb-1">PAN Cards ({searchResults.PAN.length})</h6>
                      {searchResults.PAN.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>#{item.seq}: {item.IdNumber} (Reported: {item.ReportedDate})</span>
                          <button
                            onClick={() => copyToClipboard(item.IdNumber)}
                            className="text-cyber-teal hover:text-electric-blue"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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