import React from 'react';
import { Shield, Database, Phone, Car, CreditCard, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const OfficerProLookups: React.FC = () => {
  const { isDark } = useTheme();

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

      {/* Placeholder for future PRO lookup tools */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Available PRO Services
        </h3>
        <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          PRO lookup tools will be migrated here from the main dashboard.
        </p>
      </div>
    </div>
  );
};