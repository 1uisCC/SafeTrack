import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, Linking, Modal } from 'react-native';
import * as Contacts from 'expo-contacts';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

export default function ContactosScreen() {
  const [misContactos, setMisContactos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el Modal Personalizado
  const [modalConfig, setModalConfig] = useState({
    visible: false, title: '', message: '', onConfirm: () => {}, showCancel: true,
  });

  useEffect(() => {
    const cargarContactos = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "usuarios", auth.currentUser.uid));
        if (userDoc.exists()) {
          setMisContactos(userDoc.data().contactosEmergencia || []);
        }
      } catch (e) {
        console.error("Error cargando contactos:", e);
      } finally {
        setLoading(false);
      }
    };
    cargarContactos();
  }, []);

  const pickContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Permiso denegado");

    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (contact?.phoneNumbers && contact.phoneNumbers.length > 0) {
        const nuevoContacto = {
          id: contact.id,
          name: contact.name,
          number: contact.phoneNumbers[0].number
        };

        if (misContactos.some(c => c.id === nuevoContacto.id)) {
          return setModalConfig({ visible: true, title: "Aviso", message: "Este contacto ya está en tu lista.", onConfirm: () => {}, showCancel: false });
        }

        await updateDoc(doc(db, "usuarios", auth.currentUser!.uid), {
          contactosEmergencia: arrayUnion(nuevoContacto)
        });
        setMisContactos([...misContactos, nuevoContacto]);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar el contacto.");
    }
  };

  const eliminarContacto = async (contacto: any) => {
    await updateDoc(doc(db, "usuarios", auth.currentUser!.uid), {
      contactosEmergencia: arrayRemove(contacto)
    });
    setMisContactos(misContactos.filter(c => c.id !== contacto.id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contactos de Emergencia</Text>
      
      <TouchableOpacity style={styles.addButton} onPress={pickContact}>
        <Text style={styles.buttonText}>+ Agregar de mi agenda</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color="#38bdf8" /> : (
        <FlatList 
          data={misContactos}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No tienes contactos guardados.</Text>}
          renderItem={({ item }) => (
            <View style={styles.contactItem}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${item.number}`)}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.number}>{item.number}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalConfig({ visible: true, title: "Eliminar", message: `¿Eliminar a ${item.name}?`, onConfirm: () => eliminarContacto(item), showCancel: true })}>
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal Personalizado "Pro" */}
      <Modal transparent={true} visible={modalConfig.visible} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.alertTitle}>{modalConfig.title}</Text>
            <Text style={styles.alertMessage}>{modalConfig.message}</Text>
            <View style={{ flexDirection: 'row' }}>
              {modalConfig.showCancel && (
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#475569' }]} onPress={() => setModalConfig({...modalConfig, visible: false})}>
                  <Text style={{color: 'white', fontWeight: 'bold'}}>No</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444', marginLeft: 10 }]} onPress={() => { modalConfig.onConfirm(); setModalConfig({...modalConfig, visible: false}); }}>
                <Text style={{color: 'white', fontWeight: 'bold'}}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0f172a' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  addButton: { backgroundColor: '#38bdf8', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#0f172a', fontWeight: 'bold' },
  contactItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 10, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  number: { color: '#94a3b8' },
  deleteText: { color: '#f43f5e', fontWeight: 'bold' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 50 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', backgroundColor: '#1e293b', padding: 25, borderRadius: 25, alignItems: 'center' },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  alertMessage: { color: '#cbd5e1', textAlign: 'center', marginBottom: 25, fontSize: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 15 }
});