/**
 * Authentication utilities — JWT-based session management.
 */

import crypto from "crypto";
import { type Request, type Response, type NextFunction } from "express";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "securewatch-dev-secret-change-in-production";

// Simple JWT implementation (base64url encoded)
function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString("utf-8");
}

function hmacSHA256(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export function createToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24; // 24 hours
  const claims = base64urlEncode(JSON.stringify({ ...payload, iat, exp }));
  const signature = hmacSHA256(`${header}.${claims}`, JWT_SECRET);
  return `${header}.${claims}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, claims, signature] = parts;
    const expectedSig = hmacSHA256(`${header}.${claims}`, JWT_SECRET);
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(base64urlDecode(claims)) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + JWT_SECRET).digest("hex");
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    return;
  }
  (req as Request & { user: JWTPayload }).user = payload;
  next();
}
