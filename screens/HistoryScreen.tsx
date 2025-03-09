import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Header, Card, Button } from '../components/StyledComponents';
import { FadeInView } from '../components/AnimatedComponents';

export type HistoryItem = {
  id: string;
  book_id: string;
  book_name: string;
  chapter: string;
  timestamp: number;
  lastVerse?: string;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const savedHistory = await AsyncStorage.getItem('readingHistory');
      
      if (savedHistory) {
        console.log('Historial cargado:', JSON.parse(savedHistory).length, 'elementos');
        const parsedHistory = JSON.parse(savedHistory);
        // Sort by most recent first
        parsedHistory.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp);
        setHistory(parsedHistory);
      } else {
        console.log('No se encontró historial guardado');
        setHistory([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      setLoading(false);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      'Borrar historial',
      '¿Estás seguro de que deseas borrar todo el historial de lectura?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('readingHistory');
              setHistory([]);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if the date is today
    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    // Check if the date is yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    // For other dates
    else {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
  };

  const navigateToChapter = (item: HistoryItem) => {
    navigation.navigate('BibleTab', {
      screen: 'Versicles',
      params: {
        version: '025',
        versionName: 'Reina Valera 1960',
        book: item.book_id,
        bookName: item.book_name,
        chapter: item.chapter,
        chapterNumber: item.chapter,
        abbreviation: 'RV60',
        useFullVerseAPI: true
      }
    });
  };

  const groupHistoryByDate = () => {
    const grouped: {[key: string]: HistoryItem[]} = {};
    
    history.forEach(item => {
      const date = new Date(item.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    return Object.entries(grouped).map(([date, items]) => ({
      date,
      data: items,
    }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Historial de Lectura"
        leftIcon="arrow-back"
        rightIcon={history.length > 0 ? "trash-outline" : undefined}
        onLeftPress={() => navigation.navigate('Books')}
        onRightPress={history.length > 0 ? clearHistory : undefined}
      />

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="time-outline" 
            size={80} 
            color={isDark ? theme.border : '#ddd'} 
          />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            No hay historial de lectura
          </Text>
          <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
            Tu historial de lectura se mostrará aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupHistoryByDate()}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item, index }) => (
            <View style={styles.dateGroup}>
              <Text style={[styles.dateHeader, { color: theme.textSecondary }]}>
                {new Date(item.date).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              
              {item.data.map((historyItem, itemIndex) => (
                <FadeInView key={historyItem.id} index={itemIndex}>
                  <Card 
                    onPress={() => navigateToChapter(historyItem)}
                    style={styles.historyCard}
                  >
                    <View style={styles.historyCardContent}>
                      <View style={styles.historyInfo}>
                        <Text style={[styles.historyBookName, { color: theme.text }]}>
                          {historyItem.book_name} {historyItem.chapter}
                        </Text>
                        <Text style={[styles.historyTime, { color: theme.textSecondary }]}>
                          {formatDate(historyItem.timestamp)}
                        </Text>
                        
                        {historyItem.lastVerse && (
                          <View style={[styles.lastVerseBadge, { backgroundColor: theme.primaryLight + '30' }]}>
                            <Text style={[styles.lastVerseText, { color: theme.primary }]}>
                              Último: Versículo {historyItem.lastVerse}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Ionicons 
                        name="chevron-forward" 
                        size={20} 
                        color={theme.primary} 
                      />
                    </View>
                  </Card>
                </FadeInView>
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    paddingHorizontal: 8,
    textTransform: 'capitalize',
  },
  historyCard: {
    marginBottom: 8,
    padding: 12,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyInfo: {
    flex: 1,
  },
  historyBookName: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 13,
    marginTop: 2,
  },
  lastVerseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  lastVerseText: {
    fontSize: 12,
    fontWeight: '500',
  },
});