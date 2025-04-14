import { PublishCommand } from "@aws-sdk/client-sns";
import { snsClient } from "../config/aws";

/**
 * Sends an SMS message using AWS SNS
 * @param phoneNumber - The phone number to send the SMS to (with country code)
 * @param message - The message content
 * @returns Promise resolving to the message ID if sent successfully
 */
export const sendSMS = async (phoneNumber: string, message: string): Promise<string> => {
  try {
    // Make sure the phone number has the correct format (+919876543210)
    // If it doesn't start with +, add it
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Configure the SMS parameters
    const params = {
      Message: message,
      PhoneNumber: formattedPhone,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'KANASU'  // Custom sender ID, must be pre-registered with AWS
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'  // Transactional messages have higher delivery priority
        }
      }
    };

    // Send the SMS
    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    console.log(`SMS sent successfully to ${phoneNumber}, MessageId: ${response.MessageId}`);
    return response.MessageId || "";
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
}; 