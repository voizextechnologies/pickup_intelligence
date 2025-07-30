import React, { useState, useEffect } from 'react';
import { Shield, Database, Phone, Car, CreditCard, FileText, Search, Smartphone, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import PhonePrefillV2 from './tabs/PhonePrefillV2';
import RCSearch from './tabs/RCSearch';
import RechargeStatusCheck from './tabs/RechargeStatusCheck';
import RechargeExpiryCheck from './tabs/RechargeExpiryCheck';
import OperatorCircleCheck from './tabs/Operator_Circle_Check';
import PhoneToCreditAndBusinessDetails from './tabs/PhoneToCreditAndBusinessDetails';
import UdyamDetailsSearch from './tabs/UdyamDetailsSearch';

export const OfficerProLookups: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<
    | 'phone-prefill-v2'
    | 'rc'
    | 'imei'
    | 'fasttag'
    | 'credit-history'
    | 'cell-id'
    | 'recharge-status'
    | 'recharge-expiry'
    | 'operator-check'
    | 'phone-to-credit-business'
    | 'phoneto-udyam'
    | 'sample-tab-2'
    | 'sample-tab-3'
    | 'sample-tab-4'
    | 'sample-tab-5'
    | 'sample-tab-6'
    | 'sample-tab-7'
    | 'sample-tab-8'
    | 'sample-tab-9'
    | 'sample-tab-10'
  >('phone-prefill-v2');

  const renderComingSoon = (title: string, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
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
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          PRO Verification Services
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Premium API-based verification and intelligence services
        </p>
      </div>

      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
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
          <button
            onClick={() => setActiveTab('recharge-status')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'recharge-status'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="font-medium">Recharge Status Check</span>
          </button>
          <button
            onClick={() => setActiveTab('recharge-expiry')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'recharge-expiry'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">Recharge Expiry Check</span>
          </button>
          <button
            onClick={() => setActiveTab('operator-check')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'operator-check'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="font-medium">Operator Check</span>
          </button>
          <button
            onClick={() => setActiveTab('phone-to-credit-business')}
            className={`relative flex items-center space-x-3 py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
              activeTab === 'phone-to-credit-business'
                ? 'bg-gradient-to-r from-neon-magenta to-cyber-teal text-white border-2 border-electric-blue shadow-2xl shadow-electric-blue/40 animate-pulse-slow'
                : isDark
                  ? 'bg-gradient-to-r from-neon-magenta/70 to-cyber-teal/70 text-white border border-electric-blue/50 hover:bg-gradient-to-r hover:from-neon-magenta/90 hover:to-cyber-teal/90'
                  : 'bg-gradient-to-r from-neon-magenta/60 to-cyber-teal/60 text-white border border-electric-blue/40 hover:bg-gradient-to-r hover:from-neon-magenta/80 hover:to-cyber-teal/80'
            } overflow-hidden group`}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-electric-blue/20 to-neon-magenta/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CreditCard className="w-6 h-6 relative z-10" />
            <span className="font-extrabold text-lg relative z-10 tracking-wide">Phone PRO MAX</span>
          </button>
          <button
            onClick={() => setActiveTab('phone-to-udyam')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'phone-to-udyam'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="font-medium">Phone to Udyam</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-2')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-2'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="font-medium">Sample Tab 2</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-3')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-3'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="font-medium">Sample Tab 3</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-4')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-4'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Car className="w-4 h-4" />
            <span className="font-medium">Sample Tab 4</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-5')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-5'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">Sample Tab 5</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-6')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-6'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">Sample Tab 6</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-7')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-7'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="font-medium">Sample Tab 7</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-8')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-8'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="font-medium">Sample Tab 8</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-9')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-9'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="font-medium">Sample Tab 9</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-tab-10')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'sample-tab-10'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="font-medium">Sample Tab 10</span>
          </button>
        </div>
      </div>

      {activeTab === 'phone-prefill-v2' && <PhonePrefillV2 />}
      {activeTab === 'rc' && <RCSearch />}
      {activeTab === 'recharge-status' && <RechargeStatusCheck />}
      {activeTab === 'recharge-expiry' && <RechargeExpiryCheck />}
      {activeTab === 'imei' && renderComingSoon('IMEI Verification', Smartphone)}
      {activeTab === 'fasttag' && renderComingSoon('FastTag Verification', Car)}
      {activeTab === 'cell-id' && renderComingSoon('Cell ID Lookup', MapPin)}
      {activeTab === 'operator-check' && <OperatorCircleCheck />}
      {activeTab === 'phone-to-credit-business' && <PhoneToCreditAndBusinessDetails />}
      {activeTab === 'phone-to-udyam' && <UdyamDetailsSearch />}
      {activeTab === 'sample-tab-2' && renderComingSoon('Sample Tab 2', Database)}
      {activeTab === 'sample-tab-3' && renderComingSoon('Sample Tab 3', Phone)}
      {activeTab === 'sample-tab-4' && renderComingSoon('Sample Tab 4', Car)}
      {activeTab === 'sample-tab-5' && renderComingSoon('Sample Tab 5', CreditCard)}
      {activeTab === 'sample-tab-6' && renderComingSoon('Sample Tab 6', FileText)}
      {activeTab === 'sample-tab-7' && renderComingSoon('Sample Tab 7', Search)}
      {activeTab === 'sample-tab-8' && renderComingSoon('Sample Tab 8', Smartphone)}
      {activeTab === 'sample-tab-9' && renderComingSoon('Sample Tab 9', MapPin)}
      {activeTab === 'sample-tab-10' && renderComingSoon('Sample Tab 10', Shield)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
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
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Phone to Credit & Business</span>
              <span className="text-cyber-teal">100 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Carrier Lookup</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Number Validation</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Recharge Status Check</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Recharge Expiry Check</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Operator & Circle Check</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
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

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
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