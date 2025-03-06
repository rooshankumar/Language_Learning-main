
import { db } from './firebase';
import { collection, query, where, orderBy, getDocs, addDoc, doc, setDoc, getDoc, onSnapshot, Firestore } from 'firebase/firestore';

// Create a consistent chat ID from two user IDs
export function createChatId(uid1: string, uid2: string): string {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// Get all chats for a user with real-time updates
export function subscribeToUserChats(userId: string, callback: (chats: any[]) => void) {
  try {
    const chatsQuery = query(
      collection(db as Firestore, 'chats'),
      where('participants', 'array-contains', userId)
    );
    
    return onSnapshot(chatsQuery, async (snapshot) => {
      const chats = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          const chatId = chatDoc.id;
          
          // Get the other participant
          const otherUserId = chatData.participants.find((id: string) => id !== userId);
          
          // Get other user's info
          const userDoc = await getDoc(doc(db as Firestore, 'users', otherUserId));
          const userData = userDoc.data() || {};
          
          // Get chat metadata for unread count
          const metadataRef = doc(db as Firestore, 'users', userId, 'chatMetadata', chatId);
          const metadataDoc = await getDoc(metadataRef);
          const metadata = metadataDoc.data() || { unreadCount: 0 };
          
          return {
            id: chatId,
            lastMessage: chatData.lastMessage,
            lastMessageTimestamp: chatData.lastMessageTimestamp,
            otherUser: {
              id: otherUserId,
              name: userData.name || userData.displayName || 'User',
              photoURL: userData.photoURL || null
            },
            unreadCount: metadata.unreadCount || 0
          };
        })
      );
      
      callback(chats);
    });
  } catch (error) {
    console.error('Error subscribing to chats:', error);
    throw error;
  }
}

// Subscribe to messages in a chat
export function subscribeToChatMessages(chatId: string, callback: (messages: any[]) => void) {
  try {
    const messagesQuery = query(
      collection(db as Firestore, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    throw error;
  }
}

// Send a message
export async function sendMessage(senderId: string, senderName: string, recipientId: string, content: string) {
  try {
    const chatId = createChatId(senderId, recipientId);
    const timestamp = new Date().toISOString();
    
    // Add message to the chat
    const messageRef = collection(db as Firestore, 'chats', chatId, 'messages');
    const message = {
      senderId,
      senderName,
      recipientId,
      content,
      timestamp,
      read: false
    };

    // Update recipient's unread count
    const recipientMetadataRef = doc(db as Firestore, 'users', recipientId, 'chatMetadata', chatId);
    const recipientMetadata = await getDoc(recipientMetadataRef);
    const currentUnreadCount = recipientMetadata.exists() ? (recipientMetadata.data().unreadCount || 0) : 0;
    
    await setDoc(recipientMetadataRef, {
      unreadCount: currentUnreadCount + 1,
      lastMessageTimestamp: timestamp
    }, { merge: true });
    
    await addDoc(messageRef, message);
    
    // Update chat metadata
    await setDoc(doc(db as Firestore, 'chats', chatId), {
      participants: [senderId, recipientId],
      lastMessage: content,
      lastMessageTimestamp: timestamp,
      lastMessageSenderId: senderId
    }, { merge: true });
    
    // For recipient, increment unread count
    await setDoc(doc(db as Firestore, 'users', recipientId, 'chatMetadata', chatId), {
      withUser: senderId,
      unreadCount: (await getUnreadCount(recipientId, chatId)) + 1,
      lastMessageTimestamp: timestamp
    }, { merge: true });
    
    // For sender, ensure record exists with 0 unread
    await setDoc(doc(db as Firestore, 'users', senderId, 'chatMetadata', chatId), {
      withUser: recipientId,
      unreadCount: 0,
      lastMessageTimestamp: timestamp
    }, { merge: true });
    
    return { ...message, chatId };
    
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Get unread count for a chat
async function getUnreadCount(userId: string, chatId: string) {
  try {
    const metadataRef = doc(db as Firestore, 'users', userId, 'chatMetadata', chatId);
    const metadataDoc = await getDoc(metadataRef);
    return metadataDoc.exists() ? (metadataDoc.data().unreadCount || 0) : 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Mark messages as read
export async function markMessagesAsRead(userId: string, chatId: string) {
  try {
    // Reset unread counter
    await setDoc(doc(db as Firestore, 'users', userId, 'chatMetadata', chatId), {
      unreadCount: 0
    }, { merge: true });
    
    // Get unread messages
    const messagesQuery = query(
      collection(db as Firestore, 'chats', chatId, 'messages'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );
    
    const messageDocs = await getDocs(messagesQuery);
    
    // Mark each message as read
    const updatePromises = messageDocs.docs.map(messageDoc => 
      setDoc(doc(db as Firestore, 'chats', chatId, 'messages', messageDoc.id), { read: true }, { merge: true })
    );
    
    await Promise.all(updatePromises);
    
    return messageDocs.size; // Return count of messages marked as read
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

// Start or get a chat with another user
export async function startChat(currentUserId: string, currentUserName: string, otherUserId: string) {
  try {
    const chatId = createChatId(currentUserId, otherUserId);
    
    // Check if chat already exists
    const chatRef = doc(db as Firestore, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      // Create new chat
      await setDoc(chatRef, {
        participants: [currentUserId, otherUserId],
        createdAt: new Date().toISOString(),
      });
      
      // Initialize chat metadata for both users
      await setDoc(doc(db as Firestore, 'users', currentUserId, 'chatMetadata', chatId), {
        withUser: otherUserId,
        unreadCount: 0,
        createdAt: new Date().toISOString()
      });
      
      await setDoc(doc(db as Firestore, 'users', otherUserId, 'chatMetadata', chatId), {
        withUser: currentUserId,
        withUserName: currentUserName,
        unreadCount: 0,
        createdAt: new Date().toISOString()
      });
    }
    
    return chatId;
    
  } catch (error) {
    console.error('Error starting chat:', error);
    throw error;
  }
}
