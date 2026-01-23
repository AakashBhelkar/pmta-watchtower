-- CreateIndex
CREATE INDEX "AggregateMinute_sender_timeBucket_idx" ON "AggregateMinute"("sender", "timeBucket");

-- CreateIndex
CREATE INDEX "AggregateMinute_recipientDomain_eventType_timeBucket_idx" ON "AggregateMinute"("recipientDomain", "eventType", "timeBucket");

-- CreateIndex
CREATE INDEX "AggregateMinute_eventType_timeBucket_idx" ON "AggregateMinute"("eventType", "timeBucket");

-- CreateIndex
CREATE INDEX "Alert_alertType_entityValue_status_createdAt_idx" ON "Alert"("alertType", "entityValue", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Event_eventType_eventTimestamp_idx" ON "Event"("eventType", "eventTimestamp");

-- CreateIndex
CREATE INDEX "Event_sender_eventType_idx" ON "Event"("sender", "eventType");

-- CreateIndex
CREATE INDEX "Event_recipientDomain_eventTimestamp_idx" ON "Event"("recipientDomain", "eventTimestamp");

-- CreateIndex
CREATE INDEX "Event_eventTimestamp_recipientDomain_idx" ON "Event"("eventTimestamp", "recipientDomain");

-- CreateIndex
CREATE INDEX "Event_fileId_eventTimestamp_idx" ON "Event"("fileId", "eventTimestamp");
