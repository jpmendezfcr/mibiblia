import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for our favorite items
export type FavoriteVerse = {
  id: string;
  book_id: string;
  book_name: string;
  chapter: string;
  verse: string;
  text: string;
  timestamp: number;
};

type FavoriteContextType = {
  favorites: FavoriteVerse[];
  addFavorite: (verse: Omit<FavoriteVerse, 'timestamp'>) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
};

// Create the context
const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

// Custom hook to access the context
export const useFavorites = () => {
  const context = useContext(FavoriteContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoriteContextProvider');
  }
  return context;
};

// Provider component
const FavoriteContextProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);  // Load favorites from AsyncStorage on mount with mejor manejo de errores
  useEffect(() => {
    let isMounted = true;
    
    const loadFavorites = async () => {
      try {
        // Verificar si hay almacenamiento disponible (para prevenir errores en Android)
        if (!AsyncStorage) {
          console.warn('AsyncStorage no disponible');
          return;
        }
        
        let storedFavorites;
        try {
          storedFavorites = await AsyncStorage.getItem('favorites');
        } catch (storageError) {
          console.error('Error accessing AsyncStorage:', storageError);
          if (isMounted) setFavorites([]);
          return;
        }
        
        if (storedFavorites) {
          try {
            const parsedFavorites = JSON.parse(storedFavorites);
            
            // Validar la estructura antes de establecer el estado
            if (!Array.isArray(parsedFavorites)) {
              console.warn('Los favoritos almacenados no son un array, reiniciando');
              if (isMounted) setFavorites([]);
              AsyncStorage.setItem('favorites', JSON.stringify([])).catch(e => 
                console.error('Error al reiniciar favoritos:', e)
              );
              return;
            }
            
            // Asegurarse de que todos los elementos tienen la estructura correcta
            const validFavorites = parsedFavorites.filter(item => 
              item && typeof item === 'object' && item.id && item.book_name
            );
            
            if (isMounted) setFavorites(validFavorites);
            
            // Si se eliminaron elementos inválidos, actualizar el almacenamiento
            if (validFavorites.length !== parsedFavorites.length) {
              AsyncStorage.setItem('favorites', JSON.stringify(validFavorites)).catch(e => 
                console.error('Error al actualizar favoritos filtrados:', e)
              );
            }
          } catch (parseError) {
            console.error('Error parsing favorites data:', parseError);
            if (isMounted) setFavorites([]);
            // Si los datos están corruptos, reiniciamos
            AsyncStorage.setItem('favorites', JSON.stringify([])).catch(e => 
              console.error('Error al reiniciar favoritos corruptos:', e)
            );
          }
        } else if (isMounted) {
          setFavorites([]);
        }
      } catch (error) {
        console.error('Failed to load favorites from storage', error);
        if (isMounted) setFavorites([]);
      }
    };

    loadFavorites();
    
    return () => {
      isMounted = false;
    };
  }, []);  // Save favorites to AsyncStorage whenever they change with mejor manejo de errores
  useEffect(() => {
    // Solo guardar si hay favoritos para conservar
    if (!favorites || favorites.length === 0) return;
    
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (error) {
        console.error('Failed to save favorites to storage', error);
        // No mostramos error al usuario para no interrumpir la experiencia
      }
    };

    saveFavorites();
  }, [favorites]);

  // Add a verse to favorites
  const addFavorite = async (verse: Omit<FavoriteVerse, 'timestamp'>) => {
    const newFavorite: FavoriteVerse = {
      ...verse,
      timestamp: Date.now(),
    };
    
    setFavorites(prev => [newFavorite, ...prev]);
  };

  // Remove a verse from favorites
  const removeFavorite = async (id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id));
  };

  // Check if a verse is in favorites
  const isFavorite = (id: string) => {
    return favorites.some(item => item.id === id);
  };

  // Context value
  const value = {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
};

export default FavoriteContextProvider;