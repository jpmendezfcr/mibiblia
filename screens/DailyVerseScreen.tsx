import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Header, Card, Button } from '../components/StyledComponents';
import Toast from 'react-native-toast-message';
import { useFavorites } from '../context/FavoriteContext';

// Función para obtener fecha formateada
const getFormattedDate = () => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('es-ES', options);
};

export default function DailyVerseScreen() {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetchDailyVerse();
  }, []);

  useEffect(() => {
    if (verse) {
      loadHighlightState();
    }
  }, [verse]);

  const loadHighlightState = async () => {
    try {
      if (!verse) return;
      const key = `highlighted_${verse.book_id}_${verse.chapter}`;
      const savedHighlights = await AsyncStorage.getItem(key);
      if (savedHighlights) {
        const highlights = JSON.parse(savedHighlights);
        setIsHighlighted(!!highlights[verse.verse]);
      }
    } catch (error) {
      console.error('Error loading highlighted state:', error);
    }
  };

  const toggleHighlight = async () => {
    try {
      if (!verse) return;
      
      const key = `highlighted_${verse.book_id}_${verse.chapter}`;
      const savedHighlights = await AsyncStorage.getItem(key);
      let highlights = savedHighlights ? JSON.parse(savedHighlights) : {};
      
      if (highlights[verse.verse]) {
        delete highlights[verse.verse];        Toast.show({
          type: 'success',
          text1: 'Subrayado eliminado'
        });
      } else {        highlights[verse.verse] = '#FFEB3B';  // Color amarillo para destacar
        Toast.show({
          type: 'success',
          text1: 'Versículo subrayado'
        });
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(highlights));
      setIsHighlighted(!isHighlighted);
    } catch (error) {
      console.error('Error toggling highlight:', error);      Toast.show({
        type: 'error',
        text1: 'Error al actualizar el subrayado'
      });
    }
  };

  const toggleFavorite = async () => {
    if (!verse) return;
    
    const verseId = `${verse.book_id}-${verse.chapter}-${verse.verse}`;
    
    if (isFavorite(verseId)) {
      await removeFavorite(verseId);      Toast.show({
        type: 'success',
        text1: 'Eliminado de favoritos'
      });
    } else {
      await addFavorite({
        id: verseId,
        book_id: verse.book_id,
        book_name: verse.book_name,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text
      });      Toast.show({
        type: 'success',
        text1: 'Añadido a favoritos'
      });
    }
  };

  const fetchDailyVerse = async () => {
    // Comprobar si ya tenemos un versículo para hoy
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedVerse = await AsyncStorage.getItem('daily_verse');
      const savedDate = await AsyncStorage.getItem('daily_verse_date');
      
      // Si tenemos uno guardado y es de hoy, usarlo
      if (savedVerse && savedDate === today) {
        setVerse(JSON.parse(savedVerse));
        setLoading(false);
        return;
      }
      
      // De lo contrario, obtener uno nuevo
      setLoading(true);
      
      // Lista de versículos inspiradores
      const inspiringVerses = [
        { book_id: '43', book_name: 'Juan', chapter: '3', verse: '16', abbreviation: 'RV60' },
        { book_id: '19', book_name: 'Salmos', chapter: '23', verse: '1', abbreviation: 'RV60' },
        { book_id: '45', book_name: 'Romanos', chapter: '8', verse: '28', abbreviation: 'RV60' },
        { book_id: '50', book_name: 'Filipenses', chapter: '4', verse: '13', abbreviation: 'RV60' },
        { book_id: '23', book_name: 'Isaías', chapter: '40', verse: '31', abbreviation: 'RV60' },
        { book_id: '24', book_name: 'Jeremías', chapter: '29', verse: '11', abbreviation: 'RV60' },
        { book_id: '19', book_name: 'Salmos', chapter: '46', verse: '1', abbreviation: 'RV60' },
        { book_id: '20', book_name: 'Proverbios', chapter: '3', verse: '5', abbreviation: 'RV60' },
        { book_id: '40', book_name: 'Mateo', chapter: '11', verse: '28', abbreviation: 'RV60' },
        { book_id: '19', book_name: 'Salmos', chapter: '119', verse: '105', abbreviation: 'RV60' }
      ];
      
      // Seleccionar un versículo al azar basado en la fecha
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const selectedVerse = inspiringVerses[dayOfYear % inspiringVerses.length];
      
      // Fetch del versículo completo
      const response = await fetch(
        `https://mibiblia.click/api.php?op=bible&t=${selectedVerse.abbreviation}&b=${selectedVerse.book_id}&c=${selectedVerse.chapter}&v=${selectedVerse.verse}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      const key = Object.keys(data)[0]; // Obtener la clave del primer objeto
      
      if (key && data[key]) {
        const verseData = {
          book_id: selectedVerse.book_id,
          book_name: selectedVerse.book_name,
          chapter: selectedVerse.chapter,
          verse: data[key].verse,
          text: data[key].text,
          reference: `${selectedVerse.book_name} ${selectedVerse.chapter}:${selectedVerse.verse}`,
          date: today
        };
        
        // Guardar para uso futuro
        await AsyncStorage.setItem('daily_verse', JSON.stringify(verseData));
        await AsyncStorage.setItem('daily_verse_date', today);
        
        setVerse(verseData);
      } else {
        throw new Error('Invalid verse data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('No se pudo cargar el versículo del día');
    } finally {
      setLoading(false);
    }
  };

  const shareVerse = async () => {
    if (!verse) return;
    
    try {
      await Share.share({
        message: `Versículo del día: ${verse.reference} - "${verse.text}" #MiBiblia`,
      });
    } catch (error) {      Toast.show({
        type: 'error',
        text1: 'No se pudo compartir el versículo'
      });
    }
  };

  const openInBible = () => {
    if (!verse) return;
    
    navigation.navigate('BibleTab', {
      screen: 'Versicles',
      params: {
        version: '025',
        versionName: 'Reina Valera 1960',
        book: verse.book_id,
        bookName: verse.book_name,
        chapter: verse.chapter,
        chapterNumber: verse.chapter,
        abbreviation: 'RV60',
        useFullVerseAPI: true
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>        <Header
          title={t('dailyVerseTitle')}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.navigate('Books')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primary }]}>Cargando versículo del día...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>        <Header
          title={t('dailyVerseTitle')}
          leftIcon="arrow-back"
          onLeftPress={() => navigation.navigate('Books')}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.error} />          <Text style={[styles.errorText, { color: theme.error }]}>{t('errorText')}</Text>
          <Button 
            title="Reintentar" 
            onPress={fetchDailyVerse} 
            icon="refresh"
          />
        </View>
      </SafeAreaView>
    );
  }

  const isFav = verse ? isFavorite(`${verse.book_id}-${verse.chapter}-${verse.verse}`) : false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>        <Header
          title={t('dailyVerseTitle')}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.navigate('Books')}
        rightIcon="share-outline"
        onRightPress={shareVerse}
      />
      
      <View style={styles.dateContainer}>
        <Text style={[styles.dateText, { color: theme.text }]}>{getFormattedDate()}</Text>
      </View>
      
      <View style={styles.verseImageContainer}>
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}
        
        <Image
          source={{ uri: `https://api.a0.dev/assets/image?text=Biblia ${verse.reference}&aspect=16:9&seed=${verse.chapter+verse.verse}` }}
          style={styles.verseImage}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.verseImageOverlay}
        />
        
        <View style={styles.verseImageTextContainer}>
          <Text style={styles.verseImageText}>
            {verse.reference}
          </Text>
        </View>
      </View>
      
      <Card style={styles.verseCard}>
        <Text style={[
          styles.verseText, 
          { color: theme.text },
          isHighlighted && { backgroundColor: '#FFEB3B' }
        ]}>
          "{verse.text}"
        </Text>
        <Text style={[styles.verseReference, { color: theme.primary }]}>
          {verse.reference}
        </Text>        <View style={styles.verseActions}>
          <TouchableOpacity 
            style={styles.verseActionButton}
            onPress={toggleHighlight}
          >
            <Ionicons 
              name={isHighlighted ? "brush" : "brush-outline"} 
              size={24} 
              color={isHighlighted ? "#FFC107" : theme.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.verseActionButton}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFav ? "heart" : "heart-outline"} 
              size={24} 
              color={isFav ? "#FF5252" : theme.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.verseActionButton}
            onPress={shareVerse}
          >
            <Ionicons 
              name="share-outline" 
              size={24} 
              color={theme.primary} 
            />
          </TouchableOpacity>          <TouchableOpacity 
            style={styles.verseActionButton}
            onPress={() => {
              navigation.navigate('AudioPlayer', {
                bookName: verse ? verse.book_name : '',
                chapter: verse ? verse.chapter : '',
                text: verse ? verse.text : '',
                reference: verse ? verse.reference : '',
                verse: verse ? verse.verse : ''
              });
            }}
          >
            <Ionicons 
              name="musical-note-outline" 
              size={24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
        </View>
      </Card>
      
      <View style={styles.actionsContainer}>
        <Button
          title="Ver en contexto"
          icon="book-outline"
          onPress={openInBible}
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
  },
  dateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  verseImageContainer: {
    height: 200,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  verseImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  verseImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  verseImageTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  verseImageText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  verseCard: {
    margin: 16,
    padding: 20,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 30,
    fontStyle: 'italic',
    marginBottom: 16,
    padding: 6,
    borderRadius: 4,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 16,
  },
  verseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  verseActionButton: {
    padding: 10,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    margin: 8,
  },
});