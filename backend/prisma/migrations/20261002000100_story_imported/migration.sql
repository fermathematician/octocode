-- Marks stories that were created automatically from a pushed branch.
ALTER TABLE "Story" ADD COLUMN "imported" BOOLEAN NOT NULL DEFAULT false;
