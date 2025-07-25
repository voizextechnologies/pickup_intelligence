import React, { useState } from 'react';
import { Shield, Phone, Car, CreditCard } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { PhonePrefillV2Lookup } from '../../components/OfficerProLookups/PhonePrefillV2Lookup';
import { VehicleRCLookup } from '../../components/OfficerProLookups/VehicleRCLookup';

export const OfficerProLookups: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'phone' | 'vehicle' | 'recharge'>('phone');

  const tabs = [
    { id: 'phone', name: 'Phone Prefill V2', icon: Phone, component: PhonePrefillV2Lookup },
    { id: 'vehicle', name: 'Vehicle RC Search', icon: Car, component: VehicleRCLookup },
    { id: 'recharge', name: 'Recharge Status Check', icon: CreditCard, component: null } // Placeholder for future
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          PRO Lookups
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Premium API-based verification and intelligence services
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={!tab.component} // Disable if component is not available
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                    : !tab.component
                      ? 'text-gray-500 cursor-not-allowed opacity-50'
                      : isDark 
                        ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                        : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.name}</span>
                {!tab.component && (
                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                    Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className={`border border-cyber-teal/20 rounded-lg p-8 text-center ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <Shield className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Feature Coming Soon
            </h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              This PRO lookup feature is currently under development and will be available soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};