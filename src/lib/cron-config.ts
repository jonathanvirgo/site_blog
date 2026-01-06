// Cron job configuration
export const cronConfig = {
  // Supabase health check schedule
  // Prevents 7-day inactivity timeout
  supabaseHealthCheck: {
    // Cron expression: '0 */6 * * *' = every 6 hours
    // Other options:
    // - '0 0 * * *'      = daily at midnight
    // - '0 0,12 * * *'   = twice daily (midnight and noon)
    // - '0 */4 * * *'    = every 4 hours
    // - '0 */3 * * *'    = every 3 hours
    schedule: '0 0 * * *',
    enabled: true,
    // Set to false to disable during development
    runOnStartup: false, // Run immediately when app starts (in addition to schedule)
  },
};
