-- Commits are stored per branch: the same commit can appear on several
-- branches (e.g. a shared ancestor), and each card must show only the commits
-- that belong to its own branch.

-- 1. Backfill any null branch (there should not be any) from the repository.
UPDATE "Commit" c
SET "branch" = r."defaultBranch"
FROM "GithubRepository" r
WHERE c."repositoryId" = r."id" AND c."branch" IS NULL;

-- 2. Branch is now required.
ALTER TABLE "Commit" ALTER COLUMN "branch" SET NOT NULL;

-- 3. Uniqueness is per branch, not per repository.
DROP INDEX "Commit_repositoryId_sha_key";
CREATE UNIQUE INDEX "Commit_repositoryId_branch_sha_key" ON "Commit"("repositoryId", "branch", "sha");
