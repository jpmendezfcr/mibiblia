import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Header, Card, Button } from '../components/StyledComponents';
import { FadeInView } from '../components/AnimatedComponents';
import Toast from 'react-native-toast-message';

export type ReadingPlan = {
  id: string;
  title: string;
  description: string;
  duration: number; // Duración en días
  readings: ReadingDay[];
  startDate?: string; // ISO string
  currentDay?: number;
};

type ReadingDay = {
  day: number;
  title: string;
  references: ReadingReference[];
  completed?: boolean;
};

type ReadingReference = {
  book_id: string;
  book_name: string;
  chapter: string;
  startVerse?: string;
  endVerse?: string;
  completed?: boolean;
};

const PREDEFINED_PLANS: ReadingPlan[] = [
  {
    id: 'evangelios',
    title: 'Los Evangelios en 30 días',
    description: 'Recorre la vida de Jesús a través de los cuatro evangelios en un mes.',
    duration: 30,
    readings: Array.from({ length: 30 }, (_, i) => {
      // Asignar capítulos según el día
      let book_id, book_name, chapter;
      
      if (i < 7) {
        // Mateo primeros 7 días (4 capítulos por día)
        book_id = '40';
        book_name = 'Mateo';
        const startChapter = i * 4 + 1;
        chapter = `${startChapter}-${Math.min(startChapter + 3, 28)}`;
      } else if (i < 11) {
        // Marcos siguientes 4 días (4 capítulos por día)
        book_id = '41';
        book_name = 'Marcos';
        const startChapter = (i - 7) * 4 + 1;
        chapter = `${startChapter}-${Math.min(startChapter + 3, 16)}`;
      } else if (i < 19) {
        // Lucas siguientes 8 días (3 capítulos por día)
        book_id = '42';
        book_name = 'Lucas';
        const startChapter = (i - 11) * 3 + 1;
        chapter = `${startChapter}-${Math.min(startChapter + 2, 24)}`;
      } else {
        // Juan últimos 11 días (2 capítulos por día)
        book_id = '43';
        book_name = 'Juan';
        const startChapter = (i - 19) * 2 + 1;
        chapter = `${startChapter}-${Math.min(startChapter + 1, 21)}`;
      }
      
      return {
        day: i + 1,
        title: `Día ${i + 1}`,
        references: [
          {
            book_id,
            book_name,
            chapter,
            completed: false
          }
        ],
        completed: false
      };
    })
  },
  {
    id: 'salmos-30',
    title: 'Salmos en 30 días',
    description: 'Encuentra consuelo y alabanza con un recorrido por el libro de los Salmos.',
    duration: 30,
    readings: Array.from({ length: 30 }, (_, i) => {
      const startPsalm = i * 5 + 1;
      const endPsalm = Math.min(startPsalm + 4, 150);
      
      return {
        day: i + 1,
        title: `Día ${i + 1}`,
        references: Array.from({ length: endPsalm - startPsalm + 1 }, (_, j) => ({
          book_id: '19',
          book_name: 'Salmos',
          chapter: (startPsalm + j).toString(),
          completed: false
        })),
        completed: false
      };
    })
  },
  {
    id: 'nuevo-testamento-90',
    title: 'Nuevo Testamento en 90 días',
    description: 'Un recorrido completo por el Nuevo Testamento, un capítulo por día.',
    duration: 90,
    readings: Array.from({ length: 90 }, (_, i) => {
      // Distribuir los 260 capítulos del NT en 90 días
      let book_id, book_name, chapter;
      let day = i + 1;
      
      // Simplificado: 3 capítulos por día para los primeros 60 días, luego 2 por día
      if (i < 60) {
        const bookIndex = Math.floor(i / 10); // Cambiar de libro cada 10 días aproximadamente
        const startChapter = (i % 10) * 3 + 1;
        
        switch(bookIndex) {
          case 0:
            book_id = '40'; book_name = 'Mateo'; break; // 28 caps
          case 1:
            book_id = '41'; book_name = 'Marcos'; break; // 16 caps
          case 2:
            book_id = '42'; book_name = 'Lucas'; break; // 24 caps
          case 3:
            book_id = '43'; book_name = 'Juan'; break; // 21 caps
          case 4:
            book_id = '44'; book_name = 'Hechos'; break; // 28 caps
          case 5:
            book_id = '45'; book_name = 'Romanos'; break; // 16 caps
        }
        
        chapter = startChapter.toString();
      } else {
        // Resto del NT en los últimos 30 días (simplificado)
        const remainingDay = i - 60;
        
        if (remainingDay < 10) {
          book_id = '46'; book_name = '1 Corintios'; // 16 caps
          chapter = (remainingDay + 1).toString();
        } else if (remainingDay < 20) {
          book_id = '47'; book_name = '2 Corintios'; // 13 caps
          chapter = (remainingDay - 9).toString();
        } else {
          book_id = '50'; book_name = 'Filipenses'; // 4 caps
          chapter = ((remainingDay - 19) % 4 + 1).toString();
        }
      }
      
      return {
        day,
        title: `Día ${day}`,
        references: [
          {
            book_id,
            book_name,
            chapter,
            completed: false
          }
        ],
        completed: false
      };
    })
  },
  {
    id: 'plan-5-dias',
    title: 'Plan de 5 días',
    description: 'Un plan corto para empezar a leer la Biblia regularmente.',
    duration: 5,
    readings: [
      {
        day: 1,
        title: 'Día 1: El Principio',
        references: [
          { book_id: '1', book_name: 'Génesis', chapter: '1', completed: false }
        ],
        completed: false
      },
      {
        day: 2,
        title: 'Día 2: El Buen Pastor',
        references: [
          { book_id: '19', book_name: 'Salmos', chapter: '23', completed: false }
        ],
        completed: false
      },
      {
        day: 3,
        title: 'Día 3: El Amor de Dios',
        references: [
          { book_id: '43', book_name: 'Juan', chapter: '3', completed: false }
        ],
        completed: false
      },
      {
        day: 4,
        title: 'Día 4: La Fe',
        references: [
          { book_id: '58', book_name: 'Hebreos', chapter: '11', completed: false }
        ],
        completed: false
      },
      {
        day: 5,
        title: 'Día 5: La Esperanza',
        references: [
          { book_id: '66', book_name: 'Apocalipsis', chapter: '21', completed: false }
        ],
        completed: false
      }
    ]
  }
];

export default function ReadingPlanScreen() {
  const [activePlans, setActivePlans] = useState<ReadingPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
  const [dayReadings, setDayReadings] = useState<ReadingDay | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [planDetailVisible, setPlanDetailVisible] = useState(false);
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    loadPlans();
  }, []);  const loadPlans = async () => {
    try {
      const savedPlans = await AsyncStorage.getItem('reading_plans');
      let active: ReadingPlan[] = [];
      
      if (savedPlans) {
        active = JSON.parse(savedPlans);
        
        // Actualizar progreso basado en la fecha actual
        active = active.map(plan => {
          if (plan.startDate) {
            try {
              const startDate = new Date(plan.startDate);
              const today = new Date();
              
              // Calcular diferencia en días manualmente
              const diffTime = Math.abs(today.getTime() - startDate.getTime());
              const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              // Actualizar el día actual, sin exceder la duración
              plan.currentDay = Math.min(daysDiff + 1, plan.duration);
            } catch (err) {
              console.error('Error calculating date difference:', err);
            }
          }
          
          return plan;
        });
        
        await AsyncStorage.setItem('reading_plans', JSON.stringify(active));
      }
      
      setActivePlans(active);
      
      // Filtrar planes predefinidos que no estén activos
      const activeIds = active.map(p => p.id);
      const available = PREDEFINED_PLANS.filter(p => !activeIds.includes(p.id));
      setAvailablePlans(available);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading reading plans:', error);
      setLoading(false);
    }
  };

  const startPlan = async (plan: ReadingPlan) => {
    try {
      // Establecer fecha de inicio y día actual
      const newPlan = {
        ...plan,
        startDate: new Date().toISOString(),
        currentDay: 1
      };
      
      const updatedActive = [...activePlans, newPlan];
      await AsyncStorage.setItem('reading_plans', JSON.stringify(updatedActive));
      
      // Actualizar estados
      setActivePlans(updatedActive);
      setAvailablePlans(availablePlans.filter(p => p.id !== plan.id));      Toast.show({
        type: 'success',
        text1: 'Plan de lectura iniciado'
      });
      
      // Mostrar la lectura del día
      showTodaysReading(newPlan);
    } catch (error) {
      console.error('Error starting reading plan:', error);      Toast.show({
        type: 'error',
        text1: 'Error al iniciar el plan de lectura'
      });
    }
  };

  const showTodaysReading = (plan: ReadingPlan) => {
    if (!plan.currentDay || !plan.readings) return;
    
    const todayReading = plan.readings.find(r => r.day === plan.currentDay);
    if (todayReading) {
      setSelectedPlan(plan);
      setDayReadings(todayReading);
      setModalVisible(true);
    }
  };

  const markReferenceAsRead = async (planId: string, day: number, referenceIndex: number) => {
    try {
      // Actualizar en memoria
      const updatedPlans = activePlans.map(plan => {
        if (plan.id === planId) {
          const updatedReadings = plan.readings.map(reading => {
            if (reading.day === day) {
              const updatedReferences = reading.references.map((ref, idx) => {
                if (idx === referenceIndex) {
                  return { ...ref, completed: true };
                }
                return ref;
              });
              
              // Comprobar si todas las referencias están completadas
              const allCompleted = updatedReferences.every(ref => ref.completed);
              
              return { 
                ...reading, 
                references: updatedReferences,
                completed: allCompleted
              };
            }
            return reading;
          });
          
          return { ...plan, readings: updatedReadings };
        }
        return plan;
      });
      
      // Guardar cambios
      setActivePlans(updatedPlans);
      await AsyncStorage.setItem('reading_plans', JSON.stringify(updatedPlans));
      
      // Actualizar UI si se está mostrando el modal
      if (selectedPlan?.id === planId && dayReadings?.day === day) {
        const updatedDayReadings = updatedPlans
          .find(p => p.id === planId)?.readings
          .find(r => r.day === day);
          
        if (updatedDayReadings) {
          setDayReadings(updatedDayReadings);
        }
      }      Toast.show({
        type: 'success',
        text1: 'Lectura marcada como completada'
      });
    } catch (error) {
      console.error('Error marking reference as read:', error);      Toast.show({
        type: 'error',
        text1: 'Error al actualizar la lectura'
      });
    }
  };  const navigateToReference = (reference: ReadingReference) => {
    // Si es un rango de capítulos, tomar solo el primero
    const chapter = reference.chapter.split('-')[0];
    
    navigation.navigate('BibleTab', {
      screen: 'Versicles',
      params: {
        version: '025',
        versionName: 'Reina Valera 1960',
        book: reference.book_id,
        bookName: reference.book_name,
        chapter,
        chapterNumber: chapter,
        abbreviation: 'RV60',
        useFullVerseAPI: true
      }
    });
    
    setModalVisible(false);
  };

  const getPlanProgress = (plan: ReadingPlan) => {
    if (!plan.readings) return 0;
    
    const completedDays = plan.readings.filter(r => r.completed).length;
    return (completedDays / plan.duration) * 100;
  };  const getNextReadingDate = (plan: ReadingPlan) => {
    if (!plan.startDate || !plan.currentDay) return '';
    
    try {
      const startDate = new Date(plan.startDate);
      const nextReadingDay = addDays(startDate, plan.currentDay - 1);
      
      // Formatear la fecha manualmente
      const day = nextReadingDay.getDate();
      const month = nextReadingDay.toLocaleString('es-ES', { month: 'long' });
      
      return `${day} de ${month}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const removePlan = async (planId: string) => {
    try {
      // Filtrar plan de los activos
      const updatedPlans = activePlans.filter(p => p.id !== planId);
      await AsyncStorage.setItem('reading_plans', JSON.stringify(updatedPlans));
      
      // Actualizar estado
      setActivePlans(updatedPlans);
      
      // Añadir plan a disponibles
      const planToAdd = PREDEFINED_PLANS.find(p => p.id === planId);
      if (planToAdd && !availablePlans.some(p => p.id === planId)) {
        setAvailablePlans([...availablePlans, planToAdd]);
      }      Toast.show({
        type: 'success',
        text1: 'Plan de lectura eliminado'
      });
    } catch (error) {
      console.error('Error removing reading plan:', error);      Toast.show({
        type: 'error',
        text1: 'Error al eliminar el plan de lectura'
      });
    }
  };

  const showPlanDetail = (plan: ReadingPlan) => {
    setSelectedPlan(plan);
    setPlanDetailVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Header
          title="Planes de Lectura"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primary }]}>Cargando planes de lectura...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Planes de Lectura"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Planes Activos */}
        {activePlans.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Mis Planes Activos
            </Text>
            
            {activePlans.map((plan, index) => (
              <FadeInView key={plan.id} index={index}>
                <Card style={styles.planCard}>
                  <TouchableOpacity 
                    onPress={() => showTodaysReading(plan)}
                    style={styles.planHeader}
                  >
                    <View style={styles.planInfo}>
                      <Text style={[styles.planTitle, { color: theme.text }]}>
                        {plan.title}
                      </Text>
                      <Text style={[styles.planNextReading, { color: theme.textSecondary }]}>
                        Día {plan.currentDay} de {plan.duration} • {getNextReadingDate(plan)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme.primary} />
                  </TouchableOpacity>
                  
                  <View style={styles.progressContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { backgroundColor: isDark ? '#444' : '#eee' }
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          { 
                            backgroundColor: theme.primary,
                            width: `${getPlanProgress(plan)}%`
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                      {Math.round(getPlanProgress(plan))}% completado
                    </Text>
                  </View>
                  
                  <View style={styles.planActions}>
                    <Button
                      title="Ver detalles"
                      icon="information-circle-outline"
                      type="outlined"
                      onPress={() => showPlanDetail(plan)}
                      style={styles.planActionButton}
                    />
                    <Button
                      title="Eliminar"
                      icon="trash-outline"
                      type="secondary"
                      onPress={() => removePlan(plan.id)}
                      style={styles.planActionButton}
                      textStyle={{ color: theme.error }}
                    />
                  </View>
                </Card>
              </FadeInView>
            ))}
          </View>
        )}
        
        {/* Planes Disponibles */}
        {availablePlans.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Planes Disponibles
            </Text>
            
            {availablePlans.map((plan, index) => (
              <FadeInView key={plan.id} index={index}>
                <Card style={styles.planCard}>
                  <TouchableOpacity 
                    onPress={() => showPlanDetail(plan)}
                    style={styles.planHeader}
                  >
                    <View style={styles.planInfo}>
                      <Text style={[styles.planTitle, { color: theme.text }]}>
                        {plan.title}
                      </Text>
                      <Text style={[styles.planDescription, { color: theme.textSecondary }]}>
                        {plan.description}
                      </Text>
                      <Text style={[styles.planDuration, { color: theme.primary }]}>
                        {plan.duration} días
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme.primary} />
                  </TouchableOpacity>
                  
                  <Button
                    title="Comenzar Plan"
                    icon="play"
                    onPress={() => startPlan(plan)}
                    style={styles.startPlanButton}
                  />
                </Card>
              </FadeInView>
            ))}
          </View>
        )}
        
        {activePlans.length === 0 && availablePlans.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={64}
              color={isDark ? theme.border : '#ddd'}
            />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No hay planes de lectura disponibles
            </Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              Intenta más tarde o crea un plan personalizado
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Modal para mostrar la lectura del día */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedPlan && dayReadings && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {selectedPlan.title} - {dayReadings.title}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.readingsContainer}>
                  {dayReadings.references.map((reference, index) => (                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.readingItem,
                        reference.completed && { backgroundColor: theme.primaryLight + '20' },
                        { borderColor: theme.border }
                      ]}
                      onPress={() => navigateToReference(reference)}
                    >
                      <View style={styles.readingInfo}>
                        <Text style={[styles.readingReference, { color: theme.text }]}>
                          {reference.book_name} {reference.chapter}
                          {reference.startVerse ? `:${reference.startVerse}` : ''}
                          {reference.endVerse ? `-${reference.endVerse}` : ''}
                        </Text>
                      </View>
                      
                      <View style={styles.readingActions}>
                        
                        <TouchableOpacity
                          style={[
                            styles.checkButton,
                            reference.completed && { backgroundColor: theme.primary }
                          ]}
                          onPress={() => markReferenceAsRead(selectedPlan.id, dayReadings.day, index)}
                        >
                          <Ionicons
                            name={reference.completed ? "checkmark" : "checkmark-outline"}
                            size={20}
                            color={reference.completed ? 'white' : theme.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <View style={styles.modalFooter}>
                  <Button
                    title="Cerrar"
                    type="secondary"
                    onPress={() => setModalVisible(false)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  {dayReadings.completed ? (
                    <Button
                      title="Completado ✓"
                      disabled={true}
                      style={{ flex: 1, marginLeft: 8, opacity: 0.7 }}
                    />
                  ) : (
                    <Button
                      title="Marcar Todo como Leído"
                      onPress={() => {
                        dayReadings.references.forEach((_, index) => {
                          markReferenceAsRead(selectedPlan.id, dayReadings.day, index);
                        });
                      }}
                      style={{ flex: 1, marginLeft: 8 }}
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Modal para detalles del plan */}
      <Modal
        visible={planDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPlanDetailVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedPlan && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {selectedPlan.title}
                  </Text>
                  <TouchableOpacity onPress={() => setPlanDetailVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.planDetailContainer}>
                  <Text style={[styles.planDetailDescription, { color: theme.text }]}>
                    {selectedPlan.description}
                  </Text>
                  
                  <Text style={[styles.planDetailSectionTitle, { color: theme.primary }]}>
                    Duración
                  </Text>
                  <Text style={[styles.planDetailText, { color: theme.text }]}>
                    {selectedPlan.duration} días
                  </Text>
                  
                  <Text style={[styles.planDetailSectionTitle, { color: theme.primary }]}>
                    Resumen de lecturas
                  </Text>
                  
                  {selectedPlan.readings.slice(0, 5).map((reading, index) => (
                    <View 
                      key={index}
                      style={[styles.planDetailReadingItem, { borderColor: theme.border }]}
                    >
                      <Text style={[styles.planDetailReadingDay, { color: theme.text }]}>
                        {reading.title}
                      </Text>
                      <Text style={[styles.planDetailReadingReferences, { color: theme.textSecondary }]}>
                        {reading.references.map(ref => 
                          `${ref.book_name} ${ref.chapter}`
                        ).join(', ')}
                      </Text>
                    </View>
                  ))}
                  
                  {selectedPlan.readings.length > 5 && (
                    <Text style={[styles.planDetailMoreText, { color: theme.textSecondary }]}>
                      ...y {selectedPlan.readings.length - 5} lecturas más
                    </Text>
                  )}
                </ScrollView>
                
                <View style={styles.modalFooter}>
                  <Button
                    title="Cerrar"
                    type="secondary"
                    onPress={() => setPlanDetailVisible(false)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  
                  {activePlans.some(p => p.id === selectedPlan.id) ? (
                    <Button
                      title="Ver Hoy"
                      onPress={() => {
                        setPlanDetailVisible(false);
                        const plan = activePlans.find(p => p.id === selectedPlan.id);
                        if (plan) showTodaysReading(plan);
                      }}
                      style={{ flex: 1, marginLeft: 8 }}
                    />
                  ) : (
                    <Button
                      title="Comenzar Plan"
                      onPress={() => {
                        setPlanDetailVisible(false);
                        startPlan(selectedPlan);
                      }}
                      style={{ flex: 1, marginLeft: 8 }}
                    />
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
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
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  planCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  planDuration: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  planNextReading: {
    fontSize: 14,
    marginTop: 4,
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  planActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  planActionButton: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
  },
  startPlanButton: {
    margin: 0,
    borderRadius: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  readingsContainer: {
    padding: 16,
    maxHeight: 400,
  },  readingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  readingInfo: {
    flex: 1,
  },
  readingReference: {
    fontSize: 16,
    fontWeight: '500',
  },
  readingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingActionButton: {
    padding: 8,
    marginRight: 8,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
  },
  planDetailContainer: {
    padding: 16,
    maxHeight: 400,
  },
  planDetailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  planDetailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  planDetailText: {
    fontSize: 15,
  },
  planDetailReadingItem: {
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  planDetailReadingDay: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  planDetailReadingReferences: {
    fontSize: 14,
  },
  planDetailMoreText: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
});