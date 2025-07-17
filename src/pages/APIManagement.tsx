import React, { useState } from 'react';
import { Key, Plus, Edit2, Trash2, Eye, EyeOff, Activity, AlertTriangle, CheckCircle, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/UI/StatusBadge';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

export const APIManagement: React.FC = () => {
  const { apis, isLoading, addAPI, updateAPI, deleteAPI } = useSupabaseData();
  const { isDark } = useTheme();
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAPI, setEditingAPI] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    service_provider: '',
    type: 'PRO' as 'FREE' | 'PRO' | 'DISABLED',
    global_buy_price: 0,
    global_sell_price: 0,
    default_credit_charge: 0,
    description: '',
    api_key: '',
    key_status: 'Active' as 'Active' | 'Inactive'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const handleAddAPI = () => {
    setFormData({
      name: '',
      service_provider: '',
      type: 'PRO',
      global_buy_price: 0,
      global_sell_price: 0,
      default_credit_charge: 0,
      description: '',
      api_key: '',
      key_status: 'Active'
    });
    setEditingAPI(null);
    setShowAddModal(true);
  };

  const handleEditAPI = (api: any) => {
    setFormData({
      name: api.name,
      service_provider: api.service_provider,
      type: api.type,
      global_buy_price: api.global_buy_price,
      global_sell_price: api.global_sell_price,
      default_credit_charge: api.default_credit_charge,
      description: api.description,
      api_key: api.api_key,
      key_status: api.key_status
    });
    setEditingAPI(api);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {

      if (editingAPI) {
        await updateAPI(editingAPI.id, formData);
      } else {
        await addAPI(formData);
      }

      setShowAddModal(false);
      setFormData({
        name: '',
        service_provider: '',
        type: 'PRO',
        global_buy_price: 0,
        global_sell_price: 0,
        default_credit_charge: 0,
        description: '',
        api_key: '',
        key_status: 'Active'
      });
    } catch (error) {
      console.error('Error saving API:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAPI = (api: any) => {
    if (window.confirm(`Are you sure you want to delete ${api.name}?`)) {
      deleteAPI(api.id);
    }
  };

  const handleToggleStatus = (api: any) => {
    const newStatus = api.key_status === 'Active' ? 'Inactive' : 'Active';
    updateAPI(api.id, { key_status: newStatus });
  };

  const filteredAPIs = apis.filter(api => 
    api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.service_provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maskAPIKey = (key: string) => {
    if (!key) return 'No key provided';
    const visiblePart = key.substring(0, 8);
    const maskedPart = '*'.repeat(24);
    return `${visiblePart}${maskedPart}`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            API Management
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage API keys and integrations for PRO services
          </p>
        </div>
        <button 
          onClick={handleAddAPI}
          className="bg-cyber-gradient text-white px-4 py-2 rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add API Key</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total APIs
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {apis.length}
              </p>
            </div>
            <Key className="w-8 h-8 text-cyber-teal" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Active APIs
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {apis.filter(api => api.key_status === 'Active').length}
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
                PRO APIs
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {apis.filter(api => api.type === 'PRO').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-neon-magenta" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Usage
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {apis.reduce((sum, api) => sum + api.usage_count, 0).toLocaleString()}
              </p>
            </div>
            <Activity className="w-8 h-8 text-electric-blue" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <input
          type="text"
          placeholder="Search APIs by name or service provider..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
            isDark 
              ? 'bg-crisp-black text-white placeholder-gray-500' 
              : 'bg-white text-gray-900 placeholder-gray-400'
          }`}
        />
      </div>

      {/* APIs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAPIs.map((api) => (
          <div key={api.id} className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
            isDark ? 'bg-muted-graphite' : 'bg-white'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-cyber-gradient rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {api.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {api.service_provider}
                  </p>
                </div>
              </div>
              <StatusBadge status={api.key_status} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Type:</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  api.type === 'FREE' ? 'bg-green-500/20 text-green-400' :
                  api.type === 'PRO' ? 'bg-neon-magenta/20 text-neon-magenta' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {api.type}
                </span>
              </div>
              
              <div>
                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  API Key
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className={`flex-1 px-3 py-2 text-sm rounded border font-mono ${
                    isDark 
                      ? 'bg-crisp-black border-cyber-teal/30 text-gray-300' 
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}>
                    {showKeys[api.id] ? api.api_key : maskAPIKey(api.api_key)}
                  </code>
                  <button
                    onClick={() => toggleKeyVisibility(api.id)}
                    className={`p-2 rounded transition-colors ${
                      isDark ? 'text-gray-400 hover:text-cyber-teal' : 'text-gray-600 hover:text-cyber-teal'
                    }`}
                  >
                    {showKeys[api.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Used:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {api.last_used ? new Date(api.last_used).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Usage Count:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {api.usage_count.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Credits:</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {api.default_credit_charge}
                  </p>
                </div>
              </div>

              {/* Usage Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Monthly Usage
                  </span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {Math.round((api.usage_count / 10000) * 100)}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${
                  isDark ? 'bg-crisp-black' : 'bg-gray-200'
                }`}>
                  <div 
                    className="bg-cyber-gradient h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((api.usage_count / 10000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-cyber-teal/20">
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditAPI(api)}
                  className={`p-2 rounded transition-colors ${
                  isDark ? 'text-gray-400 hover:text-cyber-teal' : 'text-gray-600 hover:text-cyber-teal'
                }`}>
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteAPI(api)}
                  className={`p-2 rounded transition-colors ${
                  isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-400'
                }`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={() => handleToggleStatus(api)}
                className="flex items-center space-x-2 transition-colors hover:opacity-80"
              >
                <div className={`w-2 h-2 rounded-full ${
                  api.key_status === 'Active' ? 'bg-green-400' : 'bg-red-400'
                } animate-pulse`} />
                <span className={`text-xs ${
                  api.key_status === 'Active' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {api.key_status === 'Active' ? 'Operational' : 'Inactive'}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit API Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full rounded-lg p-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-muted-graphite border border-cyber-teal/20' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingAPI ? 'Edit API' : 'Add New API'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    API Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Phone Prefill V2"
                    className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white placeholder-gray-500' 
                        : 'bg-white text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Service Provider *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.service_provider}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_provider: e.target.value }))}
                    placeholder="e.g., Signzy, RapidAPI, Surepass"
                    className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white placeholder-gray-500' 
                        : 'bg-white text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white' 
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Default Credit Charge
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.default_credit_charge}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_credit_charge: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white' 
                        : 'bg-white text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Buy Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.global_buy_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, global_buy_price: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white' 
                        : 'bg-white text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Sell Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.global_sell_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, global_sell_price: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white' 
                        : 'bg-white text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal resize-none ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="Brief description of the API service"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  API Key *
                </label>
                <input
                  type="text"
                  required
                  value={formData.api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal font-mono ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="Enter the actual API key from the service provider"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Key Status
                </label>
                <select
                  value={formData.key_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, key_status: e.target.value as 'Active' | 'Inactive' }))}
                  className={`w-full px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white' 
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingAPI ? 'Update API' : 'Add API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredAPIs.length === 0 && (
        <div className="text-center py-12">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-muted-graphite' : 'bg-gray-100'
          }`}>
            <Key className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {searchTerm ? 'No APIs Found' : 'No APIs Added Yet'}
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {searchTerm 
              ? 'Try adjusting your search criteria or add a new API.'
              : 'Add your first API service to get started.'
            }
          </p>
        </div>
      )}
    </div>
  );
};