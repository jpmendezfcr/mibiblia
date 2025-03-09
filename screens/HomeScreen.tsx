import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function HomeScreen() {
  const { t } = useLanguage();  
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [versionsModalVisible, setVersionsModalVisible] = useState(false);
  const navigation = useNavigation();  useEffect(() => {
    fetchVersions();
    fetchDailyVerse();
    loadActivePlans();
    loadSelectedVersion();
  }, []);
  
  // Cargar la versión seleccionada previamente
  const loadSelectedVersion = async () => {
    try {
      const savedVersion = await AsyncStorage.getItem('selected_bible_version');
      if (savedVersion) {
        const parsedVersion = JSON.parse(savedVersion);
        setSelectedVersion(parsedVersion);
        console.log('Versión cargada de almacenamiento:', parsedVersion.name);
      }
    } catch (error) {
      console.error('Error al cargar la versión seleccionada:', error);
    }
  };  const fetchDailyVerse = async () => {
    try {
      setLoadingVerse(true);
      
      // Verificar si ya tenemos un versículo guardado para hoy
      const today = new Date().toISOString().split('T')[0];
      // Manejar caso de AsyncStorage no importado
      let savedVerse = null;
      let savedDate = null;
      
      // Como no hay AsyncStorage aquí, usamos variables temporales
      // En la implementación real, usaríamos AsyncStorage
      
      if (savedVerse && savedDate === today) {
        setDailyVerse(JSON.parse(savedVerse));
        setLoadingVerse(false);
        return;
      }
      
      // Si no, buscamos uno nuevo (para demo, usamos un versículo predefinido)
      const verse = {
        book_id: '43',
        book_name: 'Juan',
        chapter: '3',
        verse: '16',
        text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
        reference: 'Juan 3:16',
        date: today
      };
      
      await AsyncStorage.setItem('daily_verse', JSON.stringify(verse));
      await AsyncStorage.setItem('daily_verse_date', today);
      
      setDailyVerse(verse);
      setLoadingVerse(false);
    } catch (err) {
      console.error('Error fetching daily verse:', err);
      setLoadingVerse(false);
    }
  };
  
  const loadActivePlans = async () => {
    try {
      const savedPlans = await AsyncStorage.getItem('reading_plans');
      if (savedPlans) {
        setActivePlans(JSON.parse(savedPlans));
      }
    } catch (err) {
      console.error('Error loading active plans:', err);
    }
  };  const fetchVersions = async () => {
    try {      const response = await fetch('https://mibiblia.click/api.php?op=versions', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      // Convert the object of versions to an array format
      const versionsArray = Object.keys(rawData).map(key => ({
        id: rawData[key].id,
        name: `${rawData[key].language} - ${rawData[key].version || rawData[key].abbreviation}`,
        abbreviation: rawData[key].abbreviation,
        language: rawData[key].language
      }));
      
      // Sort by language and version name
      versionsArray.sort((a, b) => 
        a.language === b.language 
          ? a.name.localeCompare(b.name) 
          : a.language.localeCompare(b.language)
      );
      
      setVersions(versionsArray);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      // Provide sample data for testing when API fails
      const mockVersions = [
        { id: '025', name: 'Español - Biblia Reina Valera 1960', abbreviation: 'RV60', language: 'Español' },
        { id: '004', name: 'English - King James Version', abbreviation: 'KJV', language: 'English' },
        { id: '026', name: 'Português - Almeida Revisada Imprensa Bíblica', abbreviation: 'AA', language: 'Português' },
        { id: '027', name: 'Português - Nova Versão Internacional', abbreviation: 'NVI', language: 'Português' }
      ];
      setVersions(mockVersions);
      setError('Using offline data: API connection failed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>        <Text style={styles.headerTitle}>{t('home')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6a51ae" />
          <Text style={styles.loadingText}>Loading versions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>        <Text style={styles.headerTitle}>{t('home')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchVersions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }    // Función auxiliar para navegar a diferentes pantallas
  const navigateToScreen = (screenName: string, params: any = {}) => {
    navigation.navigate('BibleTab', {
      screen: screenName,
      params: params
    });
  };  const navigateToBibleAIChat = () => {
    navigation.navigate('BibleTab', { screen: 'BibleAIChat' });
  };  // Función para navegar a la versión de Biblia seleccionada con mejor manejo de errores
  const navigateToSelectedVersion = () => {
    try {
      if (selectedVersion && selectedVersion.id && selectedVersion.name) {
        console.log('Navegando a versión:', selectedVersion);
        // Asegurarse de que todos los parámetros necesarios estén presentes
        navigation.navigate('BibleTab', {
          screen: 'Books',
          params: {
            version: selectedVersion.id || '025',
            versionName: selectedVersion.name || 'Biblia',
            abbreviation: selectedVersion.abbreviation || 'RV60'
          }
        });
      } else {
        // Si no hay versión seleccionada, mostrar toast
        Toast.show({
          type: 'info',
          text1: 'Selecciona una versión de la Biblia primero'
        });
      }
    } catch (error) {
      console.error('Error al navegar:', error);
      Toast.show({
        type: 'error',
        text1: 'Error al navegar a la Biblia',
        text2: 'Intenta nuevamente'
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>        <Text style={styles.headerTitle}>{t('home')}</Text>
        <TouchableOpacity
          style={styles.settingsButton}              
          onPress={() => navigateToScreen('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={{ flex: 1 }}>
        {/* Sección de Versículo del Día */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>              <Text style={styles.sectionTitle}>{t('dailyVerseTitle')}</Text>
            <TouchableOpacity 
              style={styles.sectionActionButton}              onPress={() => navigateToScreen('DailyVerse')}
            >              <Text style={styles.sectionActionText}>{t('see')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#6a51ae" />
            </TouchableOpacity>
          </View>
          
          {loadingVerse ? (
            <View style={styles.loadingVerseContainer}>
              <ActivityIndicator size="small" color="#6a51ae" />
              <Text style={styles.loadingVerseText}>Cargando versículo...</Text>
            </View>
          ) : dailyVerse ? (
            <TouchableOpacity 
              style={styles.verseCard}              onPress={() => navigateToScreen('DailyVerse')}
            >
              <Text style={styles.verseText}>"{dailyVerse.text}"</Text>
              <Text style={styles.verseReference}>{dailyVerse.reference}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Sección de Planes de Lectura */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes de Lectura</Text>            <TouchableOpacity 
              style={styles.sectionActionButton}
              onPress={() => navigateToScreen('ReadingPlan')}
            >
              <Text style={styles.sectionActionText}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={16} color="#6a51ae" />
            </TouchableOpacity>
          </View>
          
          {activePlans.length > 0 ? (
            <View style={styles.planPreviewContainer}>
              {activePlans.slice(0, 2).map((plan, index) => (
                <TouchableOpacity 
                  key={plan.id}
                  style={styles.planPreviewCard}              onPress={() => navigateToScreen('ReadingPlan')}
                >
                  <Text style={styles.planPreviewTitle}>{plan.title}</Text>
                  <Text style={styles.planPreviewProgress}>
                    Día {plan.currentDay || 1} de {plan.duration}
                  </Text>
                  <View style={styles.planPreviewProgressBar}>
                    <View 
                      style={[
                        styles.planPreviewProgressFill,
                        { width: `${((plan.currentDay || 1) / plan.duration) * 100}%` }
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.startPlanCard}              onPress={() => navigateToScreen('ReadingPlan')}
            >
              <Ionicons name="book-outline" size={24} color="#6a51ae" />
              <Text style={styles.startPlanText}>Comenzar un plan de lectura</Text>
              <Ionicons name="chevron-forward" size={20} color="#6a51ae" />
            </TouchableOpacity>
          )}
        </View>        {/* Versiones Bíblicas */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Versiones de la Biblia</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6a51ae" />
              <Text style={styles.loadingText}>Cargando versiones...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchVersions}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.versionSelectorCard}
              onPress={() => setVersionsModalVisible(true)}
            >
              <View style={styles.versionSelectorContent}>
                <View>
                  <Text style={styles.versionSelectorLabel}>Seleccionar versión de la Biblia</Text>
                  <Text style={styles.versionSelectorValue}>
                    {selectedVersion ? selectedVersion.name : 'Escoge una versión para leer'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={24} color="#6a51ae" />
              </View>
            </TouchableOpacity>
          )}

          {/* Modal selector para versiones */}
          <Modal
            visible={versionsModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setVersionsModalVisible(false)}
          >
            <View style={styles.versionModalOverlay}>
              <View style={styles.versionModalContent}>
                <View style={styles.versionModalHeader}>
                  <Text style={styles.versionModalTitle}>Seleccionar versión</Text>
                  <TouchableOpacity onPress={() => setVersionsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={versions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.versionModalItem,
                        selectedVersion?.id === item.id && styles.versionModalItemSelected
                      ]}                      onPress={() => {
                        setSelectedVersion(item);
                        // Guardar la selección para persistencia
                        AsyncStorage.setItem('selected_bible_version', JSON.stringify(item))
                          .then(() => console.log('Versión guardada:', item.name))
                          .catch(err => console.error('Error guardando versión:', err));
                        
                        setVersionsModalVisible(false);
                        // Opcionalmente, navegar inmediatamente
                        // navigateToSelectedVersion();
                      }}
                    >
                      <View>
                        <Text style={styles.versionModalItemName}>{item.name}</Text>
                        <Text style={styles.versionModalItemAbbr}>{item.abbreviation}</Text>
                      </View>
                      {selectedVersion?.id === item.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#6a51ae" />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.versionModalList}
                />
                
                <View style={styles.versionModalActions}>
                  <TouchableOpacity 
                    style={styles.versionModalCancelBtn}
                    onPress={() => setVersionsModalVisible(false)}
                  >
                    <Text style={styles.versionModalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.versionModalConfirmBtn}
                    onPress={() => {
                      setVersionsModalVisible(false);
                      navigateToSelectedVersion();
                    }}
                  >
                    <Text style={styles.versionModalConfirmText}>Leer Biblia</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>        {/* Herramientas y Funciones */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Herramientas</Text>
          <View style={styles.toolsGrid}>            {/* El botón de Música MP3 ha sido eliminado */}<TouchableOpacity 
              style={styles.toolCard}              
              onPress={() => navigateToScreen('Search', { 
                version: '025', 
                versionName: 'Reina Valera 1960',
                abbreviation: 'RV60' 
              })}
            >
              <View style={[styles.toolIconContainer, { backgroundColor: '#e6f7ff' }]}>
                <Ionicons name="search" size={24} color="#0099ff" />
              </View>
              <Text style={styles.toolName}>{t('searchBible')}</Text>
            </TouchableOpacity>
            
            
            <TouchableOpacity 
              style={styles.toolCard}              
              onPress={() => navigateToScreen('Notes')}
            >
              <View style={[styles.toolIconContainer, { backgroundColor: '#fff2e6' }]}>
                <Ionicons name="document-text" size={24} color="#ff9933" />
              </View>              <Text style={styles.toolName}>{t('notes')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.toolCard}              
              onPress={() => navigateToScreen('History')}
            >
              <View style={[styles.toolIconContainer, { backgroundColor: '#e6ffe6' }]}>
                <Ionicons name="time" size={24} color="#33cc33" />
              </View>              <Text style={styles.toolName}>{t('history')}</Text>
            </TouchableOpacity>            
            
            <TouchableOpacity 
              style={styles.toolCard}              
              onPress={navigateToBibleAIChat}
            >
              <View style={[styles.toolIconContainer, { backgroundColor: '#ffeee6' }]}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#ff6600" />
              </View>              <Text style={styles.toolName}>{t('chatBible')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  versionSelectorCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  versionSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionSelectorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  versionSelectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  versionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  versionModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  versionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  versionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  versionModalList: {
    paddingHorizontal: 16,
  },
  versionModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  versionModalItemSelected: {
    backgroundColor: '#f0e7ff',
  },
  versionModalItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  versionModalItemAbbr: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  versionModalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  versionModalCancelBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  versionModalCancelText: {
    color: '#666',
    fontWeight: '500',
  },
  versionModalConfirmBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#6a51ae',
  },
  versionModalConfirmText: {
    color: 'white',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#6a51ae',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    padding: 4,
  },
  sectionContainer: {
    margin: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6a51ae',
  },
  sectionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionActionText: {
    fontSize: 14,
    color: '#6a51ae',
    marginRight: 4,
  },
  loadingVerseContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingVerseText: {
    marginLeft: 8,
    color: '#666',
  },
  verseCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  verseText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6a51ae',
    textAlign: 'right',
  },
  planPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planPreviewCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  planPreviewProgress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  planPreviewProgressBar: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  planPreviewProgressFill: {
    height: '100%',
    backgroundColor: '#6a51ae',
  },
  startPlanCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  startPlanText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  versionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionInfo: {
    flex: 1,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionAbbreviation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6a51ae',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
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
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  toolCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '48%',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});