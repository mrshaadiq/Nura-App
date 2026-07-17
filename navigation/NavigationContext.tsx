import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ScreenName = 'Home' | 'Profile' | 'Questionnaire' | 'Scanner' | 'Results' | 'History' | 'Education' | 'Faskes';

export interface NavState {
  screen: ScreenName;
  params?: any;
}

interface NavigationContextType {
  currentScreen: ScreenName;
  params: any;
  navigate: (screen: ScreenName, params?: any) => void;
  goBack: () => void;
  navStack: NavState[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navStack, setNavStack] = useState<NavState[]>([{ screen: 'Home' }]);

  const navigate = (screen: ScreenName, params?: any) => {
    console.log(`[Navigation] Navigating to: ${screen}`, params);
    if (screen === 'Home') {
      // Reset stack to avoid memory leak or stack bloat
      setNavStack([{ screen: 'Home' }]);
    } else {
      setNavStack(prev => [...prev, { screen, params }]);
    }
  };

  const goBack = () => {
    if (navStack.length > 1) {
      setNavStack(prev => prev.slice(0, -1));
    }
  };

  const current = navStack[navStack.length - 1];

  return (
    <NavigationContext.Provider
      value={{
        currentScreen: current.screen,
        params: current.params,
        navigate,
        goBack,
        navStack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within a NavigationProvider');
  }
  return context;
}
