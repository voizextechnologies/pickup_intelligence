import React from 'react';
import { OfficerSidebar } from './OfficerSidebar';

interface OfficerLayoutProps {
  children: React.ReactNode;
}

export const OfficerLayout: React.FC<OfficerLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-crisp-black">
      <OfficerSidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};