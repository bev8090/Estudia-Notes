import { createApp } from "./app.ts";
import { env } from "./lib/env.ts";
import { failInterruptedJobs } from "./services/jobs.ts";

await failInterruptedJobs();

createApp().listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
