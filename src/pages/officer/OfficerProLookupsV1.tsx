import React, { useState } from 'react';
import { Shield, Database, CreditCard, FileText, Search, Car, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import PassportVerification from './tabs/PassportVerification';
import AadhaarOCRVerification from './tabs/AadhaarOCRVerification';
import PanOCRVerification from './tabs/PanOCRVerification';
import PanDetails from './tabs/PanDetails';
import UpiInfoCheck from './tabs/UpiInfoCheck';
import UpiVerification from './tabs/UpiVerification';
import PanVerification from './tabs/PanVerification';
import PanByGstNumber from './tabs/PanByGstNumber';
import UpiValidation from './tabs/UpiValidation';
import MobileToUpi from './tabs/MobileToUpi';
import GstStatus from './tabs/GstStatus';
import GstAdvance from './tabs/GstAdvance';
import VoterIdVerification from './tabs/VoterIdVerification';
import VoterId2Verification from './tabs/VoterId2Verification';
import MCACompanySearch from './tabs/MCACompanySearch';
import VehicleChallanDetails from './tabs/VehicleChallanDetails';
import DrivingLicenseVerification from './tabs/DrivingLicenseVerification';
import RegistrationCertificateVerification from './tabs/RegistrationCertificateVerification';
import DINVerification from './tabs/DINVerification';


export const OfficerProLookupsV1: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'aadhaar-duplicate' | 'pan-duplicate' | 'pan-details' | 'pan-verification' | 'pan-by-gst' | 'bank-verification-v1' | 'bank-verification-v2' | 'upi-info' | 'upi-to-account' | 'upi-validation' | 'mobile-to-upi' | 'gst-status' | 'gst-advance' | 'gst-verification' | 'voter-id-verification' | 'voter-id-2-verification' | 'mca-company' | 'mca-cin-search' | 'din-verification' | 'registration-certificate' | 'driving-license-verification' | 'vehicle-challan-details' | 'passport-verification'>('aadhaar-duplicate');

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
            <span className="font-medium">UPI Info</span>
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
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">UPI to Account Number</span>
          </button>
          <button
            onClick={() => setActiveTab('upi-validation')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'upi-validation'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
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
          <button
            onClick={() => setActiveTab('gst-status')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'gst-status'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">GST Status</span>
          </button>
          <button
            onClick={() => setActiveTab('gst-advance')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'gst-advance'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">GST Advance Check</span>
          </button>
          <button
            onClick={() => setActiveTab('gst-verification')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'gst-verification'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">GST Verification</span>
          </button>
          <button
            onClick={() => setActiveTab('voter-id-verification')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'voter-id-verification'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="font-medium">Voter ID Verification</span>
          </button>
          <button
            onClick={() => setActiveTab('voter-id-2-verification')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'voter-id-2-verification'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="font-medium">Voter ID 2 Verification</span>
          </button>
          <button
            onClick={() => setActiveTab('mca-company')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'mca-company'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">MCA Company</span>
          </button>
          <button
            onClick={() => setActiveTab('mca-cin-search')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'mca-cin-search'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="font-medium">MCA CIN Search</span>
          </button>
          <button
            onClick={() => setActiveTab('din-verification')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'din-verification'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">DIN Verification</span>
          </button>
          <button
            onClick={() => setActiveTab('registration-certificate')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'registration-certificate'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Car className="w-4 h-4" />
            <span className="font-medium">Registration Certificate</span>
          </button>
          <button
            onClick={() => setActiveTab('driving-license-verification')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'driving-license-verification'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">Driving License Verification</span>
          </button>
          <button
            onClick={() => setActiveTab('vehicle-challan-details')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'vehicle-challan-details'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <Car className="w-4 h-4" />
            <span className="font-medium">Vehicle Challan Details</span>
          </button>
          <button
            onClick={() => setActiveTab('passport-verification')}
            className={`flex items-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200 ${
              activeTab === 'passport-verification'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30'
                : isDark 
                  ? 'text-gray-400 hover:text-cyber-teal hover:bg-cyber-teal/10' 
                  : 'text-gray-600 hover:text-cyber-teal hover:bg-cyber-teal/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">Passport Verification</span>
          </button>
        </div>
      </div>

      {activeTab === 'aadhaar-duplicate' && <AadhaarOCRVerification />}
      {activeTab === 'pan-duplicate' && <PanOCRVerification />}
      {activeTab === 'pan-details' && <PanDetails />}
      {activeTab === 'pan-verification' && <PanVerification />}
      {activeTab === 'pan-by-gst' && <PanByGstNumber />}
      {activeTab === 'bank-verification-v1' && renderComingSoon('Bank Account Verification V1', CreditCard)}
      {activeTab === 'bank-verification-v2' && renderComingSoon('Bank Account Verification V2', CreditCard)}
      {activeTab === 'upi-info' && <UpiInfoCheck />}
      {activeTab === 'upi-to-account' && <UpiVerification />}
      {activeTab === 'upi-validation' && <UpiValidation />}
      {activeTab === 'mobile-to-upi' && <MobileToUpi />}
      {activeTab === 'gst-status' && <GstStatus />}
      {activeTab === 'gst-advance' && <GstAdvance />}
      {activeTab === 'gst-verification' && <GstVerification />}
      {activeTab === 'voter-id-verification' && <VoterIdVerification />}
      {activeTab === 'voter-id-2-verification' && <VoterId2Verification />}
      {activeTab === 'mca-company' && <MCACompanySearch />}
      {activeTab === 'mca-cin-search' && renderComingSoon('MCA CIN Search', Search)}
      {activeTab === 'din-verification' && <DINVerification />}
      {activeTab === 'registration-certificate' && <RegistrationCertificateVerification />}
      {activeTab === 'driving-license-verification' && <DrivingLicenseVerification />}
      {activeTab === 'vehicle-challan-details' && <VehicleChallanDetails />}
      {activeTab === 'passport-verification' && <PassportVerification />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-neon-magenta/10 border-neon-magenta/30 text-neon-magenta">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Identity Verification
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Verify identity documents
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
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Voter ID Verification</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Voter ID 2 Verification</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Passport Verification</span>
              <span className="text-cyber-teal">5 credits</span>
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
              <span className="text-cyber-teal">1.8 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>UPI to Account Number</span>
              <span className="text-cyber-teal">20 credits</span>
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

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${isDark ? 'bg-muted-graphite' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-cyber-teal/10 border-cyber-teal/30 text-cyber-teal">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Business & Vehicle Verification
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                GST, company, and vehicle checks
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>PAN Number by GST Number</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>GST Status</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>GST Advance Check</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>GST Verification</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>MCA Company</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>MCA CIN Search</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>DIN Verification</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Registration Certificate</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Driving License Verification</span>
              <span className="text-cyber-teal">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Vehicle Challan Details</span>
              <span className="text-cyber-teal">2 credits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};