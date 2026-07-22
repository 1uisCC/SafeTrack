import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebaseConfig';
import { uploadImageToCloudinary } from '../../services/cloudinaryConfig';

export default function EvidenciaScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    const q = query(collection(db, "evidencias"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvidencias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePictureAsync();
        if (photoData) setPhoto(photoData.uri);
      } catch (error) {
        Alert.alert("Error", "No se pudo tomar la foto.");
      }
    }
  };

  const subirEvidencia = async () => {
    if (!photo) return;
    setUploading(true);
    
    try {
      console.log("Iniciando subida a Cloudinary...");
      const res = await uploadImageToCloudinary(photo);
      
      console.log("Respuesta completa de Cloudinary:", JSON.stringify(res));

      // Verificamos si Cloudinary devolvió un error
      if (res && res.error) {
        throw new Error(res.error.message || "Error desconocido del servidor");
      }

      // Extraemos la URL de forma segura
      const urlFinal = res?.secure_url || res?.url;

      if (!urlFinal) {
        throw new Error("No se pudo obtener la URL de la imagen. Verifica tu configuración de Cloudinary.");
      }

      await addDoc(collection(db, "evidencias"), {
        userId: auth.currentUser?.uid || "anonimo",
        url: urlFinal, 
        fecha: new Date().toISOString(),
      });
      
      setPhoto(null);
      Alert.alert("¡Éxito!", "Evidencia registrada.");
      
    } catch (e: any) {
      console.error("Error al subir:", e.message);
      Alert.alert("Error de subida", e.message || "No se pudo completar la subida.");
    } finally {
      setUploading(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{color:'#fff', marginBottom: 20}}>Se requiere permiso de cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}><Text style={{color:'#fff'}}>Dar permisos</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {photo ? (
        <View style={styles.preview}>
          <Image source={{ uri: photo }} style={{ flex: 1, borderRadius: 15 }} />
          <View style={styles.row}>
            <TouchableOpacity onPress={() => setPhoto(null)} style={[styles.btn, {backgroundColor:'#ef4444'}]}><Text style={{color:'#fff'}}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity onPress={subirEvidencia} style={[styles.btn, {backgroundColor:'#22c55e'}]}>
                {uploading ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff'}}>Publicar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <CameraView style={styles.camera} ref={cameraRef}>
          <TouchableOpacity style={styles.capture} onPress={takePicture} />
        </CameraView>
      )}

      <FlatList
        data={evidencias}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Validamos que item.url sea un string antes de renderizar */}
            {typeof item.url === 'string' && (
              <Image source={{ uri: item.url }} style={styles.thumb} />
            )}
            <Text style={{color:'#94a3b8', fontSize:12, marginTop:5}}>Reportado el: {new Date(item.fecha).toLocaleDateString()}</Text>
          </View>
        )}
        ListHeaderComponent={<Text style={styles.title}>Historial de Evidencias</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { height: 250, margin: 20, borderRadius: 20, overflow: 'hidden' },
  capture: { position:'absolute', bottom:20, alignSelf:'center', width:60, height:60, borderRadius:30, backgroundColor:'#fff', borderWidth: 5, borderColor: '#38bdf8' },
  preview: { height: 300, margin: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { padding: 15, borderRadius: 10, flex: 0.48, alignItems: 'center', backgroundColor:'#38bdf8' },
  title: { color:'#fff', fontSize: 20, fontWeight:'bold', marginHorizontal: 20, marginBottom: 10, marginTop: 10 },
  card: { backgroundColor:'#1e293b', marginHorizontal:20, marginBottom:15, padding:10, borderRadius:15 },
  thumb: { width:'100%', height:150, borderRadius:10, backgroundColor: '#334155' }
});