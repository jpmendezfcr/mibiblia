import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function BooksScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { version, versionName, abbreviation } = route.params;

  useEffect(() => {
    fetchBooks();
  }, []);  const fetchBooks = async () => {
    try {
      // Usar la abreviación de la versión seleccionada en lugar de hardcodear RV60
      const abbreviation = route.params.abbreviation || 'RV60';
      console.log('Cargando libros para versión:', abbreviation);
      
      const response = await fetch(`https://mibiblia.click/api.php?op=books&t=${abbreviation}`, {
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
      
      // Check if the response is an object and convert to array if needed
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = Object.keys(data).map(key => ({
          id: data[key].id,
          name: data[key].name
        }));
      }
      
      setBooks(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      // Provide sample data for testing when API fails
      const mockBooks = [
        { id: '1', name: 'Génesis' },
        { id: '2', name: 'Éxodo' },
        { id: '3', name: 'Levítico' },
        { id: '4', name: 'Números' },
        { id: '5', name: 'Deuteronomio' }
      ];
      setBooks(mockBooks);
      setError('Using offline data: API connection failed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>        <TouchableOpacity 
          onPress={() => navigation.navigate('Search', { 
            version, 
            versionName,
            abbreviation: route.params.abbreviation 
          })} 
          style={styles.backButton}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>{versionName}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6a51ae" />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>        <TouchableOpacity 
          onPress={() => navigation.navigate('Search', { 
            version, 
            versionName,
            abbreviation: route.params.abbreviation 
          })} 
          style={styles.backButton}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
          <Text style={styles.headerTitle}>{versionName}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBooks}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>        <TouchableOpacity 
          onPress={() => navigation.navigate('Search', { 
            version, 
            versionName,
            abbreviation: route.params.abbreviation 
          })} 
          style={styles.backButton}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{versionName}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={books}        keyExtractor={(item) => (item.id || '').toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookCard}          onPress={() => navigation.navigate('Chapters', { 
              version, 
              versionName, 
              book: item.id, 
              bookName: item.name,
              abbreviation: route.params.abbreviation
            })}
          >
            <Text style={styles.bookName}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={24} color="#6a51ae" />
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
  bookCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookName: {
    fontSize: 18,
    fontWeight: '500',
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