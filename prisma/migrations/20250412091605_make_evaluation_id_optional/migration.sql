-- AddForeignKey
ALTER TABLE "StudentSubmission" ADD CONSTRAINT "StudentSubmission_assessmentSessionId_anganwadiId_fkey" FOREIGN KEY ("assessmentSessionId", "anganwadiId") REFERENCES "AnganwadiAssessment"("assessmentSessionId", "anganwadiId") ON DELETE RESTRICT ON UPDATE CASCADE;
