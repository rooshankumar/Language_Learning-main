import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
}

class ChatService {
  private socket: Socket | null = null;
  private currentUser: User | null = null;
  private messageListeners: ((message: Message) => void)[] = [];
  private userListListeners: ((users: User[]) => void)[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;

    try {
      const SOCKET_URL = process.env.NODE_ENV === 'production'
        ? window.location.origin
        : 'http://localhost:3000';

      this.socket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        // Reconnect user if available
        if (this.currentUser) {
          this.setUser(this.currentUser);
        }
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      this.socket.on('message', (data) => {
        const message: Message = {
          id: data.id || uuidv4(),
          content: data.message,
          sender: data.sender,
          timestamp: new Date(data.timestamp || Date.now())
        };

        this.messageListeners.forEach(listener => listener(message));
      });

      this.socket.on('userList', (users) => {
        this.userListListeners.forEach(listener => listener(users));
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  public setUser(user: User) {
    if (!user || !user.id) {
      console.error('Invalid user object provided to chatService.setUser');
      return;
    }

    this.currentUser = user;

    if (this.socket && this.socket.connected && this.currentUser) {
      this.socket.emit('join', { 
        userId: this.currentUser.id, 
        username: this.currentUser.name || 'Unknown User'
      });
      console.log('User set in chat service:', this.currentUser.id);
    } else if (!this.socket) {
      console.error('Socket not initialized when setting user');
      // Re-initialize if needed
      this.initialize();
    } else if (!this.socket.connected) {
      console.error('Socket not connected when setting user');
    }
  }

  public joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('joinRoom', roomId);
    }
  }

  public leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leaveRoom', roomId);
    }
  }

  public sendMessage(roomId: string, content: string) {
    if (!this.socket || !this.currentUser) return;

    const messageId = uuidv4();

    this.socket.emit('message', {
      id: messageId,
      room: roomId,
      message: content,
      sender: {
        id: this.currentUser.id,
        name: this.currentUser.name,
        avatar: this.currentUser.avatar
      },
      timestamp: new Date().toISOString()
    });

    return messageId;
  }

  public onMessage(callback: (message: Message) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  public onUserListUpdate(callback: (users: User[]) => void) {
    this.userListListeners.push(callback);
    return () => {
      this.userListListeners = this.userListListeners.filter(listener => listener !== callback);
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public subscribeToChatMessages(chatId: string, callback: (messages: Message[]) => void) {
    if (!this.socket) return () => {};

    this.socket.emit('subscribeToChatMessages', chatId);

    const messageHandler = (messages: Message[]) => {
      if (messages && Array.isArray(messages)) {
        callback(messages);
      }
    };

    this.socket.on(`chatMessages:${chatId}`, messageHandler);

    return () => {
      this.socket?.off(`chatMessages:${chatId}`, messageHandler);
      this.socket?.emit('unsubscribeFromChatMessages', chatId);
    };
  }

  public markMessagesAsRead(chatId: string, userId: string) {
    if (!this.socket) return;

    this.socket.emit('markMessagesAsRead', {
      chatId,
      userId
    });
  }

  public startChat(recipientId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.log('Socket not initialized, attempting to initialize');
        this.initialize();

        if (!this.socket) {
          reject(new Error('Failed to initialize socket connection'));
          return;
        }
      }

      if (!this.currentUser) {
        reject(new Error('Not connected or user not set'));
        return;
      }

      console.log('Starting chat with recipient:', recipientId);

      this.socket.emit('startChat', {
        userId: this.currentUser.id,
        recipientId
      });

      const handler = (chatId: string) => {
        console.log('Chat started with ID:', chatId);
        resolve(chatId);
        this.socket?.off('chatStarted', handler);
      };

      this.socket.on('chatStarted', handler);

      // Add timeout to prevent hanging promises
      setTimeout(() => {
        this.socket?.off('chatStarted', handler);
        reject(new Error('Timeout starting chat - server did not respond'));
      }, 10000);
    });
  }
}

// Export as singleton
export const chatService = new ChatService();