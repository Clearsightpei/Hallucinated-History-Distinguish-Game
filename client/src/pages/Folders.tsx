import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/ui/search";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import FolderCard from "@/components/FolderCard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import RenameFolderDialog from "@/components/RenameFolderDialog";
import { FolderWithStoryCount, Folder } from "@shared/schema";
import PageGradientBackground from "@/components/PageGradientBackground";

export default function Folders() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  
  // Fetch folders
  const { data: folders = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/folders', { search: searchQuery }],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/folders?search=${encodeURIComponent(searchQuery)}` 
        : '/api/folders';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json() as Promise<FolderWithStoryCount[]>;
    }
  });
  
  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      await apiRequest("DELETE", `/api/folders/${folderId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  });
  
  // Handle folder deletion
  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;
    
    try {
      await deleteFolderMutation.mutateAsync(selectedFolder.id);
      setIsDeleteFolderOpen(false);
      setSelectedFolder(null);
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
  };
  
  // Handle folder search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Utility functions for password and access control
  const getFolderPassword = (folderId: number) => {
    return localStorage.getItem(`folder_password_${folderId}`) || "";
  };
  
  const setFolderPassword = (folderId: number, password: string) => {
    localStorage.setItem(`folder_password_${folderId}`, password);
  };
  
  const getFolderAccess = (folderId: number) => {
    const access = localStorage.getItem(`folder_access_${folderId}`);
    if (!access) return null;
    try {
      return JSON.parse(access);
    } catch {
      return null;
    }
  };
  
  const grantFolderAccess = (folderId: number) => {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    localStorage.setItem(
      `folder_access_${folderId}`,
      JSON.stringify({ granted: true, expiresAt })
    );
  };
  
  const clearFolderAccess = (folderId: number) => {
    localStorage.removeItem(`folder_access_${folderId}`);
  };
  
  const isFolderAccessGranted = (folderId: number) => {
    const access = getFolderAccess(folderId);
    if (!access) return false;
    if (Date.now() > access.expiresAt) {
      clearFolderAccess(folderId);
      return false;
    }
    return access.granted;
  };
  
  // Prompt for password (simple window.prompt for now)
  const promptForPassword = async (message: string) => {
    return window.prompt(message) || "";
  };
  
  // Handle View Stories with password check
  const handleViewStories = async (folder: FolderWithStoryCount) => {
    const folderPassword = getFolderPassword(folder.id);
    if (!folderPassword) {
      // No password, allow access
      window.location.href = `/folders/${folder.id}`;
      return;
    }
    if (isFolderAccessGranted(folder.id)) {
      window.location.href = `/folders/${folder.id}`;
      return;
    }
    const input = await promptForPassword(`Enter password for folder "${folder.name}":`);
    if (input === folderPassword) {
      grantFolderAccess(folder.id);
      window.location.href = `/folders/${folder.id}`;
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password.",
        variant: "destructive"
      });
    }
  };
  
  // Handle folder edit
  const handleEditFolder = async (folder: FolderWithStoryCount) => {
    const folderPassword = getFolderPassword(folder.id);
    if (!folderPassword) {
      setSelectedFolder(folder);
      setIsRenameFolderOpen(true);
      return;
    }
    const input = await promptForPassword(`Enter current password to edit folder "${folder.name}":`);
    if (input === folderPassword) {
      setSelectedFolder(folder);
      setIsRenameFolderOpen(true);
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password.",
        variant: "destructive"
      });
    }
  };
  
  // Handle folder delete
  const handleOpenDeleteFolder = async (folder: FolderWithStoryCount) => {
    const folderPassword = getFolderPassword(folder.id);
    if (!folderPassword || isFolderAccessGranted(folder.id)) {
      setSelectedFolder(folder);
      setIsDeleteFolderOpen(true);
      return;
    }
    const input = await promptForPassword(`Enter password to delete folder "${folder.name}":`);
    if (input === folderPassword) {
      grantFolderAccess(folder.id);
      setSelectedFolder(folder);
      setIsDeleteFolderOpen(true);
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password.",
        variant: "destructive"
      });
    }
  };
  
  // Handle folder creation success
  const handleFolderCreated = () => {
    refetch();
  };
  
  // Handle folder rename success
  const handleFolderRenamed = () => {
    refetch();
  };
  
  return (
    <PageGradientBackground>
      <div>
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Manage Folders</h1>
          
          <div className="mt-4 sm:mt-0 flex items-center">
            <Search 
              placeholder="Search folders..."
              value={searchQuery}
              onChange={handleSearch}
            />
            <Button className="ml-4" onClick={() => setIsCreateFolderOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Folder
            </Button>
          </div>
        </div>

        {/* Folder List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading folders...</p>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">No folders found</h2>
            <p className="text-neutral-600 mb-6">Create a new folder to get started</p>
            <Button onClick={() => setIsCreateFolderOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Folder
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {folders.map((folder) => (
              <FolderCard 
                key={folder.id}
                folder={folder}
                onEdit={() => handleEditFolder(folder)}
                onDelete={() => handleOpenDeleteFolder(folder)}
                onViewStories={() => handleViewStories(folder)}
              />
            ))}
          </div>
        )}
        
        {/* Dialogs */}
        <CreateFolderDialog 
          open={isCreateFolderOpen}
          onOpenChange={setIsCreateFolderOpen}
          onFolderCreated={handleFolderCreated}
        />
        
        <RenameFolderDialog 
          folder={selectedFolder}
          open={isRenameFolderOpen}
          onOpenChange={setIsRenameFolderOpen}
          onFolderRenamed={handleFolderRenamed}
        />
        
        <DeleteConfirmDialog 
          open={isDeleteFolderOpen}
          onOpenChange={setIsDeleteFolderOpen}
          title="Delete Folder"
          description={`Are you sure you want to delete "${selectedFolder?.name}"? This will permanently remove the folder and all its stories. This action cannot be undone.`}
          onConfirm={handleDeleteFolder}
        />
      </div>
    </PageGradientBackground>
  );
}
