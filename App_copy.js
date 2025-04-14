import React from 'react';
import { View, Text, StyleSheet,TextInput SafeAreaView,Modal } from 'react-native';

export default function App() {
  return (
    <View style={styles.conteiner}>
       
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
});
