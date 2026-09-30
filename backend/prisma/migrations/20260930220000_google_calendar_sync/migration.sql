-- AlterEnum
ALTER TYPE "OAuthProvider" ADD VALUE 'GOOGLE';

-- CreateEnum
CREATE TYPE "CalendarEventSource" AS ENUM ('LOCAL', 'GOOGLE');

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "source" "CalendarEventSource" NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "CalendarEvent" ADD COLUMN "externalId" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "externalUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CalendarSyncState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "syncToken" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_userId_externalId_key" ON "CalendarEvent"("userId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSyncState_userId_key" ON "CalendarSyncState"("userId");

-- AddForeignKey
ALTER TABLE "CalendarSyncState" ADD CONSTRAINT "CalendarSyncState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
