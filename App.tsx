import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { initDb } from './database/database';
import { NavigationProvider, useAppNavigation } from './navigation/NavigationContext';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import QuestionnaireScreen from './screens/QuestionnaireScreen';
import ScannerScreen from './screens/ScannerScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';

function AppContent() {
  const { currentScreen, params } = useAppNavigation();

  // Render active screen matching state
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {currentScreen === 'Home' && (
        <HomeScreen isActive={currentScreen === 'Home'} />
      )}
      {currentScreen === 'Profile' && (
        <ProfileScreen />
      )}
      {currentScreen === 'Questionnaire' && (
        <QuestionnaireScreen 
          params={params} 
          isActive={currentScreen === 'Questionnaire'} 
        />
      )}
      {currentScreen === 'Scanner' && (
        <ScannerScreen 
          params={params} 
          isActive={currentScreen === 'Scanner'} 
        />
      )}
      {currentScreen === 'Results' && (
        <ResultsScreen 
          params={params} 
          isActive={currentScreen === 'Results'} 
        />
      )}
      {currentScreen === 'History' && (
        <HistoryScreen 
          params={params} 
          isActive={currentScreen === 'History'} 
        />
      )}
    </View>
  );
}

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

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

  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
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
