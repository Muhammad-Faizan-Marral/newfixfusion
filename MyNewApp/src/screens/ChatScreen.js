import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';

let socket = null;

export default function ChatScreen({ route }) {
  const { userId, technicianId } = route.params;
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef();
  const typingTimeoutRef = useRef();

  useEffect(() => {
    console.log('🔧 Initializing ChatScreen with:', { userId, technicianId });
    
    // Initialize socket connection
    socket = io('http://192.333.33.337:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Connected to server with ID:', socket.id);
      setIsConnected(true);
      
      // Join room after connection
      const roomId = getRoomId(userId, technicianId);
      console.log('🏠 Joining room:', roomId);
      socket.emit('joinRoom', roomId);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setIsConnected(false);
    });

    socket.on('roomJoined', (data) => {
      console.log('🏠 Room joined successfully:', data);
    });

    // Listen for incoming messages
    socket.on('receiveMessage', (data) => {
      console.log('📨 Received message:', data);
      
      // Add to chat (avoid duplication by checking if message already exists)
      setChat((prevChat) => {
        const messageExists = prevChat.some(msg => 
          msg.id === data.id || 
          (msg.senderId === data.senderId && 
           msg.receiverId === data.receiverId && 
           Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 1000)
        );
        
        if (!messageExists) {
          return [...prevChat, data];
        }
        return prevChat;
      });
    });

    // Listen for message sent confirmation
    socket.on('messageSent', (data) => {
      console.log('✅ Message sent confirmation:', data);
    });

    // Listen for message errors
    socket.on('messageError', (error) => {
      console.error('❌ Message error:', error);
      Alert.alert('Error', error.error || 'Failed to send message');
    });

    // Listen for typing status
    socket.on('userTyping', (data) => {
      if (data.senderId !== userId) {
        setIsTyping(data.isTyping);
      }
    });

    // Request location permission on mount
    requestLocationPermission();

    // Load previous messages
    loadPreviousMessages();

    return () => {
      if (socket) {
        const roomId = getRoomId(userId, technicianId);
        socket.emit('leaveRoom', roomId);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('receiveMessage');
        socket.off('messageSent');
        socket.off('messageError');
        socket.off('roomJoined');
        socket.off('userTyping');
        socket.disconnect();
        socket = null;
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, technicianId]);

  const requestLocationPermission = async () => {
    try {
      console.log('📍 Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      console.log('📍 Location permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location permission is needed to share your location in chat.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      setLocationPermission(false);
    }
  };

  const getRoomId = (id1, id2) => {
    return [id1, id2].sort().join('-');
  };

  const loadPreviousMessages = async () => {
    try {
      setIsLoading(true);
      console.log(`🔄 Loading messages between ${userId} and ${technicianId}`);
      
      const response = await fetch(
        `http://192.333.33.337:5000/api/messages/${userId}/${technicianId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const previousMessages = await response.json();
        console.log(`📚 Loaded ${previousMessages.length} previous messages`);
        setChat(previousMessages);
        
        // Mark messages as read
        markMessagesAsRead();
      } else {
        const errorData = await response.json();
        console.error('⚠️ Error loading messages:', errorData);
      }
    } catch (error) {
      console.error('❌ Error loading previous messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await fetch('http://192.333.33.337:5000/api/messages/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          technicianId: technicianId
        }),
      });
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLocationLoading(true);
      console.log('📍 Getting current location...');
      
      if (!locationPermission) {
        Alert.alert('Permission Required', 'Please grant location permission first.');
        await requestLocationPermission();
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });

      console.log('📍 Location obtained:', location.coords);

      // Get address from coordinates
      let address = 'Location shared';
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode && reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          address = `${place.name || ''} ${place.street || ''} ${place.city || ''} ${place.region || ''}`.trim();
        }
      } catch (geoError) {
        console.warn('⚠️ Reverse geocoding failed:', geoError);
      }

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString(),
      };

      console.log('📍 Final location data:', locationData);
      return locationData;
    } catch (error) {
      console.error('❌ Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get current location. Please try again.');
      return null;
    } finally {
      setIsLocationLoading(false);
    }
  };

  const sendLocationMessage = async () => {
    if (!isConnected) {
      Alert.alert('Connection Error', 'Not connected to server. Please wait...');
      return;
    }

    console.log('📍 Starting location share process...');
    const locationData = await getCurrentLocation();
    if (!locationData) {
      console.log('❌ Location data not available');
      return;
    }

    const locationMessage = {
      senderId: parseInt(userId),
      receiverId: parseInt(technicianId),
      message: `📍 ${locationData.address}`,
      messageType: 'location',
      locationData: locationData,
      timestamp: new Date().toISOString(),
    };

    console.log('📍 Sending location message:', locationMessage);

    // Add to local chat immediately for better UX
    setChat((prevChat) => [...prevChat, locationMessage]);
    
    // Emit to server
    if (socket) {
      socket.emit('sendMessage', locationMessage);
    } else {
      console.error('❌ Socket not available');
      Alert.alert('Error', 'Connection not available');
    }
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage === '') return;
    
    if (!isConnected) {
      Alert.alert('Connection Error', 'Not connected to server. Please wait...');
      return;
    }

    if (!socket) {
      Alert.alert('Error', 'Socket connection not available');
      return;
    }

    const newMessage = {
      senderId: parseInt(userId),
      receiverId: parseInt(technicianId),
      message: trimmedMessage,
      messageType: 'text',
      timestamp: new Date().toISOString(),
    };

    console.log('📤 Sending text message:', newMessage);

    // Add to local chat immediately for better UX
    setChat((prevChat) => [...prevChat, newMessage]);
    
    // Emit to server
    socket.emit('sendMessage', newMessage);
    
    // Clear input
    setMessage('');
    
    // Stop typing indicator
    handleTyping(false);
  };

  const handleTyping = (typing) => {
    if (socket && isConnected) {
      socket.emit('typing', {
        senderId: userId,
        receiverId: technicianId,
        isTyping: typing
      });
    }
  };

  const onMessageInputChange = (text) => {
    setMessage(text);
    
    // Handle typing indicator
    handleTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 1000);
  };

  const openLocationInMaps = (locationData) => {
    const { latitude, longitude, address } = locationData;
    
    Alert.alert(
      'Open Location',
      `Address: ${address}\nLat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apple Maps',
          onPress: () => {
            const url = `maps:${latitude},${longitude}?q=${encodeURIComponent(address)}`;
            Linking.openURL(url);
          }
        },
        {
          text: 'Google Maps',
          onPress: () => {
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            Linking.openURL(googleMapsUrl);
          }
        }
      ]
    );
  };

  const renderLocationMessage = (item) => (
    <TouchableOpacity
      style={[
        styles.messageContainer,
        item.senderId === userId ? styles.userMessage : styles.technicianMessage,
        styles.locationMessage
      ]}
      onPress={() => openLocationInMaps(item.locationData)}
    >
      <View style={styles.locationContent}>
        <Ionicons 
          name="location" 
          size={20} 
          color={item.senderId === userId ? '#fff' : '#007bff'} 
        />
        <View style={styles.locationTextContainer}>
          <Text style={[
            styles.messageText,
            item.senderId === userId ? styles.userMessageText : styles.technicianMessageText,
            styles.locationMessageText
          ]}>
            {item.locationData.address}
          </Text>
          <Text style={[
            styles.locationCoords,
            item.senderId === userId ? styles.userMessageText : styles.technicianMessageText
          ]}>
            {item.locationData.latitude.toFixed(6)}, {item.locationData.longitude.toFixed(6)}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.timestamp,
        item.senderId === userId ? styles.userTimestamp : styles.technicianTimestamp
      ]}>
        {new Date(item.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </TouchableOpacity>
  );

  const renderTextMessage = (item) => (
    <View
      style={[
        styles.messageContainer,
        item.senderId === userId ? styles.userMessage : styles.technicianMessage,
      ]}
    >
      <Text style={[
        styles.messageText,
        item.senderId === userId ? styles.userMessageText : styles.technicianMessageText
      ]}>
        {item.message}
      </Text>
      <Text style={[
        styles.timestamp,
        item.senderId === userId ? styles.userTimestamp : styles.technicianTimestamp
      ]}>
        {new Date(item.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    if (item.messageType === 'location' && item.locationData) {
      return renderLocationMessage(item);
    }
    return renderTextMessage(item);
  };

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (chat.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chat]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.wrapper, styles.centered]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Connection Status */}
        <View style={[styles.statusBar, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>

        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={chat}
          keyExtractor={(item, index) => item.id?.toString() || `${item.senderId}-${item.timestamp}-${index}`}
          renderItem={renderItem}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>typing...</Text>
            <ActivityIndicator size="small" color="#007bff" />
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={onMessageInputChange}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[styles.locationButton, { opacity: isLocationLoading ? 0.5 : 1 }]}
            onPress={sendLocationMessage}
            disabled={isLocationLoading || !isConnected}
          >
            {isLocationLoading ? (
              <ActivityIndicator size="small" color="#007bff" />
            ) : (
              <Ionicons name="location" size={24} color="#007bff" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sendButton, { opacity: message.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!message.trim() || !isConnected}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statusBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    borderBottomRightRadius: 4,
  },
  technicianMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationMessage: {
    minWidth: 200,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  technicianMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  technicianTimestamp: {
    color: '#666',
    textAlign: 'left',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationMessageText: {
    fontWeight: '500',
  },
  locationCoords: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom:23,

  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});