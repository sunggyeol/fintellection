export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { preCacheFredSeries } = await import("@/lib/api/provider-chain");
    preCacheFredSeries().catch((err) =>
      console.error("[FRED] Pre-cache failed:", err)
    );
  }
}
