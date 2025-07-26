import React, { useState } from 'react';
import { Shield, CreditCard, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const OfficerProLookupsV1: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<
    | 'aadhaar-duplicate'
    | 'pan-duplicate'
    | 'pan-details'
    | 'pan-verification'
    | 'pan-by-gst'
    | 'bank-verification-v1'
    | 'bank-verification-v2'
    | 'upi-info'
    | 'upi-to-account'
    | 'upi-validation'
    | 'mobile-to-upi'
  >('aadhaar-duplicate');

  const renderComingSoon = (title: string, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <div className="text-center py-12">
          <Icon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Coming Soon
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {title} functionality will be available soon.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          PRO Verification Services V1
        </h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Premium API-based verification and intelligence services
        </p>
      </div>

      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
        <div className="flex space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('aadhaar-duplicate')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'aadhaar-duplicate'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">Aadhaar Duplicate Check</span>
          </button>
          <button
            onClick={() => setActiveTab('pan-duplicate')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'pan-duplicate'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">PAN Duplicate Check</span>
          </button>
          <button
            onClick={() => setActiveTab('pan-details')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'pan-details'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">PAN Card Details</span>
          </button>
          <button
            onClick={() => setActiveTab('pan-verification')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'pan-verification'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">PAN Verification</span>
          </button>
          <button
            onClick={() => setActiveTab('pan-by-gst')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'pan-by-gst'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">PAN Number by GST Number</span>
          </button>
          <button
            onClick={() => setActiveTab('bank-verification-v1')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'bank-verification-v1'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">Bank Account Verification V1</span>
          </button>
          <button
            onClick={() => setActiveTab('bank-verification-v2')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'bank-verification-v2'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">Bank Account Verification V2</span>
          </button>
          <button
            onClick={() => setActiveTab('upi-info')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'upi-info'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">UPI Details</span>
          </button>
          <button
            onClick={() => setActiveTab('upi-to-account')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'upi-to-account'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <CreditCard className="w-4 h-4 h-4" />
            <span className="font-medium">UPI to Account Number</span>
          </button>
          <button
            onClick={() => setActiveTab('upi-validation')}
            className="`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'upi-validation'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`"
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">UPI Validation</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile-to-upi')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'mobile-to-upi'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10'
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">Mobile to UPI</span>
          </button>
        </div>
      </div>

      {activeTab === 'aadhaar-duplicate' && renderComingSoon('Aadhaar Duplicate Check', FileText)}
      {activeTab === 'pan-duplicate' && renderComingSoon('PAN Duplicate Check', FileText)}
      {activeTab === 'pan-details' && renderComingSoon('PAN Card Details', FileText)}
      {activeTab === 'pan-verification' && renderComingSoon('PAN Verification', FileText)}
      {activeTab === 'pan-by-gst' && renderComingSoon('PAN Number by GST Number', FileText)}
      {activeTab === 'bank-verification-v1' && renderComingSoon('Bank Account Verification V1', CreditCard)}
      {activeTab === 'bank-verification-v2' && renderComingSoon('Bank Account Verification V2', CreditCard)}
      {activeTab === 'upi-info' && renderComingSoon('UPI Info', CreditCard)}
      {activeTab === 'upi-to-account' && renderComingSoon('UPI to Account Number', CreditCard)}
      {activeTab === 'upi-validation' && renderComingSoon('UPI Validation', CreditCard)}
      {activeTab === 'mobile-to-upi' && renderComingSoon('Mobile to UPI', CreditCard)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
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
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Aadhaar Duplicate Check</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>PAN Duplicate Check</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>PAN Card Details</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>PAN Verification</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>PAN Number by GST Number</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-electric-blue/10 border-electric-blue/30 text-electric-blue">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Financial Verification
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Bank and UPI details
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Bank Account Verification V1</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Bank Account Verification V2</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>UPI Info</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>UPI to Account Number</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>UPI Validation</span>
              <span className="text-cyber-teal">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Mobile to UPI</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};