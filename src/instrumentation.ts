import { initCronJobs } from "@/lib/cron";

export async function register() {
    // Only run on the server (Node.js runtime)
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("🔧 Instrumentation: Registering server-side services...\n");

        // Initialize cron jobs
        initCronJobs();
    }
}
