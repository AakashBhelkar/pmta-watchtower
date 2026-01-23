-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('acct', 'tran', 'bounce', 'fbl', 'rb', 'unknown');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('pending', 'processing', 'completed', 'error');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('open', 'acknowledged', 'resolved');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('domain', 'vmta', 'user', 'job', 'ip');

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileHash" TEXT,
    "fileSize" BIGINT,
    "uploadTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'pending',
    "rowCount" INTEGER,
    "errorLogs" JSONB DEFAULT '[]',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "eventType" "FileType" NOT NULL,
    "eventTimestamp" TIMESTAMP(3),
    "fileId" TEXT,
    "jobId" TEXT,
    "sender" TEXT,
    "recipient" TEXT,
    "recipientDomain" TEXT,
    "vmta" TEXT,
    "vmtaPool" TEXT,
    "sourceIp" TEXT,
    "destinationIp" TEXT,
    "envId" TEXT,
    "messageId" TEXT,
    "customHeader" TEXT,
    "smtpStatus" TEXT,
    "bounceCategory" TEXT,
    "dsnAction" TEXT,
    "dsnDiag" TEXT,
    "deliveryLatency" DECIMAL(10,3),
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateMinute" (
    "id" TEXT NOT NULL,
    "timeBucket" TIMESTAMP(3) NOT NULL,
    "eventType" "FileType" NOT NULL,
    "jobId" TEXT,
    "sender" TEXT,
    "recipientDomain" TEXT,
    "vmta" TEXT,
    "fileId" TEXT,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "bounced" INTEGER NOT NULL DEFAULT 0,
    "deferred" INTEGER NOT NULL DEFAULT 0,
    "complaints" INTEGER NOT NULL DEFAULT 0,
    "avgLatencyMs" DOUBLE PRECISION,
    "p95LatencyMs" DOUBLE PRECISION,

    CONSTRAINT "AggregateMinute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityValue" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "contributingFactors" JSONB DEFAULT '{}',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityValue" TEXT NOT NULL,
    "timeWindowStart" TIMESTAMP(3) NOT NULL,
    "timeWindowEnd" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "probableCause" TEXT,
    "metrics" JSONB DEFAULT '{}',
    "status" "AlertStatus" NOT NULL DEFAULT 'open',
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityValue" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "summary" TEXT NOT NULL,
    "rootCause" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_fileHash_key" ON "File"("fileHash");

-- CreateIndex
CREATE INDEX "File_fileType_idx" ON "File"("fileType");

-- CreateIndex
CREATE INDEX "File_fileHash_idx" ON "File"("fileHash");

-- CreateIndex
CREATE INDEX "File_uploadTime_idx" ON "File"("uploadTime");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_eventTimestamp_idx" ON "Event"("eventTimestamp");

-- CreateIndex
CREATE INDEX "Event_jobId_idx" ON "Event"("jobId");

-- CreateIndex
CREATE INDEX "Event_sender_idx" ON "Event"("sender");

-- CreateIndex
CREATE INDEX "Event_recipientDomain_idx" ON "Event"("recipientDomain");

-- CreateIndex
CREATE INDEX "Event_vmta_idx" ON "Event"("vmta");

-- CreateIndex
CREATE INDEX "Event_fileId_idx" ON "Event"("fileId");

-- CreateIndex
CREATE INDEX "Event_messageId_idx" ON "Event"("messageId");

-- CreateIndex
CREATE INDEX "AggregateMinute_timeBucket_idx" ON "AggregateMinute"("timeBucket");

-- CreateIndex
CREATE INDEX "AggregateMinute_recipientDomain_timeBucket_idx" ON "AggregateMinute"("recipientDomain", "timeBucket");

-- CreateIndex
CREATE INDEX "AggregateMinute_jobId_timeBucket_idx" ON "AggregateMinute"("jobId", "timeBucket");

-- CreateIndex
CREATE INDEX "AggregateMinute_eventType_idx" ON "AggregateMinute"("eventType");

-- CreateIndex
CREATE INDEX "AggregateMinute_fileId_idx" ON "AggregateMinute"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "AggregateMinute_timeBucket_eventType_jobId_sender_recipient_key" ON "AggregateMinute"("timeBucket", "eventType", "jobId", "sender", "recipientDomain", "vmta", "fileId");

-- CreateIndex
CREATE INDEX "RiskScore_riskScore_idx" ON "RiskScore"("riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "RiskScore_entityType_entityValue_key" ON "RiskScore"("entityType", "entityValue");

-- CreateIndex
CREATE INDEX "Alert_entityType_entityValue_idx" ON "Alert"("entityType", "entityValue");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE INDEX "Incident_entityType_entityValue_idx" ON "Incident"("entityType", "entityValue");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
