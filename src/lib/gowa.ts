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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: formattedPhoneNumber,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Failed to send WhatsApp message to ${formattedPhoneNumber}. Status: ${response.status}. Body: ${errorBody}`
      );
    } else {
      console.log(`WhatsApp message sent successfully to ${formattedPhoneNumber}.`);
    }
  } catch (error) {
    console.error(
      `An error occurred while sending WhatsApp message to ${formattedPhoneNumber}:`,
      error
    );
  }
};
