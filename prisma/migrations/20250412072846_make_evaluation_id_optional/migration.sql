-- DropForeignKey
ALTER TABLE "StudentResponse" DROP CONSTRAINT "StudentResponse_evaluationId_fkey";

-- AlterTable
ALTER TABLE "StudentResponse" ALTER COLUMN "evaluationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StudentResponse" ADD CONSTRAINT "StudentResponse_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
