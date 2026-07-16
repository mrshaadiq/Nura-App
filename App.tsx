import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { initDb } from './database/database';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import QuestionnaireScreen from './screens/QuestionnaireScreen';
import ScannerScreen from './screens/ScannerScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';

interface NavState {
  screen: 'Home' | 'Profile' | 'Questionnaire' | 'Scanner' | 'Results' | 'History';
  params?: any;
}

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [navStack, setNavStack] = useState<NavState[]>([{ screen: 'Home' }]);

  // Initialize SQLite Database on app launch
  useEffect(() => {
    async function setupApp() {
      try {
        console.log("[App] Initializing SQLite database...");
        await initDb();
        setDbInitialized(true);
        console.log("[App] Database initialized successfully.");
      } catch (error) {
        console.error("[App] Database initialization failed:", error);
      }
    }
    setupApp();
  }, []);

  // Simple, robust custom navigation router
  const navigate = (screen: string, params?: any) => {
    console.log(`[App] Navigating to: ${screen}`, params);
    
    if (screen === 'Home') {
      // Reset stack when returning to Dashboard to avoid memory leak or stack bloat
      setNavStack([{ screen: 'Home' }]);
    } else {
      setNavStack(prev => [...prev, { screen: screen as any, params }]);
    }
  };

  const goBack = () => {
    if (navStack.length > 1) {
      setNavStack(prev => prev.slice(0, -1));
    }
  };

  const current = navStack[navStack.length - 1];

  // Splash/Loading screen while SQLite database is setting up
  if (!dbInitialized) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <Text style={styles.appName}>NURA APP</Text>
        <Text style={styles.appTagline}>Sistem Deteksi Malnutrisi Lokal AI</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      </View>
    );
  }

  // Render active screen matching state
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {current.screen === 'Home' && (
        <HomeScreen navigate={navigate} isActive={current.screen === 'Home'} />
      )}
      {current.screen === 'Profile' && (
        <ProfileScreen navigate={navigate} />
      )}
      {current.screen === 'Questionnaire' && (
        <QuestionnaireScreen 
          navigate={navigate} 
          params={current.params} 
          isActive={current.screen === 'Questionnaire'} 
        />
      )}
      {current.screen === 'Scanner' && (
        <ScannerScreen 
          navigate={navigate} 
          params={current.params} 
          isActive={current.screen === 'Scanner'} 
        />
      )}
      {current.screen === 'Results' && (
        <ResultsScreen 
          navigate={navigate} 
          params={current.params} 
          isActive={current.screen === 'Results'} 
        />
      )}
      {current.screen === 'History' && (
        <HistoryScreen 
          navigate={navigate} 
          params={current.params} 
          isActive={current.screen === 'History'} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#4F46E5', // Indigo-600 primary splash background
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#4F46E5',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  appTagline: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 6,
    fontWeight: '500',
  },
  loader: {
    marginTop: 40,
  },
});
