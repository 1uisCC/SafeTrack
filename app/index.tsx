import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebaseConfig'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import DateTimePicker from '@react-native-community/datetimepicker';

import * as Notifications from 'expo-notifications';

// Al iniciar tu app, asegúrate de llamar a esto:


export default function IndexScreen() {

useEffect(() => {
  Notifications.requestPermissionsAsync();
}, []);


  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para Registro e Inicio
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNac, setFechaNac] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- Lógica de Registro Completa ---
  const handleRegister = async () => {
    if (!nombre || !email || !password || !telefono) return Alert.alert("Error", "Completa los campos obligatorios.");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        nombre, email, telefono, fechaNac, createdAt: new Date().toISOString()
      });
      // Guardado seguro para biometría futura
      await SecureStore.setItemAsync('userEmail', email);
      await SecureStore.setItemAsync('userPassword', password);
      
      Alert.alert("¡Éxito!", "Cuenta creada y vinculada al dispositivo.");
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.code === 'auth/email-already-in-use' ? "Correo en uso." : error.message);
    }
    setLoading(false);
  };

  // --- Lógica de Login con Biometría Vinculada ---
  const handleLogin = async (useBiometrics = false, targetEmail?: string, targetPass?: string) => {
    setLoading(true);
    try {
      const e = useBiometrics ? await SecureStore.getItemAsync('userEmail') : email;
      const p = useBiometrics ? await SecureStore.getItemAsync('userPassword') : password;
      
      if (!e || !p) throw new Error("No hay cuenta vinculada a este dispositivo.");

      await signInWithEmailAndPassword(auth, e, p);
      router.replace('/(tabs)/mapa');
    } catch (error) {
      Alert.alert("Error", "No se pudo iniciar sesión.");
    }
    setLoading(false);
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Acceder a SafeTrack' });
    if (result.success) handleLogin(true);
  };


  // Dentro de tu componente, agrega estos estados:
const [date, setDate] = useState(new Date());
const [showPicker, setShowPicker] = useState(false);

const onDateChange = (event, selectedDate) => {
  const currentDate = selectedDate || date;
  setShowPicker(Platform.OS === 'ios'); // En iOS se queda abierto
  setDate(currentDate);
  // Aquí guardas el valor en tu estado global del formulario
  setFechaNac(currentDate.toLocaleDateString()); 
};

  return (
    <View style={styles.container}>
      <Ionicons name="footsteps" size={80} color="#38bdf8" style={{ alignSelf: 'center' }} />
      <Text style={styles.title}>SafeTrack</Text>

      <View style={styles.inputContainer}>
        <TextInput placeholder="Correo" placeholderTextColor="#94a3b8" style={styles.input} onChangeText={setEmail} autoCapitalize="none" />
      </View>
      <View style={styles.inputContainer}>
        <TextInput placeholder="Contraseña" placeholderTextColor="#94a3b8" style={styles.input} secureTextEntry onChangeText={setPassword} />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => handleLogin()}><Text style={styles.buttonText}>Iniciar Sesión</Text></TouchableOpacity>
      
      <TouchableOpacity style={styles.bioButton} onPress={handleBiometricAuth}>
        <Ionicons name="finger-print" size={24} color="#38bdf8" />
        <Text style={{color: '#38bdf8', marginLeft: 10}}>Entrar con Huella</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setModalVisible(true)}><Text style={styles.registerLink}>¿No tienes cuenta? <Text style={{color: '#38bdf8'}}>Regístrate</Text></Text></TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Cuenta</Text>
            <TextInput placeholder="Nombre" style={styles.inputModal} onChangeText={setNombre} />
            <TextInput placeholder="Teléfono" style={styles.inputModal} keyboardType="phone-pad" onChangeText={setTelefono} />
           <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
           <Text > {date.toLocaleDateString()}  </Text>
           </TouchableOpacity>
                      {showPicker && (
                     <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                              />)}
            <TextInput placeholder="Correo" style={styles.inputModal} onChangeText={setEmail} autoCapitalize="none" />
            <TextInput placeholder="Contraseña" style={styles.inputModal} secureTextEntry onChangeText={setPassword} />
            <TouchableOpacity style={styles.button} onPress={handleRegister}><Text style={styles.buttonText}>Confirmar Registro</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelar}>Cancelar</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
// ... Mantén tus estilos actuales ...

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, alignItems: 'center' },
  input: { flex: 1, padding: 15, color: '#fff' },
  icon: { marginRight: 10 },
  button: { backgroundColor: '#38bdf8', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#0f172a', fontWeight: 'bold' },
  bioButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  registerLink: { color: '#fff', textAlign: 'center', marginTop: 20 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 24, marginBottom: 20, textAlign: 'center' },
  inputModal: { backgroundColor: '#334155', padding: 15, borderRadius: 10, color: '#fff', marginBottom: 10 },
  cancelar: { color: '#ef4444', textAlign: 'center', marginTop: 15 },
  dateButton: { backgroundColor: '#334155', padding: 15, borderRadius: 10, color: '#fff', marginBottom: 10 }
});