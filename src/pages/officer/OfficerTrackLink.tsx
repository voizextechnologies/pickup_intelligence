import React from 'react';
import { Link as LinkIcon, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const OfficerTrackLink: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          TrackLink
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Track and monitor external links and resources
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className={`border border-cyber-teal/20 rounded-lg p-8 text-center ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <LinkIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          TrackLink Feature Coming Soon
        </h3>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Advanced link tracking and monitoring capabilities for investigations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
            <ExternalLink className="w-8 h-8 text-cyber-teal mx-auto mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Link Monitoring
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Track suspicious links
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
            <Clock className="w-8 h-8 text-electric-blue mx-auto mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Real-time Alerts
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Instant notifications
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'}`}>
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Link Verification
            </h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Safety assessment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};