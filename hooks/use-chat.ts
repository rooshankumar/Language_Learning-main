
import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import { startChat } from '@/lib/chat-service';
import { Firestore } from 'firebase/firestore';

// Define message type
export interface Message {
  id?: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
  chatId?: string;
  text?: string; // Added for compatibility with chat-window.tsx
}

// Define recipient profile type
export interface RecipientProfile {
  photoURL?: string;
  displayName?: string;
  isOnline?: boolean;
}

// Define chat hook return type
interface UseChatReturn {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  recipientProfile?: RecipientProfile;
  createOrGetChat?: (recipientId: string) => Promise<string>;
}

export function useChat(chatId: string, recipientId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Fetch recipient profile
  useEffect(() => {
    if (!user || !recipientId) return;
    
    const fetchRecipientProfile = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        if (!db) return;

        const userDoc = await getDoc(doc(db as Firestore, 'users', recipientId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRecipientProfile({
            photoURL: userData.photoURL,
            displayName: userData.displayName || 'User',
            isOnline: userData.isOnline || false
          });
        }
      } catch (err) {
        console.error("Error fetching recipient profile:", err);
      }
    };
    
    fetchRecipientProfile();
  }, [recipientId, user]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    try {
      if (!user || !content.trim()) return;
      
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      if (!db) return;

      const message: Message = {
        senderId: user.uid,
        senderName: user.displayName || 'User',
        recipientId,
        content,
        timestamp: new Date().toISOString(),
        read: false,
        text: content // For compatibility with chat-window.tsx
      };
      
      // Save message to Firestore
      await addDoc(collection(db as Firestore, "chats", chatId, "messages"), {
        ...message,
        timestamp: serverTimestamp(),
      });
      
      // Optionally emit via socket if real-time
      if (socketRef.current) {
        socketRef.current.emit('send_message', message);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  }, [chatId, recipientId, user]);

  const createOrGetChat = useCallback(async (recipientId: string): Promise<string> => {
    try {
      if (!user) throw new Error('User must be authenticated');
      
      const { collection, query, where, getDocs, addDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      if (!db) throw new Error('Database not initialized');

      // Check for existing chat
      const chatsRef = collection(db as Firestore, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const existingChat = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(recipientId);
      });

      if (existingChat) {
        return existingChat.id;
      }

      // Create new chat if none exists
      const newChatRef = await addDoc(chatsRef, {
        participants: [user.uid, recipientId],
        createdAt: new Date().toISOString(),
        lastMessage: null
      });

      return newChatRef.id;
    } catch (err) {
      console.error('Error creating/getting chat:', err);
      throw err;
    }
  }, [user]);

  return {
    messages,
    sendMessage,
    loading,
    error,
    recipientProfile: recipientProfile || undefined,
    createOrGetChat
  };

}

// Helper function for community page to create a chat with another user
export async function createChat(userId: string, userName: string, recipientId: string): Promise<string> {
  try {
    // Use the existing startChat function which only takes recipientId
    return await startChat(recipientId);
  } catch (err) {
    console.error('Error creating chat:', err);
    throw err;
  }
}

interface UseChatSocketReturn {
  socket: Socket | null;
  connected: boolean;
  messages: Message[];
  sendMessage: (recipientId: string, content: string, chatId?: string) => void;
  markAsRead: (chatId: string) => void;
  setTyping: (recipientId: string, isTyping: boolean) => void;
  isUserTyping: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

export function useChatSocket(): UseChatSocketReturn {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUserTyping, setIsUserTyping] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store typing timeout IDs
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';
    const socketClient = io(SOCKET_URL);

    socketClient.on('connect', () => {
      console.log('Socket connected');
      // Authenticate with socket server
      socketClient.emit('authenticate', {
        uid: user.uid,
        displayName: user.displayName || 'User'
      });
    });

    socketClient.on('authenticated', () => {
      console.log('Socket authenticated');
      setConnected(true);
      setLoading(false);
    });

    socketClient.on('auth_error', (err) => {
      console.error('Socket authentication error:', err);
      setError('Authentication error with chat server');
      setLoading(false);
    });

    socketClient.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketClient.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'Error with chat connection');
    });

    socketClient.on('new_message', (message: Message) => {
      console.log('New message received:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    socketClient.on('message_sent', (message: Message) => {
      console.log('Message sent confirmation:', message);
      // This ensures we don't duplicate messages that might also come from Firestore
      setMessages(prevMessages => {
        // Check if we already have this message (by comparing content and timestamp)
        const exists = prevMessages.some(
          m => m.senderId === message.senderId && 
               m.content === message.content && 
               m.timestamp === message.timestamp
        );
        
        if (exists) return prevMessages;
        return [...prevMessages, message];
      });
    });

    socketClient.on('user_typing', ({ userId, isTyping }) => {
      setIsUserTyping(prev => ({
        ...prev,
        [userId]: isTyping
      }));
      
      // Clear typing indicator after 3 seconds if no updates
      if (isTyping && typingTimeouts.current[userId]) {
        clearTimeout(typingTimeouts.current[userId]);
      }
      
      if (isTyping) {
        typingTimeouts.current[userId] = setTimeout(() => {
          setIsUserTyping(prev => ({
            ...prev,
            [userId]: false
          }));
        }, 3000);
      }
    });

    setSocket(socketClient);

    // Cleanup on unmount
    return () => {
      Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout));
      socketClient.disconnect();
    };
  }, [user]);

  // Function to send a message
  const sendMessage = useCallback((recipientId: string, content: string, chatId?: string) => {
    if (!socket || !connected || !user) {
      setError('Cannot send message: not connected');
      return;
    }

    const timestamp = new Date().toISOString();
    
    socket.emit('send_message', {
      recipientId,
      content,
      timestamp,
      chatId
    });
  }, [socket, connected, user]);

  // Function to mark messages as read
  const markAsRead = useCallback((chatId: string) => {
    if (!socket || !connected || !user) return;
    
    socket.emit('mark_as_read', { chatId });
  }, [socket, connected, user]);

  // Function to indicate typing status
  const setTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (!socket || !connected || !user) return;
    
    socket.emit('typing', { recipientId, isTyping });
  }, [socket, connected, user]);

  return {
    socket,
    connected,
    messages,
    sendMessage,
    markAsRead,
    setTyping,
    isUserTyping,
    loading,
    error
  };
}
