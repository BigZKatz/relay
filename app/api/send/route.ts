import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSMS } from "@/lib/twilio";
import { logCommunication } from "@/lib/entrata";
import { interpolateMessage, stripPersonalization } from "@/lib/utils";

type PersonRecord = {
  id: string;
  firstName: string;
  lastName: string;
  unit: string;
  phone: string;
  type: "resident" | "applicant" | "prospect";
};

export async function POST(req: NextRequest) {
  try {
    const { body, mode, recipientIds, applicantIds, prospectIds, propertyId } = await req.json();

    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    }
    if (mode !== "personalized" && mode !== "community") {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    const hasResidents = Array.isArray(recipientIds) && recipientIds.length > 0;
    const hasApplicants = Array.isArray(applicantIds) && applicantIds.length > 0;
    const hasProspects = Array.isArray(prospectIds) && prospectIds.length > 0;

    if (!hasResidents && !hasApplicants && !hasProspects) {
      return NextResponse.json({ error: "At least one recipient required." }, { status: 400 });
    }

    // Fetch all recipient types in parallel
    const [residents, applicants, prospects] = await Promise.all([
      hasResidents
        ? db.resident.findMany({
            where: { id: { in: recipientIds }, status: "active" },
            select: { id: true, firstName: true, lastName: true, unit: true, phone: true },
          })
        : Promise.resolve([]),
      hasApplicants
        ? db.applicant.findMany({
            where: { id: { in: applicantIds } },
            select: { id: true, firstName: true, lastName: true, unit: true, phone: true },
          })
        : Promise.resolve([]),
      hasProspects
        ? db.prospect.findMany({
            where: { id: { in: prospectIds }, status: "active" },
            select: { id: true, firstName: true, lastName: true, unitInterest: true, phone: true },
          })
        : Promise.resolve([]),
    ]);

    const allRecipients: PersonRecord[] = [
      ...residents.map((r) => ({ ...r, type: "resident" as const })),
      ...applicants.map((a) => ({ ...a, type: "applicant" as const })),
      ...prospects.map((p) => ({ ...p, unit: p.unitInterest ?? "", type: "prospect" as const })),
    ];

    if (allRecipients.length === 0) {
      return NextResponse.json({ error: "No recipients found." }, { status: 400 });
    }

    // Create the message record with all recipients
    const message = await db.message.create({
      data: {
        body,
        mode,
        status: "pending",
        propertyId: propertyId ?? null,
        recipients: {
          create: allRecipients.map((r) => ({
            ...(r.type === "resident"
              ? { residentId: r.id }
              : r.type === "applicant"
              ? { applicantId: r.id }
              : { prospectId: r.id }),
            phone: r.phone,
            status: "pending",
          })),
        },
      },
      include: { recipients: true },
    });

    // Send SMS to each recipient
    let sentCount = 0;
    let failCount = 0;

    const deliveryResults = await Promise.all(
      allRecipients.map(async (person) => {
        const recipientRecord = message.recipients.find((r) =>
          person.type === "resident"
            ? r.residentId === person.id
            : person.type === "applicant"
            ? r.applicantId === person.id
            : r.prospectId === person.id
        );
        if (!recipientRecord) return null;

        const smsBody =
          mode === "personalized"
            ? interpolateMessage(body, person)
            : stripPersonalization(body);

        const result = await sendSMS(person.phone, smsBody);
        const deliveredAt = result.success ? new Date() : null;
        const errorMessage = !result.success
          ? result.errorCode
            ? `Twilio error: ${result.errorCode}`
            : "SMS delivery failed."
          : null;


        if (result.success) {
          sentCount++;
          await db.messageRecipient.update({
            where: { id: recipientRecord.id },
            data: {
              status: "delivered",
              twilioSid: result.sid,
              sentAt: deliveredAt,
            },
          });
        } else {
          failCount++;
          await db.messageRecipient.update({
            where: { id: recipientRecord.id },
            data: {
              status: "failed",
              errorCode: errorMessage,
            },
          });
        }

        return {
          person,
          recipientRecordId: recipientRecord.id,
          smsBody,
          success: result.success,
          sentAt: deliveredAt,
        };
      })
    );

    const completedDeliveries = deliveryResults.filter(
      (item): item is NonNullable<(typeof deliveryResults)[number]> => item !== null
    );

    // Determine overall message status
    const finalStatus =
      failCount === 0
        ? "sent"
        : sentCount === 0
          ? "failed"
          : "partial";

    const residentLogs = await Promise.all(
      completedDeliveries
        .filter((item) => item.person.type === "resident" && item.success)
        .map(async (item) => {
          const logResult = await logCommunication({
            residentId: item.person.id,
            messageId: message.id,
            body: item.smsBody,
            sentAt: item.sentAt ?? new Date(),
            channel: "sms",
            direction: "outbound",
          });

          return logResult;
        })
    );

    await db.message.update({
      where: { id: message.id },
      data: {
        status: finalStatus,
        sentAt: sentCount > 0 ? new Date() : null,
        entraLogged: residentLogs.length > 0 ? residentLogs.every((log) => log.success) : false,
        entraLogId: residentLogs.length === 1 && residentLogs[0]?.success ? residentLogs[0].entraLogId ?? null : null,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: message.id,
      sent: sentCount,
      failed: failCount,
      status: finalStatus,
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
