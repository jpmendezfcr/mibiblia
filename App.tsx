import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, LogBox, Platform, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from "./screens/HomeScreen";
import BooksScreen from "./screens/BooksScreen";
import ChaptersScreen from "./screens/ChaptersScreen";
import VersiclesScreen from "./screens/VersiclesScreen";
import SearchScreen from "./screens/SearchScreen";
import FavoritesScreen from "./screens/FavoritesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import HistoryScreen from "./screens/HistoryScreen";
import NotesScreen from "./screens/NotesScreen";
import DailyVerseScreen from "./screens/DailyVerseScreen";
import ReadingPlanScreen from "./screens/ReadingPlanScreen";
import AudioPlayerScreen from "./screens/AudioPlayerScreen";
import BibleChatScreen from "./screens/BibleChatScreen";
import BibleAIChat from "./screens/BibleAIChat";
import MusicPlayerScreen from "./screens/MusicPlayerScreen";
import { LanguageProvider } from "./context/LanguageContext";
import FavoriteContextProvider from "./context/FavoriteContext";
import ThemeProvider from "./context/ThemeContext";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BibleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Books" component={BooksScreen} initialParams={{ abbreviation: `RV60`, versionName: `Reina Valera 1960`, version: `025` }} />
      <Stack.Screen name="Chapters" component={ChaptersScreen} />
      <Stack.Screen name="Versicles" component={VersiclesScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="DailyVerse" component={DailyVerseScreen} />
      <Stack.Screen name="ReadingPlan" component={ReadingPlanScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
      <Stack.Screen name="BibleChat" component={BibleChatScreen} />
      <Stack.Screen name="BibleAIChat" component={BibleAIChat} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'BibleTab') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'FavoritesTab') {
            iconName = focused ? 'heart' : 'heart-outline';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6a51ae',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0'
        }
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="BibleTab" component={BibleStack} options={{ tabBarLabel: 'Biblia' }} 
        listeners={({ navigation, route }) => ({
          tabPress: e => {
            navigation.navigate('BibleTab', { screen: 'Books' });
          }
        })}
      />
      <Tab.Screen name="FavoritesTab" component={FavoritesScreen} options={{ tabBarLabel: 'Favoritos' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);

  // Initialize app
  useEffect(() => {
    async function prepare() {
      try {
        console.log('Starting app initialization...');
        
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
        console.log('Splash screen prevented from auto-hiding');

        // Pre-load any resources, make API calls, etc.
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure resources are loaded
        
        console.log('App initialization complete');
        setAppIsReady(true);
      } catch (error: any) {
        console.error('Error during initialization:', error);
        setError('Error initializing app: ' + error.message);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      try {
        console.log('Attempting to hide splash screen...');
        await SplashScreen.hideAsync();
        console.log('Splash screen hidden successfully');
      } catch (error: any) {
        console.error('Error hiding splash screen:', error);
        // Even if hiding splash screen fails, we want to show the app
        setError(null);
      }
    }
  }, [appIsReady]);

  // Ignorar advertencias específicas que pueden ser problemáticas en Android
  useEffect(() => {
    LogBox.ignoreLogs([
      'ViewPropTypes will be removed',
      'ColorPropType will be removed',
      'Require cycle:',
      'AsyncStorage has been extracted from react-native',
      'new NativeEventEmitter',
      'Setting a timer'
    ]);
  }, []);

  // Función de captura de errores global mejorada
  const handleError = (error: Error, isFatal: boolean) => {
    console.log('Error capturado:', error);
    
    if (isFatal) {
      setError(error.message || 'Error crítico en la aplicación');
      Toast.show({
        type: 'error',
        text1: 'Error en la aplicación',
        text2: 'Por favor, reinicia la app'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Se ha producido un error',
        text2: error.message || 'Intenta de nuevo'
      });
    }
  };

  // Configurar el manejador de errores global
  useEffect(() => {
    try {
      if (Platform.OS === 'android') {
        // Código para manejar errores en Android
        const ErrorUtils = (global as any).ErrorUtils;
        if (ErrorUtils) {
          const originalHandler = ErrorUtils.getGlobalHandler();
          ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
            handleError(error, isFatal);
            // Llamar al manejador original solo si no es fatal
            if (!isFatal && originalHandler) {
              originalHandler(error, isFatal);
            }
          });
        }
      }
      return () => {
        // Limpieza en desmontaje (restaurar manejador original si es necesario)
      };
    } catch (e) {
      console.error('Error al configurar el manejador de errores:', e);
    }
  }, []);

  // Si hay un error crítico, mostrar una pantalla de error en lugar de la app
  if (error) {
    return (
      <SafeAreaProvider style={styles.container}>
        <View style={styles.errorScreen}>
          <Text style={styles.errorTitle}>¡Ups! Algo salió mal</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHelp}>Por favor, reinicia la aplicación</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar style="auto" />
      <LanguageProvider>
        <ThemeProvider>
          <FavoriteContextProvider>
            <NavigationContainer
              fallback={
                <View style={styles.loadingScreen}>
                  <ActivityIndicator size="large" color="#6a51ae" />
                  <Text style={styles.loadingText}>Cargando...</Text>
                </View>
              }
              onReady={() => {
                console.log('Navigation ready');
              }}
            >
              <TabNavigator />
            </NavigationContainer>
          </FavoriteContextProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8d7da',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#721c24',
    marginBottom: 20,
  },
  errorHelp: {
    fontSize: 14,
    color: '#721c24',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#6a51ae',
  }
});
