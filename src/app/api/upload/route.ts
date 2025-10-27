import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isMinioEnabled, uploadToMinio } from "@/lib/minio";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const mime = file.type;
    const size = file.size;
    if (!ALLOWED_MIME.includes(mime)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extFromType = mime === "image/jpeg" ? ".jpg" : mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : mime === "image/gif" ? ".gif" : mime === "image/svg+xml" ? ".svg" : "";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${extFromType}`;

    // If MinIO is configured, upload there and return public URL constructed from MINIO_PUBLIC_URL or MINIO_ENDPOINT
    if (isMinioEnabled()) {
      try {
        const url = await uploadToMinio(buffer, filename, mime);
        return NextResponse.json({ url }, { status: 201 });
      } catch (err) {
        console.error("MinIO upload failed, falling back to local storage:", err);
        // fall through to local fallback
      }
    }

    // Local fallback: store in `public/uploads` (existing behavior)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
