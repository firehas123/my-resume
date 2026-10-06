// Where is this code running? Vercel sets VERCEL_ENV to "production",
// "preview" or "development"; locally it is not set at all.
// Analytics and the visit counter only ever run on the production site.

export const isProductionDeployment = process.env.VERCEL_ENV === "production";

// For local testing of the visit counter only (never set this on Vercel):
// STATS_TEST_MODE=1 lets the counter run outside production.
export const statsEnabled = isProductionDeployment || process.env.STATS_TEST_MODE === "1";
