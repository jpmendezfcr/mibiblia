import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Animación de entrada para listas
export const FadeInView: React.FC<{
  children: React.ReactNode;
  index?: number;
  style?: any;
}> = ({ children, index = 0, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Animación de pulso para elementos seleccionados
export const PulseView: React.FC<{
  children: React.ReactNode;
  style?: any;
  active?: boolean;
}> = ({ children, style, active = true }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    }
    
    return () => {
      scaleAnim.stopAnimation();
    };
  }, [active]);
  
  if (!active) {
    return <View style={style}>{children}</View>;
  }
  
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Loader animado personalizado
export const AnimatedLoader: React.FC<{
  size?: number;
  color?: string;
  thickness?: number;
}> = ({ size = 40, color = '#6a51ae', thickness = 4 }) => {
  const { theme } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const actualColor = color || theme.primary;
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: `${actualColor}50`,
          borderTopColor: actualColor,
          transform: [{ rotate: spin }],
        }}
      />
    </View>
  );
};

// Componente de card con efecto de presión
export const PressableCard: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}> = ({ children, onPress, style }) => {
  const { theme, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.pressableCard,
          {
            backgroundColor: theme.card,
            transform: [{ scale: scaleAnim }],
            shadowColor: isDark ? '#000' : '#000',
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Header con animación de desplazamiento
export const AnimatedHeader: React.FC<{
  title: string;
  scrollY: Animated.Value;
  maxHeight?: number;
  minHeight?: number;
}> = ({ title, scrollY, maxHeight = 180, minHeight = 70 }) => {
  const { theme, isDark } = useTheme();
  
  // Animaciones basadas en el scroll
  const headerHeight = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [maxHeight, minHeight],
    extrapolate: 'clamp',
  });
  
  const headerTextOpacity = scrollY.interpolate({
    inputRange: [0, (maxHeight - minHeight) / 2, maxHeight - minHeight],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  const headerTextSize = scrollY.interpolate({
    inputRange: [0, maxHeight - minHeight],
    outputRange: [24, 18],
    extrapolate: 'clamp',
  });
  
  return (
    <Animated.View
      style={[
        styles.animatedHeader,
        {
          height: headerHeight,
        },
      ]}
    >
      <LinearGradient
        colors={isDark ? 
          [theme.primaryDark, theme.primary] : 
          [theme.primary, theme.primaryLight]}
        style={styles.animatedHeaderGradient}
      >
        <Animated.Text
          style={[
            styles.animatedHeaderTitle,
            {
              opacity: headerTextOpacity,
              fontSize: headerTextSize,
            },
          ]}
        >
          {title}
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressableCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  animatedHeaderGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  animatedHeaderTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
});