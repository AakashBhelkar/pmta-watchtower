-- Add messageKey as a generated column to Event table
-- This provides consistent message deduplication across all queries

-- Step 1: Add messageKey column (nullable first for existing data)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "messageKey" TEXT;

-- Step 2: Populate messageKey for existing rows
UPDATE "Event"
SET "messageKey" = COALESCE("messageId", CONCAT("jobId", ':', "recipient"))
WHERE "messageKey" IS NULL;

-- Step 3: Create index on messageKey for efficient lookups
CREATE INDEX IF NOT EXISTS "Event_messageKey_idx" ON "Event"("messageKey");

-- Step 4: Create composite index for messageKey + eventType (common query pattern)
CREATE INDEX IF NOT EXISTS "Event_messageKey_eventType_idx" ON "Event"("messageKey", "eventType");

-- Add message-level columns to AggregateMinute table
ALTER TABLE "AggregateMinute" ADD COLUMN IF NOT EXISTS "messageAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AggregateMinute" ADD COLUMN IF NOT EXISTS "deliveredMessages" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AggregateMinute" ADD COLUMN IF NOT EXISTS "bouncedMessages" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AggregateMinute" ADD COLUMN IF NOT EXISTS "complaintMessages" INTEGER NOT NULL DEFAULT 0;

-- Add latency sum/count columns for correct aggregation math
ALTER TABLE "AggregateMinute" ADD COLUMN IF NOT EXISTS "latencySumMs" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "AggregateMinute" ADD COLUMN IF NOT EXISTS "latencyCount" INTEGER NOT NULL DEFAULT 0;

-- Create a trigger function to auto-populate messageKey on INSERT
CREATE OR REPLACE FUNCTION set_message_key()
RETURNS TRIGGER AS $$
BEGIN
    NEW."messageKey" := COALESCE(NEW."messageId", CONCAT(NEW."jobId", ':', NEW."recipient"));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set messageKey on new events
DROP TRIGGER IF EXISTS trigger_set_message_key ON "Event";
CREATE TRIGGER trigger_set_message_key
    BEFORE INSERT ON "Event"
    FOR EACH ROW
    EXECUTE FUNCTION set_message_key();
