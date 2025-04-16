import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, SafeAreaView, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';

const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export default function App() {
  const [showProgram, setProgram] = useState(false);
  const [showEatPlan, setEat] = useState(false);

  const keyExtractor = (item, index) => index.toString();
  const renderItem = ({ item }) => <Text style={{ color: 'white' }}>{item}</Text>;

  return (
    <View style={styles.container}>
      <AntDesign name="addfile" size={24} color="white" onPress={() => setProgram(true)} />
      <MaterialCommunityIcons name="food-variant" size={24} color="white" onPress={() => setEat(true)} />
      <AntDesign name="menuunfold" size={24} color="white" />

      {/* Модальне вікно програми тренувань */}
      <Modal visible={showProgram} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Твоя програма</Text>
          <FlatList
            data={days}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
          <TextInput placeholder="Введи вправу" style={styles.input} placeholderTextColor="#ccc" />
          <AntDesign name="close" size={24} color="white" onPress={() => setProgram(false)} />
        </View>
      </Modal>

      {/* Модальне вікно харчування */}
      <Modal visible={showEatPlan} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.title}>План харчування</Text>
          <FlatList
             data={days}
             keyExtractor={keyExtractor}
             renderItem={renderItem}
          />
          <TextInput placeholder="Введи вправу" style={styles.input} placeholderTextColor="#ccc" />
          <AntDesign name="close" size={24} color="white" onPress={() => setProgram(false)} />
          <TextInput placeholder="Введи їжу" style={styles.input} placeholderTextColor="#ccc" />
          <AntDesign name="close" size={24} color="white" onPress={() => setEat(false)} />
        </View>
      </Modal>
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
    color: '#fff',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    padding: 10,
    marginVertical: 10,
    width: '80%',
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000dd',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
