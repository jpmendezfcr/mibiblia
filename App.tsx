import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DebugLogger from './services/DebugLogger';
import ErrorBoundary from './components/ErrorBoundary';

// Import your screens
import HomeScreen from './screens/HomeScreen';
// ... other imports

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const initApp = async () => {
      try {
        await DebugLogger.info('Starting app initialization...');
        
        // Log app startup
        await DebugLogger.debug('App initialization complete');
      } catch (error) {
        await DebugLogger.error(`App initialization error: ${error}`);
      }
    };

    initApp();
  }, []);

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        {/* Add other screens here */}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
