// CommunityLayout.tsx
// Placeholder for CommunityLayout component

import React from 'react';
import { Outlet } from 'react-router-dom';

const CommunityLayout = () => {
  return (
    <div className="community-section">
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default CommunityLayout; 