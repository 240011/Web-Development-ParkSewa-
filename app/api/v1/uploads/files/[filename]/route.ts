import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { ApiResponseHelper } from "../../../../../backend/src/helpers/ApiResponseHelper";

const uploadPath = path.join(process.cwd(), "app", "backend", "uploads");

function getContentType(filename: string) {
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> | { filename: string } }
) {
  const { filename } = await params;
  const safeFilename = decodeURIComponent(path.basename(filename));
  const filepath = path.join(uploadPath, safeFilename);

  try {
    const file = await fs.readFile(filepath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": getContentType(safeFilename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      ApiResponseHelper.error("File not found", 404),
      { status: 404 }
    );
  }
}
