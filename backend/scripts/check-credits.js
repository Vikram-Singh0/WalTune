#!/usr/bin/env node

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function checkCredits() {
  try {
    console.log("🔍 Checking play credits in database...\n");
    
    const result = await pool.query(`
      SELECT 
        user_sui_address,
        remaining_plays,
        total_purchased,
        created_at,
        updated_at
      FROM play_credits
      ORDER BY updated_at DESC
      LIMIT 10
    `);

    if (result.rows.length === 0) {
      console.log("❌ No play credits found in database.");
    } else {
      console.log(`✅ Found ${result.rows.length} credit record(s):\n`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. User: ${row.user_sui_address}`);
        console.log(`   Remaining Plays: ${row.remaining_plays}`);
        console.log(`   Total Purchased: ${row.total_purchased}`);
        console.log(`   Updated: ${row.updated_at}\n`);
      });
    }

    // Check purchases
    const purchases = await pool.query(`
      SELECT 
        user_sui_address,
        number_of_plays,
        amount_sui,
        transaction_digest,
        created_at
      FROM play_credit_purchases
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (purchases.rows.length === 0) {
      console.log("❌ No purchase records found.");
    } else {
      console.log(`\n📦 Found ${purchases.rows.length} purchase(s):\n`);
      purchases.rows.forEach((row, index) => {
        console.log(`${index + 1}. User: ${row.user_sui_address}`);
        console.log(`   Plays: ${row.number_of_plays}`);
        console.log(`   Amount: ${row.amount_sui} SUI`);
        console.log(`   TX: ${row.transaction_digest}`);
        console.log(`   Date: ${row.created_at}\n`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkCredits();

