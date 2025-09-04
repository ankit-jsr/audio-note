import { formatDistanceToNow } from "date-fns";
import { Play, Highlighter, Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AudioContent } from "@shared/schema";

interface ContentLibraryProps {
  audioContent: AudioContent[];
  onSelectContent: (content: AudioContent) => void;
  selectedContentId?: string;
}

export function ContentLibrary({ audioContent, onSelectContent, selectedContentId }: ContentLibraryProps) {
  const formatDuration = (seconds: number) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProgressPercentage = (progress: number, duration: number) => {
    if (!duration) return 0;
    return Math.round((progress / duration) * 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Transcribed</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (audioContent.length === 0) {
    return (
      <div className="text-center py-12" data-testid="content-library-empty">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <Highlighter className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No audio content yet</p>
          <p className="text-sm">Upload your first audio file to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="content-library">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Content</h2>
        <Button variant="outline" size="sm" data-testid="button-view-all">
          View All
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {audioContent.map((content) => {
          const isSelected = selectedContentId === content.id;
          const progressPercentage = getProgressPercentage(content.progress || 0, content.duration || 0);
          
          return (
            <Card
              key={content.id}
              className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => onSelectContent(content)}
              data-testid={`content-card-${content.id}`}
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                <div className="text-4xl font-bold text-primary/60">
                  {content.title.charAt(0).toUpperCase()}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-white">Now Playing</Badge>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(content.transcriptionStatus)}
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2" data-testid={`content-title-${content.id}`}>
                  {content.title}
                </h3>
                
                {content.source && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3" data-testid={`content-source-${content.id}`}>
                    {content.source}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(content.duration || 0)}</span>
                  </div>
                  <span>Progress: {progressPercentage}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-3">
                  <div
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-500">
                    {content.transcriptionStatus === "completed" && (
                      <div className="flex items-center space-x-1 text-accent">
                        <Highlighter className="h-3 w-3" />
                        <span>Available</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(content.lastAccessedAt || content.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectContent(content);
                    }}
                    data-testid={`button-play-${content.id}`}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
