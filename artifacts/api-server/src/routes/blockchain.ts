/**
 * Blockchain audit log routes.
 * Exposes the immutable ledger for security events.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { blockchainBlocksTable } from "@workspace/db/schema";
import { desc, asc } from "drizzle-orm";
import { getBlockchain, initBlockchain, type BlockData } from "../lib/blockchain.js";

const router = Router();

// Lazy-init blockchain from DB on first request
let initialized = false;

async function ensureBlockchainLoaded() {
  if (initialized) return;
  initialized = true;

  const blocks = await db
    .select()
    .from(blockchainBlocksTable)
    .orderBy(asc(blockchainBlocksTable.blockIndex));

  if (blocks.length > 0) {
    const chain = blocks.map((b) => ({
      index: b.blockIndex,
      hash: b.hash,
      previousHash: b.previousHash,
      timestamp: b.timestamp.toISOString(),
      data: b.data as BlockData,
      nonce: b.nonce,
    }));
    initBlockchain(chain);
  }
}

router.get("/logs", async (_req, res) => {
  await ensureBlockchainLoaded();
  const blockchain = getBlockchain();
  const chain = blockchain.getChain();
  const { valid } = blockchain.isChainValid();

  res.json({
    chain: chain.map((b) => ({
      ...b,
      timestamp: b.timestamp,
    })),
    length: chain.length,
    isValid: valid,
  });
});

router.get("/verify", async (_req, res) => {
  await ensureBlockchainLoaded();
  const blockchain = getBlockchain();
  const { valid, invalidIndex } = blockchain.isChainValid();

  res.json({
    isValid: valid,
    tamperDetected: !valid,
    invalidBlockIndex: invalidIndex,
    message: valid
      ? `Blockchain integrity verified — all ${blockchain.getChain().length} blocks are valid`
      : `Tampering detected at block ${invalidIndex} — chain integrity compromised`,
  });
});

router.post("/add", async (req, res) => {
  await ensureBlockchainLoaded();
  const body = req.body as {
    eventType: string;
    userId: string;
    details?: string;
    ipAddress?: string;
  };

  const blockchain = getBlockchain();
  const block = blockchain.addBlock({
    eventType: body.eventType,
    userId: body.userId,
    details: body.details,
    ipAddress: body.ipAddress,
  });

  // Persist to DB
  await db.insert(blockchainBlocksTable).values({
    blockIndex: block.index,
    hash: block.hash,
    previousHash: block.previousHash,
    timestamp: new Date(block.timestamp),
    data: block.data,
    nonce: block.nonce,
  });

  res.status(201).json({
    ...block,
    timestamp: block.timestamp,
  });
});

export default router;
