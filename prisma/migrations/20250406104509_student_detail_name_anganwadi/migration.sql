-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'REGIONAL_COORDINATOR');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "cohortId" UUID,
    "anganwadiId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "age" TEXT,
    "cohortId" UUID,
    "gender" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "anganwadiId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anganwadi" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "district" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anganwadi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_phone_key" ON "Teacher"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Student_age_key" ON "Student"("age");

-- CreateIndex
CREATE UNIQUE INDEX "Anganwadi_name_key" ON "Anganwadi"("name");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_anganwadiId_fkey" FOREIGN KEY ("anganwadiId") REFERENCES "Anganwadi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_anganwadiId_fkey" FOREIGN KEY ("anganwadiId") REFERENCES "Anganwadi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
