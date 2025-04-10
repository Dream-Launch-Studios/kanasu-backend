# Student CSV Import Guide

## Overview

The CSV import feature allows you to bulk import students into the YuvaSpark system. This is useful for onboarding multiple students at once, especially when migrating from another system or when starting a new program.

## CSV File Format

Your CSV file should follow this format:

```
name,gender,status,anganwadiName,location,district,state
John Doe,Male,ACTIVE,Anganwadi Center 1,Mumbai,Mumbai District,Maharashtra
Jane Smith,Female,ACTIVE,Anganwadi Center 2,Delhi,South Delhi,Delhi
Bob Johnson,Male,INACTIVE,Anganwadi Center 1,Mumbai,Mumbai District,Maharashtra
```

### Required Fields

- **name**: The student's full name
- **gender**: The student's gender (e.g., Male, Female, Other)

### Optional Fields

- **status**: The enrollment status of the student (default: "ACTIVE"). Valid values: "ACTIVE", "INACTIVE", "GRADUATED"
- **anganwadiName**: The name of the Anganwadi center the student belongs to. If this Anganwadi doesn't exist in the system, it will be created automatically.
- **location**: Location of the Anganwadi (only used if creating a new Anganwadi)
- **district**: District of the Anganwadi (only used if creating a new Anganwadi)
- **state**: State of the Anganwadi (only used if creating a new Anganwadi)

## Import Process

1. Prepare your CSV file according to the format above
2. Go to the Students page in the admin dashboard
3. Click the "Import Students" button
4. Select your CSV file and click "Upload"
5. The system will begin processing your file
6. You can monitor the import progress on the Imports page

## Error Handling

If there are any issues with your CSV file or the data it contains, the system will provide an error log with details about which rows failed to import and why. Common issues include:

- Missing required fields (name, gender)
- Invalid values for status
- Duplicate student names within the same Anganwadi

## API Endpoints

For developers who want to integrate with the CSV import API directly:

- **POST /api/students/import-csv**: Upload and process a CSV file
  - Request: multipart/form-data with a 'file' field containing the CSV
  - Response: JSON with import ID and status

- **GET /api/imports/:importId**: Get the status of a specific import
  - Response: JSON with import details including progress and any errors

- **GET /api/imports**: Get a list of all imports (paginated)
  - Query parameters: page, limit
  - Response: JSON with list of imports and pagination details

## Tips for Successful Imports

1. Keep your CSV file under 5MB
2. Make sure all required fields are included
3. Use consistent naming for Anganwadi centers
4. Check for duplicate student names
5. Use UTF-8 encoding for your CSV file to support non-English characters
6. Avoid special characters or formatting in your data 