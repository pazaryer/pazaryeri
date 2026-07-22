import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT;
const bucket = process.env.R2_BUCKET_NAME ?? "pazaryeri-listings";
const publicUrl = process.env.R2_PUBLIC_URL;

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("R2 credentials not configured");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export function getPublicImageUrl(key: string): string {
  if (publicUrl) return `${publicUrl.replace(/\/$/, "")}/${key}`;
  if (accountId) return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
  return key;
}

export async function createPresignedUploadUrl(
  userId: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const key = `listings/${userId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 600 });
  return { uploadUrl, publicUrl: getPublicImageUrl(key), key };
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return getPublicImageUrl(key);
}
