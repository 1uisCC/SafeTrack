import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { collection, addDoc, getDoc, doc, serverTimestamp, onSnapshot, query, where, updateDoc, deleteDoc } from 'firebase/firestore'; 
import { db, auth } from '../../services/firebaseConfig'; 
import MapView, { Marker, Polyline } from 'react-native-maps';
import CustomAlert from '../../components/CustomAlert';

export default function MapaScreen() {
  const [showAlert, setShowAlert] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<any[]>([]);
  
  const [distanciaFaltante, setDistanciaFaltante] = useState<string | null>(null);
  const [destino, setDestino] = useState<{ latitude: number, longitude: number } | null>(null);

  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  useEffect(() => {
    let subscriber: Location.LocationSubscription;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        subscriber = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (loc) => {
            setLocation(loc);
            if (destino) {
              const km = calcularDistancia(loc.coords.latitude, loc.coords.longitude, destino.latitude, destino.longitude);
              setDistanciaFaltante(km);
            }
          }
        );
      }
      try {
        const userDoc = await getDoc(doc(db, "usuarios", auth.currentUser!.uid));
        if (userDoc.exists()) setNombreUsuario(userDoc.data().nombre);
      } catch (e) { console.error("Error al cargar perfil", e); }
      setLoading(false);
    })();

    const q = query(collection(db, "alertas_activas"), where("status", "in", ["pendiente", "en_revision"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlertas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { if (subscriber) subscriber.remove(); unsubscribe(); };
  }, [destino]);

  const revisarAlerta = async (idAlerta: string) => { await updateDoc(doc(db, "alertas_activas", idAlerta), { status: "en_revision" }); };
  
  const atenderAlerta = async (idAlerta: string) => {
    try { await deleteDoc(doc(db, "alertas_activas", idAlerta)); Alert.alert("✅ Asistencia confirmada"); }
    catch (error) { Alert.alert("Error", "No se pudo eliminar."); }
  };

  const handleSOS = async () => {
    if (!location) return Alert.alert("Error", "GPS no listo.");
    await addDoc(collection(db, "alertas_activas"), {
      userId: auth.currentUser?.uid, nombreEmisor: nombreUsuario,
      lat: location.coords.latitude, lng: location.coords.longitude,
      timestamp: serverTimestamp(), status: "pendiente"
    });
    setShowAlert(true);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ff3b30" /></View>;

  return (
    <View style={styles.container}>
      {alertas.length > 0 && (
        <View style={styles.bannerAlerta}><Text style={{color: 'white', fontWeight: 'bold'}}>{alertas.length} Emergencia(s) activa(s).</Text></View>
      )}
      
      {distanciaFaltante && (
        <View style={styles.bannerDistancia}><Text style={{color: 'white', fontWeight: 'bold'}}>Faltan: {distanciaFaltante} km</Text></View>
      )}

      <MapView
        style={styles.map}
        showsUserLocation={true}
        onPress={(e) => setDestino(e.nativeEvent.coordinate)}
        initialRegion={{
          latitude: location?.coords.latitude || 19.4326,
          longitude: location?.coords.longitude || -99.1332,
          latitudeDelta: 0.01, longitudeDelta: 0.01,
        }}
      >
        {destino && (
            <>
                <Marker coordinate={destino} title="Destino" pinColor="blue" />
                {location && <Polyline coordinates={[{latitude: location.coords.latitude, longitude: location.coords.longitude}, destino]} strokeWidth={4} strokeColor="#00d4ff" />}
            </>
        )}
        {alertas.filter((a) => a.userId !== auth.currentUser?.uid).map((alerta) => (
          <Marker 
            key={alerta.id} 
            coordinate={{ latitude: alerta.lat, longitude: alerta.lng }} 
            title={`SOS: ${alerta.nombreEmisor}`}
            pinColor={alerta.status === 'pendiente' ? 'red' : 'yellow'} 
            onPress={() => revisarAlerta(alerta.id)}
            onCalloutPress={() => Alert.alert("¿Ayudar?", "¿Ya estás con esta persona?", [{ text: "No" }, { text: "Sí", onPress: () => atenderAlerta(alerta.id) }])}
          />
        ))}
      </MapView>

      {destino && (
        <TouchableOpacity style={styles.cancelButton} onPress={() => {setDestino(null); setDistanciaFaltante(null);}}>
          <Text style={styles.cancelText}>Cancelar Destino</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.sosButton} onPress={handleSOS}><Text style={styles.sosButtonText}>SOS</Text></TouchableOpacity>

      <CustomAlert visible={showAlert} onClose={() => setShowAlert(false)} title="¡Enviado!" message="Se notificó tu emergencia." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  map: { flex: 1 },
  sosButton: { 
    position: 'absolute', bottom: 40, alignSelf: 'center',
    width: 85, height: 85, borderRadius: 42.5, backgroundColor: '#ff3b30',
    justifyContent: 'center', alignItems: 'center', elevation: 12 
  },
  sosButtonText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  bannerAlerta: { position: 'absolute', top: 60, width: '92%', alignSelf: 'center', backgroundColor: '#1e1e2d', padding: 16, borderRadius: 20, zIndex: 1 },
  bannerDistancia: { position: 'absolute', top: 135, width: '92%', alignSelf: 'center', backgroundColor: '#0d2522', padding: 12, borderRadius: 20, zIndex: 1 },
  cancelButton: { position: 'absolute', bottom: 140, alignSelf: 'center', backgroundColor: '#333', padding: 10, borderRadius: 15, borderWidth: 1, borderColor: '#ff3b30' },
  cancelText: { color: '#ff3b30', fontWeight: 'bold' }
});