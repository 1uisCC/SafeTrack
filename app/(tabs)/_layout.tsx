import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Colores base de tu icono (Azul/Cian)
        tabBarActiveTintColor: '#c7d015', 
        tabBarInactiveTintColor: '#888888',
        
        // Estilo de fondo para que se vea Pro y oscuro
        tabBarStyle: {
          backgroundColor: '#000000', // Fondo oscuro como tu MapaScreen
          borderTopColor: '#000000',
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 60,
        },
        
        // Estilo del Header para que combine
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerTintColor: '#e28a0e',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen name="mapa" options={{ title: 'Mapa', tabBarIcon: ({color}) => <Ionicons name="map" size={24} color={color} /> }} />
      <Tabs.Screen name="contactos" options={{ title: 'Contactos', tabBarIcon: ({color}) => <Ionicons name="people" size={24} color={color} /> }} />
      <Tabs.Screen name="evidencia" options={{ title: 'Evidencia', tabBarIcon: ({color}) => <Ionicons name="camera" size={24} color={color} /> }} />
      <Tabs.Screen name="feed" options={{ title: 'Social', tabBarIcon: ({color}) => <Ionicons name="share-social-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: ({color}) => <Ionicons name="settings" size={24} color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Asistencia', tabBarIcon: ({color}) => <Ionicons name="chatbubbles" size={24} color={color} /> }} />
    </Tabs>
  );
}