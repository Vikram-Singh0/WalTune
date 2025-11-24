// Load environment variables FIRST
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root
dotenv.config({ path: join(__dirname, "../../.env") });

// Export configuration
export const config = {
  // Server
  PORT: parseInt(process.env.PORT || "3001", 10),
  HOST: process.env.HOST || "0.0.0.0",
  NODE_ENV: process.env.NODE_ENV || "development",

  // Sui
  SUI_NETWORK: process.env.SUI_NETWORK || "testnet",
  SUI_RPC_URL: process.env.SUI_RPC_URL,
  PACKAGE_ID: process.env.PACKAGE_ID || "",
  ARTIST_REGISTRY_ID: process.env.ARTIST_REGISTRY_ID || "",
  SONG_REGISTRY_ID: process.env.SONG_REGISTRY_ID || "",
  BACKEND_PRIVATE_KEY: process.env.BACKEND_PRIVATE_KEY || "",

  // Walrus
  WALRUS_PUBLISHER_URL: process.env.WALRUS_PUBLISHER_URL,
  WALRUS_AGGREGATOR_URL: process.env.WALRUS_AGGREGATOR_URL,

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // x402
  X402_FACILITATOR_URL: process.env.X402_FACILITATOR_URL,
  X402_USE_MOCK: process.env.X402_USE_MOCK === "true",
};

// Log configuration on load (only critical values)
console.log("📋 Configuration loaded:");
console.log("   PACKAGE_ID:", config.PACKAGE_ID ? "✅ SET" : "❌ NOT SET");
console.log("   ARTIST_REGISTRY_ID:", config.ARTIST_REGISTRY_ID ? "✅ SET" : "❌ NOT SET");
console.log("   SONG_REGISTRY_ID:", config.SONG_REGISTRY_ID ? "✅ SET" : "❌ NOT SET");
console.log("   BACKEND_PRIVATE_KEY:", config.BACKEND_PRIVATE_KEY ? "✅ SET" : "❌ NOT SET");
console.log("   DATABASE_URL:", config.DATABASE_URL ? "✅ SET" : "❌ NOT SET");
