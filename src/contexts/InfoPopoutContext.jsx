import React, { createContext, useContext } from 'react';

const InfoPopoutContext = createContext(null);

export function InfoPopoutProvider({ children, value }) {
  return (
    <InfoPopoutContext.Provider value={value}>
      {children}
    </InfoPopoutContext.Provider>
  );
}

export function useInfoPopout() {
  const context = useContext(InfoPopoutContext);
  if (!context) {
    throw new Error('useInfoPopout must be used within an InfoPopoutProvider');
  }
  return context;
}
