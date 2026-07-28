import { NextRequest } from "next/server";
import { UploadController } from "../controllers/upload.controller";

const uploadController = new UploadController();

export async function uploadRoute(request: NextRequest) {
  return uploadController.upload(request);
}
