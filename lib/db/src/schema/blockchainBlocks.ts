import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blockchainBlocksTable = pgTable("blockchain_blocks", {
  id: serial("id").primaryKey(),
  blockIndex: integer("block_index").notNull(),
  hash: text("hash").notNull(),
  previousHash: text("previous_hash").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  data: jsonb("data").notNull(),
  nonce: integer("nonce").notNull().default(0),
});

export const insertBlockchainBlockSchema = createInsertSchema(blockchainBlocksTable).omit({ id: true });
export type InsertBlockchainBlock = z.infer<typeof insertBlockchainBlockSchema>;
export type BlockchainBlock = typeof blockchainBlocksTable.$inferSelect;
