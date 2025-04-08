/*
  Warnings:

  - A unique constraint covering the columns `[anganwadiId]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_cohortId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_anganwadiId_key" ON "Teacher"("anganwadiId");
