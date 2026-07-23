import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const accessKeyId = process.env.B2_APPLICATION_KEY_ID;
const secretAccessKey = process.env.B2_APPLICATION_KEY;
const endpoint = process.env.B2_ENDPOINT;
const bucket = process.env.B2_BUCKET_NAME ?? "pazaryeri-listings";
const publicUrl = process.env.B2_PUBLIC_URL;

let client: S3Client | null = null;

function getB2Client(): S3Client {
  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("Backblaze B2 credentials not configured");
  }
  if (!client) {
    client = new S3Client({
      region: process.env.B2_REGION ?? "us-west-004",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

function getPublicImageUrl(key: string): string {
  if (publicUrl) return `${publicUrl.replace(/\/$/, "")}/${key}`;
  return `https://f004.backblazeb2.com/file/${bucket}/${key}`;
}

export function isB2Configured(): boolean {
  return Boolean(accessKeyId && secretAccessKey && endpoint);
}

export async function uploadToB2(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const key = `listings/${userId}/${randomUUID()}.${ext}`;

  await getB2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return getPublicImageUrl(key);
}
