import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ChaptersScreen() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { version, versionName, book, bookName } = route.params;

  useEffect(() => {
    fetchChapters();
  }, []);  const fetchChapters = async () => {
    try {
      // Ensure all required parameters are present
      const bookId = book || '1';
      const abbreviation = route.params.abbreviation || 'RV60';
      console.log('Cargando capítulos para versión:', abbreviation, 'libro:', bookId);
      
      const response = await fetch(`https://mibiblia.click/api.php?op=chapters&t=${abbreviation}&b=${bookId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      let data = await response.json();      // Transform the data to the expected format
      // The API returns [{"chapter":"1"}, {"chapter":"2"}, ...] format
      const formattedData = Array.isArray(data) 
        ? data.map(item => ({
            id: item.chapter || '',
            number: item.chapter || ''
          }))
        : [];
      
      setChapters(formattedData);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      // Provide sample chapters for testing
      const mockChapters = Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        number: String(i + 1)
      }));
      setChapters(mockChapters);
      setError('Using offline data: API connection failed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity          onPress={() => navigation.navigate('Books', { 
            version, 
            versionName,
            abbreviation: route.params.abbreviation 
          })} style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{bookName}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6a51ae" />
          <Text style={styles.loadingText}>Loading chapters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity          onPress={() => navigation.navigate('Books', { 
            version, 
            versionName,
            abbreviation: route.params.abbreviation 
          })} style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{bookName}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChapters}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity          onPress={() => navigation.navigate('Books', { 
            version, 
            versionName,
            abbreviation: route.params.abbreviation 
          })} style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{bookName}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={chapters}        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        numColumns={4}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chapterCard}          onPress={() => {
            // Navigate to Versicles screen with the updated API endpoint that includes full verse text
            navigation.navigate('Versicles', { 
              version, 
              versionName, 
              book, 
              bookName, 
              chapter: item.id,
              chapterNumber: item.number,
              abbreviation: route.params.abbreviation,
              useFullVerseAPI: true // Flag to use the API that returns complete verse text
            })
          }}
          >
            <Text style={styles.chapterNumber}>{item.number}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
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
  chapterCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '22%',
    aspectRatio: 1,
    margin: '1.5%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chapterNumber: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6a51ae',
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
});