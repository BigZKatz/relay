/**
 * Entrata API stub layer.
 *
 * All methods here are stubbed and ready for real implementation once
 * Entrata API access is confirmed. Each stub logs what it would do.
 *
 * Real implementation requires:
 * - ENTRATA_BASE_URL
 * - ENTRATA_USERNAME
 * - ENTRATA_PASSWORD
 * - Confirmed API endpoints for: residents, units, properties, communication logs
 */

export interface EntraResident {
  entraId: string;
  firstName: string;
  lastName: string;
  phone: string;
  unit: string;
  email?: string;
  status: string;
  propertyId: string;
}

export interface EntraProperty {
  entraId: string;
  name: string;
  address: string;
  phone?: string;
}

export interface EntraApplicant {
  entraId: string;
  firstName: string;
  lastName: string;
  phone: string;
  unit: string;
  email?: string;
  status: "pending" | "approved" | "denied" | "waitlist";
  applicationDate: Date;
  propertyId: string;
}

export interface EntraCommunicationLog {
  residentId: string;
  messageId: string;
  body: string;
  sentAt: Date;
  channel: "sms";
  direction: "outbound" | "inbound";
}

function isConfigured(): boolean {
  return !!(
    process.env.ENTRATA_BASE_URL &&
    process.env.ENTRATA_USERNAME &&
    process.env.ENTRATA_PASSWORD
  );
}

export async function getProperties(): Promise<EntraProperty[]> {
  if (!isConfigured()) {
    console.log("[Entrata STUB] getProperties() - not yet configured");
    return [];
  }
  // TODO: implement real Entrata properties endpoint
  throw new Error("Entrata getProperties not yet implemented");
}

export async function getResidents(
  propertyId: string
): Promise<EntraResident[]> {
  if (!isConfigured()) {
    console.log(
      `[Entrata STUB] getResidents(${propertyId}) - not yet configured`
    );
    return [];
  }
  // TODO: implement real Entrata residents endpoint
  throw new Error("Entrata getResidents not yet implemented");
}

export async function getApplicants(
  propertyId?: string
): Promise<EntraApplicant[]> {
  if (!isConfigured()) {
    console.log(
      `[Entrata STUB] getApplicants(${propertyId ?? "all"}) - not yet configured`
    );
    return [];
  }
  // TODO: implement real Entrata applicants endpoint
  throw new Error("Entrata getApplicants not yet implemented");
}

export async function logCommunication(
  log: EntraCommunicationLog
): Promise<{ success: boolean; entraLogId?: string; error?: string }> {
  if (!isConfigured()) {
    console.log(
      `[Entrata STUB] logCommunication for resident ${log.residentId}: "${log.body}"`
    );
    return { success: true, entraLogId: `STUB_ENTRATA_${Date.now()}` };
  }
  // TODO: implement real Entrata communication log write-back
  throw new Error("Entrata logCommunication not yet implemented");
}
