
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Message interface
export interface Message {
  _id?: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    image?: string;
  };
  createdAt: Date;
  readAt?: Date | null;
}

export interface Chat {
  _id: string;
  participants: any[];
  messages: Message[];
  lastMessage?: {
    text: string;
    sender: string;
    createdAt: Date;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

class ChatService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private username: string | null = null;
  private messageCallbacks: Map<string, (message: Message) => void> = new Map();
  private onlineUsersCallback: ((users: string[]) => void) | null = null;
  private typingCallbacks: Map<string, (data: {username: string, isTyping: boolean}) => void> = new Map();
  private chatUpdateCallbacks: ((data: any) => void)[] = [];

  // Initialize socket connection
  initialize(userId: string, username: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Get the host dynamically based on environment
    const host = typeof window !== 'undefined' 
      ? window.location.origin
      : process.env.NEXT_PUBLIC_API_URL || 'https://mylanguageapp.replit.app';

    this.socket = io(host);
    this.userId = userId;
    this.username = username;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      
      // Notify server of user login
      this.socket.emit('user_login', { userId, username });
    });

    this.socket.on('receive_message', (data) => {
      const callback = this.messageCallbacks.get(data.chatId);
      if (callback) {
        callback(data.message);
      }
    });

    this.socket.on('online_users', (users) => {
      if (this.onlineUsersCallback) {
        this.onlineUsersCallback(users);
      }
    });

    this.socket.on('user_typing', (data) => {
      const callback = this.typingCallbacks.get(data.chatId);
      if (callback) {
        callback(data);
      }
    });

    this.socket.on('update_chat_preview', (data) => {
      this.chatUpdateCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this;
  }

  // Join a specific chat room
  joinChat(chatId: string) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }
    
    this.socket.emit('join_chat', chatId);
  }

  // Send a message to a chat
  sendMessage(chatId: string, message: string) {
    if (!this.socket || !this.socket.connected || !this.userId) {
      console.error('Cannot send message: Socket not connected or user not logged in');
      return false;
    }

    this.socket.emit('send_message', {
      chatId,
      message,
      senderId: this.userId
    });

    return true;
  }

  // Subscribe to new messages for a specific chat
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

// Helper function to create a chat with another user
export async function createChat(userId: string, recipientId: string): Promise<{ success: boolean, chat?: any, error?: string }> {
  try {
    const response = await fetch('/api/chat/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: recipientId })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create chat');
    }

    return { success: true, chat: data };
  } catch (err: any) {
    console.error('Error creating chat:', err);
    return { success: false, error: err.message };
  }
}

// Helper function for community page to start a chat with another user
export async function startChat(recipientId: string) {
  try {
    const result = await createChat('', recipientId);
    if (result.success && result.chat) {
      return result.chat._id;
    }
    throw new Error(result.error || 'Unknown error creating chat');
  } catch (err: any) {
    console.error('Error starting chat:', err);
    throw err;
  }
}
