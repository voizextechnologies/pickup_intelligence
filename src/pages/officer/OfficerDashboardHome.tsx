import React from 'react';
import { Shield, Search, CreditCard, Clock, TrendingUp, Activity } from 'lucide-react';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCredits } from '../../utils/formatters';

export const OfficerDashboardHome: React.FC = () => {
  const { officer } = useOfficerAuth();
  const { isDark } = useTheme();

  if (!officer) return null;

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {officer.name.split(' ')}!
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {officer.rank} - {officer.department}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Badge Number</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {officer.badge_number}
            </p>
          </div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Credits Remaining
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCredits(officer.credits_remaining)}
              </p>
              <p className="text-xs mt-1 text-green-400">
                of {formatCredits(officer.total_credits)} total
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyber-teal/10 border-cyber-teal/30 text-cyber-teal">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Queries Today
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                12
              </p>
              <p className="text-xs mt-1 text-green-400">
                +3 from yesterday
              </p>
            </div>
            <div className="p-3 rounded-lg bg-electric-blue/10 border-electric-blue/30 text-electric-blue">
              <Search className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Success Rate
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                96%
              </p>
              <p className="text-xs mt-1 text-green-400">
                Excellent performance
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border-green-500/30 text-green-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Avg Response Time
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                1.2s
              </p>
              <p className="text-xs mt-1 text-green-400">
                Fast & reliable
              </p>
            </div>
            <div className="p-3 rounded-lg bg-neon-magenta/10 border-neon-magenta/30 text-neon-magenta">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 rounded-lg border border-cyber-teal/20 hover:bg-cyber-teal/10 transition-all duration-200 text-left">
            <Search className="w-6 h-6 text-cyber-teal mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Free OSINT Lookup
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Search public records and social media
            </p>
          </button>

          <button className="p-4 rounded-lg border border-cyber-teal/20 hover:bg-cyber-teal/10 transition-all duration-200 text-left">
            <Shield className="w-6 h-6 text-neon-magenta mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              PRO Verification
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Premium API-based verification
            </p>
          </button>

          <button className="p-4 rounded-lg border border-cyber-teal/20 hover:bg-cyber-teal/10 transition-all duration-200 text-left">
            <Activity className="w-6 h-6 text-electric-blue mb-2" />
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              View History
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Check your query history
            </p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Vehicle RC Search
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  KA01JZ4031 - Success
                </p>
              </div>
              <span className="text-xs text-green-400">2 min ago</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Phone Verification
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  +91 9876543210 - Success
                </p>
              </div>
              <span className="text-xs text-green-400">15 min ago</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${isDark ? 'bg-crisp-black/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Email Lookup
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  suspect@example.com - Success
                </p>
              </div>
              <span className="text-xs text-green-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}