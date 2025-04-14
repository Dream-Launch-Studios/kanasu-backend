import { createClient } from "@supabase/supabase-js";
import { ENV } from "../config/env";

// Check if Supabase credentials are available
if (!ENV.SUPABASE_URL) {
  console.error("SUPABASE_URL is not configured in environment variables");
  // Instead of crashing immediately, provide a placeholder for development
  // This allows the app to start but Supabase features won't work
}

if (!ENV.SUPABASE_ANON_KEY) {
  console.error("SUPABASE_ANON_KEY is not configured in environment variables");
}

const supabaseUrl = ENV.SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseKey = ENV.SUPABASE_ANON_KEY || "placeholder-key";

// Export a function that returns the client instead of creating it immediately
// This allows handling Supabase errors in controllers
export const getSupabaseClient = () => {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase credentials not configured. Check your .env file."
    );
  }
  return createClient(supabaseUrl, supabaseKey);
};
// For backward compatibility
export const supabase =
  ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY
    ? createClient(supabaseUrl, supabaseKey)
    : null;

