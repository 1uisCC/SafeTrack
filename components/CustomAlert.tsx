import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomAlert({ visible, onClose, title, message }) {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name="checkmark-circle" size={50} color="#22c55e" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}



const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '85%',
    backgroundColor: 'rgba(35, 34, 34, 0.95)', // El efecto "transparentoso"
    borderRadius: 25, // Bordes muy redondos
    padding: 30,
    alignItems: 'center',
    elevation: 10, // Sombras
  },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 10, color: '#ffffff' },
  message: { textAlign: 'center', color: '#f6f7f8', marginBottom: 20 },
  button: { backgroundColor: '#000000', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 20 },
  buttonText: { color: '#fff', fontWeight: '600' }
});