import { createApp } from "./app.ts";
import { env } from "./lib/env.ts";
import { failInterruptedJobs } from "./services/jobs.ts";
import { cleanupExpiredDemoGuides } from "./routes/demo.ts";

await failInterruptedJobs();
await cleanupExpiredDemoGuides();

createApp().listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
