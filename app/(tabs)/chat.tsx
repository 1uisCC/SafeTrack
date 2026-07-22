import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import botData from '../../services/botResponses.json'; 

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hola, soy tu asistente de SafeTrack. ¿En qué puedo apoyarte hoy?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;

    const userText = input.toLowerCase();
    const newUserMsg = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');

    setTimeout(() => {
      // Búsqueda en el JSON
      let botResponse = botData.default;
      const match = botData.keywords.find(item => 
        item.trigger.some(word => userText.includes(word))
      );
      
      if (match) botResponse = match.response;

      const newBotMsg = { id: (Date.now() + 1).toString(), text: botResponse, sender: 'bot' };
      setMessages(prev => [...prev, newBotMsg]);
    }, 600);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Escribe algo..." 
          placeholderTextColor="#64748b" 
          value={input} 
          onChangeText={setInput} 
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  bubble: { padding: 15, borderRadius: 18, marginVertical: 6, maxWidth: '80%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#38bdf8' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#1e293b' },
  text: { color: '#fff', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155' },
  input: { flex: 1, color: '#fff', paddingHorizontal: 10 },
  sendBtn: { backgroundColor: '#38bdf8', padding: 12, borderRadius: 25 }
});