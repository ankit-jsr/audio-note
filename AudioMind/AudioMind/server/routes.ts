import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAudioContentSchema, insertHighlightSchema } from "@shared/schema";
import { transcribeAudio, generateSummary, extractKeyPoints } from "./services/openai";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/mp3'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for development (in production, get from session/auth)
  const MOCK_USER_ID = "user-123";

  // Get all audio content for user
  app.get("/api/audio-content", async (req, res) => {
    try {
      const content = await storage.getAudioContentByUser(MOCK_USER_ID);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audio content" });
    }
  });

  // Get specific audio content
  app.get("/api/audio-content/:id", async (req, res) => {
    try {
      const content = await storage.getAudioContent(req.params.id);
      if (!content) {
        return res.status(404).json({ message: "Audio content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audio content" });
    }
  });

  // Serve audio files
  app.get("/api/audio/:id", async (req, res) => {
    try {
      const content = await storage.getAudioContent(req.params.id);
      if (!content) {
        return res.status(404).json({ message: "Audio content not found" });
      }
      
      if (!fs.existsSync(content.filePath)) {
        return res.status(404).json({ message: "Audio file not found" });
      }
      
      const stat = fs.statSync(content.filePath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      // Fix MIME type mapping
      let mimeType = content.mimeType || 'audio/mpeg';
      if (content.fileName) {
        const ext = path.extname(content.fileName).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.m4a': 'audio/mp4',
          '.flac': 'audio/flac',
          '.ogg': 'audio/ogg'
        };
        mimeType = mimeMap[ext] || mimeType;
      }
      
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(content.filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mimeType,
          'Cache-Control': 'no-cache'
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache'
        };
        res.writeHead(200, head);
        fs.createReadStream(content.filePath).pipe(res);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve audio file" });
    }
  });

  // Upload audio file
  app.post("/api/audio-content/upload", upload.single('audioFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const { title, source } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      // Create audio content record
      const audioContent = await storage.createAudioContent({
        userId: MOCK_USER_ID,
        title,
        source: source || null,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.json(audioContent);

      // Start transcription process asynchronously
      processAudioFile(audioContent.id, req.file.path);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload audio file" });
    }
  });

  // Search audio content
  app.get("/api/audio-content/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await storage.searchAudioContent(MOCK_USER_ID, query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to search audio content" });
    }
  });

  // Update audio content progress
  app.patch("/api/audio-content/:id/progress", async (req, res) => {
    try {
      const { progress } = req.body;
      const updated = await storage.updateAudioContent(req.params.id, {
        progress,
        lastAccessedAt: new Date(),
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Audio content not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Get transcript segments for audio content
  app.get("/api/audio-content/:id/transcript", async (req, res) => {
    try {
      const segments = await storage.getTranscriptSegments(req.params.id);
      res.json(segments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transcript" });
    }
  });

  // Get highlights for audio content
  app.get("/api/audio-content/:id/highlights", async (req, res) => {
    try {
      const highlights = await storage.getHighlightsByAudioContent(req.params.id);
      res.json(highlights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch highlights" });
    }
  });

  // Create highlight
  app.post("/api/highlights", async (req, res) => {
    try {
      const validatedData = insertHighlightSchema.parse(req.body);
      const highlight = await storage.createHighlight({
        ...validatedData,
        userId: MOCK_USER_ID,
      });
      res.json(highlight);
    } catch (error) {
      res.status(400).json({ message: "Invalid highlight data" });
    }
  });

  // Delete highlight
  app.delete("/api/highlights/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteHighlight(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Highlight not found" });
      }
      res.json({ message: "Highlight deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete highlight" });
    }
  });

  // Generate AI summary for audio content
  app.post("/api/audio-content/:id/summary", async (req, res) => {
    try {
      const content = await storage.getAudioContent(req.params.id);
      if (!content) {
        return res.status(404).json({ message: "Audio content not found" });
      }

      if (!content.transcriptionText) {
        return res.status(400).json({ message: "Transcription not available" });
      }

      const { summary, keywords } = await generateSummary(content.transcriptionText);
      
      const updated = await storage.updateAudioContent(req.params.id, {
        aiSummary: summary,
        keywords,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // Extract key points from audio content
  app.post("/api/audio-content/:id/key-points", async (req, res) => {
    try {
      const content = await storage.getAudioContent(req.params.id);
      if (!content) {
        return res.status(404).json({ message: "Audio content not found" });
      }

      if (!content.transcriptionText) {
        return res.status(400).json({ message: "Transcription not available" });
      }

      const keyPoints = await extractKeyPoints(content.transcriptionText);
      res.json({ keyPoints });
    } catch (error) {
      res.status(500).json({ message: "Failed to extract key points" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background process for audio transcription
async function processAudioFile(contentId: string, filePath: string) {
  try {
    // Update status to processing
    await storage.updateAudioContent(contentId, {
      transcriptionStatus: "processing",
    });

    try {
      // Get the original filename from the content record
      const content = await storage.getAudioContent(contentId);
      const originalFilename = content?.fileName;
      
      // Transcribe audio with original filename for format detection
      const { text, duration } = await transcribeAudio(filePath, originalFilename);
      
      // Update with transcription results
      await storage.updateAudioContent(contentId, {
        transcriptionStatus: "completed",
        transcriptionText: text,
        duration: duration ? Math.round(duration) : null,
      });

      // Generate AI summary
      try {
        const { summary, keywords } = await generateSummary(text);
        await storage.updateAudioContent(contentId, {
          aiSummary: summary,
          keywords,
        });
      } catch (summaryError) {
        console.error("Failed to generate summary:", summaryError);
      }
    } catch (transcriptionError: any) {
      console.error("Transcription failed:", transcriptionError);
      
      // Handle quota exceeded or other API errors
      let errorMessage = "Transcription failed";
      if (transcriptionError.message?.includes("quota") || transcriptionError.message?.includes("429")) {
        errorMessage = "OpenAI quota exceeded. Please add credits to your OpenAI account.";
      }
      
      await storage.updateAudioContent(contentId, {
        transcriptionStatus: "error",
        transcriptionText: `Error: ${errorMessage}`,
      });
    }

    // Don't delete the uploaded file - we need it for playback
    // fs.unlink(filePath, (err) => {
    //   if (err) console.error("Failed to delete uploaded file:", err);
    // });
    
  } catch (error) {
    console.error("Failed to process audio file:", error);
    await storage.updateAudioContent(contentId, {
      transcriptionStatus: "error",
    });
  }
}
