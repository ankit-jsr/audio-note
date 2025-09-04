import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const audioContent = pgTable("audio_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  source: text("source"), // podcast name, book title, etc.
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type"),
  transcriptionStatus: text("transcription_status").default("pending"), // pending, processing, completed, error
  transcriptionText: text("transcription_text"),
  aiSummary: text("ai_summary"),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  progress: integer("progress").default(0), // playback progress in seconds
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

export const highlights = pgTable("highlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  audioContentId: varchar("audio_content_id").notNull(),
  userId: varchar("user_id").notNull(),
  text: text("text").notNull(),
  startTime: integer("start_time").notNull(), // timestamp in seconds
  endTime: integer("end_time").notNull(),
  color: text("color").default("yellow"), // highlight color
  note: text("note"), // personal note
  createdAt: timestamp("created_at").defaultNow(),
});

export const transcriptSegments = pgTable("transcript_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  audioContentId: varchar("audio_content_id").notNull(),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time").notNull(),
  text: text("text").notNull(),
  confidence: integer("confidence"), // 0-100
  sequenceNumber: integer("sequence_number").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAudioContentSchema = createInsertSchema(audioContent).pick({
  title: true,
  source: true,
  fileName: true,
  filePath: true,
  duration: true,
  fileSize: true,
  mimeType: true,
});

export const insertHighlightSchema = createInsertSchema(highlights).pick({
  audioContentId: true,
  text: true,
  startTime: true,
  endTime: true,
  color: true,
  note: true,
});

export const insertTranscriptSegmentSchema = createInsertSchema(transcriptSegments).pick({
  audioContentId: true,
  startTime: true,
  endTime: true,
  text: true,
  confidence: true,
  sequenceNumber: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAudioContent = z.infer<typeof insertAudioContentSchema>;
export type AudioContent = typeof audioContent.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type Highlight = typeof highlights.$inferSelect;
export type InsertTranscriptSegment = z.infer<typeof insertTranscriptSegmentSchema>;
export type TranscriptSegment = typeof transcriptSegments.$inferSelect;
