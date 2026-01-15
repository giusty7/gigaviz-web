#!/usr/bin/env tsx

import { loadIndexerConfig } from "@/lib/kb/env";
import { KBIndexer } from "@/lib/kb/indexer";

async function main() {
  const mode = process.argv[2] ?? "all";
  const config = loadIndexerConfig();
  const indexer = new KBIndexer(config);

  await indexer.run(mode === "docs" || mode === "web" ? (mode as "docs" | "web") : "all");

  console.log("KB indexer finished", indexer.getStats());
}

main().catch((err) => {
  console.error("KB indexer failed", err);
  process.exit(1);
});
