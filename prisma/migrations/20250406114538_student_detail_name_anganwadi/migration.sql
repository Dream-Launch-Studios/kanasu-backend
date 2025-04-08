/*
  Warnings:

  - The `age` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "age",
ADD COLUMN     "age" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Student_age_key" ON "Student"("age");
