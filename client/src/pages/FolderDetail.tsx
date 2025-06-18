import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import RenameFolderDialog from "@/components/RenameFolderDialog";
import { Story, Folder } from "@shared/schema";
import PageGradientBackground from "@/components/PageGradientBackground";

export default function FolderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const folderId = parseInt(id);
  
  const [isDeleteStoryOpen, setIsDeleteStoryOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  
  // Redirect if invalid ID
  useEffect(() => {
    if (isNaN(folderId)) {
      navigate("/folders");
    }
  }, [folderId, navigate]);
  
  // Fetch folder details
  const { data: folder, isLoading: isLoadingFolder } = useQuery({
    queryKey: [`/api/folders/${folderId}`],
    queryFn: async () => {
      const response = await fetch(`/api/folders/${folderId}`);
      if (!response.ok) throw new Error('Failed to fetch folder');
      return response.json() as Promise<Folder>;
    }
  });
  
  // Fetch stories for this folder
  const { data: stories = [], isLoading: isLoadingStories, refetch: refetchStories } = useQuery({
    queryKey: [`/api/stories`, { folder: folderId }],
    queryFn: async () => {
      const response = await fetch(`/api/stories?folder=${folderId}`);
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json() as Promise<Story[]>;
    }
  });
  
  // Delete story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: number) => {
      await apiRequest("DELETE", `/api/stories/${storyId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Story deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive"
      });
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
      navigate("/folders");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  });
  
  // Handle story deletion
  const handleDeleteStory = async () => {
    if (!selectedStory) return;
    
    try {
      await deleteStoryMutation.mutateAsync(selectedStory.id);
      setIsDeleteStoryOpen(false);
      setSelectedStory(null);
    } catch (error) {
      console.error("Failed to delete story:", error);
    }
  };
  
  // Handle folder deletion
  const handleDeleteFolder = async () => {
    if (!folder) return;
    
    try {
      await deleteFolderMutation.mutateAsync(folder.id);
    } catch (error) {
      console.error("Failed to delete folder:", error);
    }
  };
  
  // Open story delete confirmation
  const handleOpenDeleteStory = (story: Story) => {
    setSelectedStory(story);
    setIsDeleteStoryOpen(true);
  };
  
  // Handle add story button
  const handleAddStory = () => {
    navigate(`/folders/${folderId}/add-story`);
  };
  
  // Handle edit story button
  const handleEditStory = (storyId: number) => {
    navigate(`/folders/${folderId}/stories/${storyId}/edit`);
  };
  
  // Handle rename folder success
  const handleFolderRenamed = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/folders/${folderId}`] });
  };
  
  if (isNaN(folderId)) {
    return null; // Redirect will happen in useEffect
  }
  
  if (isLoadingFolder || isLoadingStories) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!folder) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Folder not found</h2>
        <Button onClick={() => navigate("/folders")}>Back to Folders</Button>
      </div>
    );
  }
  
  const isGeneral = folder.id === 1;
  
  return (
    <PageGradientBackground>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-800">{folder.name}</h2>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => navigate("/folders")}>Go Back to Folder Menu</Button>
            <Button onClick={handleAddStory}>
              <Plus className="mr-2 h-5 w-5" />
              Add Story
            </Button>
            <Button variant="outline" onClick={() => setIsRenameFolderOpen(true)}>
              <Pencil className="mr-2 h-5 w-5" />
              Rename Folder
            </Button>
            {!isGeneral && (
              <Button variant="outline" onClick={() => setIsDeleteFolderOpen(true)}>
                <Trash2 className="mr-2 h-5 w-5 text-error" />
                Delete Folder
              </Button>
            )}
          </div>
        </div>

        {/* Story List */}
        {stories.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-4">No stories found</h3>
            <p className="text-neutral-600 mb-6">Add a story to get started</p>
            <Button onClick={handleAddStory}>
              <Plus className="mr-2 h-5 w-5" />
              Add Story
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <Card key={story.id} className="bg-[#1a3c42] shadow rounded-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-[#00ffe0]">{story.event}</h3>
                      <p className="mt-1 text-sm text-[#00ffe0] line-clamp-2">{story.introduction}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 h-8"
                        onClick={() => handleEditStory(story.id)}
                      >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => handleOpenDeleteStory(story)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4 text-error" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-[#00ffe0] rounded-md p-3 bg-[#1a3c42]">
                      <p className="text-xs font-medium text-[#00ffe0] mb-1">True Version:</p>
                      <p className="text-sm text-[#00ffe0] line-clamp-3">{story.true_version}</p>
                    </div>
                    <div className="border border-[#00ffe0] rounded-md p-3 bg-[#1a3c42]">
                      <p className="text-xs font-medium text-[#00ffe0] mb-1">Fake Version:</p>
                      <p className="text-sm text-[#00ffe0] line-clamp-3">{story.fake_version}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Dialogs */}
        <DeleteConfirmDialog 
          open={isDeleteStoryOpen}
          onOpenChange={setIsDeleteStoryOpen}
          title="Delete Story"
          description={`Are you sure you want to delete "${selectedStory?.event}"? This action cannot be undone.`}
          onConfirm={handleDeleteStory}
        />
        
        <RenameFolderDialog 
          folder={folder}
          open={isRenameFolderOpen}
          onOpenChange={setIsRenameFolderOpen}
          onFolderRenamed={handleFolderRenamed}
        />
        
        <DeleteConfirmDialog 
          open={isDeleteFolderOpen}
          onOpenChange={setIsDeleteFolderOpen}
          title="Delete Folder"
          description={`Are you sure you want to delete "${folder.name}"? This will permanently remove the folder and all its stories. This action cannot be undone.`}
          onConfirm={handleDeleteFolder}
        />
      </div>
    </PageGradientBackground>
  );
}
