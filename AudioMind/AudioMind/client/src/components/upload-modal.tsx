import { useState, useRef } from "react";
import { Upload, X, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/mp3'];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an audio file (MP3, WAV, M4A, FLAC)",
        });
        return;
      }

      // Check file size (500MB limit)
      const maxSize = 500 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a file smaller than 500MB",
        });
        return;
      }

      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Simulate file input change
      const mockEvent = {
        target: { files: [droppedFile] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(mockEvent);
    }
  };

  const handleUpload = async () => {
    if (!file && !url) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select an audio file or provide a URL",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please provide a title for the audio content",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (file) {
        // File upload
        const formData = new FormData();
        formData.append('audioFile', file);
        formData.append('title', title.trim());
        if (source.trim()) {
          formData.append('source', source.trim());
        }

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const response = await fetch('/api/audio-content/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        toast({
          title: "Upload successful",
          description: "Your audio file is being processed and transcribed",
        });
      } else if (url) {
        // URL processing (would need backend support)
        toast({
          variant: "destructive",
          title: "URL upload not implemented",
          description: "URL processing is not yet available",
        });
        return;
      }

      // Reset form
      setTitle("");
      setSource("");
      setUrl("");
      setFile(null);
      onOpenChange(false);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your audio file",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="upload-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Audio Content</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-dropzone"
          >
            <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            {file ? (
              <div>
                <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Drag & drop your audio file here, or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Supports MP3, WAV, M4A, FLAC (Max 500MB)
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file"
          />

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">Or paste a URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/audio.mp3"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="input-url"
            />
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter audio title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-title"
            />
          </div>

          {/* Source Input */}
          <div className="space-y-2">
            <Label htmlFor="source">Source (Optional)</Label>
            <Input
              id="source"
              type="text"
              placeholder="e.g., Podcast name, Book title"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              data-testid="input-source"
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2" data-testid="upload-progress">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                <span className="text-primary font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
            data-testid="button-upload-start"
          >
            {isUploading ? "Processing..." : "Start Processing"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
