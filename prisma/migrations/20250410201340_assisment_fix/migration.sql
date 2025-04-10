/*
  Warnings:

  - Made the column `submittedAt` on table `StudentSubmission` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "StudentSubmission_assessmentSessionId_studentId_key";

-- AlterTable
ALTER TABLE "StudentSubmission" ALTER COLUMN "submissionStatus" SET DEFAULT 'COMPLETED',
ALTER COLUMN "submittedAt" SET NOT NULL,
ALTER COLUMN "submittedAt" SET DEFAULT CURRENT_TIMESTAMP;
