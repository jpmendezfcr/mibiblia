import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import DebugLogger from '../services/DebugLogger';

const HomeScreen: React.FC = () => {
  const { t } = useLanguage();

  const handleReadBiblePress = async () => {
    try {
      await DebugLogger.info('User pressed Read Bible button');
      // Add navigation or other functionality here
    } catch (error) {
      await DebugLogger.error(`Error in Read Bible action: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('welcome')}</Text>
      <TouchableOpacity 
        style={styles.button}
        onPress={handleReadBiblePress}
      >
        <Text style={styles.buttonText}>{t('readBible')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#6B52AE',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
