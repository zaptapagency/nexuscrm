/**
 * Environment variable validation
 * Ensures all required env vars are set and have valid formats
 */

export function validateEnv() {
  const required = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      `See .env.example for the required format.`
    );
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!;
  if (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://") && !dbUrl.startsWith("file:")) {
    throw new Error(
      `Invalid DATABASE_URL format. Expected postgresql:// or postgres:// or file:// format, got: ${dbUrl.substring(0, 20)}...`
    );
  }

  // Validate NEXTAUTH_URL format
  const authUrl = process.env.NEXTAUTH_URL!;
  if (!authUrl.startsWith("http://") && !authUrl.startsWith("https://")) {
    throw new Error(
      `Invalid NEXTAUTH_URL format. Expected http:// or https://, got: ${authUrl}`
    );
  }

  return {
    DATABASE_URL: dbUrl,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: authUrl,
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

// Validate on module load
if (typeof window === "undefined") {
  // Only run on server
  validateEnv();
}
