#!/usr/bin/env node

/**
 * Database Setup Script
 * Runs the play credits migration
 */

import pg from "pg";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function runMigration() {
  console.log("🚀 Running database migration...");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  try {
    // Read migration file
    const migrationPath = join(__dirname, "../migrations/create_play_credits_tables.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("📄 Executing migration SQL...");
    
    // Execute migration
    await pool.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("📊 Tables created:");
    console.log("   - play_credits");
    console.log("   - play_credit_purchases");

    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('play_credits', 'play_credit_purchases')
      ORDER BY table_name
    `);

    console.log("\n✅ Verified tables:");
    result.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    
    if (error.message.includes("already exists")) {
      console.log("ℹ️  Tables may already exist. This is okay.");
    } else {
      console.error("\nFull error:", error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();

