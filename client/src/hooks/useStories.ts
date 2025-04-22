import { useQuery } from "@tanstack/react-query";
import { Story } from "@shared/schema";

// Hook to fetch stories by folder ID
export function useStories(folderId?: string | number) {
  const queryKey = folderId 
    ? ['/api/stories', { folder: folderId }]
    : ['/api/stories'];
  
  const queryFn = async () => {
    const url = folderId 
      ? `/api/stories?folder=${folderId}` 
      : `/api/stories`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch stories');
    return response.json() as Promise<Story[]>;
  };
  
  return useQuery({
    queryKey,
    queryFn
  });
}

// Hook to fetch a single story by ID
export function useStory(storyId: string | number) {
  return useQuery({
    queryKey: [`/api/stories/${storyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${storyId}`);
      if (!response.ok) throw new Error('Failed to fetch story');
      return response.json() as Promise<Story>;
    }
  });
}
