
import { chatService } from './chat-service';

// Re-export the functions to maintain compatibility
export function subscribeToChatMessages(chatId: string, callback: (messages: any[]) => void) {
  return chatService.subscribeToChatMessages(chatId, callback);
}

export function markMessagesAsRead(chatId: string, userId: string) {
  return chatService.markMessagesAsRead(chatId, userId);
}

export function startChat(recipientId: string): Promise<string> {
  return chatService.startChat(recipientId);
}
