/**
 * Formats a local phone number (e.g., 0812...) to the international E.164 format (e.g., 62812...).
 * If the number already starts with '62', it returns it as is.
 * @param phoneNumber The phone number to format.
 * @returns The formatted phone number.
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.startsWith('0')) {
    return `62${phoneNumber.substring(1)}`;
  }
  if (phoneNumber.startsWith('62')) {
    return phoneNumber;
  }
  // If the format is unknown, return it as is, but it might fail.
  return phoneNumber;
};

/**
 * Sends a WhatsApp message using the Gowa API.
 * @param phoneNumber The recipient's phone number.
 * @param message The message to send.
 */
export const sendWhatsAppMessage = async (
  phoneNumber: string,
  message: string
): Promise<void> => {
  const gowaApiUrl = process.env.GOWA_API_URL;

  if (!gowaApiUrl) {
    console.error('GOWA_API_URL is not set. Cannot send WhatsApp message.');
    return;
  }

  const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
  const endpoint = `${gowaApiUrl}/send/message`;

  try {
    // Include basic auth if credentials are provided (the Gowa server in docker-compose
    // uses APP_BASIC_AUTH). This avoids 401 Unauthorized when the Gowa API is protected.
    const gowaAdmin = process.env.GOWA_ADMIN;
    const gowaPassword = process.env.GOWA_PASSWORD;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (gowaAdmin && gowaPassword) {
      const token = Buffer.from(`${gowaAdmin}:${gowaPassword}`).toString('base64');
      headers['Authorization'] = `Basic ${token}`;
    }

    const payload: Record<string, unknown> = {
      // The Gowa/OpenAPI expects a `phone` field for send/message — include it
      phone: phoneNumber.includes('@g.us') ? phoneNumber : formattedPhoneNumber,
      message,
    };

    // Keep other formats for compatibility: number for single recipients and chatId for groups
    if (phoneNumber.includes('@g.us')) {
      payload['chatId'] = phoneNumber;
    } else {
      payload['number'] = formattedPhoneNumber;
    }

    console.log('Gowa: POST', endpoint, 'payload:', JSON.stringify(payload));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let errorBody = await response.text();
      try {
        if (contentType.includes('application/json')) {
          errorBody = JSON.stringify(JSON.parse(errorBody));
        }
      } catch {
        // keep raw text
      }
      console.error(
        `Failed to send WhatsApp message to ${phoneNumber}. Status: ${response.status}. Body: ${errorBody}`
      );
    } else {
      console.log(`WhatsApp message sent successfully to ${phoneNumber}.`);
    }
  } catch (error) {
    console.error(
      `An error occurred while sending WhatsApp message to ${formattedPhoneNumber}:`,
      error
    );
  }
};
