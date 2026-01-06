import cron from "node-cron";
import prisma from "./prisma";
import { cronConfig } from "./cron-config";

/**
 * Initialize all cron jobs
 */
export function initCronJobs() {
    console.log("🚀 Initializing cron jobs...\n");

    // Setup Supabase health check cron job
    if (cronConfig.supabaseHealthCheck.enabled) {
        const schedule = cronConfig.supabaseHealthCheck.schedule;

        // Run on startup if configured
        if (cronConfig.supabaseHealthCheck.runOnStartup) {
            (async () => {
                const now = new Date().toISOString();
                console.log(`\n[${now}] 🔄 Running initial Supabase health check...`);
                try {
                    await prisma.$queryRaw`SELECT 1 as ping`;
                    console.log(`[${now}] ✅ Supabase is active\n`);
                } catch (error) {
                    console.error(`[${now}] ❌ Supabase health check failed:`, error);
                }
            })();
        }

        // Schedule periodic health checks
        cron.schedule(schedule, async () => {
            const now = new Date().toISOString();
            console.log(`\n[${now}] 🔄 Running Supabase health check...`);
            try {
                await prisma.$queryRaw`SELECT 1 as ping`;
                console.log(
                    `[${now}] ✅ Supabase health check passed - connection active\n`
                );
            } catch (error) {
                console.error(`[${now}] ❌ Supabase health check failed:`, error);
            }
        });

        console.log(
            `⏰ Cron job enabled: Supabase health check - Schedule: "${schedule}"`
        );
    } else {
        console.log("⏰ Cron job disabled (supabaseHealthCheck.enabled = false)");
    }

    console.log("\n✅ Cron jobs initialized successfully!\n");
}
