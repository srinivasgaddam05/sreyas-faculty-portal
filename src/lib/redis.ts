import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || "";
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";

let redisClient: Redis | null = null;

// In-memory fallback if Redis is not configured or offline
const memoryCache = new Map<string, { value: any; expiresAt: number }>();
let memoryQueryCount = 0;
const memoryLatencies: number[] = [];

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  if (!redisUrl || !redisToken) return null;

  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Upstash Redis:", error);
    return null;
  }
}

/**
 * Normalizes question string for cache key generation
 */
function getCacheKey(question: string): string {
  return `chat_cache:${question.toLowerCase().trim().replace(/\s+/g, "_")}`;
}

export async function getCachedResponse<T>(question: string): Promise<T | null> {
  const key = getCacheKey(question);
  const client = getRedisClient();

  if (client) {
    try {
      const data = await client.get<T>(key);
      if (data) return data;
    } catch (err) {
      console.warn("Redis get error, falling back to local memory:", err);
    }
  }

  // Memory fallback
  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.value as T;
  }
  return null;
}

export async function setCachedResponse<T>(
  question: string,
  response: T,
  ttlSeconds: number = 3600
): Promise<void> {
  const key = getCacheKey(question);
  const client = getRedisClient();

  if (client) {
    try {
      await client.set(key, response, { ex: ttlSeconds });
      return;
    } catch (err) {
      console.warn("Redis set error:", err);
    }
  }

  // Memory fallback
  memoryCache.set(key, {
    value: response,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function recordQueryMetrics(latencyMs: number): Promise<void> {
  const client = getRedisClient();
  if (client) {
    try {
      await Promise.all([
        client.incr("metrics:queries_month"),
        client.lpush("metrics:recent_latencies", latencyMs),
        client.ltrim("metrics:recent_latencies", 0, 99), // keep last 100
      ]);
      return;
    } catch (err) {
      console.warn("Redis metrics error:", err);
    }
  }

  // Memory fallback
  memoryQueryCount++;
  memoryLatencies.push(latencyMs);
  if (memoryLatencies.length > 50) memoryLatencies.shift();
}

export async function getMetricsData(): Promise<{ queriesServed: number; avgQueryTimeMs: number }> {
  const client = getRedisClient();
  if (client) {
    try {
      const [queries, latencies] = await Promise.all([
        client.get<number>("metrics:queries_month"),
        client.lrange<number>("metrics:recent_latencies", 0, 20),
      ]);

      const count = queries ? Number(queries) : 0;
      let avgTime = 0;
      if (latencies && latencies.length > 0) {
        const sum = latencies.reduce((acc, curr) => acc + Number(curr), 0);
        avgTime = Math.round(sum / latencies.length);
      }
      return { queriesServed: count, avgQueryTimeMs: avgTime };
    } catch (err) {
      console.warn("Redis fetch error:", err);
    }
  }

  // Memory fallback
  const avg =
    memoryLatencies.length > 0
      ? Math.round(memoryLatencies.reduce((a, b) => a + b, 0) / memoryLatencies.length)
      : 0;
  return { queriesServed: memoryQueryCount, avgQueryTimeMs: avg };
}
