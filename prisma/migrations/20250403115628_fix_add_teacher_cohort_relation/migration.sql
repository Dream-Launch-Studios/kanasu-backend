/*
  Warnings:

  - You are about to drop the column `phone` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[age]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Student_phone_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "phone",
ADD COLUMN     "age" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_age_key" ON "Student"("age");
