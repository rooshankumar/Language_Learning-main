
import { chatService } from './chat-service';

// Re-export the functions to maintain compatibility
export function subscribeToChatMessages(chatId: string, callback: (messages: any[]) => void) {
  return chatService.subscribeToChatMessages(chatId, callback);
}

export function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chatService.markMessagesAsRead(chatId, userId);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function startChat(recipientId: string): Promise<string> {
  return chatService.startChat(recipientId);
}
