import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Share, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useFavorites } from '../context/FavoriteContext';

export default function VersiclesScreen() {
  const [versicles, setVersicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVerseDetails, setSelectedVerseDetails] = useState(null);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [highlightedVerses, setHighlightedVerses] = useState({});
  const navigation = useNavigation();
  const route = useRoute();
  const { version, versionName, book, bookName, chapter, chapterNumber } = route.params;
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();  useEffect(() => {
    fetchVersicles();
    loadHighlightedVerses();
    saveReadingHistory();
  }, []);

  // Guardar el historial de lectura
  const saveReadingHistory = async () => {
    try {
      // Crear un ID único para esta entrada de historial
      const historyId = `${book}-${chapter}-${Date.now()}`;
      
      // Crear el objeto de historial
      const historyItem = {
        id: historyId,
        book_id: book,
        book_name: bookName,
        chapter: chapter,
        timestamp: Date.now(),
        lastVerse: null // Se actualizará cuando el usuario lea versículos específicos
      };
      
      // Obtener el historial existente
      const savedHistory = await AsyncStorage.getItem('readingHistory');
      let historyItems = [];
      
      if (savedHistory) {
        historyItems = JSON.parse(savedHistory);
        
        // Verificar si ya existe una entrada para este libro y capítulo
        const existingIndex = historyItems.findIndex(
          item => item.book_id === book && item.chapter === chapter
        );
        
        // Si existe, eliminarla (para actualizarla con la nueva)
        if (existingIndex !== -1) {
          historyItems.splice(existingIndex, 1);
        }
      }
      
      // Añadir la nueva entrada al principio
      historyItems.unshift(historyItem);
      
      // Limitar a las 50 entradas más recientes
      if (historyItems.length > 50) {
        historyItems = historyItems.slice(0, 50);
      }
      
      // Guardar el historial actualizado
      await AsyncStorage.setItem('readingHistory', JSON.stringify(historyItems));
      
      console.log('Historial guardado:', historyItem);
    } catch (error) {
      console.error('Error al guardar el historial:', error);
    }
  };

  // Cargar versículos destacados
  const loadHighlightedVerses = async () => {
    try {
      const key = `highlighted_${book}_${chapter}`;
      const savedHighlights = await AsyncStorage.getItem(key);
      if (savedHighlights) {
        setHighlightedVerses(JSON.parse(savedHighlights));
      }
    } catch (error) {
      console.error('Error loading highlighted verses:', error);
    }
  };

  // Guardar versículos destacados
  const saveHighlightedVerses = async (highlights) => {
    try {
      const key = `highlighted_${book}_${chapter}`;
      await AsyncStorage.setItem(key, JSON.stringify(highlights));
    } catch (error) {
      console.error('Error saving highlighted verses:', error);
    }
  };

  // Alternar el destacado de un versículo
  const toggleHighlight = (verseId) => {
    const newHighlights = { ...highlightedVerses };
    if (newHighlights[verseId]) {
      delete newHighlights[verseId];
    } else {
      newHighlights[verseId] = '#FFEB3B'; // Color amarillo para destacar
    }
    setHighlightedVerses(newHighlights);
    saveHighlightedVerses(newHighlights);
  };  const fetchVersicles = async () => {
    try {
      // Use the full Bible API endpoint when the flag is set
      const useFullVerseAPI = route.params.useFullVerseAPI || false;
      
      // Make sure all parameters have fallback values to prevent PHP warnings
      const bookId = book || '1';
      const chapterId = chapter || '1';
      const abbreviation = route.params.abbreviation || 'RV60';
      
      console.log('Cargando versículos para versión:', abbreviation, 'libro:', bookId, 'capítulo:', chapterId);
      
      const apiEndpoint = useFullVerseAPI 
        ? `https://mibiblia.click/api.php?op=bible&t=${abbreviation}&b=${bookId}&c=${chapterId}&v=`
        : `https://mibiblia.click/api.php?op=versicles&t=${abbreviation}&b=${bookId}&c=${chapterId}`;
      
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      let data = await response.json();
      
      // Handle different API response formats
      if (useFullVerseAPI && typeof data === 'object' && !Array.isArray(data)) {
        // Format for the full Bible API (object with keys like "1-4-1")
        data = Object.keys(data).map(key => ({
          id: data[key].verse || '',
          verse: data[key].verse || '',
          text: data[key].text || "No verse text available" 
        }));
        
        // Sort by verse number
        data.sort((a, b) => {
          const verseA = parseInt(a.verse) || 0;
          const verseB = parseInt(b.verse) || 0;
          return verseA - verseB;
        });
      } else if (Array.isArray(data)) {
        // Format for the versicles API (array of objects with verse numbers)
        data = data.map(item => ({
          id: item.verse || '',
          verse: item.verse || '',
          text: item.text || "The API didn't provide the verse text. Please check another version or try again later."
        }));
      } else if (data && typeof data === 'object') {
        // Handle other object format if needed
        data = Object.keys(data).map(key => ({
          id: data[key].id || key,
          verse: data[key].verse || key,
          text: data[key].text || "The API didn't provide the verse text. Please check another version or try again later."
        }));
      }
      
      setVersicles(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      // Provide sample verses for testing
      const mockVersicles = Array.from({ length: 15 }, (_, i) => ({
        id: String(i + 1),
        verse: String(i + 1),
        text: `Este es un versículo de ejemplo para mostrar cuando la API no está disponible. Podemos seguir probando la aplicación sin conexión.`
      }));
      setVersicles(mockVersicles);
      setError('Using offline data: API connection failed');
      setLoading(false);
    }
  };  const fetchSingleVerse = async (verseNumber) => {
    setLoadingVerse(true);
    try {
      // Ensure all required parameters have fallback values
      const bookId = book || '1';
      const chapterId = chapter || '1';
      const verse = verseNumber || '1';
      const abbreviation = route.params.abbreviation || 'RV60';
      
      console.log('Cargando versículo individual para versión:', abbreviation, 'libro:', bookId, 'capítulo:', chapterId, 'versículo:', verse);
      
      const response = await fetch(
        `https://mibiblia.click/api.php?op=bible&t=${abbreviation}&b=${bookId}&c=${chapterId}&v=${verse}`,
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
      const key = Object.keys(data)[0];
      
      if (key && data[key]) {
        setSelectedVerseDetails({
          verse: data[key].verse,
          text: data[key].text
        });
      } else {
        throw new Error('Invalid verse data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      // Fallback to the verse from the list
      const verseFromList = versicles.find(v => v.verse === verseNumber.toString());
      if (verseFromList) {
        setSelectedVerseDetails({
          verse: verseFromList.verse,
          text: verseFromList.text
        });
      } else {
        toast.error('Failed to load verse details');
      }
    } finally {
      setLoadingVerse(false);
    }
  };  const showVerseDetail = (verse) => {
    setSelectedVerse(verse);
    fetchSingleVerse(verse);
    setModalVisible(true);
    
    // Actualizar el último versículo visto en el historial
    updateLastVerseInHistory(verse);
  };
  
  // Actualizar el último versículo visto en el historial
  const updateLastVerseInHistory = async (verse) => {
    try {
      const savedHistory = await AsyncStorage.getItem('readingHistory');
      if (savedHistory) {
        const historyItems = JSON.parse(savedHistory);
        
        // Buscar la entrada de este libro y capítulo
        const existingIndex = historyItems.findIndex(
          item => item.book_id === book && item.chapter === chapter
        );
        
        // Si existe, actualizar el último versículo visto
        if (existingIndex !== -1) {
          historyItems[existingIndex].lastVerse = verse;
          historyItems[existingIndex].timestamp = Date.now(); // Actualizar la marca de tiempo
          
          // Guardar el historial actualizado
          await AsyncStorage.setItem('readingHistory', JSON.stringify(historyItems));
        }
      }
    } catch (error) {
      console.error('Error al actualizar el último versículo visto:', error);
    }
  };  const toggleFavorite = async (verse) => {
    const verseId = `${book}-${chapter}-${verse.verse}`;
    
    if (isFavorite(verseId)) {
      await removeFavorite(verseId);      Toast.show({
        type: 'success',
        text1: 'Removed from favorites'
      });
    } else {
      await addFavorite({
        id: verseId,
        book_id: book,
        book_name: bookName,
        chapter: chapter,
        verse: verse.verse,
        text: verse.text
      });      Toast.show({
        type: 'success',
        text1: 'Added to favorites'
      });
    }
  };  const shareVersicle = async (verse, text) => {
    try {
      await Share.share({
        message: `${bookName} ${chapterNumber}:${verse} - ${text} (${versionName})`,
      });
    } catch (error) {      Toast.show({
        type: 'error',
        text1: 'Error al compartir versículo'
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity            onPress={() => navigation.navigate('Chapters', { 
              version, 
              versionName, 
              book, 
              bookName,
              abbreviation: route.params.abbreviation 
            })} style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`${bookName} ${chapterNumber}`}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6a51ae" />
          <Text style={styles.loadingText}>Loading verses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity            onPress={() => navigation.navigate('Chapters', { 
              version, 
              versionName, 
              book, 
              bookName,
              abbreviation: route.params.abbreviation 
            })} style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`${bookName} ${chapterNumber}`}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchVersicles}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Chapters', { 
            version, 
            versionName, 
            book, 
            bookName,
            abbreviation: route.params.abbreviation 
          })} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{`${bookName} ${chapterNumber}`}</Text>        
        <TouchableOpacity 
          onPress={() => navigation.navigate('Search', { 
            version, 
            versionName,
            abbreviation: route.params.abbreviation
          })}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>      <FlatList
        data={versicles}
        keyExtractor={(item, index) => (item.id || index).toString()}
        renderItem={({ item }) => {
          const verseId = `${book}-${chapter}-${item.verse}`;
          const isHighlighted = highlightedVerses[item.verse];
          const isFav = isFavorite(verseId);
          
          return (
            <TouchableOpacity 
              style={styles.versicleContainer}
              onPress={() => showVerseDetail(item.verse)}
            >
              <Text style={styles.versicleNumber}>{item.verse}</Text>
              <View style={[
                styles.versicleTextContainer,
                isHighlighted && { backgroundColor: '#FFFDE7' }
              ]}>
                <Text style={[
                  styles.versicleText,
                  isHighlighted && { backgroundColor: '#FFEB3B' }
                ]}>
                  {item.text}
                </Text>              <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleHighlight(item.verse);
                    }}
                  >
                    <Ionicons 
                      name={isHighlighted ? "brush" : "brush-outline"} 
                      size={20} 
                      color={isHighlighted ? "#FFC107" : "#6a51ae"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item);
                    }}
                  >
                    <Ionicons 
                      name={isFav ? "heart" : "heart-outline"} 
                      size={20} 
                      color={isFav ? "#FF5252" : "#6a51ae"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      shareVersicle(item.verse, item.text);
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="#6a51ae" />
                  </TouchableOpacity>                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('AudioPlayer', {
                        bookName,
                        chapter,
                        text: item.text,
                        reference: `${bookName} ${chapter}:${item.verse}`
                      });
                    }}
                  >
                    <Ionicons name="musical-note-outline" size={20} color="#6a51ae" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
      />

      {/* Detailed Verse Modal */}      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {loadingVerse ? (
              <ActivityIndicator size="large" color="#6a51ae" />
            ) : selectedVerseDetails ? (
              <View style={styles.detailedVerseContainer}>
                <View style={styles.detailedVerseHeader}>
                  <Text style={styles.detailedVerseReference}>
                    {`${bookName} ${chapterNumber}:${selectedVerseDetails.verse}`}
                  </Text>                  <View style={styles.detailedActionButtons}>
                    {/* Botón para subrayar */}
                    <TouchableOpacity 
                      onPress={() => toggleHighlight(selectedVerseDetails.verse)}
                      style={styles.detailedActionButton}
                    >
                      <Ionicons 
                        name={highlightedVerses[selectedVerseDetails.verse] ? "brush" : "brush-outline"} 
                        size={24} 
                        color={highlightedVerses[selectedVerseDetails.verse] ? "#FFC107" : "#6a51ae"} 
                      />
                    </TouchableOpacity>
                    
                    {/* Botón para favoritos */}
                    <TouchableOpacity 
                      onPress={() => toggleFavorite(selectedVerseDetails)}
                      style={styles.detailedActionButton}
                    >
                      <Ionicons 
                        name={isFavorite(`${book}-${chapter}-${selectedVerseDetails.verse}`) ? "heart" : "heart-outline"} 
                        size={24} 
                        color={isFavorite(`${book}-${chapter}-${selectedVerseDetails.verse}`) ? "#FF5252" : "#6a51ae"} 
                      />
                    </TouchableOpacity>
                    
                    {/* Botón para compartir */}
                    <TouchableOpacity 
                      onPress={() => shareVersicle(selectedVerseDetails.verse, selectedVerseDetails.text)}
                      style={styles.detailedActionButton}
                    >
                      <Ionicons name="share-outline" size={24} color="#6a51ae" />
                    </TouchableOpacity>
                    
                    {/* Botón para reproducir audio */}                    <TouchableOpacity 
                      onPress={() => {
                        setModalVisible(false);
                        navigation.navigate('AudioPlayer', {
                          bookName,
                          chapter,
                          text: selectedVerseDetails.text,
                          reference: `${bookName} ${chapterNumber}:${selectedVerseDetails.verse}`,
                          verse: selectedVerseDetails.verse
                        });
                      }}
                      style={styles.detailedActionButton}
                    >
                      <Ionicons name="musical-note-outline" size={24} color="#6a51ae" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[
                  styles.detailedVerseText,
                  highlightedVerses[selectedVerseDetails.verse] && { backgroundColor: '#FFEB3B' }
                ]}>
                  {selectedVerseDetails.text}
                </Text>
              </View>
            ) : (
              <Text>No verse data available</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#6a51ae',
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
  list: {
    padding: 16,
  },
  versicleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  versicleNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a51ae',
    width: 30,
    marginRight: 8,
  },
  versicleTextContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  versicleText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionButton: {
    padding: 6,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6a51ae',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6a51ae',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
    backgroundColor: 'white',
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
    borderBottomColor: '#eaeaea',
  },
  detailedVerseReference: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6a51ae',
    flex: 1,
  },
  detailedActionButtons: {
    flexDirection: 'row',
  },
  detailedActionButton: {
    padding: 6,
    marginLeft: 8,
  },
  detailedVerseText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#333',
    padding: 8,
    borderRadius: 4,
  },
});