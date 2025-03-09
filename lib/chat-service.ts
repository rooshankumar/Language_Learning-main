
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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Initialize socket connection
  initialize(userId: string, username: string) {
    this.userId = userId;
    this.username = username;

    this.connectSocket();
    return this;
  }

  private connectSocket() {
    if (this.socket?.connected) return; // Already connected
    
    // Connect to Socket.IO server
    this.socket = io({
      path: '/api/socket',
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
      auth: {
        userId: this.userId,
        username: this.username
      }
    });

    // Setup event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.handleReconnect();
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

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connectSocket();
    }, delay);
  }
  
  // Reset socket connection
  reset() {
    this.disconnect();
    this.reconnectAttempts = 0;
    if (this.userId && this.username) {
      this.connectSocket();
    }
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

  // Check connection status
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Create singleton instance
const chatService = new ChatService();
export default chatService;

// Helper function to create a chat with a user using the correct API endpoint
export async function createChat(participantId: string) {
  try {
    if (!participantId) {
      throw new Error('Participant ID is required');
    }
    
    console.log('Creating chat with participant:', participantId);
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participantId }),
    });

    // Log full response details for debugging
    console.log('Chat creation API status:', response.status);
    console.log('Chat creation API status text:', response.statusText);
    
    // Check if response is empty
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response received from server');
      return { 
        success: false, 
        error: 'Server returned an empty response', 
        data: null 
      };
    }
    
    // Safely parse the JSON response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Chat creation API full response:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return { 
        success: false, 
        error: 'Invalid JSON response from server', 
        data: responseText 
      };
    }
    
    if (!response.ok) {
      console.error('Server error response:', data);
      return { 
        success: false, 
        error: data?.error || `HTTP error ${response.status}: ${response.statusText}`, 
        data 
      };
    }

    // More robust check for chatId in different possible formats
    const chatId = data.chatId || 
                  (data._id && typeof data._id === 'string' ? data._id : 
                   data._id && typeof data._id === 'object' ? data._id.toString() : null);
    
    if (!chatId) {
      console.error('No chat ID found in API response:', data);
      return { 
        success: false, 
        error: 'No chat ID returned from the server', 
        data 
      };
    }

    console.log('Chat created/found successfully with ID:', chatId);
    return { success: true, chatId, data };
  } catch (error: any) {
    console.error('Error creating chat:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred', 
      details: error.stack 
    };
  }
}

// Get all chat details by ID
export async function getChatById(chatId: string) {
  try {
    const response = await fetch(`/api/chat/${chatId}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error fetching chat:', data);
      return { success: false, error: data.error || 'Failed to fetch chat' };
    }
    
    return { success: true, chat: data };
  } catch (error: any) {
    console.error('Error getting chat:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}
