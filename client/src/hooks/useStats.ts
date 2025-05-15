import { useQuery } from "@tanstack/react-query";
import { UserStats, StoryStats } from "@shared/schema";
import { useSession } from "@/context/SessionContext";

// Hook to fetch user stats
export function useUserStats(folderId?: string) {
  const { sessionId } = useSession();
  
  const queryKey = folderId 
    ? ['/api/stats/user', { userId: sessionId, folder: folderId }]
    : ['/api/stats/user', { userId: sessionId }];
  
  const queryFn = async () => {
    const url = folderId 
      ? `/api/stats/user?userId=${sessionId}&folder=${folderId}` 
      : `/api/stats/user?userId=${sessionId}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch user stats');
    return response.json() as Promise<UserStats>;
  };
  
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 60000 // 1 minute
  });
}

// Hook to fetch story stats
export function useStoryStats(folderId?: string) {
  const queryKey = folderId 
    ? ['/api/stats/stories', { folder: folderId }]
    : ['/api/stats/stories'];
  
  const queryFn = async () => {
    const url = folderId 
      ? `/api/stats/stories?folder=${folderId}` 
      : `/api/stats/stories`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch story stats');
    return response.json() as Promise<StoryStats[]>;
  };
  
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 60000 // 1 minute
  });
}
