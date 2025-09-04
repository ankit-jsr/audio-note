import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AudioContent } from "@shared/schema";

interface AudioPlayerProps {
  audioContent: AudioContent | null;
  onProgressUpdate: (progress: number) => void;
}

export function AudioPlayer({ audioContent, onProgressUpdate }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioContent && audioRef.current) {
      const audio = audioRef.current;
      
      // Set the audio source to the served audio file
      audio.src = `/api/audio/${audioContent.id}`;
      audio.preload = "metadata";
      
      // Reset states
      setIsPlaying(false);
      setCurrentTime(audioContent.progress || 0);
      setDuration(audioContent.duration || 0);
      
      // Add error handler
      const handleError = (e: Event) => {
        console.error("Audio load error:", e);
        if (audio.error) {
          console.error("Audio error code:", audio.error.code);
          console.error("Audio error message:", audio.error.message);
        }
        console.error("Audio source:", audio.src);
        setIsPlaying(false);
      };
      
      // Add load handler
      const handleLoad = () => {
        console.log("Audio loaded successfully");
        if (audioContent.progress) {
          audio.currentTime = audioContent.progress;
        }
      };
      
      audio.addEventListener('error', handleError);
      audio.addEventListener('canplaythrough', handleLoad);
      
      // Load the audio
      audio.load();
      
      return () => {
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplaythrough', handleLoad);
      };
    }
  }, [audioContent]);

  const togglePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Playback error:", error);
        setIsPlaying(false);
      }
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSpeedChange = (speed: string) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(speed);
    }
  };

  if (!audioContent) {
    return (
      <Card data-testid="audio-player-empty">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No audio content selected</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (audioContent.transcriptionStatus) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Transcribed</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Transcribing...</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="mb-8" data-testid="audio-player">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Now Playing</h2>
          {getStatusBadge()}
        </div>

        {/* Audio Info */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {audioContent.title.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 dark:text-white truncate" data-testid="audio-title">
              {audioContent.title}
            </h3>
            {audioContent.source && (
              <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="audio-source">
                {audioContent.source}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {duration > 0 ? `Duration: ${formatTime(duration)}` : "Duration: Unknown"} • 
              Added {new Date(audioContent.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Audio Player Controls */}
        <div className="space-y-4">
          {/* Waveform Visualization (Simulated) */}
          <div 
            className="relative h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer"
            onClick={handleProgressClick}
            data-testid="audio-waveform"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <div className="flex space-x-1">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    style={{ height: `${20 + Math.random() * 60}%` }}
                  />
                ))}
              </div>
            </div>
            {/* Progress indicator */}
            <div
              className="absolute top-0 left-0 h-full bg-primary/20 rounded-lg transition-all duration-300"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={skipBackward}
                data-testid="button-skip-back"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full"
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={skipForward}
                data-testid="button-skip-forward"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Time and Speed */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span data-testid="current-time">{formatTime(currentTime)}</span>
              <span>/</span>
              <span data-testid="total-time">{formatTime(duration)}</span>
              <Select value={playbackSpeed} onValueChange={handleSpeedChange}>
                <SelectTrigger className="w-16 h-8" data-testid="select-playback-speed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="0.75">0.75x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.25">1.25x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Audio element */}
        <audio
          ref={audioRef}
          preload="metadata"
          onTimeUpdate={() => {
            if (audioRef.current) {
              const time = audioRef.current.currentTime;
              setCurrentTime(time);
              onProgressUpdate(time);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error("Audio element error:", e);
            setIsPlaying(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
