import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  SUPABASE_URL: process.env.SUPABASE_URL as string,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY as string,
  // AWS SNS Configuration
  AWS_REGION: process.env.AWS_REGION as string,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
  // MSG91 Configuration
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY as string,
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID as string,
  MSG91_SENDER_ID: process.env.MSG91_SENDER_ID as string,
};
