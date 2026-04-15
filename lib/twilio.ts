import twilio from "twilio";
import { canSendMediaUrls } from "@/lib/media";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

export interface SendResult {
  success: boolean;
  sid?: string;
  error?: string;
  errorCode?: string;
}

export async function sendSMS(to: string, body: string, mediaUrls?: string[]): Promise<SendResult> {
  if (!fromNumber) {
    return { success: false, error: "TWILIO_PHONE_NUMBER not configured" };
  }

  const mediaCheck = canSendMediaUrls(mediaUrls);
  if (!mediaCheck.ok) {
    return { success: false, error: mediaCheck.message ?? "Media sending is not configured." };
  }

  // Stub mode when credentials are placeholder values
  if (
    accountSid?.startsWith("ACxxxxxx") ||
    authToken === "your_auth_token_here"
  ) {
    console.log(`[Twilio STUB] SMS to ${to}: ${body}${mediaUrls?.length ? ` | media: ${mediaUrls.join(", ")}` : ""}`);
    return { success: true, sid: `STUB_${Date.now()}` };
  }

  try {
    const client = getClient();
    const message = await client.messages.create({
      from: fromNumber,
      to,
      body,
      ...(mediaUrls?.length ? { mediaUrl: mediaUrls } : {}),
    });
    return { success: true, sid: message.sid };
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string };
    return {
      success: false,
      error: e.message ?? "Unknown Twilio error",
      errorCode: e.code?.toString(),
    };
  }
}
