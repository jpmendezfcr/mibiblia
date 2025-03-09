import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';

type Song = {
  id: number;
  titulo: string;
  autor: string;
  ritmo: string;
  palabras_clave: string;
  url: string;
};

export default function MusicPlayerScreen() {
  const { theme, isDark } = useTheme();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterField, setFilterField] = useState<"titulo" | "autor" | "ritmo" | "palabra" | "">("");
  const [sound, setSound] = useState(null);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);

  useEffect(() => {
    fetchSongs();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [searchQuery, filterField]);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      let url = "https://mibiblia.click/apimp3.php";
      if (searchQuery.trim() && filterField) {
        // Encode query parameters
        const params = new URLSearchParams();
        params.append(filterField, searchQuery.trim());
        // For fields 'titulo' or 'autor' you might want to limit results.
        if (filterField === "titulo" || filterField === "autor") {
          params.append("cantidad", filterField === "titulo" ? "5" : "10");
        }
        url += "?" + params.toString();
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: Song[] = await response.json();
      setSongs(data);
    } catch (err: any) {
      console.error("Error fetching songs:", err);
      Toast.show({
        type: 'error',
        text1: 'Error al cargar canciones',
        text2: err.message || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const playSong = async (song: Song) => {
    try {
      if (sound) {
        // If a song is already playing, stop it first.
        await sound.unloadAsync();
        setSound(null);
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.url },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingSongId(song.id);
    } catch (err: any) {
      console.error("Error playing song:", err);
      Toast.show({
        type: 'error',
        text1: 'Error al reproducir la canción',
        text2: err.message || ''
      });
    }
  };

  const renderSong = ({ item }: { item: Song }) => (
    <TouchableOpacity style={[styles.songCard, { backgroundColor: theme.card }]} onPress={() => playSong(item)}>
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: theme.text }]} numberOfLines={1}>{item.titulo}</Text>
        <Text style={[styles.songAuthor, { color: theme.textSecondary }]} numberOfLines={1}>{item.autor}</Text>
        <Text style={[styles.songRitmo, { color: theme.textSecondary }]} numberOfLines={1}>{item.ritmo}</Text>
      </View>
      {playingSongId === item.id ? (
        <Ionicons name="pause-circle" size={28} color={theme.primary} />
      ) : (
        <Ionicons name="play-circle" size={28} color={theme.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>Música MP3</Text>
      </View>
      <View style={[styles.searchContainer, { borderColor: theme.border }]}>
        <TextInput
          style={[styles.searchInput, { color: theme.text, backgroundColor: isDark ? '#333' : '#f8f8f8' }]}
          placeholder="Buscar..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.filterButtons}>
          {[
            { field: "titulo", label: "Título" },
            { field: "autor", label: "Autor" },
            { field: "ritmo", label: "Ritmo" },
            { field: "palabra", label: "Palabra clave" },
          ].map(option => (
            <TouchableOpacity
              key={option.field}
              style={[
                styles.filterButton,
                filterField === option.field && { backgroundColor: theme.primary }
              ]}
              onPress={() => setFilterField(filterField === option.field ? "" : option.field as any)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterField === option.field ? 'white' : theme.text }
              ]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primary }]}>Cargando canciones...</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSong}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-note-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No se encontraron canciones</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'column',
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  songAuthor: {
    fontSize: 14,
    marginTop: 2,
  },
  songRitmo: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 8,
  },
});