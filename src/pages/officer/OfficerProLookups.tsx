import React from 'react';
import { Shield, Database } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { PhonePrefillV2 } from '../../components/ProLookups/PhonePrefillV2';
import { VehicleRCSearch } from '../../components/ProLookups/VehicleRCSearch';
import { RechargeStatusCheck } from '../../components/ProLookups/RechargeStatusCheck';

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

      {/* Info Banner */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-neon-magenta" />
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Premium Services
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              These services require credits and provide verified, real-time data from official sources.
            </p>
          </div>
        </div>
      </div>

      {/* PRO Lookup Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phone Prefill V2 */}
        <PhonePrefillV2 />

        {/* Vehicle RC Search */}
        <VehicleRCSearch />

        {/* Recharge Status Check */}
        <RechargeStatusCheck />

        {/* Placeholder for Future APIs */}
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-gray-400" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              More Services Coming Soon
            </h3>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Additional verification services will be added here. Contact admin to request specific APIs.
          </p>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Usage Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className={`font-medium mb-2 ${isDark ? 'text-cyber-teal' : 'text-cyber-teal'}`}>
              Credit System
            </h4>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>• Each API call consumes credits based on the service</li>
              <li>• Credits are deducted only on successful queries</li>
              <li>• Failed queries do not consume credits</li>
              <li>• Check your credit balance before making queries</li>
            </ul>
          </div>
          <div>
            <h4 className={`font-medium mb-2 ${isDark ? 'text-cyber-teal' : 'text-cyber-teal'}`}>
              Best Practices
            </h4>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>• Verify input data before submitting queries</li>
              <li>• Use appropriate formats (e.g., +91 for phone numbers)</li>
              <li>• Review results carefully for accuracy</li>
              <li>• Report any issues to your administrator</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};