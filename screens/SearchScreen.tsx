import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Keyboard, Modal, Pressable, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavorites } from '../context/FavoriteContext';
import { useTheme } from '../context/ThemeContext';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [highlightedVerses, setHighlightedVerses] = useState({});
  const navigation = useNavigation();
  const route = useRoute();
  const { version, versionName } = route.params;
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { theme, isDark } = useTheme();
  
  const getAbbreviation = () => {
    return route.params.abbreviation;
  };
  
  useEffect(() => {
    if (selectedVerse) {
      loadHighlightState(selectedVerse);
    }
  }, [selectedVerse]);

  const loadHighlightState = async (verse) => {
    try {
      if (!verse) return;
      const key = `highlighted_${verse.book_id}_${verse.chapter}`;
      const savedHighlights = await AsyncStorage.getItem(key);
      if (savedHighlights) {
        const highlights = JSON.parse(savedHighlights);
        setIsHighlighted(!!highlights[verse.verse]);
        setHighlightedVerses(highlights);
      }
    } catch (error) {
      console.error('Error loading highlighted state:', error);
    }
  };

  const toggleHighlight = async () => {
    try {
      if (!selectedVerse) return;
      
      const key = `highlighted_${selectedVerse.book_id}_${selectedVerse.chapter}`;
      const savedHighlights = await AsyncStorage.getItem(key);
      let highlights = savedHighlights ? JSON.parse(savedHighlights) : {};      if (highlights[selectedVerse.verse]) {
        delete highlights[selectedVerse.verse];
        Toast.show({
          type: 'success',
          text1: 'Subrayado eliminado'
        });
      } else {
        highlights[selectedVerse.verse] = '#FFEB3B';  // Color amarillo para destacar
        Toast.show({
          type: 'success',
          text1: 'Versículo subrayado'
        });
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(highlights));
      setHighlightedVerses(highlights);
      setIsHighlighted(!isHighlighted);
    } catch (error) {
      console.error('Error toggling highlight:', error);      Toast.show({
        type: 'error',
        text1: 'Error al actualizar el subrayado'
      });
    }
  };

  const toggleFavorite = async () => {
    if (!selectedVerse) return;
    
    const verseId = `${selectedVerse.book_id}-${selectedVerse.chapter}-${selectedVerse.verse}`;    if (isFavorite(verseId)) {
      await removeFavorite(verseId);
      Toast.show({
        type: 'success',
        text1: 'Eliminado de favoritos'
      });
    } else {
      await addFavorite({
        id: verseId,
        book_id: selectedVerse.book_id,
        book_name: selectedVerse.book_name,
        chapter: selectedVerse.chapter,
        verse: selectedVerse.verse,
        text: selectedVerse.text
      });
      Toast.show({
        type: 'success',
        text1: 'Añadido a favoritos'
      });
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    Keyboard.dismiss();

    try {
      // Create form data for POST parameters
      const formData = new FormData();      const abbreviation = getAbbreviation() || 'RV60';
      console.log('Realizando búsqueda en versión:', abbreviation);
      
      formData.append('t', abbreviation);
      formData.append('b', '');
      formData.append('c', '');
      formData.append('q', searchQuery.trim());
      
      const url = 'https://mibiblia.click/api.php?op=search';
      console.log('Search URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the API response to an array format for FlatList
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const formattedResults = Object.keys(data).map(key => {
          const parts = key.split('-');
          return {
            id: key,
            book_id: data[key].book || parts[0],
            chapter: data[key].chapter || parts[1],
            verse: data[key].verse || parts[2],
            text: data[key].text || 'No text available',
            book_name: data[key].bookname || 'Unknown book'
          };
        });
        setSearchResults(formattedResults);
      } else if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Search error:', err);
      // Provide sample search results
      const mockResults = [
        { 
          id: '1-1-1',
          book_id: '1', 
          book_name: 'Génesis', 
          chapter: '1', 
          verse: '1', 
          text: `En el principio creó Dios los cielos y la tierra. (Resultado de ejemplo para "${searchQuery}")` 
        },
        { 
          id: '43-3-16',
          book_id: '43', 
          book_name: 'Juan', 
          chapter: '3', 
          verse: '16', 
          text: `Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito. (Resultado de ejemplo para "${searchQuery}")` 
        }
      ];
      setSearchResults(mockResults);
      setError('Using sample results: API connection failed');
      setLoading(false);
    }
  };

  const shareVerse = async () => {
    if (!selectedVerse) return;
    
    try {
      await Share.share({
        message: `${selectedVerse.book_name} ${selectedVerse.chapter}:${selectedVerse.verse} - ${selectedVerse.text} (RV60)`,
      });    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'No se pudo compartir el versículo'
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>        
        <TouchableOpacity 
          onPress={() => navigation.navigate('Books', { 
            version, 
            versionName,
            abbreviation: route.params.abbreviation 
          })} 
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar en la Biblia</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TextInput
          style={[styles.searchInput, { 
            borderColor: theme.border, 
            backgroundColor: isDark ? '#333333' : '#f8f8f8',
            color: theme.text
          }]}
          placeholder="Ingresa términos de búsqueda..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: theme.primary }]} 
          onPress={performSearch}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primary }]}>Buscando...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]} 
            onPress={performSearch}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : hasSearched && searchResults.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={64} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.noResultsText, { color: theme.text }]}>No se encontraron resultados</Text>
          <Text style={[styles.noResultsSubtext, { color: theme.textSecondary }]}>Prueba con diferentes términos de búsqueda</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => item.id || `${item.book_id}-${item.chapter}-${item.verse}-${index}`}
          renderItem={({ item }) => {
            const isVerseHighlighted = highlightedVerses[item.verse];
            return (
              <TouchableOpacity
                style={[
                  styles.resultCard, 
                  { 
                    backgroundColor: theme.card,
                    shadowColor: isDark ? '#000' : '#000'
                  },
                  isVerseHighlighted && { backgroundColor: '#FFFDE7' }
                ]}
                onPress={() => {
                  setSelectedVerse(item);
                  setModalVisible(true);
                }}
              >
                <Text style={[styles.resultReference, { color: theme.primary }]}>
                  {`${item.book_name} ${item.chapter}:${item.verse}`}
                </Text>
                <Text style={[
                  styles.resultText, 
                  { color: theme.text },
                  isVerseHighlighted && { backgroundColor: '#FFEB3B' }
                ]}>
                  {item.text}
                </Text>
                <View style={styles.resultActions}>                    <TouchableOpacity 
                      style={styles.resultActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedVerse(item);
                        toggleHighlight();
                      }}
                    >
                      <Ionicons 
                        name={isVerseHighlighted ? "brush" : "brush-outline"} 
                        size={20} 
                        color={isVerseHighlighted ? "#FFC107" : theme.primary} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.resultActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedVerse(item);
                        toggleFavorite();
                      }}
                    >
                      <Ionicons 
                        name={isFavorite(`${item.book_id}-${item.chapter}-${item.verse}`) ? "heart" : "heart-outline"} 
                        size={20} 
                        color={isFavorite(`${item.book_id}-${item.chapter}-${item.verse}`) ? "#FF5252" : theme.primary} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.resultActionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        Share.share({
                          message: `${item.book_name} ${item.chapter}:${item.verse} - ${item.text} (RV60)`,
                        });
                      }}
                    >
                      <Ionicons name="share-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>                    {/* Botón de música MP3 eliminado */}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
      
      {/* Verse Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View 
            style={[
              styles.modalContent, 
              { backgroundColor: theme.card }
            ]} 
            onStartShouldSetResponder={() => true}
          >
            {selectedVerse && (
              <View style={styles.detailedVerseContainer}>
                <View style={[styles.detailedVerseHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailedVerseReference, { color: theme.primary }]}>
                    {`${selectedVerse.book_name} ${selectedVerse.chapter}:${selectedVerse.verse}`}
                  </Text>
                  
                  <View style={styles.actionButtons}>                    <TouchableOpacity 
                      onPress={toggleHighlight}
                      style={styles.actionButton}
                    >
                      <Ionicons 
                        name={isHighlighted ? "brush" : "brush-outline"} 
                        size={24} 
                        color={isHighlighted ? "#FFC107" : theme.primary} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={toggleFavorite}
                      style={styles.actionButton}
                    >
                      <Ionicons 
                        name={isFavorite(`${selectedVerse.book_id}-${selectedVerse.chapter}-${selectedVerse.verse}`) ? "heart" : "heart-outline"} 
                        size={24} 
                        color={isFavorite(`${selectedVerse.book_id}-${selectedVerse.chapter}-${selectedVerse.verse}`) ? "#FF5252" : theme.primary} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={shareVerse}
                      style={styles.actionButton}
                    >
                      <Ionicons name="share-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>                    <TouchableOpacity 
                      onPress={() => {
                        setModalVisible(false);
                        navigation.navigate('AudioPlayer', {
                          bookName: selectedVerse.book_name,
                          chapter: selectedVerse.chapter,
                          text: selectedVerse.text,
                          reference: `${selectedVerse.book_name} ${selectedVerse.chapter}:${selectedVerse.verse}`,
                          verse: selectedVerse.verse
                        });
                      }}
                      style={styles.actionButton}
                    >
                      <Ionicons name="musical-note-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={[
                  styles.detailedVerseText, 
                  { color: theme.text },
                  isHighlighted && { backgroundColor: '#FFEB3B' }
                ]}>
                  {selectedVerse.text}
                </Text>
                
                <TouchableOpacity
                  style={[styles.viewInContextButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('Versicles', {
                      version,
                      versionName,
                      book: selectedVerse.book_id,
                      bookName: selectedVerse.book_name,
                      chapter: selectedVerse.chapter,
                      chapterNumber: selectedVerse.chapter,
                      abbreviation: route.params.abbreviation,
                      useFullVerseAPI: true
                    });
                  }}
                >
                  <Text style={styles.viewInContextButtonText}>Ver en contexto</Text>
                  <Ionicons name="book-outline" size={18} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  resultCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultReference: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    padding: 4,
    borderRadius: 4,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  resultActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 16,
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailedVerseContainer: {
    width: '100%',
  },
  detailedVerseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  detailedVerseReference: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  detailedVerseText: {
    fontSize: 20,
    lineHeight: 30,
    padding: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 6,
  },
  viewInContextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  viewInContextButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
});