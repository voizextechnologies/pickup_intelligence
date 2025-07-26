import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OfficerLayout } from '../components/Layout/OfficerLayout';
import { OfficerDashboardHome } from './officer/OfficerDashboardHome';
import { OfficerFreeLookups } from './officer/OfficerFreeLookups';
import { OfficerProLookups } from './officer/OfficerProLookups';
import { OfficerTrackLink } from './officer/OfficerTrackLink';
import { OfficerOsintPro } from './officer/OfficerOsintPro';
import { OfficerHistory } from './officer/OfficerHistory';
import { OfficerAccount } from './officer/OfficerAccount';
import { OfficerProLookupsV1 } from './officer/OfficerProLookupsV1'; // Import the new component
import { OfficerDashboardContent } from './officer/OfficerDashboardContent'; // The original content

export const OfficerPortalRouter: React.FC = () => {
  return (
    <OfficerLayout>
      <Routes>
        {/* Default route for /officer/dashboard */}
        <Route index element={<Navigate to="home" replace />} />
        
        {/* Original Officer Dashboard content as a sub-route */}
        <Route path="home" element={<OfficerDashboardContent />} />

        {/* New dedicated sub-pages */}
        <Route path="free-lookups" element={<OfficerFreeLookups />} />
        <Route path="pro-lookups" element={<OfficerProLookups />} />
        <Route path="osint-pro" element={<OfficerOsintPro />} />
        <Route path="pro-lookups-v1" element={<OfficerProLookupsV1 />} /> {/* Add the new route */}
        <Route path="tracklink" element={<OfficerTrackLink />} />
        <Route path="history" element={<OfficerHistory />} />
        <Route path="account" element={<OfficerAccount />} />

        {/* Fallback for any unmatched routes within /officer/dashboard */}
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </OfficerLayout>
  );
};