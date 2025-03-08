import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const { user } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      // Create socket connection
      const socket = io('/', {
        path: '/api/socket',
        autoConnect: true,
        auth: {
          userId: user.id
        }
      });

      socketRef.current = socket;

      // Socket event handlers
      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        setError(error.message || 'An error occurred');
      });

      socket.on('message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      // Clean up on unmount
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [user]);

  // Send message function
  const sendMessage = useCallback((content, chatId, attachments = []) => {
    if (!socketRef.current || !isConnected || !user) {
      setError('Cannot send message: not connected');
      return false;
    }

    socketRef.current.emit('message', {
      content,
      chatId,
      senderId: user.id,
      attachments
    });

    return true;
  }, [isConnected, user]);

  // Load chat history
  const loadChatHistory = useCallback(async (chatId) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/chat/${chatId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to load chat history');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError(error.message || 'Failed to load chat history');
    }
  }, [user]);

  return {
    messages,
    isConnected,
    error,
    sendMessage,
    loadChatHistory
  };
}

export default useChat;

// Helper function for community page to create a chat with another user
export async function createChatWithUser(userId: string, recipientId: string): Promise<string> {
  try {
    const newChat = await createChat(userId, recipientId);
    if (newChat.success) {
      return newChat.chat._id;
    }
    throw new Error('Failed to create chat');
  } catch (err) {
    console.error('Error creating chat:', err);
    throw err;
  }
}