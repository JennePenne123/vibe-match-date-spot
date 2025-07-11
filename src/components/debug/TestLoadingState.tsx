import React from 'react';

export const TestLoadingState: React.FC = () => (
  <div className="text-center py-4">
    <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full"></div>
    <p className="mt-2">Testing...</p>
  </div>
);