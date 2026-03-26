-- Fix failed migration in Railway PostgreSQL
-- Run this in Railway PostgreSQL Query tab

-- Step 1: Mark the failed migration as rolled back
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20251018_complete_schema_sync';

-- Step 2: If you want to skip this migration entirely, mark it as applied
-- Uncomment the following if you want to skip it:
-- INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
-- VALUES (gen_random_uuid(), '', NOW(), '20251018_complete_schema_sync', NULL, NULL, NOW(), 1);

-- Step 3: Check remaining migrations
SELECT migration_name, finished_at, rolled_back_at 
FROM "_prisma_migrations" 
ORDER BY started_at DESC;
