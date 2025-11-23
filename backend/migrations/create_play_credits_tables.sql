-- Create play_credits table
CREATE TABLE IF NOT EXISTS play_credits (
  id SERIAL PRIMARY KEY,
  user_sui_address VARCHAR(66) NOT NULL UNIQUE,
  remaining_plays INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create play_credit_purchases table to track purchase history
CREATE TABLE IF NOT EXISTS play_credit_purchases (
  id SERIAL PRIMARY KEY,
  user_sui_address VARCHAR(66) NOT NULL,
  number_of_plays INTEGER NOT NULL,
  amount_sui DECIMAL(18, 9) NOT NULL,
  transaction_digest VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  -- Note: No foreign key constraint to allow purchases even if credits record doesn't exist yet
  -- The service will create the credits record if needed
);

-- Create index on user_sui_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_play_credits_user_address ON play_credits(user_sui_address);
CREATE INDEX IF NOT EXISTS idx_play_credit_purchases_user_address ON play_credit_purchases(user_sui_address);
CREATE INDEX IF NOT EXISTS idx_play_credit_purchases_transaction ON play_credit_purchases(transaction_digest);

