/**
 * AI-Based Anomaly Detection Engine
 *
 * Analyzes login behavior patterns to identify suspicious activity.
 * Uses rule-based heuristics + statistical baselines to simulate
 * ML-based anomaly detection (Isolation Forest / LSTM approach).
 *
 * In production: train on historical login data and use TensorFlow.js
 * or a Python FastAPI endpoint for inference.
 */

import { db } from "@workspace/db";
import { loginAttemptsTable } from "@workspace/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export type AnomalyType =
  | "unusual_location"
  | "unusual_time"
  | "new_device"
  | "high_frequency"
  | "brute_force"
  | "vpn_detected";

export type Severity = "low" | "medium" | "high";
export type Recommendation = "allow" | "monitor" | "challenge" | "block";

export interface AnomalyFactor {
  type: AnomalyType;
  description: string;
  severity: Severity;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  riskScore: number;
  factors: AnomalyFactor[];
  recommendation: Recommendation;
  message: string;
}

// Known VPN/proxy IP ranges (simplified check)
const VPN_INDICATORS = ["10.8.", "10.9.", "192.168.100.", "172.16."];

// Business hours: 8am - 8pm local (rough heuristic on UTC hour)
function isUnusualHour(date: Date): boolean {
  const hour = date.getUTCHours();
  return hour < 6 || hour > 22;
}

// Check if IP looks like VPN/proxy
function isVPN(ip: string): boolean {
  return VPN_INDICATORS.some((range) => ip.startsWith(range));
}

/**
 * Analyze a login attempt for anomalies against historical data.
 */
export async function analyzeLoginAnomaly(params: {
  username: string;
  ipAddress: string;
  country?: string;
  city?: string;
  userAgent?: string;
  deviceType?: string;
  loginTime?: Date;
}): Promise<AnomalyResult> {
  const { username, ipAddress, country, city, userAgent, deviceType } = params;
  const loginTime = params.loginTime ?? new Date();
  const factors: AnomalyFactor[] = [];
  let riskScore = 0;

  // 1. VPN/Proxy detection
  if (isVPN(ipAddress)) {
    factors.push({
      type: "vpn_detected",
      description: `IP ${ipAddress} appears to be from a VPN/proxy network`,
      severity: "medium",
    });
    riskScore += 25;
  }

  // 2. Unusual login time
  if (isUnusualHour(loginTime)) {
    factors.push({
      type: "unusual_time",
      description: `Login attempt at unusual hour (${loginTime.getUTCHours()}:00 UTC)`,
      severity: "low",
    });
    riskScore += 15;
  }

  try {
    // 3. Check historical logins for this user
    const recentLogins = await db
      .select()
      .from(loginAttemptsTable)
      .where(eq(loginAttemptsTable.username, username))
      .orderBy(desc(loginAttemptsTable.timestamp))
      .limit(50);

    if (recentLogins.length > 0) {
      // 3a. Check for unusual location (new country/city)
      const knownCountries = new Set(recentLogins.map((l) => l.country).filter(Boolean));
      if (country && !knownCountries.has(country) && knownCountries.size > 0) {
        factors.push({
          type: "unusual_location",
          description: `First login from ${city ?? "unknown"}, ${country} — known locations: ${[...knownCountries].slice(0, 3).join(", ")}`,
          severity: "high",
        });
        riskScore += 40;
      }

      // 3b. Check for new device
      const knownAgents = new Set(recentLogins.map((l) => l.userAgent).filter(Boolean));
      if (userAgent && !knownAgents.has(userAgent) && knownAgents.size > 0) {
        factors.push({
          type: "new_device",
          description: `Login from new ${deviceType ?? "device"} not seen before for this user`,
          severity: "medium",
        });
        riskScore += 20;
      }

      // 3c. High frequency detection (>5 attempts in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentAttempts = recentLogins.filter(
        (l) => new Date(l.timestamp) >= fiveMinutesAgo,
      );
      if (recentAttempts.length >= 5) {
        factors.push({
          type: "high_frequency",
          description: `${recentAttempts.length} login attempts in the last 5 minutes`,
          severity: "high",
        });
        riskScore += 35;
      }

      // 3d. Brute force detection (>3 failures in last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentFailures = recentLogins.filter(
        (l) => l.status === "failure" && new Date(l.timestamp) >= tenMinutesAgo,
      );
      if (recentFailures.length >= 3) {
        factors.push({
          type: "brute_force",
          description: `${recentFailures.length} failed login attempts in the last 10 minutes — possible brute force`,
          severity: "high",
        });
        riskScore += 50;
      }
    }
  } catch (err) {
    console.error("Error fetching login history for anomaly analysis:", err);
  }

  const isAnomaly = riskScore >= 25;

  // Determine recommendation based on risk score
  let recommendation: Recommendation;
  if (riskScore >= 80) recommendation = "block";
  else if (riskScore >= 50) recommendation = "challenge";
  else if (riskScore >= 25) recommendation = "monitor";
  else recommendation = "allow";

  const message =
    riskScore >= 80
      ? "High risk detected — login blocked pending verification"
      : riskScore >= 50
        ? "Suspicious activity detected — additional verification required"
        : riskScore >= 25
          ? "Moderate risk factors detected — activity will be monitored"
          : "Login appears normal — no anomalies detected";

  return {
    isAnomaly,
    riskScore: Math.min(100, riskScore),
    factors,
    recommendation,
    message,
  };
}
