import { SNSClient } from "@aws-sdk/client-sns";
import { ENV } from "./env";

// Create an AWS SNS client
export const snsClient = new SNSClient({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});
