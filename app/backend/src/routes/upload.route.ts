import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";

const uploadPath = path.join(process.cwd(), "app", "backend", "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

export async function uploadRoute(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        ApiResponseHelper.error("No file uploaded", 400),
        { status: 400 }
      );
    }

    const fileSuffix = uuidv4();
    const filename = `${fileSuffix}-${file.name}`;
    const filepath = path.join(uploadPath, filename);

    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(bytes));

    return NextResponse.json(
      ApiResponseHelper.success(
        { filename, size: file.size, type: file.type },
        "File uploaded successfully"
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "File upload failed";
    return NextResponse.json(
      ApiResponseHelper.error(message, 400),
      { status: 400 }
    );
  }
}
