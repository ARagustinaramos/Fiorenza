import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const cwd = process.cwd();
const envLocalPath = path.join(cwd, ".env.local");
const envPath = path.join(cwd, ".env");

if (process.env.NODE_ENV !== "production" && fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

