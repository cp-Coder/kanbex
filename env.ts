import { createEnv } from "@t3-oss/env-core";
import z from "zod";
import dotenv from "dotenv";

dotenv.config();

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
});