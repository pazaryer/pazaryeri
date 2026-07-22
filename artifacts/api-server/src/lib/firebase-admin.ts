import { createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/** Firebase UID → deterministic UUID (mevcut DB şemasıyla uyumlu) */
export function firebaseUidToUuid(firebaseUid: string): string {
  const hash = createHash("sha256").update(`firebase:${firebaseUid}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function verifyFirebaseToken(token: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID required");
  }

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const firebaseUid = payload.sub;
  if (!firebaseUid) {
    throw new Error("Invalid token: missing sub");
  }

  return {
    firebaseUid,
    id: firebaseUidToUuid(firebaseUid),
    email: typeof payload.email === "string" ? payload.email : undefined,
    phone: typeof payload.phone_number === "string" ? payload.phone_number : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
