import React, { useState } from 'react';
import { User, Mail, Phone, Shield, CreditCard, Settings, Save, Eye, EyeOff } from 'lucide-react';
import { useOfficerAuth } from '../../contexts/OfficerAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCredits } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const OfficerAccount: React.FC = () => {
  const { officer, updateOfficerState } = useOfficerAuth();
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: officer?.name || '',
    email: officer?.email || '',
    mobile: officer?.mobile || '',
    telegram_id: officer?.telegram_id || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!officer) return null;

  const handleSave = () => {
    // Validate passwords if changing
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    // Update officer state (in a real app, this would make an API call)
    updateOfficerState({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      telegram_id: formData.telegram_id
    });

    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      name: officer.name,
      email: officer.email,
      mobile: officer.mobile,
      telegram_id: officer.telegram_id || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Account Settings
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your profile and account preferences
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-cyber-gradient text-white px-4 py-2 rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className={`lg:col-span-2 border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Profile Information
          </h3>

          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-cyber-gradient rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {officer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {officer.name}
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {officer.rank} - {officer.department}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Full Name
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent transition-all duration-200 ${
                      isEditing
                        ? isDark 
                          ? 'bg-crisp-black border-cyber-teal/30 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                        : isDark
                          ? 'bg-muted-graphite border-cyber-teal/20 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent transition-all duration-200 ${
                      isEditing
                        ? isDark 
                          ? 'bg-crisp-black border-cyber-teal/30 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                        : isDark
                          ? 'bg-muted-graphite border-cyber-teal/20 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent transition-all duration-200 ${
                      isEditing
                        ? isDark 
                          ? 'bg-crisp-black border-cyber-teal/30 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                        : isDark
                          ? 'bg-muted-graphite border-cyber-teal/20 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Telegram ID
                </label>
                <input
                  type="text"
                  value={formData.telegram_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegram_id: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="@username"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent transition-all duration-200 ${
                    isEditing
                      ? isDark 
                        ? 'bg-crisp-black border-cyber-teal/30 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      : isDark
                        ? 'bg-muted-graphite border-cyber-teal/20 text-gray-300'
                        : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                />
              </div>
            </div>

            {isEditing && (
              <div className="space-y-4 pt-6 border-t border-cyber-teal/20">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Change Password (Optional)
                </h4>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent transition-all duration-200 ${
                      isDark 
                        ? 'bg-crisp-black border-cyber-teal/30 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent transition-all duration-200 pr-12 ${
                          isDark 
                            ? 'bg-crisp-black border-cyber-teal/30 text-white placeholder-gray-500' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                          isDark ? 'text-gray-400 hover:text-cyber-teal' : 'text-gray-500 hover:text-cyber-teal'
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent transition-all duration-200 ${
                        isDark 
                          ? 'bg-crisp-black border-cyber-teal/30 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-cyber-teal/20">
                <button
                  onClick={handleCancel}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Summary */}
        <div className="space-y-6">
          {/* Credits Summary */}
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Credits Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Remaining Credits
                </span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCredits(officer.credits_remaining)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Credits
                </span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCredits(officer.total_credits)}
                </span>
              </div>
              <div className={`w-full rounded-full h-3 ${isDark ? 'bg-crisp-black' : 'bg-gray-200'}`}>
                <div 
                  className="bg-cyber-gradient h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(officer.credits_remaining / officer.total_credits) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Used: {formatCredits(officer.total_credits - officer.credits_remaining)}
                </span>
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {Math.round((officer.credits_remaining / officer.total_credits) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Account Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Badge Number:</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>{officer.badge_number}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Department:</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>{officer.department}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Rank:</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>{officer.rank}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  officer.status === 'Active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {officer.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};