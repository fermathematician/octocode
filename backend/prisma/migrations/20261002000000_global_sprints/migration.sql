-- Sprints become global per user instead of belonging to a single project.

-- 1. Add the new owner column (nullable at first).
ALTER TABLE "Sprint" ADD COLUMN "ownerId" TEXT;

-- 2. Backfill ownership from the owning project.
UPDATE "Sprint" s
SET "ownerId" = p."ownerId"
FROM "Project" p
WHERE s."projectId" = p."id";

-- 3. Enforce ownership.
ALTER TABLE "Sprint" ALTER COLUMN "ownerId" SET NOT NULL;

-- 4. Remove the project link.
ALTER TABLE "Sprint" DROP CONSTRAINT "Sprint_projectId_fkey";
DROP INDEX "Sprint_projectId_idx";
ALTER TABLE "Sprint" DROP COLUMN "projectId";

-- 5. Scope sprints by their owner.
CREATE INDEX "Sprint_ownerId_idx" ON "Sprint"("ownerId");

ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
