import { useState } from "react";
import { Story } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StoryCardProps {
  story: Story;
  onSelect: (choice: "true" | "fake") => void;
  isSelectable?: boolean;
}

export default function StoryCard({ story, onSelect, isSelectable = true }: StoryCardProps) {
  // Create a completely random order every time the component is mounted
  // using a combination of Math.random() and unique component instance state
  const [isRandomized] = useState(() => {
    // Generate a completely random value every time, with no dependence on story ID
    return Math.random() > 0.5;
  });
  
  // Determine which version appears in which position
  const firstVersion = isRandomized ? story.true_version : story.fake_version;
  const secondVersion = isRandomized ? story.fake_version : story.true_version;
  
  const handleSelectFirst = () => {
    onSelect(isRandomized ? "true" : "fake");
  };
  
  const handleSelectSecond = () => {
    onSelect(isRandomized ? "fake" : "true");
  };
  
  return (
    <div className="flex flex-col items-center gap-6 mb-8">
      <Card className="bg-white rounded-lg shadow overflow-hidden border-3 border-neutral-200 hover:border-primary transition-colors w-[150%] max-w-5xl">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-3">Version A</h3>
          <p className="text-neutral-700">{firstVersion}</p>
        </CardContent>
        {isSelectable && (
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
            <Button 
              className="w-full" 
              onClick={handleSelectFirst}
              variant="default"
            >
              Select as True
            </Button>
          </div>
        )}
      </Card>

      <Card className="bg-white rounded-lg shadow overflow-hidden border-3 border-neutral-200 hover:border-primary transition-colors w-[150%] max-w-5xl">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-3">Version B</h3>
          <p className="text-neutral-700">{secondVersion}</p>
        </CardContent>
        {isSelectable && (
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
            <Button 
              className="w-full" 
              onClick={handleSelectSecond}
              variant="default"
            >
              Select as True
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
