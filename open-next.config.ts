import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
	// Uncomment to enable R2 cache for ISR/data caching
	// incrementalCache: r2IncrementalCache,
});
