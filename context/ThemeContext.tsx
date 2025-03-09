import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definir los temas
export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  inactive: string;
  highlight: string;
  cardHighlight: string;
};

export type ThemeType = 'light' | 'dark' | 'system';

// Integración de estilos para componentes nuevos
export interface VerseOfDayStyle {
  container: any;
  card: any;
  verseText: any;
  reference: any;
}

export interface ReadingPlanStyle {
  container: any;
  card: any;
  title: any;
  description: any;
  progressBar: any;
  progressText: any;
}

const lightTheme: ThemeColors = {
  primary: '#6a51ae',
  primaryLight: '#9d7ee8',
  primaryDark: '#523f87',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#FF5252',
  success: '#4CAF50',
  inactive: '#9e9e9e',
  highlight: '#FFEB3B',
  cardHighlight: '#FFFDE7',
};

const darkTheme: ThemeColors = {
  primary: '#9d7ee8',
  primaryLight: '#c3b0ff',
  primaryDark: '#6a51ae',
  background: '#1a1a1a',
  card: '#2d2d2d',
  text: '#f0f0f0',
  textSecondary: '#bbbbbb',
  border: '#444444',
  error: '#FF5252',
  success: '#66BB6A',
  inactive: '#6e6e6e',
  highlight: '#FFC107',
  cardHighlight: '#423d00',
};

type ThemeContextType = {
  theme: ThemeColors;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('system');
  const [theme, setTheme] = useState<ThemeColors>(colorScheme === 'dark' ? darkTheme : lightTheme);  useEffect(() => {
    let isMounted = true;
    
    const loadThemePreference = async () => {
      try {
        // Verificar que AsyncStorage está disponible
        if (!AsyncStorage) {
          console.warn('AsyncStorage no disponible');
          return;
        }
        
        let savedTheme;
        try {
          savedTheme = await AsyncStorage.getItem('themePreference');
        } catch (storageError) {
          console.error('Error accessing AsyncStorage:', storageError);
          return;
        }
        
        if (savedTheme && isMounted) {
          // Validar que el tema es válido antes de aplicarlo
          if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
            setThemeType(savedTheme as ThemeType);
          } else {
            console.warn('Tema guardado inválido:', savedTheme);
            // Usar el tema del sistema por defecto
            setThemeType('system');
          }
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
        // En caso de error, usar el tema del sistema
        if (isMounted) setThemeType('system');
      }
    };

    loadThemePreference();
    
    return () => {
      isMounted = false;
    };
  }, []);  useEffect(() => {
    // Actualizar el tema basado en la preferencia
    let newTheme: ThemeColors;
    
    if (themeType === 'system') {
      newTheme = colorScheme === 'dark' ? darkTheme : lightTheme;
    } else {
      newTheme = themeType === 'dark' ? darkTheme : lightTheme;
    }
    
    setTheme(newTheme);
    
    // Guardar la preferencia en AsyncStorage con manejo de errores
    try {
      if (AsyncStorage) {
        AsyncStorage.setItem('themePreference', themeType)
          .catch(error => console.error('Error saving theme preference:', error));
      }
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  }, [themeType, colorScheme]);

  const isDark = themeType === 'dark' || (themeType === 'system' && colorScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ theme, themeType, setThemeType, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;