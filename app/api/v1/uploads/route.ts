import { NextRequest } from "next/server";
import { uploadRoute } from "../../../backend/src/routes/upload.route";

export async function POST(request: NextRequest) {
    return uploadRoute(request);
}
