import { pgTable, serial, text, timestamp, boolean, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const anomalySeverityEnum = pgEnum("anomaly_severity", ["low", "medium", "high", "critical"]);

export const anomaliesTable = pgTable("anomalies", {
  id: serial("id").primaryKey(),
  loginAttemptId: integer("login_attempt_id"),
  username: text("username").notNull(),
  anomalyType: text("anomaly_type").notNull(),
  severity: anomalySeverityEnum("severity").notNull().default("low"),
  description: text("description").notNull(),
  riskScore: real("risk_score").notNull().default(0),
  resolved: boolean("resolved").notNull().default(false),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
});

export const insertAnomalySchema = createInsertSchema(anomaliesTable).omit({ id: true, detectedAt: true });
export type InsertAnomaly = z.infer<typeof insertAnomalySchema>;
export type Anomaly = typeof anomaliesTable.$inferSelect;
