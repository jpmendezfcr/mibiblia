import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'zh';

type Translations = {
  [key: string]: {
    [lang in SupportedLanguage]: string;
  }
};

const translations: Translations = {
  home: { es: 'Inicio', en: 'Home', fr: 'Accueil', de: 'Startseite', it: 'Home', pt: 'Início', zh: '首页' },
  bible: { es: 'Biblia', en: 'Bible', fr: 'Bible', de: 'Bibel', it: 'Bibbia', pt: 'Bíblia', zh: '圣经' },
  favorites: { es: 'Favoritos', en: 'Favorites', fr: 'Favoris', de: 'Favoriten', it: 'Preferiti', pt: 'Favoritos', zh: '收藏' },
  settings: { es: 'Configuración', en: 'Settings', fr: 'Paramètres', de: 'Einstellungen', it: 'Impostazioni', pt: 'Configurações', zh: '设置' },
  language: { es: 'Idioma', en: 'Language', fr: 'Langue', de: 'Sprache', it: 'Lingua', pt: 'Idioma', zh: '语言' },
  dailyVerseTitle: { es: 'Versículo del Día', en: 'Daily Verse', fr: 'Verset du jour', de: 'Tagesvers', it: 'Versetto del Giorno', pt: 'Versículo do Dia', zh: '每日经文' },
  loadingDailyVerse: { es: 'Cargando versículo del día...', en: 'Loading daily verse...', fr: 'Chargement du verset du jour...', de: 'Tagesvers wird geladen...', it: 'Caricamento del versetto del giorno...', pt: 'Carregando versículo do dia...', zh: '加载每日经文...' },
  retry: { es: 'Reintentar', en: 'Retry', fr: 'Réessayer', de: 'Erneut versuchen', it: 'Riprova', pt: 'Tentar novamente', zh: '重试' },
  audioPlayerTitle: { es: 'Reproduciendo Audio', en: 'Playing Audio', fr: 'Lecture audio', de: 'Audio abspielen', it: 'Riproduzione audio', pt: 'Reproduzindo áudio', zh: '播放音频' },
  loadingAudio: { es: 'Cargando audio...', en: 'Loading audio...', fr: 'Chargement de l\'audio...', de: 'Audio wird geladen...', it: 'Caricamento audio...', pt: 'Carregando áudio...', zh: '加载音频...' },
  loadingText: { es: 'Cargando...', en: 'Loading...', fr: 'Chargement...', de: 'Wird geladen...', it: 'Caricamento...', pt: 'Carregando...', zh: '加载中...' },
  errorText: { es: 'Ha ocurrido un error', en: 'An error occurred', fr: 'Une erreur est survenue', de: 'Ein Fehler ist aufgetreten', it: 'Si è verificato un errore', pt: 'Ocorreu um erro', zh: '发生错误' },
  clearHistory: { es: 'Borrar historial de lectura', en: 'Clear reading history', fr: 'Effacer l\'historique de lecture', de: 'Lesehistorie löschen', it: 'Cancella cronologia di lettura', pt: 'Limpar histórico de leitura', zh: '清除阅读历史' },
  clearAllData: { es: 'Borrar todos los datos', en: 'Clear all data', fr: 'Effacer toutes les données', de: 'Alle Daten löschen', it: 'Cancella tutti i dati', pt: 'Limpar todos os dados', zh: '清除所有数据' },
  version: { es: 'Versión', en: 'Version', fr: 'Version', de: 'Version', it: 'Versione', pt: 'Versão', zh: '版本' },
  madeWithLove: { es: 'Hecho con ❤️', en: 'Made with ❤️', fr: 'Fait avec ❤️', de: 'Gemacht mit ❤️', it: 'Fatto con ❤️', pt: 'Feito com ❤️', zh: '用❤️制作' },
  theme: { es: 'Tema', en: 'Theme', fr: 'Thème', de: 'Thema', it: 'Tema', pt: 'Tema', zh: '主题' },
  textSize: { es: 'Tamaño de texto', en: 'Text size', fr: 'Taille du texte', de: 'Textgröße', it: 'Dimensione del testo', pt: 'Tamanho do texto', zh: '文字大小' },
  appearance: { es: 'Apariencia', en: 'Appearance', fr: 'Apparence', de: 'Aussehen', it: 'Aspetto', pt: 'Aparência', zh: '外观' },
  dataPrivacy: { es: 'Datos y privacidad', en: 'Data & Privacy', fr: 'Données et confidentialité', de: 'Daten & Datenschutz', it: 'Dati e privacy', pt: 'Dados e privacidade', zh: '数据与隐私' },
  cancel: { es: 'Cancelar', en: 'Cancel', fr: 'Annuler', de: 'Abbrechen', it: 'Annulla', pt: 'Cancelar', zh: '取消' },
  delete: { es: 'Borrar', en: 'Delete', fr: 'Supprimer', de: 'Löschen', it: 'Elimina', pt: 'Excluir', zh: '删除' },
  about: { es: 'Acerca de', en: 'About', fr: 'À propos', de: 'Über', it: 'Informazioni', pt: 'Sobre', zh: '关于' },
  chatBible: { es: 'Chat Bíblico', en: 'Bible Chat', fr: 'Chat Biblique', de: 'Bibel-Chat', it: 'Chat Biblico', pt: 'Chat Bíblico', zh: '圣经聊天' },
  notes: { es: 'Notas', en: 'Notes', fr: 'Notes', de: 'Notizen', it: 'Note', pt: 'Notas', zh: '笔记' },
  history: { es: 'Historial', en: 'History', fr: 'Historique', de: 'Verlauf', it: 'Cronologia', pt: 'Histórico', zh: '历史' },
  readingPlans: { es: 'Planes de Lectura', en: 'Reading Plans', fr: 'Plans de Lecture', de: 'Lesepläne', it: 'Piani di Lettura', pt: 'Planos de Leitura', zh: '阅读计划' },
  startReadingPlan: { es: 'Comenzar un plan de lectura', en: 'Start a reading plan', fr: 'Commencer un plan de lecture', de: 'Einen Leseplan starten', it: 'Inizia un piano di lettura', pt: 'Iniciar um plano de leitura', zh: '开始阅读计划' },
  searchBible: { es: 'Buscar en la Biblia', en: 'Search the Bible', fr: 'Recherche dans la Bible', de: 'Bibel durchsuchen', it: 'Cerca nella Bibbia', pt: 'Pesquisar na Bíblia', zh: '搜索圣经' },
  enterSearchTerms: { es: 'Ingresa términos de búsqueda...', en: 'Enter search terms...', fr: 'Entrez des termes de recherche...', de: 'Suchbegriffe eingeben...', it: 'Inserisci i termini di ricerca...', pt: 'Digite os termos para pesquisar...', zh: '输入搜索词...' },
  see: { es: 'Ver', en: 'See', fr: 'Voir', de: 'Ansehen', it: 'Visualizza', pt: 'Ver', zh: '查看' },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('es');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('preferred_language');
        if (savedLang && ['es','en','fr','de','it','pt','zh'].includes(savedLang)) {
          setLanguageState(savedLang as SupportedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem('preferred_language', lang).catch(err => console.error('Error saving language:', err));
  };

  const t = (key: string) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};