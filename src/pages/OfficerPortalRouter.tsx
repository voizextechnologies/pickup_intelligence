import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OfficerLayout } from '../src/components/Layout/OfficerLayout';
import { OfficerDashboardHome } from '../src/pages/officer/OfficerDashboardHome';
import { OfficerFreeLookups } from '../src/pages/officer/OfficerFreeLookups';
import { OfficerProLookups } from '../src/pages/officer/OfficerProLookups';
import { OfficerTrackLink } from '../src/pages/officer/OfficerTrackLink';
import { OfficerHistory } from '../src/pages/officer/OfficerHistory';
import { OfficerAccount } from '../src/pages/officer/OfficerAccount';
import { OfficerDashboardContent } from '../src/pages/officer/OfficerDashboardContent'; // The original content

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