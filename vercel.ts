import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  installCommand: "npm install",
  buildCommand: "npm run build",
  crons: [{ path: "/api/cron/movies", schedule: "0 6 * * *" }],
};
