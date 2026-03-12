/**
 * Seed script — populates the database with demo data for SecureWatch.
 * Run: pnpm --filter @workspace/scripts run seed
 */

import { db } from "@workspace/db";
import {
  usersTable,
  loginAttemptsTable,
  anomaliesTable,
  blockchainBlocksTable,
  emotionCallSessionsTable,
} from "@workspace/db/schema";
import crypto from "crypto";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "securewatch-dev-secret-change-in-production";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + JWT_SECRET).digest("hex");
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

const COUNTRIES = ["United States", "Germany", "United Kingdom", "China", "Russia", "Brazil", "India", "France", "Japan", "Canada"];
const CITIES = {
  "United States": ["New York", "San Francisco", "Chicago", "Austin"],
  "Germany": ["Berlin", "Munich", "Hamburg"],
  "United Kingdom": ["London", "Manchester", "Edinburgh"],
  "China": ["Beijing", "Shanghai", "Shenzhen"],
  "Russia": ["Moscow", "Saint Petersburg"],
  "Brazil": ["São Paulo", "Rio de Janeiro"],
  "India": ["Mumbai", "Bangalore", "Delhi"],
  "France": ["Paris", "Lyon"],
  "Japan": ["Tokyo", "Osaka"],
  "Canada": ["Toronto", "Vancouver"],
};

const DEVICES = ["desktop", "mobile", "tablet", "unknown"] as const;
const AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14) Firefox/121",
  "Mozilla/5.0 (Linux; Android 14) Chrome/120",
];

const IPS = [
  "192.168.1.45", "10.0.0.23", "203.0.113.1", "198.51.100.7",
  "172.16.0.5", "10.8.0.12", "185.220.101.5", "95.216.44.22",
  "1.179.232.100", "91.108.4.42",
];

async function main() {
  console.log("🌱 Seeding SecureWatch database...");

  // 1. Create users
  console.log("  Creating users...");
  await db.delete(usersTable);
  const users = await db.insert(usersTable).values([
    {
      username: "admin",
      email: "admin@securewatch.io",
      passwordHash: hashPassword("admin123"),
      role: "admin",
    },
    {
      username: "operator",
      email: "operator@securewatch.io",
      passwordHash: hashPassword("operator123"),
      role: "operator",
    },
    {
      username: "alice",
      email: "alice@securewatch.io",
      passwordHash: hashPassword("alice123"),
      role: "viewer",
    },
  ]).returning();
  console.log(`  ✓ Created ${users.length} users`);

  // 2. Create login attempts (last 14 days)
  console.log("  Creating login attempts...");
  await db.delete(loginAttemptsTable);

  const loginRows = [];
  const now = Date.now();
  const targetUsernames = ["admin", "alice", "john.doe", "jane.smith", "bob.wilson", "eve.attacker"];

  for (let i = 0; i < 150; i++) {
    const hoursAgo = randomBetween(0, 14 * 24);
    const timestamp = new Date(now - hoursAgo * 3600 * 1000);
    const country = randomItem(COUNTRIES);
    const cities = (CITIES as any)[country];
    const isAnomaly = Math.random() < 0.15;
    const status = Math.random() < (isAnomaly ? 0.6 : 0.2) ? "failure" : "success";

    loginRows.push({
      username: randomItem(targetUsernames),
      ipAddress: randomItem(IPS),
      country,
      city: randomItem(cities),
      latitude: randomBetween(-60, 70),
      longitude: randomBetween(-140, 140),
      userAgent: randomItem(AGENTS),
      deviceType: randomItem(DEVICES),
      status: status as "success" | "failure",
      failureReason: status === "failure" ? "Invalid password" : null,
      riskScore: isAnomaly ? randomBetween(30, 95) : randomBetween(0, 20),
      isAnomaly,
      timestamp,
    });
  }

  await db.insert(loginAttemptsTable).values(loginRows);
  console.log(`  ✓ Created ${loginRows.length} login attempts`);

  // 3. Create anomaly records
  console.log("  Creating anomaly records...");
  await db.delete(anomaliesTable);

  const anomalyTypes = ["unusual_location", "brute_force", "new_device", "high_frequency", "vpn_detected", "unusual_time"];
  const severities = ["low", "medium", "high", "critical"] as const;

  const anomalyRows = [];
  for (let i = 0; i < 25; i++) {
    const type = randomItem(anomalyTypes);
    const severity = randomItem(severities);
    const username = randomItem(targetUsernames);
    anomalyRows.push({
      username,
      anomalyType: type,
      severity,
      description: `Anomaly detected: ${type.replace(/_/g, " ")} for user ${username}`,
      riskScore: randomBetween(25, 95),
      resolved: Math.random() < 0.3,
      detectedAt: new Date(now - randomBetween(0, 7 * 24 * 3600 * 1000)),
    });
  }

  await db.insert(anomaliesTable).values(anomalyRows);
  console.log(`  ✓ Created ${anomalyRows.length} anomaly records`);

  // 4. Create emotion call sessions
  console.log("  Creating emotion call sessions...");
  await db.delete(emotionCallSessionsTable);

  const emotions = ["stressed", "neutral", "drunk", "abusive", "pain"] as const;
  const riskLevels = ["low", "medium", "high", "critical"] as const;

  const callRows = [];
  for (let i = 0; i < 12; i++) {
    const callId = `call-${crypto.randomUUID().slice(0, 8)}`;
    const startHoursAgo = randomBetween(0.5, 48);
    const startTime = new Date(now - startHoursAgo * 3600 * 1000);
    const duration = randomBetween(30, 600);
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const peakRisk = randomItem(riskLevels);
    const wasEscalated = peakRisk === "critical" || (peakRisk === "high" && Math.random() < 0.5);

    // Generate emotion timeline
    const segmentCount = Math.floor(duration / 30);
    const timeline = [];
    for (let j = 0; j < segmentCount; j++) {
      const dominant = randomItem(emotions);
      timeline.push({
        emotion: dominant,
        confidence: randomBetween(0.45, 0.95),
        timestamp: j * 30,
        allScores: {
          stressed: randomBetween(0, 0.5),
          neutral: randomBetween(0, 0.5),
          drunk: randomBetween(0, 0.3),
          abusive: randomBetween(0, 0.3),
          pain: randomBetween(0, 0.3),
        },
      });
    }

    callRows.push({
      callId,
      startTime,
      endTime,
      duration,
      peakRiskLevel: peakRisk,
      wasEscalated,
      callerInfo: `Caller #${1000 + i}`,
      timeline,
    });
  }

  await db.insert(emotionCallSessionsTable).values(callRows);
  console.log(`  ✓ Created ${callRows.length} call sessions`);

  // 5. Create blockchain genesis block
  console.log("  Creating blockchain genesis block...");
  await db.delete(blockchainBlocksTable);

  const genesisHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ index: 0, previousHash: "0".repeat(64), timestamp: new Date().toISOString(), data: { eventType: "genesis" }, nonce: 0 }))
    .digest("hex");

  const blockRows = [
    {
      blockIndex: 0,
      hash: genesisHash,
      previousHash: "0".repeat(64),
      timestamp: new Date(now - 14 * 24 * 3600 * 1000),
      data: { eventType: "genesis", details: "SecureWatch blockchain initialized" },
      nonce: 0,
    },
  ];

  // Add some sample blocks
  const eventTypes = ["login_success", "login_failure", "anomaly_detected", "call_escalated"];
  let prevHash = genesisHash;
  for (let i = 1; i <= 15; i++) {
    const eventType = randomItem(eventTypes);
    const data = {
      eventType,
      userId: randomItem(targetUsernames),
      details: `${eventType.replace(/_/g, " ")} recorded`,
      ipAddress: randomItem(IPS),
    };
    const hash = crypto.createHash("sha256").update(JSON.stringify({ index: i, previousHash: prevHash, data, nonce: i * 7 })).digest("hex");
    blockRows.push({
      blockIndex: i,
      hash,
      previousHash: prevHash,
      timestamp: new Date(now - (14 - i * 0.9) * 24 * 3600 * 1000),
      data,
      nonce: i * 7,
    });
    prevHash = hash;
  }

  await db.insert(blockchainBlocksTable).values(blockRows);
  console.log(`  ✓ Created ${blockRows.length} blockchain blocks`);

  console.log("\n✅ Seeding complete!");
  console.log("\nDemo credentials:");
  console.log("  admin / admin123 (admin role)");
  console.log("  operator / operator123 (operator role)");
  console.log("  alice / alice123 (viewer role)");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
