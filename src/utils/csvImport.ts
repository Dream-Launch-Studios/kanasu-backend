import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import prisma from '../config/prisma';
import type { Gender } from '@prisma/client';

interface StudentCsvRow {
  name: string;
  gender: string;
  status?: string;
  anganwadiName?: string;
}

/**
 * Process a CSV file containing student data
 * Expected CSV format:
 * name,gender,status,anganwadiName
 * John Doe,Male,ACTIVE,Anganwadi 1
 * Jane Smith,Female,ACTIVE,Anganwadi 2
 */
export const processStudentCsv = async (
  filePath: string,
  importId: string,
  importedBy: string
): Promise<void> => {
  // Update import status to PROCESSING
  await prisma.csvImport.update({
    where: { id: importId },
    data: { status: 'PROCESSING' }
  });

  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  let totalRows = 0;
  let successRows = 0;
  let failedRows = 0;
  let errorLog = '';

  try {
    for await (const record of parser) {
      totalRows++;
      try {
        // Validate required fields
        if (!record.name || !record.gender) {
          failedRows++;
          errorLog += `Row ${totalRows}: Missing required fields (name or gender)\n`;
          continue;
        }

        const studentData: StudentCsvRow = {
          name: record.name,
          gender: record.gender,
          status: record.status || 'ACTIVE'
        };

        // If anganwadi name is provided, find or create the anganwadi
        let anganwadiId = null;
        if (record.anganwadiName) {
          const anganwadi = await prisma.anganwadi.findFirst({
            where: { name: { equals: record.anganwadiName, mode: 'insensitive' } }
          });

          if (anganwadi) {
            anganwadiId = anganwadi.id;
          } else {
            // Create new Anganwadi if it doesn't exist
            const newAnganwadi = await prisma.anganwadi.create({
              data: {
                name: record.anganwadiName,
                location: record.location || null,
                district: record.district || null,
                state: record.state || null
              }
            });
            anganwadiId = newAnganwadi.id;
          }
        }

        // Create the student
        await prisma.student.create({
          data: {
            name: studentData.name,
            gender: studentData.gender as Gender,
            status: studentData.status,
            anganwadiId
          }
        });

        successRows++;
      } catch (error) {
        failedRows++;
        errorLog += `Row ${totalRows}: ${(error as Error).message}\n`;
      }
    }

    // Update import record with results
    await prisma.csvImport.update({
      where: { id: importId },
      data: {
        status: 'COMPLETED',
        totalRows,
        successRows,
        failedRows,
        errorLog: errorLog || null
      }
    });
  } catch (error) {
    // Handle any errors during processing
    await prisma.csvImport.update({
      where: { id: importId },
      data: {
        status: 'FAILED',
        totalRows,
        successRows,
        failedRows,
        errorLog: `Processing error: ${(error as Error).message}\n${errorLog}`
      }
    });
    throw error;
  } finally {
    // Clean up temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to delete temporary file:', e);
    }
  }
}; 