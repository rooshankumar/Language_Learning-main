
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppShell } from '@/components/app-shell';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, onSnapshot, query, Firestore } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { startChat } from '@/lib/chat-service';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface User {
  uid: string;
  displayName?: string;
  photoURL?: string;
  about?: string;
  nativeLanguages?: string[];
  learningLanguages?: string[];
}

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!user || !db) return;

    setIsLoading(true);
    
    // Create a query for all users except the current user
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersList: User[] = [];
      
      snapshot.forEach((doc) => {
        // Don't include the current user
        if (doc.id === user.uid) return;
        
        usersList.push({
          uid: doc.id,
          ...doc.data() as Omit<User, 'uid'>
        });
      });
      
      setUsers(usersList);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to users:', error);
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);
  
  const handleStartChat = async (otherUser: User) => {
    if (!user || !db) return;
    
    try {
      // Get current user info
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      const currentUserData = currentUserDoc.data();
      const currentUserName = currentUserData?.displayName || user.displayName || 'User';
      
      // Start or get existing chat
      const chatId = await startChat(user.uid, currentUserName, otherUser.uid);
      
      // Navigate to chat
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
  
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const displayName = user.displayName?.toLowerCase() || '';
    const nativeLanguages = user.nativeLanguages?.join(' ').toLowerCase() || '';
    const learningLanguages = user.learningLanguages?.join(' ').toLowerCase() || '';
    
    return (
      displayName.includes(searchLower) ||
      nativeLanguages.includes(searchLower) ||
      learningLanguages.includes(searchLower)
    );
  });

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>Please Sign In</CardTitle>
              <CardDescription>
                You need to be signed in to view the community.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Community</h1>
          <Input
            type="search"
            placeholder="Search users..."
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No users found matching your search.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((otherUser) => (
              <Card key={otherUser.uid}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser.photoURL || '/placeholder-user.jpg'} />
                      <AvatarFallback>
                        {otherUser.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <CardTitle>{otherUser.displayName || 'User'}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {otherUser.nativeLanguages?.map((lang) => (
                          <Badge key={lang} variant="secondary">
                            {lang} (Native)
                          </Badge>
                        ))}
                        {otherUser.learningLanguages?.map((lang) => (
                          <Badge key={lang}>
                            {lang} (Learning)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {otherUser.about && (
                  <CardContent>
                    <p className="text-muted-foreground">{otherUser.about}</p>
                  </CardContent>
                )}
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleStartChat(otherUser)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Chat
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
