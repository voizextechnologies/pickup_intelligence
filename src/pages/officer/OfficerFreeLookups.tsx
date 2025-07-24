import React from 'react';
import { Search, Globe, Mail, Phone, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const OfficerFreeLookups: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Free OSINT Lookups
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Open-source intelligence gathering from public sources
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className={`border border-cyber-teal/20 rounded-lg p-8 text-center ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <Search className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Free OSINT Tools Coming Soon
        </h3>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          We're working on integrating powerful open-source intelligence tools for law enforcement.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
            <Globe className="w-8 h-8 text-cyber-teal mx-auto mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Social Media Search
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Search across platforms
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
            <Mail className="w-8 h-8 text-electric-blue mx-auto mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Email Investigation
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Email breach checks
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
            <Phone className="w-8 h-8 text-neon-magenta mx-auto mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Phone Lookup
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Basic phone info
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
            <User className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Identity Search
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Public records
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};