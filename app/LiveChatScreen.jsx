import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';



export default function LiveChatScreen() {
  const router = useRouter();
  const { customerId, wsUrl: wsUrlParam } = useLocalSearchParams();

  // Cache one time, and only update if wsUrlParam changes
  const wsUrl = useMemo(
    // () => (wsUrlParam ? String(wsUrlParam) : 'wss://import-zum-york-quarter.trycloudflare.com/ws'),
    () => (wsUrlParam ? String(wsUrlParam) : 'ws://10.0.2.2:8000/ws'), // This is for emulator, normally is localhost
    [wsUrlParam]
  );


  const wsRef = useRef(null); // Stores the WebSoc instance
  const [connected, setConnected] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [queuePos, setQueuePos] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {id, conversationId, sender_role, content, ts}


  const appendMessage = useCallback((m) => {
    setMessages((prev) => {
      if (m?.id && prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m]; // Spread syntax to create new array and append new message
    });
  }, []); // Never Changes

  const connect = useCallback(() => {
    try {
      const url = wsUrl.includes('?') ? `${wsUrl}&role=customer` : `${wsUrl}?role=customer`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: 'hello', conversationId: null })); // Send over the new conversation request
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          switch (data.type) {
            case 'ready':
              if (data.conversationId) setConversationId(data.conversationId);
              break;
            case 'queue.update':
              setQueuePos(typeof data.position === 'number' ? data.position : null);
              break;
            case 'assigned':
              setQueuePos(null);
              break;
            case 'message.new':
              if (data.message) appendMessage(data.message);
              break;
            case 'ended':
              setQueuePos(null);
              setConnected(false);
              break;
            case 'error':
              console.warn('Server error:', data);
              break;
            default:
              break;
          }
        } catch (e) {
          console.warn('Bad JSON from server:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('WS error', e?.message || e);
      };

      ws.onclose = () => {
        setConnected(false);
      };
    } catch (e) {
      console.warn('WS connect failed', e);
    }
  }, [wsUrl, appendMessage]);


  // On mount, connect
  useEffect(() => {
    connect();
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [connect]);

  // Send message function
  const sendLine = useCallback(() => {
    const ws = wsRef.current;
    const text = String(input || '').trim();
    if (!ws || ws.readyState !== 1) return;
    if (!text) return;
    if (!conversationId) return;
    ws.send(JSON.stringify({ type: 'message.send', conversationId, content: text }));
    setInput('');
  }, [input, conversationId]);

  const endChat = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return;
    if (!conversationId) return;
    ws.send(JSON.stringify({ type: 'end', conversationId }));
  }, [conversationId]);

  // FlatList render item function
  const renderItem = ({ item }) => {
    const mine = item.sender_role === 'customer';
    return (
      <View style={[styles.messageContainer, mine ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.bubbleText, mine ? styles.myText : styles.theirText]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, mine ? styles.myTimestamp : styles.theirTimestamp]}>
            {new Date(item.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0e273c', '#1a3a5c']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0e273c" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>💬</Text>
                </View>
                <Text style={styles.title}>Live Support</Text>
              </View>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statusContainer}>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: connected ? '#4ade80' : '#ef4444' }]} />
                <Text style={styles.statusText}>
                  {connected ? 'Connected' : 'Connecting...'}
                </Text>
              </View>
              {conversationId && (
                <View style={styles.conversationBadge}>
                  <Text style={styles.conversationText}>Chat ID: {conversationId}</Text>
                </View>
              )}
              {queuePos != null && (
                <View style={styles.queueBadge}>
                  <Text style={styles.queueText}>Queue position: #{queuePos}</Text>
                </View>
              )}
            </View>
          </View>

        <View style={styles.chatContainer}>
          <FlatList
            data={messages}
            keyExtractor={(item, idx) => item.id || String(idx)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type your message here..."
              placeholderTextColor="#9ca3af"
              returnKeyType="send"
              onSubmitEditing={sendLine}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendLine}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={endChat}>
            <Text style={styles.endBtnText}>End Chat</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(220, 178, 78, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#dcb24e',
  },
  logoText: {
    fontSize: 24,
  },
  title: {
    color: '#fffffe',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(220, 178, 78, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dcb24e',
  },
  backButtonText: {
    fontSize: 14,
    color: '#dcb24e',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#fffffe',
    fontSize: 14,
    fontWeight: '500',
  },
  conversationBadge: {
    backgroundColor: 'rgba(220, 178, 78, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 178, 78, 0.4)',
  },
  conversationText: {
    color: '#dcb24e',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  queueBadge: {
    backgroundColor: 'rgba(220, 178, 78, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dcb24e',
  },
  queueText: {
    color: '#dcb24e',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listContent: {
    padding: 20,
    paddingBottom: 24,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myBubble: {
    backgroundColor: '#dcb24e',
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(220, 178, 78, 0.2)',
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  myText: {
    color: '#0e273c',
  },
  theirText: {
    color: '#0e273c',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  myTimestamp: {
    color: 'rgba(14, 39, 60, 0.7)',
    textAlign: 'right',
  },
  theirTimestamp: {
    color: '#9ca3af',
    textAlign: 'left',
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(220, 178, 78, 0.2)',
    shadowColor: '#0e273c',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    color: '#0e273c',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(220, 178, 78, 0.3)',
  },
  sendBtn: {
    backgroundColor: '#dcb24e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#dcb24e',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnText: {
    color: '#0e273c',
    fontWeight: '700',
    fontSize: 16,
  },
  endBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  endBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
