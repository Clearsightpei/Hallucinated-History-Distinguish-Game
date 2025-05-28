import { useState } from "react";
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

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderCreated: () => void;
}

export default function CreateFolderDialog({
  open,
  onOpenChange,
  onFolderCreated,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [folderPassword, setFolderPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Create folder
      const res = await apiRequest("POST", "/api/folders", { name: folderName });
      const result = await res.json();
      // Save password to localStorage if set
      if (folderPassword && result && result.id) {
        localStorage.setItem(`folder_password_${result.id}`, folderPassword);
      }
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
      setFolderName("");
      setFolderPassword("");
      onFolderCreated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your history stories. Optionally set a password to protect it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="e.g., World Wars"
                minLength={2}
                maxLength={50}
              />
              <p className="text-xs text-neutral-500">Between 2-50 characters</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="folderPassword">Password (optional)</Label>
              <Input
                id="folderPassword"
                type="password"
                value={folderPassword}
                onChange={e => setFolderPassword(e.target.value)}
                placeholder="Set a password (optional)"
              />
              <p className="text-xs text-neutral-500">Leave blank for no password</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
