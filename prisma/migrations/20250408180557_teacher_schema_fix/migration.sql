/*
  Warnings:

  - Added the required column `topicId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "topicId" UUID NOT NULL;
