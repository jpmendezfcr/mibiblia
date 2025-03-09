import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { Header, Card, Button, Input } from '../components/StyledComponents';
import { FadeInView } from '../components/AnimatedComponents';

export type Note = {
  id: string;
  title: string;
  content: string;
  verseReference?: string;
  timestamp: number;
  tags?: string[];
};

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('bible_notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading notes:', error);
      setLoading(false);
    }
  };

  const saveNotes = async (updatedNotes: Note[]) => {
    try {
      await AsyncStorage.setItem('bible_notes', JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Error saving notes:', error);      Toast.show({
        type: 'error',
        text1: 'Error al guardar notas'
      });
    }
  };

  const addNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) {      Toast.show({
        type: 'error',
        text1: 'El título o contenido no puede estar vacío'
      });
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: noteTitle.trim() || 'Nota sin título',
      content: noteContent.trim(),
      timestamp: Date.now(),
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    
    setNoteTitle('');
    setNoteContent('');
    setModalVisible(false);    Toast.show({
      type: 'success',
      text1: 'Nota guardada'
    });
  };

  const updateNote = () => {
    if (!editingNote) return;
    
    if (!noteTitle.trim() && !noteContent.trim()) {      Toast.show({
        type: 'error',
        text1: 'El título o contenido no puede estar vacío'
      });
      return;
    }

    const updatedNote: Note = {
      ...editingNote,
      title: noteTitle.trim() || 'Nota sin título',
      content: noteContent.trim(),
      timestamp: Date.now(),
    };

    const updatedNotes = notes.map(note => 
      note.id === editingNote.id ? updatedNote : note
    );

    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setModalVisible(false);    Toast.show({
      type: 'success',
      text1: 'Nota actualizada'
    });
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);    Toast.show({
      type: 'success',
      text1: 'Nota eliminada'
    });
  };

  const openAddNoteModal = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setModalVisible(true);
  };

  const openEditNoteModal = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setModalVisible(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + 
           new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Mis Notas"
        leftIcon="arrow-back"
        rightIcon="add"
        onLeftPress={() => navigation.navigate('Books')}
        onRightPress={openAddNoteModal}
      />

      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="document-text-outline" 
            size={80} 
            color={isDark ? theme.border : '#ddd'} 
          />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            No hay notas
          </Text>
          <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
            Toca el botón + para crear tu primera nota
          </Text>
          <Button
            title="Crear Nota"
            icon="add"
            onPress={openAddNoteModal}
            style={{ marginTop: 20 }}
          />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item, index }) => (
            <FadeInView index={index}>
              <Card 
                onPress={() => openEditNoteModal(item)}
                style={styles.noteCard}
              >
                <View style={styles.noteHeader}>
                  <Text 
                    style={[styles.noteTitle, { color: theme.text }]} 
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => deleteNote(item.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
                
                <Text 
                  style={[styles.noteDate, { color: theme.textSecondary }]}
                >
                  {formatDate(item.timestamp)}
                </Text>
                
                {item.verseReference && (
                  <View style={[styles.referenceBadge, { backgroundColor: theme.primaryLight + '30' }]}>
                    <Text style={[styles.referenceText, { color: theme.primary }]}>
                      {item.verseReference}
                    </Text>
                  </View>
                )}
                
                <Text 
                  style={[styles.noteContent, { color: theme.text }]} 
                  numberOfLines={3}
                >
                  {item.content}
                </Text>
              </Card>
            </FadeInView>
          )}
        />
      )}

      {/* Modal for adding/editing notes */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Input 
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholder="Título"
                style={{ marginBottom: 12 }}
              />
              
              <View style={[styles.contentInputContainer, { borderColor: theme.border, backgroundColor: isDark ? '#222222' : '#f8f8f8' }]}>
                <TextInput
                  value={noteContent}
                  onChangeText={setNoteContent}
                  placeholder="Escribe tu nota aquí..."
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.contentInput, { color: theme.text }]}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                onPress={() => setModalVisible(false)}
                type="secondary"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={editingNote ? "Actualizar" : "Guardar"}
                onPress={editingNote ? updateNote : addNote}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
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
  noteCard: {
    marginBottom: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  noteDate: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  referenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '500',
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
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 400,
  },
  contentInputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
    height: 150,
  },
  contentInput: {
    padding: 12,
    fontSize: 16,
    height: '100%',
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 20,
  },
});