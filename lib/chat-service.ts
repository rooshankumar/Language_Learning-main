
'use client';

import { io, Socket } from 'socket.io-client';

export interface Message {
  _id: string;
  chatId: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    image?: string;
    profilePic?: string;
  };
  createdAt: Date;
}

export interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

class ChatService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private username: string | null = null;
  private messageCallbacks: Map<string, (message: Message) => void> = new Map();
  private typingCallbacks: Map<string, (data: {username: string, isTyping: boolean}) => void> = new Map();
  private onlineUsersCallback: ((users: string[]) => void) | null = null;
  private chatUpdateCallbacks: ((data: any) => void)[] = [];

  // Initialize socket connection
  initialize(userId: string, username: string) {
    if (this.socket) return; // Already initialized

    this.userId = userId;
    this.username = username;

    // Connect to Socket.IO server
    this.socket = io({
      path: '/api/socket',
      reconnectionAttempts: 5,
      timeout: 10000,
      auth: {
        userId,
        username
      }
    });

    // Setup event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('users_online', (users) => {
      if (this.onlineUsersCallback) {
        this.onlineUsersCallback(users);
      }
    });

    this.socket.on('receive_message', (data) => {
      const callback = this.messageCallbacks.get(data.chatId);
      if (callback) {
        callback(data.message);
      }
    });

    this.socket.on('user_typing', (data) => {
      const callback = this.typingCallbacks.get(data.chatId);
      if (callback) {
        callback({
          username: data.username,
          isTyping: data.isTyping
        });
      }
    });

    this.socket.on('update_chat_preview', (data) => {
      this.chatUpdateCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Join a chat room
  joinChat(chatId: string) {
    if (!this.socket || !this.socket.connected) {
      console.error('Cannot join chat: Socket not connected');
      return;
    }

    this.socket.emit('join_chat', { chatId });
  }

  // Send a message
  sendMessage(chatId: string, content: string): boolean {
    if (!this.socket || !this.socket.connected || !this.userId) {
      console.error('Cannot send message: Socket not connected or user not logged in');
      return false;
    }

    this.socket.emit('send_message', {
      chatId,
      content,
      senderId: this.userId
    });

    return true;
  }

  // Subscribe to messages for a specific chat
  subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    this.messageCallbacks.set(chatId, callback);
    return () => {
      this.messageCallbacks.delete(chatId);
    };
  }

  // Subscribe to online users updates
  subscribeToOnlineUsers(callback: (users: string[]) => void) {
    this.onlineUsersCallback = callback;
    return () => {
      this.onlineUsersCallback = null;
    };
  }

  // Subscribe to typing indicator for a chat
  subscribeToTypingIndicator(chatId: string, callback: (data: {username: string, isTyping: boolean}) => void) {
    this.typingCallbacks.set(chatId, callback);
    return () => {
      this.typingCallbacks.delete(chatId);
    };
  }

  // Subscribe to chat updates (like last message)
  subscribeToChatUpdates(callback: (data: any) => void) {
    this.chatUpdateCallbacks.push(callback);
    return () => {
      this.chatUpdateCallbacks = this.chatUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Send typing indicator
  sendTypingIndicator(chatId: string, isTyping: boolean) {
    if (!this.socket || !this.socket.connected || !this.username) {
      return;
    }

    this.socket.emit('typing', {
      chatId,
      username: this.username,
      isTyping
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create singleton instance
const chatService = new ChatService();
export default chatService;

// Helper function to create a chat with a user
export async function createChat(title: string, recipientId: string) {
  try {
    if (!recipientId) {
      throw new Error('Recipient ID is required');
    }
    
    console.log('Creating chat with recipient:', recipientId);
    
    const response = await fetch('/api/chat/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipientId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Server error response:', data);
      return { success: false, error: data.error || 'Failed to create chat' };
    }

    return { success: true, chat: data };
  } catch (error: any) {
    console.error('Error creating chat:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}
