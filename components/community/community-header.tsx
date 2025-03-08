
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CommunityHeader({ 
  searchQuery, 
  setSearchQuery 
}: { 
  searchQuery: string, 
  setSearchQuery: (query: string) => void 
}) {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Community</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, language, or interests..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </>
  );
}
