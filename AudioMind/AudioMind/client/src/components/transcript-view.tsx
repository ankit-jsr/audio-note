import { useState, useEffect } from "react";
import { CornerLeftUp, Download, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AudioContent, Highlight } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
  isActive?: boolean;
}

interface TranscriptViewProps {
  audioContent: AudioContent | null;
  highlights: Highlight[];
  onAddHighlight: (text: string, startTime: number, endTime: number) => void;
}

export function TranscriptView({ audioContent, highlights, onAddHighlight }: TranscriptViewProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (audioContent?.transcriptionText) {
      // For demo purposes, split the transcript into segments
      // In a real implementation, this would come from the transcript segments API
      const sentences = audioContent.transcriptionText.split('. ');
      const segments = sentences.map((sentence, index) => ({
        id: `segment-${index}`,
        timestamp: formatTimestamp(index * 15), // Simulate 15-second intervals
        text: sentence + (index < sentences.length - 1 ? '.' : ''),
        isActive: index === 2, // Simulate currently playing segment
      }));
      setTranscriptSegments(segments);
    }
  }, [audioContent]);

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleAddHighlight = (segmentText: string, segmentIndex: number) => {
    const text = selectedText || segmentText;
    const startTime = segmentIndex * 15; // Simulate timing
    const endTime = startTime + 15;
    
    onAddHighlight(text, startTime, endTime);
    setSelectedText("");
    
    toast({
      title: "Highlight added",
      description: "Your highlight has been saved successfully",
    });
  };

  const exportTranscript = async () => {
    if (!audioContent?.transcriptionText) {
      toast({
        variant: "destructive",
        title: "No transcript available",
        description: "The transcript is not ready for export",
      });
      return;
    }

    try {
      const blob = new Blob([audioContent.transcriptionText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${audioContent.title}-transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Transcript has been downloaded",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the transcript",
      });
    }
  };

  const getHighlightStyle = (text: string) => {
    const highlight = highlights.find(h => h.text.includes(text.slice(0, 50)));
    if (!highlight) return {};
    
    const colorMap: Record<string, string> = {
      yellow: 'bg-yellow-200 dark:bg-yellow-800/50',
      blue: 'bg-blue-200 dark:bg-blue-800/50',
      green: 'bg-green-200 dark:bg-green-800/50',
      purple: 'bg-purple-200 dark:bg-purple-800/50',
    };
    
    return { className: colorMap[highlight.color] || colorMap.yellow };
  };

  if (!audioContent) {
    return (
      <Card data-testid="transcript-view-empty">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No audio content selected</p>
        </CardContent>
      </Card>
    );
  }

  if (audioContent.transcriptionStatus === "pending") {
    return (
      <Card data-testid="transcript-view-pending">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">Transcription pending...</p>
        </CardContent>
      </Card>
    );
  }

  if (audioContent.transcriptionStatus === "processing") {
    return (
      <Card data-testid="transcript-view-processing">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <p className="text-blue-600 dark:text-blue-400 mb-2">Transcribing audio...</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (audioContent.transcriptionStatus === "error") {
    return (
      <Card data-testid="transcript-view-error">
        <CardContent className="p-6 text-center">
          <p className="text-red-500">Failed to transcribe audio. Please try uploading again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="transcript-view">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Transcript</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              data-testid="button-auto-scroll"
            >
              <CornerLeftUp className="h-4 w-4 mr-1" />
              Auto-scroll
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportTranscript}
              data-testid="button-export-transcript"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Transcript Content */}
        <div className="space-y-4 max-h-96 overflow-y-auto" onMouseUp={handleTextSelection} data-testid="transcript-content">
          {transcriptSegments.length > 0 ? (
            transcriptSegments.map((segment, index) => (
              <div
                key={segment.id}
                className={`group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  segment.isActive ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary' : ''
                }`}
                data-testid={`transcript-segment-${index}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 flex-shrink-0">
                    {segment.timestamp}
                  </span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed flex-1">
                    <span className={getHighlightStyle(segment.text).className}>
                      {segment.text}
                    </span>
                    {segment.isActive && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Currently playing
                      </Badge>
                    )}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleAddHighlight(segment.text, index)}
                    data-testid={`button-highlight-${index}`}
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No transcript available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
