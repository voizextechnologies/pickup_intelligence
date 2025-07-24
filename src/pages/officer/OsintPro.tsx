```tsx
import React, { useState } from 'react';
import { Search, Smartphone, Mail, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const OsintPro: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'mobile-check' | 'email-check' | 'advance-name-scan'>('mobile-check');

  const renderComingSoon = (featureName: string, Icon: React.ElementType) => (
    <div className={\`border border-cyber-teal/20 rounded-lg p-8 text-center ${
      isDark ? 'bg-muted-graphite' : 'bg-white'
    }`}>
      <Icon className={\`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <h3 className={\`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {featureName} Feature Coming Soon
      </h3>
      <p className={\`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        We're actively developing advanced {featureName.toLowerCase()} capabilities. Stay tuned for updates!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={\`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
          <Search className="w-8 h-8 text-cyber-teal mx-auto mb-2" />
          <h4 className={\`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Comprehensive Data
          </h4>
          <p className={\`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Deep dive into available records
          </p>
        </div>
        <div className={\`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
          <Mail className="w-8 h-8 text-electric-blue mx-auto mb-2" />
          <h4 className={\`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Cross-Referencing
          </h4>
          <p className={\`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Connect disparate data points
          </p>
        </div>
        <div className={\`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
          <User className="w-8 h-8 text-neon-magenta mx-auto mb-2" />
          <h4 className={\`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Actionable Insights
          </h4>
          <p className={\`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Translate data into intelligence
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={\`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div>
        <h1 className={\`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          OSINT PRO Lookups
        </h1>
        <p className={\`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Advanced Open-Source Intelligence tools for in-depth investigations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={\`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('mobile-check')}
            className={\`flex-shrink-0 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'mobile-check'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            Mobile Check
          </button>
          <button
            onClick={() => setActiveTab('email-check')}
            className={\`flex-shrink-0 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'email-check'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            Email Check
          </button>
          <button
            onClick={() => setActiveTab('advance-name-scan')}
            className={\`flex-shrink-0 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'advance-name-scan'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            Advance Name Scan
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'mobile-check' && renderComingSoon('Mobile Check', Smartphone)}
      {activeTab === 'email-check' && renderComingSoon('Email Check', Mail)}
      {activeTab === 'advance-name-scan' && renderComingSoon('Advance Name Scan', User)}
    </div>
  );
};
```