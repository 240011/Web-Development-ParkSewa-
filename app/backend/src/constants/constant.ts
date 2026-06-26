export const MONGODB_URL = process.env.MONGODB_URI || "mongodb://localhost:27017/parksewa";
export const MONGODB_TEST_URL = process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/parksewa_test";

export const EMAIL_USER: string = process.env.EMAIL_USER || "";
export const EMAIL_PASS: string = process.env.EMAIL_PASS || "";
export const CLIENT_URL: string = process.env.CLIENT_URL || 'http://localhost:3000';