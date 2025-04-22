import { useQuery } from "@tanstack/react-query";
import { FolderWithStoryCount, Folder } from "@shared/schema";

// Hook to fetch all folders
export function useFolders(search?: string) {
  const queryKey = search 
    ? ['/api/folders', { search }]
    : ['/api/folders'];
  
  const queryFn = async () => {
    const url = search 
      ? `/api/folders?search=${encodeURIComponent(search)}` 
      : `/api/folders`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch folders');
    return response.json() as Promise<FolderWithStoryCount[]>;
  };
  
  return useQuery({
    queryKey,
    queryFn
  });
}

// Hook to fetch a single folder by ID
export function useFolder(folderId: string | number) {
  return useQuery({
    queryKey: [`/api/folders/${folderId}`],
    queryFn: async () => {
      const response = await fetch(`/api/folders/${folderId}`);
      if (!response.ok) throw new Error('Failed to fetch folder');
      return response.json() as Promise<Folder>;
    }
  });
}
