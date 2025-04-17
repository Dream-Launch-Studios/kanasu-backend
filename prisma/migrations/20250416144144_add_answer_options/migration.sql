-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "answerOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "correctAnswer" INTEGER;
