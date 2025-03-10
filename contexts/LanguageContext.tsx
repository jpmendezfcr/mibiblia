import React, { createContext, useContext, useState, ReactNode } from 'react';
import DebugLogger from '../services/DebugLogger';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState('es'); // Default to Spanish

  // Simple translation function - you can expand this with a proper translation system
  const t = (key: string): string => {
    const translations: { [key: string]: { [key: string]: string } } = {
      es: {
        welcome: 'Bienvenido a MiBiblia',
        readBible: 'Leer la Biblia',
        settings: 'Configuración',
        // Add more translations as needed
      },
      en: {
        welcome: 'Welcome to MyBible',
        readBible: 'Read the Bible',
        settings: 'Settings',
      },
    };

    try {
      return translations[language][key] || key;
    } catch (error) {
      DebugLogger.error(`Translation not found for key: ${key} in language: ${language}`);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
  }
  return context;
};

export default LanguageContext;
