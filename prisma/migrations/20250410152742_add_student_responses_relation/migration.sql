-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "gradingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StudentResponseScore" (
    "id" UUID NOT NULL,
    "studentResponseId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentResponseScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "topicIds" UUID[],

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssessmentSessionToEvaluation" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AssessmentSessionToEvaluation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AssessmentSessionToEvaluation_B_index" ON "_AssessmentSessionToEvaluation"("B");

-- AddForeignKey
ALTER TABLE "StudentResponseScore" ADD CONSTRAINT "StudentResponseScore_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssessmentSessionToEvaluation" ADD CONSTRAINT "_AssessmentSessionToEvaluation_A_fkey" FOREIGN KEY ("A") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssessmentSessionToEvaluation" ADD CONSTRAINT "_AssessmentSessionToEvaluation_B_fkey" FOREIGN KEY ("B") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
