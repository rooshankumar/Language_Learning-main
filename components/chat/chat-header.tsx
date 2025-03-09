
'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserDetails } from '@/lib/user-utils';

interface ChatHeaderProps {
  partnerId: string;
}

export function ChatHeader({ partnerId }: ChatHeaderProps) {
  const [partner, setPartner] = useState<any>({ name: "Loading...", status: "Offline" });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!partnerId) return;
    
    const fetchPartner = async () => {
      setLoading(true);
      try {
        const user = await getUserDetails(partnerId);
        setPartner(user);
      } catch (error) {
        console.error("Error fetching chat partner:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartner();
  }, [partnerId]);
  
  // Import at the top of the file
  import { formatLastSeen } from "@/lib/user-activity";
  
  return (
    <div className="flex items-center p-3 border-b">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={partner.profilePic || partner.image} alt={partner.name} />
        <AvatarFallback>
          {partner.name?.substring(0, 2).toUpperCase() || "??"}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{partner.name || "Unknown User"}</h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full mr-1 ${partner.isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
          <span>
            {partner.isOnline 
              ? "Online" 
              : `Last seen ${formatLastSeen(partner.lastActive || partner.lastSeen)}`
            }
          </span>
        </div>
      </div>
    </div>
  );
}
