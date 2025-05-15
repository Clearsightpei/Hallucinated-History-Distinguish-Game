import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderWithStoryCount } from "@shared/schema";

interface FolderCardProps {
  folder: FolderWithStoryCount;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FolderCard({ folder, onEdit, onDelete }: FolderCardProps) {
  const isGeneral = folder.id === 1;
  
  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-neutral-800">{folder.name}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
            {folder.story_count} {folder.story_count === 1 ? 'story' : 'stories'}
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          {folder.id === 1 
            ? "Contains all stories from all folders" 
            : "Collection of historical true or false stories"}
        </p>
      </CardContent>
      <CardFooter className="border-t border-neutral-200 bg-neutral-50 px-5 py-3">
        <div className="flex justify-between w-full">
          <Link href={`/folders/${folder.id}`}>
            <a className="text-sm font-medium text-primary hover:text-primary-dark">
              View Stories
            </a>
          </Link>
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-500 hover:text-neutral-700 p-0 h-auto"
              onClick={onEdit}
              title="Edit folder"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            {!isGeneral && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 p-0 h-auto"
                onClick={onDelete}
                title="Delete folder"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
