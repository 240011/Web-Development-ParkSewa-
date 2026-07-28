import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";

type UploadedFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type NodeRequestWithFile = Readable & {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  file?: UploadedFile;
};

type MulterRequest = Parameters<typeof uploadSingleFile>[0];
type MulterResponse = Parameters<typeof uploadSingleFile>[1];
type MulterCallback = Parameters<typeof uploadSingleFile>[2];

const uploadPath = path.join(process.cwd(), "app", "backend", "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxFileSize = 5 * 1024 * 1024;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: (_request, file, callback) => {
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Only JPG, PNG, WEBP and GIF images are allowed"));
  },
});
const uploadSingleFile = upload.single("file");

function createNodeRequest(request: NextRequest) {
  if (!request.body) {
    throw new Error("No file uploaded");
  }

  const reader = request.body.getReader();
  let reading = false;
  const stream = new Readable({
    read() {
      if (reading) return;

      reading = true;

      reader.read()
        .then(({ done, value }) => {
          reading = false;

          if (done) {
            this.push(null);
            return;
          }

          this.push(value);
        })
        .catch((error) => {
          this.destroy(error instanceof Error ? error : new Error("Upload stream failed"));
        });
    },
  });

  return Object.assign(stream, {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  }) as NodeRequestWithFile;
}

export class UploadController {
  async upload(request: NextRequest) {
    try {
      const nodeRequest = createNodeRequest(request);

      await new Promise<void>((resolve, reject) => {
        uploadSingleFile(
          nodeRequest as unknown as MulterRequest,
          {} as MulterResponse,
          ((error?: Error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          }) as MulterCallback
        );
      });

      const file = nodeRequest.file;

      if (!file) {
        return NextResponse.json(
          ApiResponseHelper.error("No file uploaded", 400),
          { status: 400 }
        );
      }

      if (file.size > maxFileSize) {
        return NextResponse.json(
          ApiResponseHelper.error("File size must be 5 MB or smaller", 400),
          { status: 400 }
        );
      }

      const fileSuffix = uuidv4();
      const safeOriginalName = file.originalname.replace(/[\\/]/g, "-");
      const filename = `${fileSuffix}-${safeOriginalName}`;
      const filepath = path.join(uploadPath, filename);
      const url = `/api/v1/uploads/files/${encodeURIComponent(filename)}`;

      fs.writeFileSync(filepath, file.buffer);

      return NextResponse.json(
        ApiResponseHelper.success(
          { filename, url, size: file.size, type: file.mimetype },
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
}
