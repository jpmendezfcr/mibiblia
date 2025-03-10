import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DebugLogger from '../services/DebugLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    DebugLogger.error(`Uncaught error: ${error.message}\nStack trace: ${errorInfo.componentStack}`);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Lo sentimos, ha ocurrido un error inesperado.</Text>
          <Text style={styles.subText}>Por favor, intente lo siguiente:</Text>
          <Text style={styles.bullet}>• Cierre completamente la aplicación</Text>
          <Text style={styles.bullet}>• Verifique su conexión a internet</Text>
          <Text style={styles.bullet}>• Vuelva a abrir la aplicación</Text>
          <Text style={styles.note}>Si el problema persiste, por favor contacte con soporte.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#E53935',
  },
  subText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  bullet: {
    fontSize: 16,
    textAlign: 'left',
    color: '#666',
    marginBottom: 8,
    width: '100%',
    paddingLeft: 40,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default ErrorBoundary;
