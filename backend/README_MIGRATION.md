# Database Migration Guide

## Play Credits Tables Migration

To set up the play credits system, you need to run the database migration.

### Steps:

1. **Connect to your database** (PostgreSQL/Neon)

2. **Run the migration SQL**:
   ```bash
   # Option 1: Using psql
   psql $DATABASE_URL -f migrations/create_play_credits_tables.sql
   
   # Option 2: Copy and paste the SQL from migrations/create_play_credits_tables.sql into your database client
   ```

3. **Verify tables were created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('play_credits', 'play_credit_purchases');
   ```

### Tables Created:

- **play_credits**: Stores user play credits (remaining plays, total purchased)
- **play_credit_purchases**: Tracks purchase history (transaction digests, amounts)

### Migration File Location:

`backend/migrations/create_play_credits_tables.sql`

