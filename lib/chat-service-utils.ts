
import { chatService } from './chat-service';

export const subscribeToChatMessages = (chatId: string, callback: any) => {
  return chatService.subscribeToChatMessages(chatId, callback);
};

export const markMessagesAsRead = (chatId: string, userId: string) => {
  return chatService.markMessagesAsRead(chatId, userId);
};

export const startChat = async (recipientId: string) => {
  return chatService.startChat(recipientId);
};

export const setCurrentUser = (user: any) => {
  if (!user || !user.id) {
    console.error('Invalid user provided to setCurrentUser');
    return;
  }
  
  chatService.setUser({
    id: user.id,
    name: user.name || 'User',
    avatar: user.image
  });
};
