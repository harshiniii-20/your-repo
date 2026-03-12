import { pgTable, serial, text, timestamp, boolean, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loginStatusEnum = pgEnum("login_status", ["success", "failure"]);
export const deviceTypeEnum = pgEnum("device_type", ["mobile", "desktop", "tablet", "unknown"]);

export const loginAttemptsTable = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  ipAddress: text("ip_address").notNull(),
  country: text("country").notNull().default("Unknown"),
  city: text("city").notNull().default("Unknown"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  userAgent: text("user_agent").notNull().default("Unknown"),
  deviceType: deviceTypeEnum("device_type").notNull().default("unknown"),
  status: loginStatusEnum("status").notNull(),
  failureReason: text("failure_reason"),
  riskScore: real("risk_score").notNull().default(0),
  isAnomaly: boolean("is_anomaly").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttemptsTable).omit({ id: true, timestamp: true });
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttemptsTable.$inferSelect;
