import axios from 'axios';

// MSG91 Configuration
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID;

if (!MSG91_AUTH_KEY) {
  console.warn('MSG91_AUTH_KEY is not set in environment variables');
}

/**
 * Send SMS using MSG91 API
 * @param phoneNumber - The recipient's phone number (with country code)
 * @param message - The message to send
 */
const sendSMS = async (phoneNumber: string, message: string): Promise<void> => {
  try {
    // If MSG91 is not configured, log the message and return
    if (!MSG91_AUTH_KEY) {
      console.log(`[SMS] Would send to ${phoneNumber}: ${message}`);
      return;
    }

    // Format phone number (ensure it has country code)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;

    // Prepare the request payload
    const payload = {
      authkey: MSG91_AUTH_KEY,
      mobiles: formattedPhone,
      message: message,
      sender: MSG91_SENDER_ID || 'KANASU',
      route: 4, // Transactional route
      template_id: MSG91_TEMPLATE_ID,
    };

    // Make the API request to MSG91
    const response = await axios.post('https://api.msg91.com/api/sendhttp.php', null, {
      params: payload,
    });

    if (response.status !== 200) {
      throw new Error(`MSG91 API returned status ${response.status}`);
    }

    console.log(`SMS sent successfully to ${phoneNumber}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
};

export { sendSMS }; 