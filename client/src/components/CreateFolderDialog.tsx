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
      <DialogContent className="bg-[#1a3c42]">
        <DialogHeader>
          <DialogTitle className="text-[#00ffe0]">Create Folder</DialogTitle>
          <DialogDescription className="text-[#00ffe0]">
            Create a new folder to organize your stories.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Label
              htmlFor="folderName"
              className="text-[#00ffe0]"
            >
              Folder Name
            </Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"
            />
            <Label
              htmlFor="folderPassword"
              className="text-[#00ffe0]"
            >
              Password (optional)
            </Label>
            <Input
              id="folderPassword"
              value={folderPassword}
              onChange={(e) => setFolderPassword(e.target.value)}
              className="bg-[#1a3c42] text-[#00ffe0] border-[#00ffe0]"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
