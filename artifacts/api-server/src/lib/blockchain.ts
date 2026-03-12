/**
 * Simple Blockchain implementation for immutable audit logging.
 * Uses SHA-256 hashing to chain blocks and detect tampering.
 */

import crypto from "crypto";

export interface BlockData {
  eventType: string;
  userId?: string;
  details?: string;
  ipAddress?: string;
}

export interface Block {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  data: BlockData;
  nonce: number;
}

export class Blockchain {
  private chain: Block[] = [];
  private difficulty = 2; // Number of leading zeros required in hash

  constructor(initialChain?: Block[]) {
    if (initialChain && initialChain.length > 0) {
      this.chain = initialChain;
    } else {
      // Create genesis block
      this.chain = [this.createGenesisBlock()];
    }
  }

  private createGenesisBlock(): Block {
    const block: Block = {
      index: 0,
      previousHash: "0".repeat(64),
      timestamp: new Date().toISOString(),
      data: { eventType: "genesis", details: "SecureWatch blockchain initialized" },
      nonce: 0,
      hash: "",
    };
    block.hash = this.calculateHash(block);
    return block;
  }

  calculateHash(block: Omit<Block, "hash"> & { hash?: string }): string {
    const content = JSON.stringify({
      index: block.index,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      data: block.data,
      nonce: block.nonce,
    });
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  mineBlock(block: Omit<Block, "hash">): Block {
    let nonce = 0;
    const prefix = "0".repeat(this.difficulty);
    let hash = "";

    while (!hash.startsWith(prefix)) {
      nonce++;
      hash = this.calculateHash({ ...block, nonce });
    }

    return { ...block, nonce, hash };
  }

  addBlock(data: BlockData): Block {
    const previousBlock = this.chain[this.chain.length - 1];
    const newBlock = this.mineBlock({
      index: this.chain.length,
      previousHash: previousBlock.hash,
      timestamp: new Date().toISOString(),
      data,
      nonce: 0,
    });
    this.chain.push(newBlock);
    return newBlock;
  }

  getChain(): Block[] {
    return [...this.chain];
  }

  isChainValid(): { valid: boolean; invalidIndex: number | null } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      const expectedHash = this.calculateHash({
        index: current.index,
        previousHash: current.previousHash,
        timestamp: current.timestamp,
        data: current.data,
        nonce: current.nonce,
      });

      if (current.hash !== expectedHash) {
        return { valid: false, invalidIndex: i };
      }

      if (current.previousHash !== previous.hash) {
        return { valid: false, invalidIndex: i };
      }
    }
    return { valid: true, invalidIndex: null };
  }
}

// Singleton blockchain instance (in-memory, backed by DB for persistence)
let blockchainInstance: Blockchain | null = null;

export function getBlockchain(): Blockchain {
  if (!blockchainInstance) {
    blockchainInstance = new Blockchain();
  }
  return blockchainInstance;
}

export function initBlockchain(chain: Block[]): Blockchain {
  blockchainInstance = new Blockchain(chain);
  return blockchainInstance;
}
