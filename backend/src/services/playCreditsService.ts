import { query } from "../db/database.js";

export interface PlayCredits {
  id: string;
  userSuiAddress: string;
  remainingPlays: number;
  totalPurchased: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseCreditsResult {
  success: boolean;
  credits?: PlayCredits;
  error?: string;
}

export interface UseCreditsResult {
  success: boolean;
  remainingPlays?: number;
  error?: string;
}

/**
 * Play Credits Service
 * Manages user play credits for music streaming
 */
export class PlayCreditsService {
  /**
   * Get or create play credits for a user
   */
  async getOrCreateCredits(
    userSuiAddress: string
  ): Promise<PlayCredits | null> {
    try {
      // Try to get existing credits
      const result = await query<PlayCredits>(
        `SELECT id, user_sui_address, remaining_plays, total_purchased, created_at, updated_at
         FROM play_credits
         WHERE user_sui_address = $1
         LIMIT 1`,
        [userSuiAddress]
      );

      if (result.rows.length > 0) {
        return this.mapRowToCredits(result.rows[0]);
      }

      // Create new credits record with 0 plays
      const insertResult = await query<PlayCredits>(
        `INSERT INTO play_credits (user_sui_address, remaining_plays, total_purchased)
         VALUES ($1, 0, 0)
         RETURNING id, user_sui_address, remaining_plays, total_purchased, created_at, updated_at`,
        [userSuiAddress]
      );

      if (insertResult.rows.length === 0) {
        return null;
      }

      return this.mapRowToCredits(insertResult.rows[0]);
    } catch (error: any) {
      console.error("Error getting or creating credits:", error);
      // Check if it's a table doesn't exist error
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        console.error("❌ Database table 'play_credits' does not exist. Please run the migration:");
        console.error("   Run: backend/migrations/create_play_credits_tables.sql");
        throw new Error("Database tables not initialized. Please run the migration script: backend/migrations/create_play_credits_tables.sql");
      }
      throw error; // Re-throw to let the route handle it
    }
  }

  /**
   * Get play credits for a user
   */
  async getCredits(userSuiAddress: string): Promise<PlayCredits | null> {
    try {
      const result = await query<PlayCredits>(
        `SELECT id, user_sui_address, remaining_plays, total_purchased, created_at, updated_at
         FROM play_credits
         WHERE user_sui_address = $1
         LIMIT 1`,
        [userSuiAddress]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToCredits(result.rows[0]);
    } catch (error) {
      console.error("Error getting credits:", error);
      return null;
    }
  }

  /**
   * Purchase play credits
   * Records the purchase and adds credits to user's account
   */
  async purchaseCredits(
    userSuiAddress: string,
    numberOfPlays: number,
    amountInSui: number,
    transactionDigest: string
  ): Promise<PurchaseCreditsResult> {
    try {
      // Get or create credits record
      let credits = await this.getOrCreateCredits(userSuiAddress);
      
      if (!credits) {
        return {
          success: false,
          error: "Failed to get or create credits record",
        };
      }

      // Add credits
      const newRemainingPlays = credits.remainingPlays + numberOfPlays;
      const newTotalPurchased = credits.totalPurchased + numberOfPlays;

      const updateResult = await query<PlayCredits>(
        `UPDATE play_credits
         SET remaining_plays = $1, total_purchased = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_sui_address = $3
         RETURNING id, user_sui_address, remaining_plays, total_purchased, created_at, updated_at`,
        [newRemainingPlays, newTotalPurchased, userSuiAddress]
      );

      if (updateResult.rows.length === 0) {
        return {
          success: false,
          error: "Failed to update credits",
        };
      }

      // Record purchase transaction
      await query(
        `INSERT INTO play_credit_purchases (user_sui_address, number_of_plays, amount_sui, transaction_digest)
         VALUES ($1, $2, $3, $4)`,
        [userSuiAddress, numberOfPlays, amountInSui, transactionDigest]
      );

      return {
        success: true,
        credits: this.mapRowToCredits(updateResult.rows[0]),
      };
    } catch (error: any) {
      console.error("Error purchasing credits:", error);
      return {
        success: false,
        error: error.message || "Failed to purchase credits",
      };
    }
  }

  /**
   * Use one play credit
   * Deducts one play from user's remaining credits
   */
  async useCredit(userSuiAddress: string): Promise<UseCreditsResult> {
    try {
      const credits = await this.getCredits(userSuiAddress);

      if (!credits) {
        return {
          success: false,
          error: "No credits found for user",
        };
      }

      if (credits.remainingPlays <= 0) {
        return {
          success: false,
          error: "Insufficient play credits",
        };
      }

      const newRemainingPlays = credits.remainingPlays - 1;

      const updateResult = await query<PlayCredits>(
        `UPDATE play_credits
         SET remaining_plays = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_sui_address = $2
         RETURNING remaining_plays`,
        [newRemainingPlays, userSuiAddress]
      );

      if (updateResult.rows.length === 0) {
        return {
          success: false,
          error: "Failed to update credits",
        };
      }

      return {
        success: true,
        remainingPlays: updateResult.rows[0].remaining_plays,
      };
    } catch (error: any) {
      console.error("Error using credit:", error);
      return {
        success: false,
        error: error.message || "Failed to use credit",
      };
    }
  }

  /**
   * Check if user has available credits
   */
  async hasCredits(userSuiAddress: string): Promise<boolean> {
    try {
      const credits = await this.getCredits(userSuiAddress);
      return credits ? credits.remainingPlays > 0 : false;
    } catch (error) {
      console.error("Error checking credits:", error);
      return false;
    }
  }

  /**
   * Map database row to PlayCredits object
   */
  private mapRowToCredits(row: any): PlayCredits {
    return {
      id: row.id,
      userSuiAddress: row.user_sui_address,
      remainingPlays: row.remaining_plays,
      totalPurchased: row.total_purchased,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Singleton instance
export const playCreditsService = new PlayCreditsService();

