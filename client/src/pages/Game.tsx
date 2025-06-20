import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, BarChart3, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Story, UserStats, StoryStats } from "@shared/schema";
import FolderDropdown from "@/components/FolderDropdown";
import StoryCard from "@/components/StoryCard";
import FeedbackMessage from "@/components/FeedbackMessage";
import StatCard from "@/components/StatCard";
import { Search } from "@/components/ui/search";
import { useFolders } from "@/hooks/useFolders";
import { apiRequest } from "@/lib/queryClient";
import { AnimatePresence, motion } from "framer-motion";
import PageGradientBackground from "@/components/PageGradientBackground";

export default function Game() {
  const [location, setLocation] = useLocation();
  const [currentFolderId, setCurrentFolderId] = useState("1");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const { toast } = useToast();
  
  // Initialize session ID
  useEffect(() => {
    const existingSessionId = localStorage.getItem("true-false-history-session");
    if (existingSessionId) {
      console.log("Using existing sessionId:", existingSessionId);
      setSessionId(existingSessionId);
    } else {
      const randomId = Math.random().toString(36).substring(2, 15);
      console.log("Generated new sessionId:", randomId);
      localStorage.setItem("true-false-history-session", randomId);
      setSessionId(randomId);
    }
    setSessionReady(true);
  }, []);
  
  // Parse folder ID from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const folderParam = params.get("folder");
    if (folderParam) {
      setCurrentFolderId(folderParam);
    }
  }, [location]);
  
  const [folderSearch, setFolderSearch] = useState("");
  const [showUserStats, setShowUserStats] = useState(false);
  const [showOverallStats, setShowOverallStats] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<"true" | "fake" | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Fetch folders for dropdown with search term applied
  const { data: folders, isLoading: isLoadingFolders } = useFolders(folderSearch);
  
  // Fetch stories for the selected folder
  const { data: stories = [], isLoading: isLoadingStories, refetch: refetchStories } = useQuery({
    queryKey: ['/api/stories', { folder: currentFolderId }],
    queryFn: async () => {
      const response = await fetch(`/api/stories?folder=${currentFolderId}`);
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json() as Promise<Story[]>;
    }
  });
  
  // Fetch user stats
  const { data: userStats, isLoading: isLoadingUserStats, refetch: refetchUserStats } = useQuery({
    queryKey: ['/api/stats/user', { userId: sessionId, folder: currentFolderId }],
    queryFn: async () => {
      const response = await fetch(`/api/stats/user?userId=${sessionId}&folder=${currentFolderId}`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return response.json() as Promise<UserStats>;
    },
    enabled: !!sessionId, // Only run when sessionId is not empty
  });
  
  // Fetch story stats
  const { data: storyStats, isLoading: isLoadingStoryStats, refetch: refetchStoryStats } = useQuery({
    queryKey: ['/api/stats/stories', { folder: currentFolderId }],
    queryFn: async () => {
      const response = await fetch(`/api/stats/stories?folder=${currentFolderId}`);
      if (!response.ok) throw new Error('Failed to fetch story stats');
      return response.json() as Promise<StoryStats[]>;
    }
  });
  
  // Record attempt mutation
  const recordAttemptMutation = useMutation({
    mutationFn: async (data: { story_id: number, choice: "true" | "fake", correct: boolean }) => {
      const response = await apiRequest("POST", "/api/attempt", {
        user_id: sessionId,
        story_id: data.story_id,
        choice: data.choice,
        correct: data.correct
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate user stats and story stats after recording an attempt
      queryClient.invalidateQueries({ queryKey: ['/api/stats/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/stories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record your answer",
        variant: "destructive"
      });
    }
  });
  
  const currentStory = stories[currentStoryIndex];
  
  // Handle folder change
  const handleFolderChange = (folderId: string) => {
    // Update URL with new folder ID
    const newLocation = location.split('?')[0] + `?folder=${folderId}`;
    setLocation(newLocation);
    setCurrentFolderId(folderId);
    setCurrentStoryIndex(0);
    setSelectedChoice(null);
    setIsCorrect(null);
    setShowUserStats(false);
    setShowOverallStats(false);
  };
  
  // Handle story selection
  const handleSelectChoice = useCallback(async (choice: "true" | "fake") => {
    if (!currentStory) return;

    const isChoiceCorrect = choice === "true";
    setSelectedChoice(choice);
    setIsCorrect(isChoiceCorrect);

    // Log the sessionId and data being sent
    console.log("Recording attempt:", {
      user_id: sessionId,
      story_id: currentStory.id,
      choice,
      correct: isChoiceCorrect
    });
    console.log("Session ID in localStorage:", localStorage.getItem("true-false-history-session"));

    try {
      await recordAttemptMutation.mutateAsync({
        story_id: currentStory.id,
        choice,
        correct: isChoiceCorrect
      });

      refetchUserStats();
      refetchStoryStats();
    } catch (error) {
      console.error("Failed to record attempt:", error);
    }
  }, [currentStory, recordAttemptMutation, refetchUserStats, refetchStoryStats, sessionId]);
  
  // Reset and load next story
  const handleNextStory = useCallback(() => {
    // If we have more stories, go to the next one
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prevIndex => prevIndex + 1);
    } else {
      // If we're at the end, go back to the first story
      setCurrentStoryIndex(0);
    }
    
    // Reset selection state
    setSelectedChoice(null);
    setIsCorrect(null);
    setShowUserStats(false);
    setShowOverallStats(false);
  }, [currentStoryIndex, stories.length]);
  
  // Handle folder search
  const handleFolderSearch = (query: string) => {
    setFolderSearch(query);
  };
  
  // Format accuracy as percentage
  const formatAccuracy = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  if (isLoadingStories) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading stories...</p>
      </div>
    );
  }
  
  if (stories.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No stories found</h2>
        <p className="text-neutral-600 mb-6">There are no stories in this folder yet.</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full bg-neutral-100">
      <PageGradientBackground>
        {/* Main game content (white card, story boxes, controls, etc.) */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Spot the Truth: Can You Tell AI from Human? </h1>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Folder Selector */}
            <div className="relative w-full sm:w-48">
              <FolderDropdown 
                value={currentFolderId}
                onChange={handleFolderChange}
                searchQuery={folderSearch}
              />
            </div>
            
            {/* Search Folders */}
            <Search 
              placeholder="Search folders..."
              value={folderSearch}
              onChange={handleFolderSearch}
            />
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button onClick={handleNextStory} disabled={!currentStory}>
            <ArrowRight className="mr-2 h-5 w-5" />
            New Story
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowUserStats(!showUserStats)}
            disabled={!userStats}
          >
            <Clock className="mr-2 h-5 w-5" />
            {showUserStats ? "Hide My Stats" : "Show My Stats"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowOverallStats(!showOverallStats)}
            disabled={!storyStats || storyStats.length === 0}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            {showOverallStats ? "Hide Overall Stats" : "Show Overall Stats"}
          </Button>
        </div>

        {currentStory && (
          <>
            {/* Story Context */}
            <Card className="bg-[#2d203f] rounded-lg shadow p-6 mb-6">
              <CardContent className="p-0">
                <h2 className="text-xl font-semibold text-white mb-2">{currentStory.event}</h2>
                <p className="text-[#b8a1e3]">{currentStory.introduction}</p>
              </CardContent>
            </Card>

            {/* Animated Story Versions */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`story-${currentStory.id}-index-${currentStoryIndex}`}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.35, type: "spring", stiffness: 120, damping: 20 }}
              >
                <StoryCard
                  story={currentStory}
                  onSelect={handleSelectChoice}
                  isSelectable={selectedChoice === null}
                />
              </motion.div>
            </AnimatePresence>

            {/* Feedback */}
            {selectedChoice !== null && isCorrect !== null && (
              <FeedbackMessage
                isCorrect={isCorrect}
                explanation={currentStory.explanation}
              />
            )}
          </>
        )}

        {/* User Stats */}
        {showUserStats && userStats && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-3">
              Your Stats - {folders?.find(f => f.id.toString() === currentFolderId)?.name || "General"} Folder
            </h3>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Correct Answers" value={userStats.correct_count} titleClassName="text-black" valueClassName="text-black" />
                <StatCard title="Total Attempts" value={userStats.total_attempts} titleClassName="text-black" valueClassName="text-black" />
                <StatCard title="Accuracy" value={formatAccuracy(userStats.accuracy)} titleClassName="text-black" valueClassName="text-black" />
              </div>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        {showOverallStats && storyStats && storyStats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-3">
              Overall Stats - {folders?.find(f => f.id.toString() === currentFolderId)?.name || "General"} Folder
            </h3>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium !text-black uppercase tracking-wider">
                        Story
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium !text-black uppercase tracking-wider">
                        Correct
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium !text-black uppercase tracking-wider">
                        Attempts
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium !text-black uppercase tracking-wider">
                        Accuracy
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {storyStats.map((stat) => (
                      <tr key={stat.story_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium !text-black">
                          {stat.event}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-black">
                          {stat.correct_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-black">
                          {stat.total_attempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-black">
                          {formatAccuracy(stat.accuracy)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </PageGradientBackground>
    </div>
  );
}
