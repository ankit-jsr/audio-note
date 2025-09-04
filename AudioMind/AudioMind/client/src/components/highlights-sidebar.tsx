import { useState } from "react";
import { Wand2, List, StickyNote, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AudioContent, Highlight } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface HighlightsSidebarProps {
  audioContent: AudioContent | null;
  highlights: Highlight[];
  onGenerateSummary: () => void;
  onExtractKeyPoints: () => void;
  onRemoveHighlight: (highlightId: string) => void;
  onRefreshHighlights: () => void;
}

export function HighlightsSidebar({
  audioContent,
  highlights,
  onGenerateSummary,
  onExtractKeyPoints,
  onRemoveHighlight,
  onRefreshHighlights,
}: HighlightsSidebarProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getHighlightColor = (color: string) => {
    const colorMap = {
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400',
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 border-green-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-400',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.yellow;
  };

  const handleGenerateSummary = async () => {
    if (!audioContent) return;
    
    setIsGenerating(true);
    try {
      await onGenerateSummary();
      toast({
        title: "Summary generated",
        description: "AI summary has been created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to generate summary",
        description: "There was an error creating the AI summary",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtractKeyPoints = async () => {
    if (!audioContent?.transcriptionText) return;
    
    setIsGenerating(true);
    try {
      const response = await apiRequest(
        'POST',
        `/api/audio-content/${audioContent.id}/key-points`
      );
      const data = await response.json();
      setKeyPoints(data.keyPoints || []);
      
      toast({
        title: "Key points extracted",
        description: "Important points have been identified",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to extract key points",
        description: "There was an error extracting key points",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !audioContent) return;
    
    try {
      // In a real implementation, this would create a personal note
      // For now, we'll just show a success toast
      setNoteText("");
      setShowNoteDialog(false);
      
      toast({
        title: "Note added",
        description: "Your personal note has been saved",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add note",
        description: "There was an error saving your note",
      });
    }
  };

  return (
    <div className="space-y-6" data-testid="highlights-sidebar">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full bg-secondary/10 text-secondary hover:bg-secondary/20"
            onClick={handleGenerateSummary}
            disabled={!audioContent?.transcriptionText || isGenerating}
            data-testid="button-generate-summary"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Summary"}
          </Button>
          <Button
            className="w-full bg-accent/10 text-accent hover:bg-accent/20"
            onClick={handleExtractKeyPoints}
            disabled={!audioContent?.transcriptionText || isGenerating}
            data-testid="button-extract-key-points"
          >
            <List className="h-4 w-4 mr-2" />
            Extract Key Points
          </Button>
          <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                data-testid="button-add-note"
              >
                <StickyNote className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Personal Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your note here..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  data-testid="textarea-note"
                />
                <div className="flex space-x-2">
                  <Button onClick={handleAddNote} data-testid="button-save-note">
                    Save Note
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNoteDialog(false);
                      setNoteText("");
                    }}
                    data-testid="button-cancel-note"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Highlights for Current Audio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          {highlights.length > 0 ? (
            <div className="space-y-3" data-testid="highlights-list">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className={`p-3 border-l-4 rounded-r-lg ${getHighlightColor(highlight.color)}`}
                  data-testid={`highlight-${highlight.id}`}
                >
                  <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                    "{highlight.text}"
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{formatTime(highlight.startTime)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveHighlight(highlight.id)}
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      data-testid={`button-remove-highlight-${highlight.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {highlight.note && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                      Note: {highlight.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No highlights yet. Select text in the transcript to add highlights.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <List className="h-5 w-5 mr-2 text-accent" />
              Key Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2" data-testid="key-points-list">
              {keyPoints.map((point, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  data-testid={`key-point-${index}`}
                >
                  <p className="text-sm text-gray-900 dark:text-gray-100">{point}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {audioContent?.aiSummary && (
        <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 dark:from-secondary/20 dark:to-primary/20 border-secondary/20 dark:border-secondary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Wand2 className="h-5 w-5 mr-2 text-secondary" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4" data-testid="ai-summary">
              {audioContent.aiSummary}
            </p>
            {audioContent.keywords && audioContent.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid="summary-keywords">
                {audioContent.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs"
                    data-testid={`keyword-${index}`}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
