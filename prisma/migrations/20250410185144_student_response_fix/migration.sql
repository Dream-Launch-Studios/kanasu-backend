-- CreateEnum
CREATE TYPE "CsvImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "CsvImport" (
    "id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "importedBy" UUID NOT NULL,
    "status" "CsvImportStatus" NOT NULL,
    "errorLog" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CsvImport_pkey" PRIMARY KEY ("id")
);
