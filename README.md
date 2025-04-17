# yuvspark-backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update the values in `.env` with your actual configuration

## Supabase Integration for Teacher OTP Login

This project uses Supabase for OTP-based teacher authentication. For detailed setup instructions, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

Quick setup:

1. Create a Supabase account and project
2. Enable Phone Auth in Authentication → Providers
3. Add your Supabase credentials to `.env`:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

For development without Supabase, the system will generate and display OTPs in the console.

## Student Response Transcription API

### Process Text Transcription

This endpoint allows external transcription services to submit text transcriptions of student audio responses. The system will automatically check if the transcription matches any of the predefined answer options and assign a score (5 points for correct answers).

**URL**: `/api/student-responses/transcription`
**Method**: `POST`

**Request Body**:
```json
{
  "responseId": "a1b2c3-d4e5f6-g7h8i9", // UUID of the StudentResponse
  "transcription": "The text transcription of the student's audio response"
}
```

**Success Response**:
```json
{
  "message": "Transcription processed successfully",
  "result": {
    "responseId": "a1b2c3-d4e5f6-g7h8i9",
    "transcription": "The text transcription of the student's audio response",
    "matchedOption": "The matched answer option text",
    "matchedOptionIndex": 2, // Index of the matched option (0-3), or -1 if no match
    "similarity": 0.85, // Similarity score (0-1) between the transcription and the matched option
    "isCorrect": true, // Whether the match is the correct answer
    "score": 5, // 5 for correct answers, 0 for incorrect
    "scoreId": "b2c3d4-e5f6g7-h8i9j0" // ID of the created score record
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields
- `404 Not Found`: Student response not found
- `400 Bad Request`: Question doesn't have answer options
- `500 Internal Server Error`: Server processing error

**Matching Algorithm**:
The system uses a fuzzy matching approach to determine if the transcription matches any of the answer options:

1. Text normalization:
   - Converts all text to lowercase
   - Removes punctuation
   - Normalizes whitespace

2. Similarity calculation:
   - Direct inclusion: Checks if one text contains the other
   - Word-level matching: Analyzes how many words match between the texts
   - Calculates a similarity score between 0 and 1

3. Threshold-based matching:
   - Requires a minimum similarity score (0.5) to consider it a match
   - Returns the best matching option above the threshold

### Testing with Postman

1. **Create a Question with Answer Options**
   - First, create a question through the admin interface with 4 answer options
   - Mark one as the correct answer
   - Note down the question ID

2. **Create a Student Response**
   - Make a POST request to `/api/student-responses` with appropriate data
   - Note down the response ID returned

3. **Submit a Transcription**
   - Make a POST request to `/api/student-responses/transcription`:
     - Method: POST
     - URL: `http://localhost:3000/api/student-responses/transcription`
     - Headers: `Content-Type: application/json`
     - Body:
       ```json
       {
         "responseId": "paste-student-response-id-here",
         "transcription": "Type a text that should match one of the answer options"
       }
       ```

4. **Check the Response**
   - The response will indicate if the transcription matched any answer option
   - It will also show if it was correct and the score awarded

**Example Scenario**:
- Question: "What is the capital of France?"
- Answer Options: ["Paris", "London", "Berlin", "Rome"]
- Correct Answer: "Paris" (index 0)
- Transcription: "The capital of France is Paris"
- Expected Result: Matches option at index 0, isCorrect=true, score=5

---

This project was created using `bun init` in bun v1.2.3. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
