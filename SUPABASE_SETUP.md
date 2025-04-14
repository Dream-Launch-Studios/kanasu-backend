# Supabase OTP Authentication Setup Guide

This guide will help you set up Supabase for teacher OTP authentication.

## 1. Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com) and sign up for an account
2. Create a new project with a name like "kanasu-auth"
3. Supabase will create a PostgreSQL database (note: this is separate from your main app database)

## 2. Configure Phone Authentication

1. In your Supabase dashboard, go to Authentication → Providers
2. Find "Phone" in the list and enable it
3. For SMS provider, select the option you prefer (Twilio, Vonage, or MessageBird)
4. Configure your SMS provider with required credentials
   - For Twilio, you'll need Account SID, Auth Token, and Messaging Service SID
   - You can use the free trial credits for testing

## 3. Update Your .env File

Add these variables to your `.env` file:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
```

You can find these values in your Supabase dashboard:
- Go to Project Settings → API
- Copy the URL and anon/public key

## 4. Install Supabase Client

```
npm install @supabase/supabase-js
```

## 5. Testing OTP Flow

1. Use Postman or your mobile app to test the flow
2. Send a request to `/api/teacher-auth/request-otp` with a phone number
3. Get the OTP (check your phone or Supabase logs during development)
4. Verify using `/api/teacher-auth/verify-otp` endpoint

## Troubleshooting

- **OTP Not Arriving**: Check Supabase logs and SMS provider dashboard
- **Verification Failing**: Ensure phone number format is consistent (e.g., +91XXXXXXXXXX)
- **Rate Limits**: Supabase has rate limits for OTP attempts (3 per hour by default)

## Production Considerations

- Set up proper SMS provider credentials before going to production
- Configure rate limiting to prevent abuse
- Enable additional security features in Supabase like Captcha protection 