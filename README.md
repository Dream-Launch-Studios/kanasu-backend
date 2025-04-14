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

---

This project was created using `bun init` in bun v1.2.3. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
