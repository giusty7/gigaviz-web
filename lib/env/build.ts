import "dotenv/config";
import { loadPublicEnv } from "./public";
import { loadServerEnv } from "./server";

export function validateBuildEnv(): void {
  // Throws if invalid
  loadPublicEnv();
  loadServerEnv();
}

// Allow standalone execution (npm run env:check)
if (require.main === module) {
  validateBuildEnv();
  console.log("Environment variables validated.");
}
