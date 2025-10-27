import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT;
const bucket = process.env.MINIO_BUCKET;
const region = process.env.MINIO_REGION || "us-east-1";

// Support multiple environment variable names (MINIO_ACCESS_KEY / MINIO_SECRET_KEY or MINIO_ROOT_USER / MINIO_ROOT_PASSWORD)
const accessKey = process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY_ID;
const secretKey = process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_ACCESS_KEY;

let s3: S3Client | null = null;

if (endpoint && bucket && accessKey && secretKey) {
  s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  } as any);
}

export function isMinioEnabled(): boolean {
  return !!s3 && !!bucket;
}

export async function uploadToMinio(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (!s3 || !bucket) throw new Error("MinIO not configured");

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  // Construct public URL. Prefer explicit public URL if provided, else derive from endpoint.
  const publicBase = process.env.MINIO_PUBLIC_URL || process.env.MINIO_BROWSER_REDIRECT_URL || endpoint || "";
  const base = publicBase.replace(/\/+$/g, "");
  return `${base}/${bucket}/${key}`;
}
