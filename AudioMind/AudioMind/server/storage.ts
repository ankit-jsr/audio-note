import { type User, type InsertUser, type AudioContent, type InsertAudioContent, type Highlight, type InsertHighlight, type TranscriptSegment, type InsertTranscriptSegment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Audio Content
  getAudioContent(id: string): Promise<AudioContent | undefined>;
  getAudioContentByUser(userId: string): Promise<AudioContent[]>;
  createAudioContent(audioContent: InsertAudioContent & { userId: string }): Promise<AudioContent>;
  updateAudioContent(id: string, updates: Partial<AudioContent>): Promise<AudioContent | undefined>;
  deleteAudioContent(id: string): Promise<boolean>;
  searchAudioContent(userId: string, query: string): Promise<AudioContent[]>;

  // Highlights
  getHighlight(id: string): Promise<Highlight | undefined>;
  getHighlightsByAudioContent(audioContentId: string): Promise<Highlight[]>;
  getHighlightsByUser(userId: string): Promise<Highlight[]>;
  createHighlight(highlight: InsertHighlight & { userId: string }): Promise<Highlight>;
  updateHighlight(id: string, updates: Partial<Highlight>): Promise<Highlight | undefined>;
  deleteHighlight(id: string): Promise<boolean>;

  // Transcript Segments
  getTranscriptSegments(audioContentId: string): Promise<TranscriptSegment[]>;
  createTranscriptSegment(segment: InsertTranscriptSegment): Promise<TranscriptSegment>;
  deleteTranscriptSegments(audioContentId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private audioContent: Map<string, AudioContent>;
  private highlights: Map<string, Highlight>;
  private transcriptSegments: Map<string, TranscriptSegment>;

  constructor() {
    this.users = new Map();
    this.audioContent = new Map();
    this.highlights = new Map();
    this.transcriptSegments = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Audio Content
  async getAudioContent(id: string): Promise<AudioContent | undefined> {
    return this.audioContent.get(id);
  }

  async getAudioContentByUser(userId: string): Promise<AudioContent[]> {
    return Array.from(this.audioContent.values())
      .filter(content => content.userId === userId)
      .sort((a, b) => new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime());
  }

  async createAudioContent(audioContent: InsertAudioContent & { userId: string }): Promise<AudioContent> {
    const id = randomUUID();
    const content: AudioContent = {
      ...audioContent,
      id,
      transcriptionStatus: "pending",
      transcriptionText: null,
      aiSummary: null,
      keywords: [],
      progress: 0,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };
    this.audioContent.set(id, content);
    return content;
  }

  async updateAudioContent(id: string, updates: Partial<AudioContent>): Promise<AudioContent | undefined> {
    const content = this.audioContent.get(id);
    if (!content) return undefined;
    
    const updatedContent = { ...content, ...updates };
    this.audioContent.set(id, updatedContent);
    return updatedContent;
  }

  async deleteAudioContent(id: string): Promise<boolean> {
    return this.audioContent.delete(id);
  }

  async searchAudioContent(userId: string, query: string): Promise<AudioContent[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.audioContent.values())
      .filter(content => 
        content.userId === userId &&
        (content.title.toLowerCase().includes(lowerQuery) ||
         content.source?.toLowerCase().includes(lowerQuery) ||
         content.transcriptionText?.toLowerCase().includes(lowerQuery) ||
         content.aiSummary?.toLowerCase().includes(lowerQuery))
      );
  }

  // Highlights
  async getHighlight(id: string): Promise<Highlight | undefined> {
    return this.highlights.get(id);
  }

  async getHighlightsByAudioContent(audioContentId: string): Promise<Highlight[]> {
    return Array.from(this.highlights.values())
      .filter(highlight => highlight.audioContentId === audioContentId)
      .sort((a, b) => a.startTime - b.startTime);
  }

  async getHighlightsByUser(userId: string): Promise<Highlight[]> {
    return Array.from(this.highlights.values())
      .filter(highlight => highlight.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createHighlight(highlight: InsertHighlight & { userId: string }): Promise<Highlight> {
    const id = randomUUID();
    const newHighlight: Highlight = {
      ...highlight,
      id,
      color: highlight.color || "yellow",
      note: highlight.note || null,
      createdAt: new Date(),
    };
    this.highlights.set(id, newHighlight);
    return newHighlight;
  }

  async updateHighlight(id: string, updates: Partial<Highlight>): Promise<Highlight | undefined> {
    const highlight = this.highlights.get(id);
    if (!highlight) return undefined;
    
    const updatedHighlight = { ...highlight, ...updates };
    this.highlights.set(id, updatedHighlight);
    return updatedHighlight;
  }

  async deleteHighlight(id: string): Promise<boolean> {
    return this.highlights.delete(id);
  }

  // Transcript Segments
  async getTranscriptSegments(audioContentId: string): Promise<TranscriptSegment[]> {
    return Array.from(this.transcriptSegments.values())
      .filter(segment => segment.audioContentId === audioContentId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  async createTranscriptSegment(segment: InsertTranscriptSegment): Promise<TranscriptSegment> {
    const id = randomUUID();
    const newSegment: TranscriptSegment = {
      ...segment,
      id,
      confidence: segment.confidence || null,
    };
    this.transcriptSegments.set(id, newSegment);
    return newSegment;
  }

  async deleteTranscriptSegments(audioContentId: string): Promise<boolean> {
    const segments = Array.from(this.transcriptSegments.entries())
      .filter(([_, segment]) => segment.audioContentId === audioContentId);
    
    segments.forEach(([id]) => this.transcriptSegments.delete(id));
    return true;
  }
}

export const storage = new MemStorage();
