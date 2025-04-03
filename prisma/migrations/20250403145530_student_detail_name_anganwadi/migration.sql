-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "anganwadiId" UUID,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "anganwadiId" UUID;

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
CREATE UNIQUE INDEX "Anganwadi_name_key" ON "Anganwadi"("name");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_anganwadiId_fkey" FOREIGN KEY ("anganwadiId") REFERENCES "Anganwadi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_anganwadiId_fkey" FOREIGN KEY ("anganwadiId") REFERENCES "Anganwadi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
