/**
 * Speech Emotion Recognition routes.
 * Analyzes audio data and maintains call session timelines.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { emotionCallSessionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { analyzeEmotion } from "../lib/emotionDetector.js";
import { getBlockchain } from "../lib/blockchain.js";

const router = Router();

router.post("/analyze", async (req, res) => {
  const body = req.body as {
    callId: string;
    audioData: string;
    segmentStart?: number;
    segmentDuration?: number;
  };

  const { callId, audioData, segmentStart = 0 } = body;

  // Run emotion analysis
  const result = analyzeEmotion(audioData, callId, segmentStart);

  // Find or create call session
  let [session] = await db
    .select()
    .from(emotionCallSessionsTable)
    .where(eq(emotionCallSessionsTable.callId, callId))
    .limit(1);

  const newEntry = {
    emotion: result.dominantEmotion,
    confidence: result.emotions[0]?.confidence ?? 0,
    timestamp: segmentStart,
    allScores: result.emotions.reduce(
      (acc, e) => ({ ...acc, [e.emotion]: e.confidence }),
      {} as Record<string, number>,
    ),
  };

  if (!session) {
    // Create new session
    const riskLevelOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    [session] = await db
      .insert(emotionCallSessionsTable)
      .values({
        callId,
        peakRiskLevel: result.riskLevel,
        wasEscalated: result.shouldEscalate,
        callerInfo: `Caller ${callId.slice(0, 8)}`,
        timeline: [newEntry],
      })
      .returning();
  } else {
    // Update existing session
    const timeline = (session.timeline as any[]) ?? [];
    timeline.push(newEntry);

    const riskLevelOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const currentPeak = riskLevelOrder[session.peakRiskLevel];
    const newRisk = riskLevelOrder[result.riskLevel];
    const peakRiskLevel = newRisk > currentPeak ? result.riskLevel : session.peakRiskLevel;

    [session] = await db
      .update(emotionCallSessionsTable)
      .set({
        timeline,
        peakRiskLevel,
        wasEscalated: session.wasEscalated || result.shouldEscalate,
      })
      .where(eq(emotionCallSessionsTable.callId, callId))
      .returning();
  }

  // Add to blockchain if escalated
  if (result.shouldEscalate) {
    const blockchain = getBlockchain();
    blockchain.addBlock({
      eventType: "call_escalated",
      userId: callId,
      details: `Call escalated: ${result.dominantEmotion} detected at ${Math.round(result.emotions[0]?.confidence * 100)}% confidence (risk: ${result.riskLevel})`,
    });
  }

  res.json({
    callId,
    emotions: result.emotions,
    dominantEmotion: result.dominantEmotion,
    riskLevel: result.riskLevel,
    shouldEscalate: result.shouldEscalate,
    message: result.shouldEscalate
      ? `⚠ HIGH RISK: ${result.dominantEmotion} detected — call flagged for escalation`
      : `Analysis complete: ${result.dominantEmotion} (${Math.round((result.emotions[0]?.confidence ?? 0) * 100)}% confidence)`,
  });
});

router.get("/calls", async (_req, res) => {
  const sessions = await db
    .select()
    .from(emotionCallSessionsTable)
    .orderBy(desc(emotionCallSessionsTable.startTime));

  const total = sessions.length;
  res.json({
    calls: sessions.map((s) => ({
      callId: s.callId,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString() ?? null,
      duration: s.duration,
      peakRiskLevel: s.peakRiskLevel,
      wasEscalated: s.wasEscalated,
      callerInfo: s.callerInfo,
    })),
    total,
  });
});

router.get("/calls/:callId", async (req, res) => {
  const { callId } = req.params;

  const [session] = await db
    .select()
    .from(emotionCallSessionsTable)
    .where(eq(emotionCallSessionsTable.callId, callId))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Not Found", message: "Call session not found" });
    return;
  }

  const timeline = (session.timeline as any[]) ?? [];

  res.json({
    session: {
      callId: session.callId,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString() ?? null,
      duration: session.duration,
      peakRiskLevel: session.peakRiskLevel,
      wasEscalated: session.wasEscalated,
      callerInfo: session.callerInfo,
    },
    timeline: timeline.map((t: any) => ({
      emotion: t.emotion,
      confidence: t.confidence,
      timestamp: t.timestamp,
    })),
  });
});

export default router;
