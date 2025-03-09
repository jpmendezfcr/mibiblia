import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Switch, ToastAndroid } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';
import Toast from 'react-native-toast-message';
import { Keyboard } from 'react-native';

const formatTime = (seconds) => {
  // Verificación más robusta para valores inválidos
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return "0:00";
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function AudioPlayerScreen() {
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [error, setError] = useState(null);
  const [sound, setSound] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const positionUpdateIntervalRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const params = route.params || {};
  const { text = "", reference = "", book_name = "", chapter = "", verse = "1" } = params;
  const [currentVerse, setCurrentVerse] = useState(verse);
  const [loadingNextVerse, setLoadingNextVerse] = useState(false);
  const [versesInChapter, setVersesInChapter] = useState([]);
  const [autoplay, setAutoplay] = useState(false);
  const autoplayTriggeredRef = useRef(false);

  // Configurar Audio
  useEffect(() => {
    configureAudio();
    return () => {
      unloadAudio();
    };
  }, []);

  // Cargar versículos del capítulo
  useEffect(() => {
    if (book_name && chapter) {
      fetchVersesInChapter();
    }
  }, [book_name, chapter]);

  // Cargar audio al iniciar o cuando cambia el versículo
  useEffect(() => {
    if (text) {
      loadAudio();
    }
  }, [text, currentVerse]);

  // Actualizar intervalo cuando cambia el estado de reproducción
  useEffect(() => {
    if (playing) {
      startPositionTracking();
    } else {
      stopPositionTracking();
    }
  }, [playing]);

  // Actualizar velocidad de reproducción
  useEffect(() => {
    updatePlaybackRate();
  }, [rate, sound]);  const configureAudio = async () => {
    try {
      // Configuración más segura para evitar problemas en Android
      const audioConfig = {
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      };
      
      // Añadir configuraciones específicas por plataforma
      if (Platform.OS === 'ios') {
        audioConfig.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
      } else if (Platform.OS === 'android') {
        audioConfig.interruptionModeAndroid = Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX;
      }
      
      // Inicializar el audio con un retardo para evitar errores de inicialización
      await new Promise(resolve => setTimeout(resolve, 300));
      await Audio.setAudioModeAsync(audioConfig);
      
      // Solicitar permisos de audio en Android de manera segura
      if (Platform.OS === 'android') {
        try {
          const { granted } = await Audio.requestPermissionsAsync();
          if (!granted) {
            console.warn('Permisos de audio no concedidos');
            if (Platform.OS === 'android' && ToastAndroid) {
              ToastAndroid.show('Se requieren permisos de audio para reproducir', ToastAndroid.SHORT);
            }
          }
        } catch (permError) {
          console.error('Error al solicitar permisos de audio:', permError);
        }
      }
    } catch (err) {
      console.error('Error configuring audio:', err);
      // Usar una manera segura de mostrar mensajes en Android
      if (Platform.OS === 'android' && ToastAndroid) {
        try {
          ToastAndroid.show('Error al configurar el audio', ToastAndroid.SHORT);
        } catch (toastError) {
          console.error('Error mostrando toast:', toastError);
        }
      }
    }
  };  const loadAudio = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpiar audio anterior si existe
      await unloadAudio();
      
      // Verificación adicional para evitar problemas en Android
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true
      });
      
      // Obtener la URL del audio
      const audioContent = await getAudioFromGoogleTTS();
      
      if (!audioContent) {
        throw new Error('No se pudo obtener el audio de Google TTS');
      }
      
      // Crear un nuevo objeto de sonido
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioContent },
        { shouldPlay: false, progressUpdateIntervalMillis: 1000 }
      );
      
      // Obtener la duración
      const status = await newSound.getStatusAsync();
      
      // Estimar la duración basada en la longitud del texto
      const estimatedDuration = Math.max((text ? text.length : 0) * 0.06, 3); // ~60ms por carácter, mínimo 3 segundos
      
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      } else {
        // Si la duración no está disponible, usar una estimación
        console.log('Duración no disponible, usando estimación:', estimatedDuration);
        setDuration(estimatedDuration);
      }
      
      // Configurar listeners
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded) {
          // Actualizar posición
          setPosition(status.positionMillis / 1000);
          
          // Si tenemos una duración válida, actualizarla
          if (status.durationMillis && status.durationMillis > 0) {
            setDuration(status.durationMillis / 1000);
          }
          
          // Si el audio ha terminado y autoplay está activado, reproducir el siguiente versículo
          if (status.didJustFinish && autoplay && !autoplayTriggeredRef.current) {
            autoplayTriggeredRef.current = true;
            setPlaying(false);
            goToNextVerse();
          } else if (status.didJustFinish) {
            setPlaying(false);
            newSound.setPositionAsync(0);
          }
        }
      });
      
      setSound(newSound);
      setAudioUrl(audioContent);
      setLoading(false);
      
      // Si estamos en autoplay, comenzar a reproducir automáticamente
      if (autoplayTriggeredRef.current) {
        autoplayTriggeredRef.current = false;
        newSound.playAsync();
        setPlaying(true);
      }
      
    } catch (err) {
      console.error('Error loading audio:', err);
      setError(`No se pudo cargar el audio: ${err.message}`);
      setLoading(false);
    }
  };

  // Obtener todos los versículos del capítulo actual
  const fetchVersesInChapter = async () => {
    try {
      if (!book_name || !chapter) return;
      
      // Buscar el book_id basado en el book_name
      // Este es un enfoque simple - en un caso real buscarías en una base de datos o mapa
      const bookIdMapping = {
        'Génesis': '1', 'Éxodo': '2', 'Levítico': '3', 'Números': '4', 'Deuteronomio': '5',
        'Josué': '6', 'Jueces': '7', 'Rut': '8', '1 Samuel': '9', '2 Samuel': '10',
        '1 Reyes': '11', '2 Reyes': '12', '1 Crónicas': '13', '2 Crónicas': '14', 'Esdras': '15',
        'Nehemías': '16', 'Ester': '17', 'Job': '18', 'Salmos': '19', 'Proverbios': '20',
        'Eclesiastés': '21', 'Cantares': '22', 'Isaías': '23', 'Jeremías': '24', 'Lamentaciones': '25',
        'Ezequiel': '26', 'Daniel': '27', 'Oseas': '28', 'Joel': '29', 'Amós': '30',
        'Abdías': '31', 'Jonás': '32', 'Miqueas': '33', 'Nahúm': '34', 'Habacuc': '35',
        'Sofonías': '36', 'Hageo': '37', 'Zacarías': '38', 'Malaquías': '39', 'Mateo': '40',
        'Marcos': '41', 'Lucas': '42', 'Juan': '43', 'Hechos': '44', 'Romanos': '45',
        '1 Corintios': '46', '2 Corintios': '47', 'Gálatas': '48', 'Efesios': '49', 'Filipenses': '50',
        'Colosenses': '51', '1 Tesalonicenses': '52', '2 Tesalonicenses': '53', '1 Timoteo': '54', '2 Timoteo': '55',
        'Tito': '56', 'Filemón': '57', 'Hebreos': '58', 'Santiago': '59', '1 Pedro': '60',
        '2 Pedro': '61', '1 Juan': '62', '2 Juan': '63', '3 Juan': '64', 'Judas': '65', 'Apocalipsis': '66'
      };
      
      // Usar params.book_id si está disponible, de lo contrario buscar en el mapping
      const book_id = params.book_id || bookIdMapping[book_name] || '';
      
      if (!book_id) {
        console.warn('No se pudo determinar el book_id para:', book_name);
        return;
      }
      
      const response = await fetch(
        `https://mibiblia.click/api.php?op=bible&t=RV60&b=${book_id}&c=${chapter}&v=`,
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
      
      // Transformar datos a un formato utilizable
      const verses = Object.keys(data).map(key => {
        const parts = key.split('-');
        return {
          id: parts[2], // verse number
          verse: data[key].verse,
          text: data[key].text
        };
      });
      
      // Ordenar por número de versículo
      verses.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      
      setVersesInChapter(verses);
    } catch (err) {
      console.error('Error fetching verses:', err);
      toast.error('No se pudieron cargar los versículos del capítulo');
    }
  };  const getAudioFromGoogleTTS = async () => {
    try {
      // Obtener la API key del endpoint externo
      const apiKeyResponse = await fetch('https://mibiblia.click/apikeytts.php');
      const apiKeyData = await apiKeyResponse.json();
      const apiKey = apiKeyData.apikey;
      
      if (!apiKey) {
        throw new Error('API key no encontrada');
      }
      
      // Preparar la petición a Google TTS API
      const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
      
      // Verificar que tenemos texto para convertir
      if (!text || text.trim() === "") {
        throw new Error('No hay texto disponible para reproducir');
      }
      
      const requestBody = {
        input: {
          text: text
        },
        voice: {
          languageCode: 'es-ES',
          name: 'es-ES-Standard-A',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0
        }
      };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.audioContent) {
        throw new Error('No se recibió contenido de audio');
      }
      
      // Convertir base64 a URI para reproducción
      const audioUri = `data:audio/mp3;base64,${data.audioContent}`;
      return audioUri;
    } catch (err) {
      console.error('Error al obtener audio de Google TTS:', err);
      throw err;
    }
  };
  
  const unloadAudio = async () => {
    stopPositionTracking();
    
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (err) {
        console.error('Error unloading sound:', err);
      }
      setSound(null);
    }
  };  const startPositionTracking = () => {
    if (positionUpdateIntervalRef.current) {
      clearInterval(positionUpdateIntervalRef.current);
    }
    // Actualizar manualmente la posición en todos los dispositivos para mayor consistencia
    positionUpdateIntervalRef.current = setInterval(async () => {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            setPosition(status.positionMillis / 1000);
          }
        } catch (err) {
          console.log("Error updating position:", err);
        }
      }
    }, 1000);
  };
  
  const stopPositionTracking = () => {
    if (positionUpdateIntervalRef.current) {
      clearInterval(positionUpdateIntervalRef.current);
      positionUpdateIntervalRef.current = null;
    }
  };
  
  const updatePlaybackRate = async () => {
    if (sound) {
      try {
        await sound.setRateAsync(rate, true);
      } catch (err) {
        console.error('Error updating playback rate:', err);
      }
    }
  };
  
  const playPause = async () => {
    if (!sound) return;
    
    try {
      if (playing) {
        await sound.pauseAsync();
      } else {
        // Si estamos cerca del final, volvemos al principio
        if (position >= duration - 1) {
          await sound.setPositionAsync(0);
          setPosition(0);
        }
        await sound.playAsync();
      }
      setPlaying(!playing);
    } catch (err) {
      console.error('Error toggling playback:', err);      Toast.show({
        type: 'error',
        text1: 'Error al reproducir el audio'
      });
    }
  };
  
  const resetPosition = async () => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(0);
      setPosition(0);
    } catch (err) {
      console.error('Error resetting position:', err);
    }
  };
  
  const skipForward = async () => {
    if (!sound) return;
    
    try {
      const newPosition = Math.min(position + 10, duration);
      await sound.setPositionAsync(newPosition * 1000);
      setPosition(newPosition);
    } catch (err) {
      console.error('Error skipping forward:', err);
    }
  };
  
  const skipBackward = async () => {
    if (!sound) return;
    
    try {
      const newPosition = Math.max(position - 10, 0);
      await sound.setPositionAsync(newPosition * 1000);
      setPosition(newPosition);
    } catch (err) {
      console.error('Error skipping backward:', err);
    }
  };
  
  const changeRate = async () => {
    // Rotate between speeds: 1.0 -> 1.25 -> 1.5 -> 0.75 -> 1.0
    const newRate = rate === 1.0 ? 1.25 : 
                   rate === 1.25 ? 1.5 : 
                   rate === 1.5 ? 0.75 : 1.0;
    
    setRate(newRate);    Toast.show({
      type: 'success',
      text1: `Velocidad: ${newRate}x`
    });
  };
  
  const onSliderValueChange = async (value) => {
    setPosition(value);
    
    if (sound) {
      try {
        await sound.setPositionAsync(value * 1000);
      } catch (err) {
        console.error('Error updating position with slider:', err);
      }
    }
  };  // Navegar al versículo anterior
  const goToPreviousVerse = async () => {
    if (versesInChapter.length === 0) {
      console.log('[ERROR] No hay versículos en el capítulo');
      return;
    }
    
    const currentVerseInt = parseInt(currentVerse);
    if (currentVerseInt <= 1) {
      Toast.show({
        type: 'error',
        text1: 'Este es el primer versículo del capítulo'
      });
      return;
    }
    
    try {
      // Pausar el audio actual
      if (sound && playing) {
        await sound.pauseAsync();
        setPlaying(false);
      }
      
      // Descargar el audio para liberar recursos
      await unloadAudio();
      
      // Calcular el versículo anterior
      const previousVerseNum = (currentVerseInt - 1).toString();
      setCurrentVerse(previousVerseNum);
      
      // Actualizar parámetros de navegación
      if (text) {
        const previousVerse = versesInChapter.find(v => v.verse === previousVerseNum);
        if (previousVerse) {
          navigation.setParams({
            verse: previousVerseNum,
            text: previousVerse.text,
            reference: `${book_name} ${chapter}:${previousVerseNum}`
          });
        }
      }
      
      // Esperar un poco antes de cargar el nuevo audio
      setTimeout(() => {
        loadAudio();
      }, 300);
    } catch (err) {
      console.error('Error navegando al versículo anterior:', err);
    }
  };
 // Navegar al versículo siguiente
 const goToNextVerse = async () => {
    if (!versesInChapter.length) {
      Toast.show({
        type: 'error',
        text1: 'No hay versículos disponibles'
      });
      return;
    }

    const currentVerseInt = parseInt(currentVerse);
    const maxVerse = versesInChapter.length;

    if (currentVerseInt >= maxVerse) {
      Toast.show({
        type: 'error',
        text1: 'Este es el último versículo del capítulo'
      });
      return;
    }

    setLoadingNextVerse(true);

    try {
      // Pausar y descargar el audio actual
      if (sound && playing) {
        await sound.pauseAsync();
        setPlaying(false);
      }
      await unloadAudio();

      // Obtener información del siguiente versículo
      const nextVerse = versesInChapter.find(v => parseInt(v.verse) === currentVerseInt + 1);
      
      if (!nextVerse) {
        throw new Error('No se encontró el siguiente versículo');
      }

      // Actualizar el estado y navegar al siguiente versículo
      navigation.replace('AudioPlayer', {
        verse: nextVerse.verse,
        text: nextVerse.text,
        reference: `${book_name} ${chapter}:${nextVerse.verse}`,
        book_name,
        chapter,
        book_id: params.book_id // Mantener el book_id para consistencia
      });

    } catch (error) {
      console.error('Error al navegar al siguiente versículo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error al cargar el siguiente versículo'
      });
    } finally {
      setLoadingNextVerse(false);
    }
  };
  
  // Manejar cambio de autoplay
  const toggleAutoplay = () => {
    setAutoplay(!autoplay);    Toast.show({
      type: 'success',
      text1: !autoplay ? 'Reproducción automática activada' : 'Reproducción automática desactivada'
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark ? 
          [theme.primaryDark, theme.background] : 
          [theme.primaryLight, theme.background]
        }
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>        <Text style={styles.headerTitle}>{t('audioPlayerTitle')}</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>
      
      <View style={styles.content}>
        <View style={[styles.audioCard, { backgroundColor: theme.card }]}>
          <LinearGradient
            colors={isDark ? 
              [theme.primaryDark, theme.primary] : 
              [theme.primary, theme.primaryLight]
            }
            style={styles.referenceContainer}
          >
            <Text style={styles.referenceText}>{reference || `${book_name} ${chapter}`}</Text>
          </LinearGradient>
          
          <View style={styles.textContainer}>
            <Text style={[styles.verseText, { color: theme.text }]}>
              {text}
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />              <Text style={[styles.loadingText, { color: theme.primary }]}>
                {t('loadingAudio')}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={loadAudio}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.playerContainer}>              <View style={styles.progressContainer}>                
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatTime(position)}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={Math.max(duration || 1, position + 0.1)}
                  value={position}
                  onValueChange={onSliderValueChange}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={isDark ? '#444' : '#ddd'}
                  thumbTintColor={theme.primary}
                />
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatTime(duration) || "0:00"}
                </Text>
              </View>
              
              <View style={styles.versesNavContainer}>
                <TouchableOpacity
                  style={[
                    styles.verseNavButton,
                    { backgroundColor: isDark ? '#333' : '#f0f0f0' },
                    parseInt(currentVerse) <= 1 && { opacity: 0.5 }
                  ]}
                  onPress={goToPreviousVerse}
                  disabled={parseInt(currentVerse) <= 1 || loadingNextVerse}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.primary} />
                  <Text style={[styles.verseNavText, { color: theme.text }]}>
                    Anterior
                  </Text>
                </TouchableOpacity>
                
                <View style={[styles.currentVerseContainer, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]}>
                  <Text style={[styles.currentVerseText, { color: theme.text }]}>
                    Versículo {currentVerse}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.verseNavButton,
                    { backgroundColor: isDark ? '#333' : '#f0f0f0' },
                    (versesInChapter.length > 0 && parseInt(currentVerse) >= versesInChapter.length) && { opacity: 0.5 }
                  ]}
                  onPress={goToNextVerse}
                  disabled={(versesInChapter.length > 0 && parseInt(currentVerse) >= versesInChapter.length) || loadingNextVerse}
                >
                  <Text style={[styles.verseNavText, { color: theme.text }]}>
                    Siguiente
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={skipBackward}
                >
                  <Ionicons name="play-back" size={28} color={theme.text} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    { backgroundColor: theme.primary }
                  ]}
                  onPress={playPause}
                >
                  <Ionicons
                    name={playing ? "pause" : "play"}
                    size={32}
                    color="white"
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={skipForward}
                >
                  <Ionicons name="play-forward" size={28} color={theme.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.settingsContainer}>
                <View style={styles.autoplayContainer}>
                  <Text style={[styles.autoplayText, { color: theme.text }]}>
                    Reproducción automática
                  </Text>
                  <Switch
                    value={autoplay}
                    onValueChange={toggleAutoplay}
                    trackColor={{ false: '#767577', true: theme.primaryLight }}
                    thumbColor={autoplay ? theme.primary : '#f4f3f4'}
                  />
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.rateButton,
                    { backgroundColor: isDark ? '#333' : '#f0f0f0' }
                  ]}
                  onPress={changeRate}
                >
                  <Text style={[styles.rateText, { color: theme.text }]}>
                    {rate}x
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
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
    paddingTop: 20,
    paddingBottom: 16,
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
  content: {
    flex: 1,
    padding: 16,
  },
  audioCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  referenceContainer: {
    padding: 16,
    alignItems: 'center',
  },
  referenceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  textContainer: {
    padding: 16,
    maxHeight: 200,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 26,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  playerContainer: {
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },  // Se elimina el estilo webSlider que no se usa en Android
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  versesNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verseNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  verseNavText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  currentVerseContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  currentVerseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsContainer: {
    marginTop: 8,
  },
  autoplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  autoplayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  rateButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  rateText: {
    fontWeight: '500',
  },
});