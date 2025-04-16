import React from 'react';
import { View, Text, StyleSheet,TextInput,SafeAreaView,Modal } from 'react-native';
import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
const [setProgram, showProgram] = useState(false)
const [setEat, showEatPlan] = useState(false)
export default function App() {
  return (
    <View style={styles.conteiner}>
       <AntDesign name="addfile" size={24} color="black" />
       <MaterialCommunityIcons name="food-variant" size={24} color="black" />
  
       <AntDesign name="menuunfold" size={24} color="black" />
       
    </View>
  );
}
function createGymProgram(){
  return(
    <Modal visible = {showProgram}>
       <Text>Your program</Text>
    </Modal>
  )
}
function createEatPlan{
  return(
    <Modal visible = {showEatPlan}>
       <Text>Your program</Text>
    </Modal>
  )

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    display: "flex",
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
