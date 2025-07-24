import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OfficerLayout } from '../components/Layout/OfficerLayout';
import { OfficerDashboardHome } from './officer/OfficerDashboardHome';
import { OfficerFreeLookups } from './officer/OfficerFreeLookups';
import { OfficerProLookups } from './officer/OfficerProLookups';
import { OfficerTrackLink } from './officer/OfficerTrackLink';
import { OfficerHistory } from './officer/OfficerHistory';
import { OfficerAccount } from './officer/OfficerAccount';
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
        <Route path="tracklink" element={<OfficerTrackLink />} />
        <Route path="history" element={<OfficerHistory />} />
        <Route path="account" element={<OfficerAccount />} />

        {/* Fallback for any unmatched routes within /officer/dashboard */}
        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </OfficerLayout>
  );
};