/**
 * Anomaly detection routes.
 * Returns detected anomalies and analyzes new login patterns.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { anomaliesTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { analyzeLoginAnomaly } from "../lib/anomalyDetector.js";

const router = Router();

router.get("/", async (_req, res) => {
  const anomalies = await db
    .select()
    .from(anomaliesTable)
    .orderBy(desc(anomaliesTable.detectedAt));

  res.json({
    anomalies: anomalies.map((a) => ({
      ...a,
      detectedAt: a.detectedAt.toISOString(),
    })),
    total: anomalies.length,
  });
});

router.post("/analyze", async (req, res) => {
  const body = req.body as {
    username: string;
    ipAddress: string;
    country?: string;
    city?: string;
    userAgent?: string;
    deviceType?: string;
    loginTime?: string;
  };

  const result = await analyzeLoginAnomaly({
    username: body.username,
    ipAddress: body.ipAddress,
    country: body.country,
    city: body.city,
    userAgent: body.userAgent,
    deviceType: body.deviceType,
    loginTime: body.loginTime ? new Date(body.loginTime) : undefined,
  });

  res.json(result);
});

export default router;
