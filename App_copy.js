import React, { useState } from 'react';
import {View,Text,StyleSheet, TextInput,Modal,FlatList,TouchableOpacity} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function App() {
  const [showProgram, setProgram] = useState(false);
  const [showEatPlan, setEat] = useState(false);

  const [exerciseInput, setExerciseInput] = useState('');
  const [exerciseList, setExerciseList] = useState([]);

  const [foodInput, setFoodInput] = useState('');
  const [foodList, setFoodList] = useState([]);

  const addExercise = () => {
    if (exerciseInput.trim() !== '') {
      setExerciseList([...exerciseList, exerciseInput]);
      setExerciseInput('');
    }
  };

  const addFood = () => {
    if (foodInput.trim() !== '') {
      setFoodList([...foodList, foodInput]);
      setFoodInput('');
    }
  };

  const keyExtractor = (item, index) => index.toString();
  const renderItem = ({ item }) => <Text style={styles.listItem}>{item}</Text>;

  return (
    <View style={styles.container}>
      {/* Модальне вікно програми тренувань */}
      <Modal visible={showProgram} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Твоя програма</Text>
          <FlatList
            data={exerciseList}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
          <TextInput
            placeholder="Введи вправу"
            value={exerciseInput}
            onChangeText={setExerciseInput}
            style={styles.input}
            placeholderTextColor="#ccc"
          />
          <TouchableOpacity onPress={addExercise}>
            <Text style={styles.button}>Додати</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setProgram(false)}>
            <AntDesign name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Модальне вікно харчування */}
      <Modal visible={showEatPlan} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.title}>План харчування</Text>
          <FlatList
            data={foodList}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
          <TextInput
            placeholder="Введи їжу"
            value={foodInput}
            onChangeText={setFoodInput}
            style={styles.input}
            placeholderTextColor="#ccc"
          />
          <TouchableOpacity onPress={addFood}>
            <Text style={styles.button}>Додати</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEat(false)}>
            <AntDesign name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Нижня панель з кнопками */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => setProgram(true)} style={styles.iconButton}>
          <AntDesign name="addfile" size={24} color="white" />
          <Text style={styles.iconLabel}>Тренування</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setEat(true)} style={styles.iconButton}>
          <MaterialCommunityIcons name="food-variant" size={24} color="white" />
          <Text style={styles.iconLabel}>Харчування</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <AntDesign name="menuunfold" size={24} color="white" />
          <Text style={styles.iconLabel}>Меню</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'flex-end',
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
  button: {
    backgroundColor: '#555',
    color: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  listItem: {
    color: 'white',
    fontSize: 16,
    padding: 5,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  iconButton: {
    alignItems: 'center',
  },
  iconLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
});
