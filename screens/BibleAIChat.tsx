import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Toast from 'react-native-toast-message';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

export default function BibleAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola, soy tu Consejero Biblico. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre versículos, conceptos teológicos o dudas sobre la Biblia.',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
const [sound, setSound] = useState(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call AI API to get response
      const response = await fetch('https://api.a0.dev/ai/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en la Biblia y teología. Tu objetivo es responder preguntas sobre la Biblia, sus enseñanzas, historia, interpretación y aplicación. Proporciona respuestas basadas en conocimiento bíblico sólido. Incluye referencias a versículos relevantes cuando sea apropiado. Mantén un tono respetuoso y educativo.'
            },
            {
              role: 'user',
              content: inputText.trim()
            }
          ]
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.completion || 'Lo siento, no pude procesar tu consulta. Por favor, intenta de nuevo.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      Toast.show({
        type: 'error',
        text1: 'Error de conexión',
        text2: 'No se pudo obtener respuesta de la IA'
      });
      
      // Add fallback message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Lo siento, tuve un problema conectando con el servicio. Por favor, intenta de nuevo en unos momentos.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Función para reproducir audio de un mensaje dado el texto
  const playAudioForMessage = async (messageText: string) => {
    try {
      // Obtener API key
      const apiKeyResponse = await fetch('https://mibiblia.click/apikeytts.php');
      const apiKeyData = await apiKeyResponse.json();
      const apiKey = apiKeyData.apikey;
      if (!apiKey) throw new Error('API key no encontrada');
      
      const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
      
      const requestBody = {
        input: { text: messageText },
        voice: { languageCode: 'es-ES', name: 'es-ES-Standard-A', ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' },
      };
      
      const ttsResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const ttsData = await ttsResponse.json();
      if (!ttsData.audioContent) throw new Error('No se recibió contenido de audio');
      
      const audioUri = `data:audio/mp3;base64,${ttsData.audioContent}`;
      
      // Liberar sonido anterior si existe
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      // Crear nuevo audio y reproducir
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(newSound);
      await newSound.playAsync();
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Error de audio',
        text2: err.message
      });
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Books')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consultas Bíblicas</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.isUser ? 
              [styles.userBubble, { backgroundColor: theme.primary }] : 
              [styles.aiBubble, { backgroundColor: isDark ? '#424242' : '#f0f0f0' }]
          ]}>
            <Text style={[
              styles.messageText,
              { color: item.isUser ? 'white' : theme.text }
            ]}>
              {item.text}
            </Text>
            <Text style={[
              styles.timestampText,
              { color: item.isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
            ]}>
              {formatTime(item.timestamp)}
            </Text>
            {/* Agregar botón de audio solo en mensajes del asistente */}
            {!item.isUser && (
              <TouchableOpacity 
                style={styles.audioButton}
                onPress={() => playAudioForMessage(item.text)}
              >
                <Ionicons name="musical-note-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      
      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)' }]}>
          <View style={[styles.loadingIndicator, { backgroundColor: isDark ? '#333' : 'white' }]}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Consultando...</Text>
          </View>
        </View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { 
          backgroundColor: isDark ? '#333' : 'white',
          borderTopColor: theme.border
        }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { 
              backgroundColor: isDark ? '#424242' : '#f0f0f0',
              color: theme.text
            }]}
            placeholder="Escribe tu pregunta sobre la Biblia..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, {
              backgroundColor: inputText.trim() ? theme.primary : theme.inactive
            }]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    marginVertical: 6,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestampText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 10,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  }
});