import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

/** Lock a slot for N seconds to prevent double-booking. Returns false if already locked. */
export async function lockSlot(
  doctorId: string,
  startTime: string,
  ttlSeconds = 600
): Promise<boolean> {
  const key = `slot:${doctorId}:${startTime}`;
  const result = await redis.set(key, "1", "EX", ttlSeconds, "NX");
  return result === "OK";
}

export async function unlockSlot(doctorId: string, startTime: string) {
  await redis.del(`slot:${doctorId}:${startTime}`);
}

export async function isSlotLocked(doctorId: string, startTime: string): Promise<boolean> {
  const val = await redis.get(`slot:${doctorId}:${startTime}`);
  return val !== null;
}
