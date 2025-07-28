import React, { useState } from 'react';
import { 
  UserPlus, Check, X, Clock, Mail, Phone, Building, Shield, 
  Eye, Filter, Search, Calendar, Download, AlertCircle, CheckCircle, XCircle, FileText, ExternalLink 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import toast from 'react-hot-toast';

import { OfficerRegistration } from '../lib/supabase';

export const OfficerRegistrations: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { registrations, updateRegistration, ratePlans, addOfficer } = useSupabaseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<OfficerRegistration | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalData, setApprovalData] = useState({
    plan_id: '',
    password: ''
  });

  const filteredRegistrations = registrations.filter((reg: OfficerRegistration) => {
    const matchesSearch = reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.mobile.includes(searchTerm) ||
                         reg.station.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (registration: OfficerRegistration) => {
    setSelectedRequest(registration);
    setApprovalData({
      plan_id: '',
      password: ''
    });
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest || !approvalData.plan_id || !approvalData.password.trim()) {
      toast.error('Please select a plan and provide a password');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create officer account using the same logic as admin "Add Officer"
      await addOfficer({
        name: selectedRequest.name,
        email: selectedRequest.email,
        mobile: selectedRequest.mobile,
        telegram_id: `@${selectedRequest.name.toLowerCase().replace(/\s+/g, '')}`,
        password: approvalData.password,
        status: 'Active',
        department: selectedRequest.department,
        rank: selectedRequest.rank,
        badge_number: selectedRequest.badge_number,
        station: selectedRequest.station,
        plan_id: approvalData.plan_id,
        credits_remaining: 0, // Will be set by plan
        total_credits: 0 // Will be set by plan
      });

      // Update registration status
      await updateRegistration(selectedRequest.id, {
        status: 'approved',
        reviewed_by: user?.name
      });

      setShowApproveModal(false);
      setSelectedRequest(null);
      setApprovalData({ plan_id: '', password: '' });
      
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve registration');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (registration: OfficerRegistration) => {
    setSelectedRequest(registration);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    
    try {
      await updateRegistration(selectedRequest.id, {
        status: 'rejected',
        reviewed_by: user?.name,
        rejection_reason: rejectionReason
      });
      
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject registration');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Officer Registrations
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Review and approve officer registration requests
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-electric-blue/20 text-electric-blue px-4 py-2 rounded-lg hover:bg-electric-blue/30 transition-all duration-200 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Requests
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {registrations.length}
              </p>
            </div>
            <UserPlus className="w-8 h-8 text-cyber-teal" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Pending Review
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {registrations.filter((r: any) => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Approved
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {registrations.filter((r: any) => r.status === 'approved').length}
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
                Rejected
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {registrations.filter((r: any) => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
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
              placeholder="Search registrations..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button className="px-3 py-2 bg-cyber-teal/20 text-cyber-teal rounded-lg hover:bg-cyber-teal/30 transition-colors flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
        </div>
      </div>

      {/* Registrations List */}
      <div className="space-y-4">
        {filteredRegistrations.map((registration: OfficerRegistration) => (
          <div key={registration.id} className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {registration.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(registration.status)}`}>
                    {getStatusIcon(registration.status)}
                    <span className="ml-1 capitalize">{registration.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-cyber-teal" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {registration.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-cyber-teal" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {registration.mobile}
                    </span>
                  </div>
                  {registration.telegram_id && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-cyber-teal" />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {registration.telegram_id}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-cyber-teal" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {registration.station}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-cyber-teal" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {registration.rank} - {registration.badge_number}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Department:</span>
                    <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {registration.department}
                    </span>
                  </div>
                  <div>
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submitted:</span>
                    <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(registration.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {registration.additional_info && (
                  <div className="mt-3">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Additional Info:
                    </span>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {registration.additional_info}
                    </p>
                  </div>
                )}

                {registration.status === 'rejected' && registration.rejection_reason && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
                  }`}>
                    <span className={`text-sm font-medium text-red-400`}>
                      Rejection Reason:
                    </span>
                    <p className={`text-sm mt-1 text-red-400`}>
                      {registration.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {registration.status === 'pending' && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleApprove(registration)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(registration);
                    }}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite border border-cyber-teal/20' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Reject Registration
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Please provide a reason for rejecting {selectedRequest.name}'s registration:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal resize-none ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || isProcessing}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {isProcessing ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite border border-cyber-teal/20' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Approve Registration
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-crisp-black/50 border-cyber-teal/20' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Officer Details
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Name:</span> {selectedRequest.name}</p>
                  <p><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Email:</span> {selectedRequest.email}</p>
                  <p><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Mobile:</span> {selectedRequest.mobile}</p>
                  <p><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Station:</span> {selectedRequest.station}</p>
                  {selectedRequest.department && (
                    <p><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Department:</span> {selectedRequest.department}</p>
                  )}
                  {selectedRequest.rank && (
                    <p><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Rank:</span> {selectedRequest.rank}</p>
                  )}
                </div>
              </div>
                {selectedRequest.identicard_url && (
                  <div className="mt-3">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Identicard / Official ID Proof:
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <FileText className="w-4 h-4 text-cyber-teal" />
                      <a
                        href={selectedRequest.identicard_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-teal hover:text-electric-blue transition-colors flex items-center space-x-1 text-sm"
                      >
                        <span>View Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}


              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Select Rate Plan *
                </label>
                <select
                  value={approvalData.plan_id}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, plan_id: e.target.value }))}
                  className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white' 
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="">Choose a plan</option>
                  {ratePlans.filter(plan => plan.status === 'Active').map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.plan_name} ({plan.user_type}) - ₹{plan.monthly_fee}/month - {plan.default_credits} credits
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Set Initial Password *
                </label>
                <input
                  type="password"
                  value={approvalData.password}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter initial password for officer"
                  className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setApprovalData({ plan_id: '', password: '' });
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={!approvalData.plan_id || !approvalData.password.trim() || isProcessing}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {isProcessing ? 'Approving...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredRegistrations.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-lg font-medium mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            No Registration Requests
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            No officer registration requests found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};