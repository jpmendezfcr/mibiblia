import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Componente para el header
export const Header: React.FC<{
  title: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  subtitle?: string;
}> = ({ title, leftIcon, rightIcon, onLeftPress, onRightPress, subtitle }) => {
  const { theme, isDark } = useTheme();
  
  return (
    <LinearGradient
      colors={isDark ? 
        [theme.primaryDark, theme.primary] : 
        [theme.primary, theme.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {leftIcon ? (
          <TouchableOpacity onPress={onLeftPress} style={styles.headerButton}>
            <Ionicons name={leftIcon as any} size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButtonPlaceholder} />
        )}
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          )}
        </View>
        
        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.headerButton}>
            <Ionicons name={rightIcon as any} size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButtonPlaceholder} />
        )}
      </View>
    </LinearGradient>
  );
};

// Componente de card estilizado
export const Card: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}> = ({ children, style, onPress }) => {
  const { theme, isDark } = useTheme();
  
  const cardStyle = {
    ...styles.card,
    backgroundColor: theme.card,
    shadowColor: isDark ? '#000000' : '#000000',
    ...style,
  };
  
  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }
  
  return <View style={cardStyle}>{children}</View>;
};

// Componente de botón estilizado
export const Button: React.FC<{
  title: string;
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  type?: 'primary' | 'secondary' | 'outlined';
  disabled?: boolean;
}> = ({ title, onPress, icon, style, textStyle, type = 'primary', disabled = false }) => {
  const { theme, isDark } = useTheme();
  
  let buttonColors: string[];
  let textColor: string;
  let buttonStyle: ViewStyle;
  
  switch (type) {
    case 'secondary':
      buttonColors = isDark ? ['#444444', '#555555'] : ['#e0e0e0', '#cccccc'];
      textColor = isDark ? theme.text : theme.textSecondary;
      buttonStyle = styles.button;
      break;
    case 'outlined':
      buttonColors = ['transparent', 'transparent'];
      textColor = theme.primary;
      buttonStyle = {
        ...styles.button,
        borderWidth: 1,
        borderColor: theme.primary,
      };
      break;
    default: // primary
      buttonColors = isDark ? 
        [theme.primaryDark, theme.primary] : 
        [theme.primary, theme.primaryLight];
      textColor = 'white';
      buttonStyle = styles.button;
  }
  
  if (disabled) {
    buttonColors = isDark ? ['#444444', '#444444'] : ['#cccccc', '#cccccc'];
    textColor = isDark ? '#666666' : '#888888';
  }
  
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      style={[buttonStyle, style]}
    >
      <LinearGradient
        colors={buttonColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buttonGradient}
      >
        {icon && <Ionicons name={icon as any} size={20} color={textColor} style={styles.buttonIcon} />}
        <Text style={[styles.buttonText, { color: textColor }, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Componente de input estilizado
export const Input: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: ViewStyle;
  icon?: string;
  secureTextEntry?: boolean;
  returnKeyType?: 'done' | 'search' | 'next' | 'go';
  onSubmitEditing?: () => void;
}> = ({ value, onChangeText, placeholder, style, icon, secureTextEntry, returnKeyType, onSubmitEditing }) => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: isDark ? '#222222' : '#f8f8f8' }, style]}>
      {icon && <Ionicons name={icon as any} size={20} color={theme.textSecondary} style={styles.inputIcon} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }]}
        secureTextEntry={secureTextEntry}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
};

// Componente de pantalla de carga
export const LoadingScreen: React.FC<{
  message?: string;
}> = ({ message = 'Cargando...' }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.primary }]}>{message}</Text>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 16,
    minHeight: 70,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerButton: {
    padding: 6,
    borderRadius: 20,
  },
  headerButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  button: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});