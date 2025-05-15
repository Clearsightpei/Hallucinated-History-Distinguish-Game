import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Folder } from "@shared/schema";

interface RenameFolderDialogProps {
  folder: Folder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderRenamed: () => void;
}

export default function RenameFolderDialog({
  folder,
  open,
  onOpenChange,
  onFolderRenamed,
}: RenameFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (folder) {
      setFolderName(folder.name);
    }
  }, [folder]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folder) return;
    
    if (!folderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (folderName.length < 2 || folderName.length > 50) {
      toast({
        title: "Error",
        description: "Folder name must be between 2 and 50 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("PUT", `/api/folders/${folder.id}`, { name: folderName });
      toast({
        title: "Success",
        description: "Folder renamed successfully",
      });
      onFolderRenamed();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename folder",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!folder) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>
            Change the name of the folder.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g., World Wars"
                minLength={2}
                maxLength={50}
              />
              <p className="text-xs text-neutral-500">Between 2-50 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
