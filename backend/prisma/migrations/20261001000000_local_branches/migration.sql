-- CreateTable
CREATE TABLE "LocalBranch" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalBranch_projectId_name_key" ON "LocalBranch"("projectId", "name");

-- CreateIndex
CREATE INDEX "LocalBranch_projectId_idx" ON "LocalBranch"("projectId");

-- AddForeignKey
ALTER TABLE "LocalBranch" ADD CONSTRAINT "LocalBranch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
