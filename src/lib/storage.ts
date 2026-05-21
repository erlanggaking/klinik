import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Storage abstraction. Default = local filesystem under STORAGE_LOCAL_DIR.
 * In production, swap to S3-compatible by setting STORAGE_DRIVER=s3 and
 * implementing the S3 driver below (using @aws-sdk/client-s3 or similar).
 *
 * Sensitive medical photos should ALWAYS be served via signed/short-lived URLs,
 * never directly. Watermarking should be applied at upload time (TODO Fase 2).
 */
export interface StorageDriver {
  put(key: string, data: Buffer, mime?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  signedUrl(key: string, ttlSeconds?: number): Promise<string>;
}

class LocalDriver implements StorageDriver {
  baseDir: string;
  constructor() {
    this.baseDir = path.resolve(process.env.STORAGE_LOCAL_DIR ?? "./uploads");
  }
  private resolve(key: string) {
    return path.join(this.baseDir, key);
  }
  async put(key: string, data: Buffer) {
    const fp = this.resolve(key);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, data);
  }
  async get(key: string) {
    return fs.readFile(this.resolve(key));
  }
  async delete(key: string) {
    await fs.unlink(this.resolve(key)).catch(() => {});
  }
  async signedUrl(key: string, ttl = 3600) {
    // Local: return route through our /api/files/[...key] handler (TODO).
    // We sign with HMAC + expiry so unauthorized people can't access.
    const exp = Math.floor(Date.now() / 1000) + ttl;
    const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
    const sig = crypto.createHmac("sha256", secret).update(`${key}:${exp}`).digest("hex");
    return `/api/files/${encodeURIComponent(key)}?exp=${exp}&sig=${sig}`;
  }
}

let driver: StorageDriver | null = null;
export function storage(): StorageDriver {
  if (driver) return driver;
  // const which = process.env.STORAGE_DRIVER ?? "local";
  driver = new LocalDriver();
  return driver;
}

export function buildPhotoKey(patientId: string, filename: string) {
  const safe = filename.replace(/[^\w.-]/g, "_");
  const yyyymm = new Date().toISOString().slice(0, 7);
  return `photos/${yyyymm}/${patientId}/${Date.now()}-${safe}`;
}

export function verifySignedKey(key: string, exp: string, sig: string) {
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
  const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
  const expected = crypto.createHmac("sha256", secret).update(`${key}:${exp}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
