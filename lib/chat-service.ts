
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
    const SOCKET_URL = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:3001';

    this.socket = io(SOCKET_URL);

    this.socket.on('message', (data) => {
      const message: Message = {
        id: uuidv4(),
        content: data.message,
        sender: data.sender,
        timestamp: new Date(data.timestamp)
      };

      this.messageListeners.forEach(listener => listener(message));
    });

    this.socket.on('userList', (users) => {
      this.userListListeners.forEach(listener => listener(users));
    });
  }

  public setUser(user: User) {
    this.currentUser = user;
    if (this.socket && this.currentUser) {
      this.socket.emit('join', { 
        userId: this.currentUser.id, 
        username: this.currentUser.name 
      });
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

    this.socket.emit('message', {
      room: roomId,
      message: content,
      sender: {
        id: this.currentUser.id,
        name: this.currentUser.name,
        avatar: this.currentUser.avatar
      }
    });
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
  
  // Added missing exported functions
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
      if (!this.socket || !this.currentUser) {
        reject(new Error('Not connected or user not set'));
        return;
      }
      
      this.socket.emit('startChat', {
        userId: this.currentUser.id,
        recipientId
      });
      
      const handler = (chatId: string) => {
        resolve(chatId);
        this.socket?.off('chatStarted', handler);
      };
      
      this.socket.on('chatStarted', handler);
      
      // Add timeout to prevent hanging promises
      setTimeout(() => {
        this.socket?.off('chatStarted', handler);
        reject(new Error('Timeout starting chat'));
      }, 10000);
    });
  }
}

// Export as singleton
export const chatService = new ChatService();
export { subscribeToChatMessages, markMessagesAsRead, startChat } from './chat-service-utils';
