import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { Header, Card } from '../components/StyledComponents';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: number;
};

export default function BibleChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola, soy tu asistente bíblico. Puedo ayudarte a resolver dudas sobre la Biblia, explicar pasajes o conceptos bíblicos. ¿En qué puedo ayudarte hoy?',
      sender: 'assistant',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  
  // Auto-scroll a los nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    Keyboard.dismiss();
    
    try {
      // Crear el contexto para la API con un sistema que entienda de la Biblia
      const messages = [
        {
          role: "system", 
          content: "Eres un asistente experto en la Biblia, teología cristiana y estudios bíblicos. Tienes conocimiento profundo sobre el Antiguo y Nuevo Testamento, historia bíblica, interpretación y exégesis. Responde preguntas de manera educativa, respetuosa y neutral cuando se trata de diferentes interpretaciones denominacionales. Tu objetivo es proporcionar información precisa basada en la Biblia y los estudios académicos sobre las escrituras. Eres paciente con principiantes y ofreces respuestas detalladas para estudiosos avanzados."
        },
        {
          role: "user", 
          content: inputText.trim()
        }
      ];
      
      // Llamar a la API gratuita de LLM
      const response = await fetch('https://api.a0.dev/ai/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Agregar respuesta del asistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.completion || "Lo siento, no pude procesar tu pregunta. Por favor, intenta de nuevo.",
        sender: 'assistant',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      
      // Mensaje de error en caso de falla
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Lo siento, hubo un problema al conectar con el servicio. Por favor, intenta de nuevo más tarde.",
        sender: 'assistant',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      Toast.show({
        type: 'error',
        text1: 'Error de conexión',
        text2: 'No se pudo conectar con el servicio de IA'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatear la fecha y hora del mensaje
  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Consulta Bíblica"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.navigate('Books')}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View 
              style={[
                styles.messageContainer,
                item.sender === 'user' ? 
                  [styles.userMessage, { backgroundColor: theme.primary }] : 
                  [styles.assistantMessage, { backgroundColor: isDark ? theme.card : '#f0f0f0' }]
              ]}
            >
              <Text 
                style={[
                  styles.messageText,
                  { color: item.sender === 'user' ? 'white' : theme.text }
                ]}
              >
                {item.text}
              </Text>
              <Text 
                style={[
                  styles.messageTime,
                  { 
                    color: item.sender === 'user' ? 'rgba(255,255,255,0.7)' : theme.textSecondary 
                  }
                ]}
              >
                {formatMessageTime(item.timestamp)}
              </Text>
            </View>
          )}
        />
        
        <View style={[styles.inputContainer, { backgroundColor: isDark ? theme.card : '#fff' }]}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#333' : '#f5f5f5',
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.primary },
              !inputText.trim() && { opacity: 0.5 }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    paddingRight: 40,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  }
});