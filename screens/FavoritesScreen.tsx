import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites, FavoriteVerse } from '../context/FavoriteContext';
import Toast from 'react-native-toast-message';

export default function FavoritesScreen() {
  const { favorites, removeFavorite, isFavorite } = useFavorites();
  const [selectedVerse, setSelectedVerse] = useState<FavoriteVerse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleRemoveFavorite = async (id: string) => {
    await removeFavorite(id);    Toast.show({
      type: 'success',
      text1: 'Verse removed from favorites'
    });
  };

  const shareVerse = async (verse: FavoriteVerse) => {
    try {
      await Share.share({
        message: `${verse.book_name} ${verse.chapter}:${verse.verse} - ${verse.text} (RV60)`,
      });
    } catch (error) {      Toast.show({
        type: 'error',
        text1: 'Could not share verse'
      });
    }
  };

  const viewVerseDetail = (verse: FavoriteVerse) => {
    setSelectedVerse(verse);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorite Verses</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#ddd" />
          <Text style={styles.emptyText}>No favorite verses yet</Text>
          <Text style={styles.emptySubText}>
            Add verses to your favorites by tapping the heart icon when reading
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.favoriteCard}
              onPress={() => viewVerseDetail(item)}
            >
              <View style={styles.favoriteHeader}>
                <Text style={styles.favoriteReference}>
                  {`${item.book_name} ${item.chapter}:${item.verse}`}
                </Text>
                <Text style={styles.favoriteDate}>{formatDate(item.timestamp)}</Text>
              </View>
              <Text
                style={styles.favoriteText}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {item.text}
              </Text>              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => shareVerse(item)}
                >
                  <Ionicons name="share-outline" size={20} color="#6a51ae" />
                </TouchableOpacity>                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('BibleTab', { screen: 'AudioPlayer', params: {
                      bookName: item.book_name,
                      chapter: item.chapter,
                      text: item.text,
                      reference: `${item.book_name} ${item.chapter}:${item.verse}`,
                      verse: item.verse
                    }})}
                  >
                    <Ionicons name="musical-note-outline" size={20} color="#6a51ae" />
                  </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemoveFavorite(item.id)}
                >
                  <Ionicons name="heart-dislike-outline" size={20} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
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
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {selectedVerse && (
              <View style={styles.detailedVerseContainer}>                <View style={styles.detailedVerseHeader}>
                  <Text style={styles.detailedVerseReference}>
                    {`${selectedVerse.book_name} ${selectedVerse.chapter}:${selectedVerse.verse}`}
                  </Text>
                  <View style={styles.modalActionButtons}>
                    <TouchableOpacity
                      onPress={() => shareVerse(selectedVerse)}
                      style={styles.modalActionButton}
                    >
                      <Ionicons name="share-outline" size={24} color="#6a51ae" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setModalVisible(false);
                        navigation.navigate('BibleTab', {
                          screen: 'Versicles',
                          params: {
                            version: '025',
                            versionName: 'Reina Valera 1960',
                            book: selectedVerse.book_id,
                            bookName: selectedVerse.book_name,
                            chapter: selectedVerse.chapter,
                            chapterNumber: selectedVerse.chapter,
                            abbreviation: 'RV60',
                            useFullVerseAPI: true
                          }
                        });
                      }}
                      style={styles.modalActionButton}
                    >
                      <Ionicons name="book-outline" size={24} color="#6a51ae" />
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
                      style={styles.modalActionButton}
                    >
                      <Ionicons name="musical-note-outline" size={24} color="#6a51ae" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        handleRemoveFavorite(selectedVerse.id);
                        setModalVisible(false);
                      }}
                      style={styles.modalActionButton}
                    >
                      <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.detailedVerseText}>{selectedVerse.text}</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#6a51ae',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  favoriteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteReference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a51ae',
  },
  favoriteDate: {
    fontSize: 12,
    color: '#999',
  },
  favoriteText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 6,
    marginLeft: 16,
  },
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
  detailedVerseText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#333',
  },
  modalActionButtons: {
    flexDirection: 'row',
  },
  modalActionButton: {
    padding: 6,
    marginLeft: 10,
  },
});