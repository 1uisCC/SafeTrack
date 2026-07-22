import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Modal, TextInput, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Accelerometer } from 'expo-sensors';
import { uploadImageToCloudinary } from '../../services/cloudinaryConfig';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function AjustesScreen() {
  const [caidas, setCaidas] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertaVisible, setAlertaVisible] = useState(false);
  const [segundos, setSegundos] = useState(10);
  const [uploading, setUploading] = useState(false);
  
  const [nombre, setNombre] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, "usuarios", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setNombre(data.nombre || '');
        setFotoPerfil(data.fotoPerfil || '');
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.replace('/');
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { nombre, fotoPerfil });
      setModalVisible(false);
      Alert.alert("¡Éxito!", "Perfil actualizado.");
    } catch (e) { Alert.alert("Error", "No se pudo actualizar."); }
  };

  const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({ 
    allowsEditing: true, 
    aspect: [1, 1], 
    quality: 0.5 
  });

  // 1. Verificamos que no esté cancelado Y que assets exista
  if (!result.canceled && result.assets && result.assets.length > 0 && auth.currentUser) {
    setUploading(true);
    try {
      // 2. Accedemos de forma segura al primer elemento
      const imageUri = result.assets[0].uri;
      const data = await uploadImageToCloudinary(imageUri);
      
      const url = data?.secure_url || data?.url;
      
      if (typeof url === 'string') {
        setFotoPerfil(url);
        await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { fotoPerfil: url });
        Alert.alert("Éxito", "Foto actualizada");
      } else {
        throw new Error("No se obtuvo una URL válida de Cloudinary");
      }
    } catch (e: any) { 
      console.error("Error completo:", e);
      Alert.alert("Error", "No se pudo subir: " + e.message); 
    } finally {
      setUploading(false);
    }
  } else if (result.canceled) {
    console.log("El usuario canceló la selección");
  } else {
    Alert.alert("Error", "No se pudo acceder a la imagen seleccionada.");
  }
};

  const toggleCaidas = (value: boolean) => {
    setCaidas(value);
    if (value) {
      Accelerometer.setUpdateInterval(500);
      Accelerometer.addListener((data) => {
        const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
        if (magnitude > 3.5 && !alertaVisible) setAlertaVisible(true);
      });
    } else {
      Accelerometer.removeAllListeners();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Configuración</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Perfil</Text>
        <TouchableOpacity style={styles.profileCard} onPress={() => setModalVisible(true)}>
          {fotoPerfil ? <Image source={{ uri: fotoPerfil }} style={styles.avatar} /> : 
            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={30} color="#94a3b8" /></View>}
          <View>
            <Text style={styles.name}>{nombre || 'Usuario'}</Text>
            <Text style={styles.subtext}>Editar perfil</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Seguridad</Text>
        <View style={styles.option}>
          <Text style={styles.optionText}>Detección de Caídas</Text>
          <Switch value={caidas} onValueChange={toggleCaidas} trackColor={{true: '#38bdf8'}} />
        </View>

        <Text style={styles.sectionHeader}>Asistencia</Text>
        <TouchableOpacity style={styles.option} onPress={() => router.push('/chat')}>
          <Text style={styles.optionText}>Asistente (Chatbot)</Text>
          <Ionicons name="chatbubble-ellipses" size={20} color="#38bdf8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Perfil */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={pickImage} style={{alignSelf: 'center', marginBottom: 20}}>
              {uploading ? <ActivityIndicator color="#38bdf8" /> : 
                (fotoPerfil ? <Image source={{ uri: fotoPerfil }} style={styles.avatarLarge} /> : 
                <View style={styles.avatarLargePlaceholder}><Ionicons name="camera" size={40} color="#94a3b8" /></View>)}
            </TouchableOpacity>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#94a3b8" />
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}><Text style={styles.saveButtonText}>Guardar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}><Text style={{color:'#fff'}}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Alerta */}
      <Modal visible={alertaVisible} transparent={true} animationType="fade">
        <View style={styles.alertaContainer}>
          <Text style={styles.alertaTitle}>¡CUIDADO!</Text>
          <TouchableOpacity onPress={() => setAlertaVisible(false)} style={styles.btnBien}><Text style={styles.btnBienText}>ESTOY BIEN</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 20 },
  sectionHeader: { color: '#64748b', fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  option: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: 20, borderRadius: 15, alignItems: 'center' },
  optionText: { color: '#fff', fontSize: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#334155', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  name: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  subtext: { color: '#94a3b8', fontSize: 12 },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, padding: 15, backgroundColor: '#1e293b', borderRadius: 15 },
  logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', padding: 25, borderRadius: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  avatarLarge: { width: 110, height: 110, borderRadius: 55 },
  avatarLargePlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#475569', justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  saveButton: { backgroundColor: '#38bdf8', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#0f172a', fontWeight: 'bold' },
  closeButton: { marginTop: 15, alignItems: 'center' },
  alertaContainer: { flex: 1, backgroundColor: '#991b1b', justifyContent: 'center', alignItems: 'center' },
  alertaTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  btnBien: { backgroundColor: '#fff', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  btnBienText: { color: '#991b1b', fontWeight: 'bold', fontSize: 16 }
});