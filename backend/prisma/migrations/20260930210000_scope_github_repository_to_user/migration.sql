-- Repository identity was globally unique (`repoId` and `(owner, name)`), which
-- prevented different users from linking the same GitHub repository. Scope the
-- uniqueness to the owning user instead.

-- DropIndex
DROP INDEX "GithubRepository_repoId_key";
DROP INDEX "GithubRepository_owner_name_key";

-- AlterTable: add the denormalized owner and backfill it from the linked project
ALTER TABLE "GithubRepository" ADD COLUMN "userId" TEXT;

UPDATE "GithubRepository"
SET "userId" = "Project"."ownerId"
FROM "Project"
WHERE "GithubRepository"."projectId" = "Project"."id";

ALTER TABLE "GithubRepository" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GithubRepository_userId_repoId_key" ON "GithubRepository"("userId", "repoId");

-- AddForeignKey
ALTER TABLE "GithubRepository" ADD CONSTRAINT "GithubRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
