import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const cwd = process.cwd();
const envLocalPath = path.join(cwd, ".env.local");
const envPath = path.join(cwd, ".env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

if (process.env.NODE_ENV !== "production" && fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}

