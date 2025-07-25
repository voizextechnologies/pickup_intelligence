import React, { useState } from 'react';
import { Phone, Car, Smartphone, CreditCard, History, MapPin, RefreshCw, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { PhonePrefillV2Tab } from './tabs/PhonePrefillV2Tab';
import { RCSearchTab } from './tabs/RCSearchTab';
import toast from 'react-hot-toast';

export const OfficerProLookups: React.FC = () => {
  const { isDark } = useTheme();
  const { officer, updateOfficerState } = useOfficerAuth();
  const { apis, addQuery, addTransaction } = useSupabaseData();
  
  const [activeTab, setActiveTab] = useState<'phone-prefill-v2' | 'rc' | 'imei' | 'fasttag' | 'credit-history' | 'cell-id' | 'recharge-status' | 'recharge-expiry' | 'operator-check'>('phone-prefill-v2');
  
  // State for different lookup types
  const [phoneNumber, setPhoneNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    personal: true,
    alternatePhones: false,
    emails: false,
    addresses: false,
    documents: false,
    vehicleDetails: true,
    registrationInfo: false,
    ownerAddress: false,
    rawJson: false
  });

  if (!officer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyber-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'phone-prefill-v2', name: 'Phone Prefill V2', icon: Phone, color: 'neon-magenta' },
    { id: 'rc', name: 'RC Search', icon: Car, color: 'electric-blue' },
    { id: 'imei', name: 'IMEI Tracker', icon: Smartphone, color: 'cyber-teal' },
    { id: 'fasttag', name: 'FASTag', icon: CreditCard, color: 'neon-magenta' },
    { id: 'credit-history', name: 'Credit History', icon: History, color: 'electric-blue' },
    { id: 'cell-id', name: 'Cell ID Tracker', icon: MapPin, color: 'cyber-teal' },
    { id: 'recharge-status', name: 'Recharge Status', icon: RefreshCw, color: 'neon-magenta' },
    { id: 'recharge-expiry', name: 'Recharge Expiry', icon: RefreshCw, color: 'electric-blue' },
    { id: 'operator-check', name: 'Operator Check', icon: Phone, color: 'cyber-teal' }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    if (phone.startsWith('+91')) return phone;
    if (phone.length === 10) return `+91 ${phone}`;
    return phone;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearResults = () => {
    setSearchResults(null);
    setSearchError(null);
  };

  const renderComingSoon = (tabName: string) => (
    <div className={`text-center py-12 ${
      isDark ? 'bg-muted-graphite' : 'bg-white'
    } border border-cyber-teal/20 rounded-lg`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
        isDark ? 'bg-cyber-teal/10' : 'bg-cyber-teal/10'
      }`}>
        <CheckCircle className="w-8 h-8 text-cyber-teal" />
      </div>
      <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {tabName} Coming Soon
      </h3>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        This feature is under development and will be available soon.
      </p>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'phone-prefill-v2':
        return (
          <PhonePrefillV2Tab
            isDark={isDark}
            officer={officer}
            apis={apis}
            addQuery={addQuery}
            addTransaction={addTransaction}
            updateOfficerState={updateOfficerState}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            searchError={searchError}
            setSearchError={setSearchError}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            copyToClipboard={copyToClipboard}
            formatPhoneNumber={formatPhoneNumber}
            toggleSection={toggleSection}
          />
        );
      case 'rc':
        return (
          <RCSearchTab
            isDark={isDark}
            officer={officer}
            apis={apis}
            addQuery={addQuery}
            addTransaction={addTransaction}
            updateOfficerState={updateOfficerState}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            searchError={searchError}
            setSearchError={setSearchError}
            rcNumber={rcNumber}
            setRcNumber={setRcNumber}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            copyToClipboard={copyToClipboard}
            toggleSection={toggleSection}
          />
        );
      case 'imei':
        return renderComingSoon('IMEI Tracker');
      case 'fasttag':
        return renderComingSoon('FASTag Search');
      case 'credit-history':
        return renderComingSoon('Credit History');
      case 'cell-id':
        return renderComingSoon('Cell ID Tracker');
      case 'recharge-status':
        return renderComingSoon('Recharge Status');
      case 'recharge-expiry':
        return renderComingSoon('Recharge Expiry');
      case 'operator-check':
        return renderComingSoon('Operator Check');
      default:
        return renderComingSoon('Feature');
    }
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            PRO Lookups
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Premium API-based verification and search services
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Credits Remaining</p>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {officer.credits_remaining.toFixed(3)}
            </p>
          </div>
          {searchResults && (
            <button
              onClick={clearResults}
              className="bg-electric-blue/20 text-electric-blue px-4 py-2 rounded-lg hover:bg-electric-blue/30 transition-all duration-200"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  clearResults();
                }}
                className={`p-3 rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 ${
                  activeTab === tab.id
                    ? `bg-${tab.color}/20 text-${tab.color} border border-${tab.color}/30`
                    : isDark 
                      ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                      : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        {renderTabContent()}
      </div>

      {/* Error Display */}
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