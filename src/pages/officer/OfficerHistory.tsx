import React, { useState } from 'react';
import { Search, Filter, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { StatusBadge } from '../../components/UI/StatusBadge';
import { formatCredits } from '../../utils/formatters';

export const OfficerHistory: React.FC = () => {
  const { isDark } = useTheme();
  const { officer } = useOfficerAuth();
  const { queries, isLoading } = useSupabaseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter queries for the current officer only
  const officerQueries = queries.filter(query => query.officer_id === officer?.id);

  const filteredQueries = officerQueries.filter(query => {
    const matchesSearch = query.input_data.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || query.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics from live data
  const totalQueries = officerQueries.length;
  const successfulQueries = officerQueries.filter(q => q.status === 'Success').length;
  const successRate = totalQueries > 0 ? Math.round((successfulQueries / totalQueries) * 100) : 0;
  const totalCreditsUsed = officerQueries.reduce((sum, q) => sum + q.credits_used, 0);
  
  // Calculate queries from this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthQueries = officerQueries.filter(query => {
    const queryDate = new Date(query.created_at);
    return queryDate.getMonth() === currentMonth && queryDate.getFullYear() === currentYear;
  }).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'Pending':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyber-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Query History
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Your personal search and verification history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Queries
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalQueries}
              </p>
            </div>
            <Search className="w-8 h-8 text-cyber-teal" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Success Rate
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {successRate}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Credits Used
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCredits(totalCreditsUsed)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-electric-blue" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                This Month
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {thisMonthQueries}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-neon-magenta" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search your queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="OSINT">OSINT</option>
            <option value="PRO">PRO</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            <option value="all">All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Query History Table */}
      <div className={`border border-cyber-teal/20 rounded-lg overflow-hidden ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b border-cyber-teal/20 ${
              isDark ? 'bg-crisp-black/50' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Type
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Category
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Input
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Result
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Credits
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Status
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQueries.map((query) => (
                <tr 
                  key={query.id} 
                  className={`border-b border-cyber-teal/10 transition-colors ${
                    isDark ? 'hover:bg-crisp-black/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      query.type === 'PRO' 
                        ? 'bg-neon-magenta/20 text-neon-magenta' 
                        : 'bg-cyber-teal/20 text-cyber-teal'
                    }`}>
                      {query.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {query.category}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {query.input_data}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {query.result_summary || 'Processing...'}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCredits(query.credits_used)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(query.status)}
                      <StatusBadge status={query.status} size="sm" />
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(query.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredQueries.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-muted-graphite' : 'bg-gray-100'
          }`}>
            <Search className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            No Query History Found
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {totalQueries === 0 
              ? 'You haven\'t performed any queries yet. Start by using the search tools in the dashboard.'
              : 'No queries match your current search criteria. Try adjusting your filters.'
            }
          </p>
        </div>
      )}
    </div>
  );
};