/**
 * Login attempt tracking routes.
 * Records and retrieves login history with geolocation and anomaly scoring.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { loginAttemptsTable, anomaliesTable } from "@workspace/db/schema";
import { eq, desc, count, and, gte, lte, sql } from "drizzle-orm";
import { analyzeLoginAnomaly } from "../lib/anomalyDetector.js";
import { getBlockchain } from "../lib/blockchain.js";

const router = Router();

router.get("/", async (req, res) => {
  const limit = Number(req.query["limit"] ?? 100);
  const offset = Number(req.query["offset"] ?? 0);
  const status = req.query["status"] as string | undefined;

  let query = db.select().from(loginAttemptsTable).orderBy(desc(loginAttemptsTable.timestamp));

  const attempts = await db
    .select()
    .from(loginAttemptsTable)
    .where(
      status && status !== "all"
        ? eq(loginAttemptsTable.status, status as "success" | "failure")
        : undefined,
    )
    .orderBy(desc(loginAttemptsTable.timestamp))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(loginAttemptsTable)
    .where(
      status && status !== "all"
        ? eq(loginAttemptsTable.status, status as "success" | "failure")
        : undefined,
    );

  res.json({
    attempts: attempts.map((a) => ({
      ...a,
      timestamp: a.timestamp.toISOString(),
    })),
    total,
  });
});

router.get("/stats", async (_req, res) => {
  const [totalRow] = await db.select({ value: count() }).from(loginAttemptsTable);
  const [successRow] = await db
    .select({ value: count() })
    .from(loginAttemptsTable)
    .where(eq(loginAttemptsTable.status, "success"));
  const [failureRow] = await db
    .select({ value: count() })
    .from(loginAttemptsTable)
    .where(eq(loginAttemptsTable.status, "failure"));
  const [anomalyRow] = await db
    .select({ value: count() })
    .from(loginAttemptsTable)
    .where(eq(loginAttemptsTable.isAnomaly, true));

  const topCountries = await db
    .select({
      country: loginAttemptsTable.country,
      count: count(),
    })
    .from(loginAttemptsTable)
    .groupBy(loginAttemptsTable.country)
    .orderBy(desc(count()))
    .limit(10);

  // Hourly breakdown
  const hourlyData = await db.execute(sql`
    SELECT
      EXTRACT(HOUR FROM timestamp)::int AS hour,
      COUNT(*) FILTER (WHERE status = 'success')::int AS success,
      COUNT(*) FILTER (WHERE status = 'failure')::int AS failure
    FROM login_attempts
    WHERE timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY hour
    ORDER BY hour
  `);

  // Daily breakdown (last 14 days)
  const dailyData = await db.execute(sql`
    SELECT
      TO_CHAR(timestamp::date, 'YYYY-MM-DD') AS date,
      COUNT(*) FILTER (WHERE status = 'success')::int AS success,
      COUNT(*) FILTER (WHERE status = 'failure')::int AS failure
    FROM login_attempts
    WHERE timestamp >= NOW() - INTERVAL '14 days'
    GROUP BY date
    ORDER BY date
  `);

  res.json({
    totalAttempts: totalRow.value,
    successCount: successRow.value,
    failureCount: failureRow.value,
    anomalyCount: anomalyRow.value,
    topCountries: topCountries.map((r) => ({ country: r.country, count: Number(r.count) })),
    hourlyBreakdown: (hourlyData.rows as any[]).map((r) => ({
      hour: Number(r.hour),
      success: Number(r.success),
      failure: Number(r.failure),
    })),
    dailyBreakdown: (dailyData.rows as any[]).map((r) => ({
      date: r.date,
      success: Number(r.success),
      failure: Number(r.failure),
    })),
  });
});

router.post("/", async (req, res) => {
  const body = req.body as {
    username: string;
    ipAddress: string;
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    userAgent?: string;
    deviceType?: string;
    status: "success" | "failure";
    failureReason?: string;
  };

  // Run anomaly analysis
  const anomalyResult = await analyzeLoginAnomaly({
    username: body.username,
    ipAddress: body.ipAddress,
    country: body.country,
    city: body.city,
    userAgent: body.userAgent,
    deviceType: body.deviceType,
  });

  const [attempt] = await db
    .insert(loginAttemptsTable)
    .values({
      username: body.username,
      ipAddress: body.ipAddress,
      country: body.country ?? "Unknown",
      city: body.city ?? "Unknown",
      latitude: body.latitude,
      longitude: body.longitude,
      userAgent: body.userAgent ?? "Unknown",
      deviceType: (body.deviceType as any) ?? "unknown",
      status: body.status,
      failureReason: body.failureReason,
      riskScore: anomalyResult.riskScore,
      isAnomaly: anomalyResult.isAnomaly,
    })
    .returning();

  // Record anomaly factors if detected
  if (anomalyResult.isAnomaly) {
    for (const factor of anomalyResult.factors) {
      await db.insert(anomaliesTable).values({
        loginAttemptId: attempt.id,
        username: body.username,
        anomalyType: factor.type,
        severity: factor.severity === "high" ? "high" : factor.severity === "medium" ? "medium" : "low",
        description: factor.description,
        riskScore: anomalyResult.riskScore,
        resolved: false,
      });
    }
  }

  // Add to blockchain
  const blockchain = getBlockchain();
  blockchain.addBlock({
    eventType: body.status === "success" ? "login_success" : "login_failure",
    userId: body.username,
    details: `Login ${body.status} from ${body.ipAddress} (${body.country ?? "unknown"})`,
    ipAddress: body.ipAddress,
  });

  res.status(201).json({
    ...attempt,
    timestamp: attempt.timestamp.toISOString(),
  });
});

export default router;
