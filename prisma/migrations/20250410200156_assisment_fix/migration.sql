-- AlterTable
ALTER TABLE "AssessmentSession" ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "StudentResponse" ADD COLUMN     "studentSubmissionId" UUID;

-- CreateTable
CREATE TABLE "AnganwadiAssessment" (
    "id" UUID NOT NULL,
    "assessmentSessionId" UUID NOT NULL,
    "anganwadiId" UUID NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedStudentCount" INTEGER NOT NULL DEFAULT 0,
    "totalStudentCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnganwadiAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSubmission" (
    "id" UUID NOT NULL,
    "assessmentSessionId" UUID NOT NULL,
    "anganwadiId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "submissionStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "StudentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnganwadiAssessment_assessmentSessionId_anganwadiId_key" ON "AnganwadiAssessment"("assessmentSessionId", "anganwadiId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubmission_assessmentSessionId_studentId_key" ON "StudentSubmission"("assessmentSessionId", "studentId");

-- AddForeignKey
ALTER TABLE "StudentResponse" ADD CONSTRAINT "StudentResponse_studentSubmissionId_fkey" FOREIGN KEY ("studentSubmissionId") REFERENCES "StudentSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnganwadiAssessment" ADD CONSTRAINT "AnganwadiAssessment_assessmentSessionId_fkey" FOREIGN KEY ("assessmentSessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnganwadiAssessment" ADD CONSTRAINT "AnganwadiAssessment_anganwadiId_fkey" FOREIGN KEY ("anganwadiId") REFERENCES "Anganwadi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_assessmentSessionId_fkey" FOREIGN KEY ("assessmentSessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_anganwadiId_fkey" FOREIGN KEY ("anganwadiId") REFERENCES "Anganwadi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
