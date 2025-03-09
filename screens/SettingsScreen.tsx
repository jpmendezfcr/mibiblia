import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { Header, Card, Button } from '../components/StyledComponents';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { theme, themeType, setThemeType, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [fontSizeLevel, setFontSizeLevel] = useState(2); // 1: pequeño, 2: normal, 3: grande

  const handleFontSizeChange = (level: number) => {
    setFontSizeLevel(level);    Toast.show({
      type: 'success',
      text1: 'Tamaño de fuente actualizado'
    });
    // En una aplicación real, guardaríamos esta preferencia y la aplicaríamos globalmente
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('readingHistory');      Toast.show({
        type: 'success',
        text1: 'Historial borrado correctamente'
      });
    } catch (error) {
      console.error('Error clearing history:', error);      Toast.show({
        type: 'error',
        text1: 'Error al borrar el historial'
      });
    }
  };

  const clearData = async () => {
    Alert.alert(
      'Borrar datos',
      '¿Estás seguro de que deseas borrar todos los datos guardados? Esta acción no se puede deshacer.',
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
              await AsyncStorage.clear();              Toast.show({
                type: 'success',
                text1: 'Todos los datos han sido borrados'
              });
            } catch (error) {
              console.error('Error clearing data:', error);              Toast.show({
                type: 'error',
                text1: 'Error al borrar los datos'
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>      <Header
        title={t('settings')}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.navigate('Books')}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Apariencia</Text>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Tema</Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  themeType === 'light' && { backgroundColor: theme.primaryLight },
                ]}
                onPress={() => setThemeType('light')}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={themeType === 'light' ? 'white' : theme.textSecondary}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  themeType === 'dark' && { backgroundColor: theme.primaryLight },
                ]}
                onPress={() => setThemeType('dark')}
              >
                <Ionicons
                  name="moon"
                  size={20}
                  color={themeType === 'dark' ? 'white' : theme.textSecondary}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  themeType === 'system' && { backgroundColor: theme.primaryLight },
                ]}
                onPress={() => setThemeType('system')}
              >
                <Ionicons
                  name="settings"
                  size={20}
                  color={themeType === 'system' ? 'white' : theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Tamaño de texto</Text>
            <View style={styles.fontSizeButtons}>
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSizeLevel === 1 && { backgroundColor: theme.primaryLight },
                ]}
                onPress={() => handleFontSizeChange(1)}
              >
                <Text
                  style={[
                    styles.fontSizeText,
                    { color: fontSizeLevel === 1 ? 'white' : theme.textSecondary },
                  ]}
                >
                  A
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSizeLevel === 2 && { backgroundColor: theme.primaryLight },
                ]}
                onPress={() => handleFontSizeChange(2)}
              >
                <Text
                  style={[
                    styles.fontSizeText,
                    { fontSize: 18, color: fontSizeLevel === 2 ? 'white' : theme.textSecondary },
                  ]}
                >
                  A
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSizeLevel === 3 && { backgroundColor: theme.primaryLight },
                ]}
                onPress={() => handleFontSizeChange(3)}
              >
                <Text
                  style={[
                    styles.fontSizeText,
                    { fontSize: 22, color: fontSizeLevel === 3 ? 'white' : theme.textSecondary },
                  ]}
                >
                  A
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
        
        <Card>          <Text style={[styles.sectionTitle, { color: theme.primary }]}>{t('language')}</Text>          <View style={styles.settingItem}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>              {[
                { code: 'es', label: 'Español' },
                { code: 'en', label: 'English' },
                { code: 'fr', label: 'Français' },
                { code: 'de', label: 'Deutsch' },
                { code: 'it', label: 'Italiano' },
                { code: 'pt', label: 'Português' },
                { code: 'zh', label: '中文' }
              ].map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    {
                      marginRight: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.primary,
                    },
                    language === lang.code && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text style={[
                    styles.languageButtonText,
                    { fontSize: 16, color: theme.primary },
                    language === lang.code && { color: 'white', fontWeight: 'bold' }
                  ]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Card>
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Datos y privacidad</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="time-outline" size={22} color={theme.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Borrar historial de lectura</Text>
            </View>
            <Button
              title="Borrar"
              onPress={clearHistory}
              type="outlined"
              style={styles.actionButton}
            />
          </View>
          
          <View style={[styles.settingItem, styles.settingItemBorder, { borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="trash-outline" size={22} color={theme.error} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Borrar todos los datos</Text>
            </View>
            <Button
              title="Borrar todo"
              onPress={clearData}
              type="outlined"
              style={[styles.actionButton, { borderColor: theme.error }]}
              textStyle={{ color: theme.error }}
            />
          </View>
        </Card>
        
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Acerca de</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="information-circle-outline" size={22} color={theme.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Versión</Text>
            </View>
            <Text style={[styles.versionText, { color: theme.textSecondary }]}>1.0.0</Text>
          </View>
          
          <View style={[styles.settingItem, styles.settingItemBorder, { borderColor: theme.border }]}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="heart-outline" size={22} color={theme.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Hecho con ❤️</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 4,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  versionText: {
    fontSize: 14,
  },
  themeButtons: {
    flexDirection: 'row',
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  fontSizeButtons: {
    flexDirection: 'row',
  },
  fontSizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButton: {
    marginVertical: 0,
  },
});