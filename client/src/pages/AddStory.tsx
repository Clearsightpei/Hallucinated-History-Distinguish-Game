import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStorySchema } from "@shared/schema";
import { z } from "zod";

export default function AddStory() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const folderId = parseInt(id);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    event: "",
    introduction: "",
    true_version: "",
    fake_version: "",
    explanation: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Add story mutation
  const addStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/folders/${folderId}/stories`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Story added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      navigate(`/folders/${folderId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add story",
        variant: "destructive"
      });
      console.error("Error adding story:", error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      const validatedData = insertStorySchema.parse({
        ...formData,
        folder_id: folderId
      });
      
      // Submit data
      await addStoryMutation.mutateAsync(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format validation errors
        const formattedErrors: { [key: string]: string } = {};
        error.errors.forEach(err => {
          const fieldName = err.path[0] as string;
          formattedErrors[fieldName] = err.message;
        });
        setErrors(formattedErrors);
        
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive"
        });
      } else {
        console.error("Error submitting form:", error);
      }
      setIsSubmitting(false);
    }
  };
  
  // Navigate back to folder
  const handleBack = () => {
    navigate(`/folders/${folderId}`);
  };
  
  if (isNaN(folderId)) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">Invalid folder ID</h2>
        <Button onClick={() => navigate("/folders")}>Back to Folders</Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">Add New Story</h1>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Folder
        </Button>
      </div>

      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="event" className="block text-sm font-medium text-neutral-700">
                  Event Title
                </Label>
                <div className="mt-1">
                  <Input
                    id="event"
                    name="event"
                    value={formData.event}
                    onChange={handleChange}
                    placeholder="e.g., Moon Landing 1969"
                    maxLength={100}
                    className={errors.event ? "border-error" : ""}
                  />
                </div>
                {errors.event ? (
                  <p className="mt-1 text-xs text-error">{errors.event}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">Maximum 100 characters</p>
                )}
              </div>

              <div>
                <Label htmlFor="introduction" className="block text-sm font-medium text-neutral-700">
                  Introduction
                </Label>
                <div className="mt-1">
                  <Textarea
                    id="introduction"
                    name="introduction"
                    value={formData.introduction}
                    onChange={handleChange}
                    placeholder="Provide context for the historical event"
                    maxLength={300}
                    rows={2}
                    className={errors.introduction ? "border-error" : ""}
                  />
                </div>
                {errors.introduction ? (
                  <p className="mt-1 text-xs text-error">{errors.introduction}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">Maximum 300 characters</p>
                )}
              </div>

              <div>
                <Label htmlFor="true_version" className="block text-sm font-medium text-neutral-700">
                  True Version
                </Label>
                <div className="mt-1">
                  <Textarea
                    id="true_version"
                    name="true_version"
                    value={formData.true_version}
                    onChange={handleChange}
                    placeholder="The historically accurate account"
                    minLength={10}
                    maxLength={2000}
                    rows={4}
                    className={errors.true_version ? "border-error" : ""}
                  />
                </div>
                {errors.true_version ? (
                  <p className="mt-1 text-xs text-error">{errors.true_version}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">Between 10-2000 characters</p>
                )}
              </div>

              <div>
                <Label htmlFor="fake_version" className="block text-sm font-medium text-neutral-700">
                  Fake Version
                </Label>
                <div className="mt-1">
                  <Textarea
                    id="fake_version"
                    name="fake_version"
                    value={formData.fake_version}
                    onChange={handleChange}
                    placeholder="The historically inaccurate account"
                    minLength={10}
                    maxLength={2000}
                    rows={4}
                    className={errors.fake_version ? "border-error" : ""}
                  />
                </div>
                {errors.fake_version ? (
                  <p className="mt-1 text-xs text-error">{errors.fake_version}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">Between 10-2000 characters</p>
                )}
              </div>

              <div>
                <Label htmlFor="explanation" className="block text-sm font-medium text-neutral-700">
                  Explanation
                </Label>
                <div className="mt-1">
                  <Textarea
                    id="explanation"
                    name="explanation"
                    value={formData.explanation}
                    onChange={handleChange}
                    placeholder="Explain why the true version is correct"
                    minLength={10}
                    maxLength={1000}
                    rows={3}
                    className={errors.explanation ? "border-error" : ""}
                  />
                </div>
                {errors.explanation ? (
                  <p className="mt-1 text-xs text-error">{errors.explanation}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">Between 10-1000 characters</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="mr-3"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Story"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
