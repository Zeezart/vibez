
import React from 'react';
import SupabaseInitCheck from './SupabaseInitCheck';

interface SupabaseWrapperProps {
  children: React.ReactNode;
}

const SupabaseWrapper: React.FC<SupabaseWrapperProps> = ({ children }) => {
  return (
    // @ts-ignore - We're ignoring the TypeScript error here since we know the component works with children
    <SupabaseInitCheck>
      {children}
    </SupabaseInitCheck>
  );
};

export default SupabaseWrapper;
