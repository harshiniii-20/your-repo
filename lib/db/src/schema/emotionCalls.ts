import { pgTable, serial, text, timestamp, boolean, real, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);

export const emotionCallSessionsTable = pgTable("emotion_call_sessions", {
  id: serial("id").primaryKey(),
  callId: text("call_id").notNull().unique(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: real("duration"),
  peakRiskLevel: riskLevelEnum("peak_risk_level").notNull().default("low"),
  wasEscalated: boolean("was_escalated").notNull().default(false),
  callerInfo: text("caller_info").notNull().default("Unknown Caller"),
  timeline: jsonb("timeline").notNull().default([]),
});

export const insertEmotionCallSessionSchema = createInsertSchema(emotionCallSessionsTable).omit({ id: true });
export type InsertEmotionCallSession = z.infer<typeof insertEmotionCallSessionSchema>;
export type EmotionCallSession = typeof emotionCallSessionsTable.$inferSelect;
