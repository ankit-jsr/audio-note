import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { Sidebar } from "@/components/sidebar";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptView } from "@/components/transcript-view";
import { HighlightsSidebar } from "@/components/highlights-sidebar";
import { ContentLibrary } from "@/components/content-library";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AudioContent, Highlight } from "@shared/schema";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AudioContent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch audio content
  const { data: audioContent = [], isLoading: contentLoading } = useQuery({
    queryKey: ["/api/audio-content"],
    refetchInterval: 5000, // Refetch every 5 seconds to check transcription status
  });

  // Fetch highlights for selected content
  const { data: highlights = [] } = useQuery({
    queryKey: ["/api/audio-content", selectedContent?.id, "highlights"],
    enabled: !!selectedContent,
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ contentId, progress }: { contentId: string; progress: number }) => {
      return apiRequest("PATCH", `/api/audio-content/${contentId}/progress`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-content"] });
    },
  });

  // Create highlight mutation
  const createHighlightMutation = useMutation({
    mutationFn: async (highlight: { audioContentId: string; text: string; startTime: number; endTime: number; color?: string }) => {
      return apiRequest("POST", "/api/highlights", highlight);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-content", selectedContent?.id, "highlights"] });
    },
  });

  // Remove highlight mutation
  const removeHighlightMutation = useMutation({
    mutationFn: async (highlightId: string) => {
      return apiRequest("DELETE", `/api/highlights/${highlightId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-content", selectedContent?.id, "highlights"] });
    },
  });

  // Generate summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async (contentId: string) => {
      return apiRequest("POST", `/api/audio-content/${contentId}/summary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio-content"] });
    },
  });

  // Auto-select first content item
  useEffect(() => {
    if (audioContent.length > 0 && !selectedContent) {
      setSelectedContent(audioContent[0]);
    }
  }, [audioContent, selectedContent]);

  const handleSearch = async (query: string) => {
    try {
      const response = await apiRequest("GET", `/api/audio-content/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: `No content found matching "${query}"`,
        });
      } else {
        toast({
          title: "Search completed",
          description: `Found ${results.length} result(s)`,
        });
        // You could update the content list with search results here
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "There was an error searching your content",
      });
    }
  };

  const handleProgressUpdate = (progress: number) => {
    if (selectedContent) {
      updateProgressMutation.mutate({
        contentId: selectedContent.id,
        progress: Math.floor(progress),
      });
    }
  };

  const handleAddHighlight = (text: string, startTime: number, endTime: number) => {
    if (selectedContent) {
      createHighlightMutation.mutate({
        audioContentId: selectedContent.id,
        text,
        startTime,
        endTime,
        color: "yellow",
      });
    }
  };

  const handleRemoveHighlight = (highlightId: string) => {
    removeHighlightMutation.mutate(highlightId);
  };

  const handleGenerateSummary = async () => {
    if (selectedContent) {
      await generateSummaryMutation.mutateAsync(selectedContent.id);
    }
  };

  const handleExtractKeyPoints = async () => {
    // This would be implemented as a separate API call
    toast({
      title: "Feature coming soon",
      description: "Key point extraction will be available soon",
    });
  };

  const renderMainContent = () => {
    if (activeTab === "dashboard") {
      return (
        <div className="space-y-8">
          <AudioPlayer
            audioContent={selectedContent}
            onProgressUpdate={handleProgressUpdate}
          />
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TranscriptView
                audioContent={selectedContent}
                highlights={highlights}
                onAddHighlight={handleAddHighlight}
              />
            </div>
            <div>
              <HighlightsSidebar
                audioContent={selectedContent}
                highlights={highlights}
                onGenerateSummary={handleGenerateSummary}
                onExtractKeyPoints={handleExtractKeyPoints}
                onRemoveHighlight={handleRemoveHighlight}
                onRefreshHighlights={() => {
                  queryClient.invalidateQueries({ 
                    queryKey: ["/api/audio-content", selectedContent?.id, "highlights"] 
                  });
                }}
              />
            </div>
          </div>
          
          <ContentLibrary
            audioContent={audioContent}
            onSelectContent={setSelectedContent}
            selectedContentId={selectedContent?.id}
          />
        </div>
      );
    }

    // Other tabs would be implemented here
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">This section is coming soon</p>
      </div>
    );
  };

  if (contentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading Pensieve...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-testid="dashboard">
      <NavigationHeader
        onMenuClick={() => setSidebarOpen(true)}
        onSearch={handleSearch}
      />
      
      <div className="flex">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 lg:pl-64 p-4 lg:p-8">
          {renderMainContent()}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
        <div className="grid grid-cols-5 h-16">
          {["dashboard", "library", "transcripts", "highlights", "settings"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setActiveTab(tab)}
                data-testid={`button-mobile-nav-${tab}`}
              >
                <span className="text-lg">
                  {tab === "dashboard" && "🏠"}
                  {tab === "library" && "🎧"}
                  {tab === "transcripts" && "📄"}
                  {tab === "highlights" && "🔖"}
                  {tab === "settings" && "⚙️"}
                </span>
                <span className="text-xs capitalize">{tab === "dashboard" ? "Home" : tab}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
