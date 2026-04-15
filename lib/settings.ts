import { db } from "@/lib/db";

export async function getPrimaryProperty() {
  let property = await db.property.findFirst({ orderBy: { createdAt: "asc" } });

  if (!property) {
    property = await db.property.create({
      data: {
        name: "Dendry Townhomes",
        address: "",
        timezone: "America/Denver",
      },
    });
  }

  return property;
}

export async function getAllProperties() {
  const properties = await db.property.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      timezone: true,
      phone: true,
      twilioNumber: true,
    },
  });

  if (properties.length === 0) {
    const primary = await getPrimaryProperty();
    return [primary];
  }

  return properties;
}

export async function ensurePropertySettings(propertyId: string) {
  let settings = await db.propertySettings.findUnique({ where: { propertyId } });

  if (!settings) {
    settings = await db.propertySettings.create({
      data: {
        propertyId,
        afterHoursEnabled: true,
        afterHoursMessage:
          "Thank you for contacting Dendry Townhomes. We are closed right now but will contact you as soon as we reopen. If you are experiencing a maintenance emergency please call 385-325-5853 and press option 3.",
        soundEnabled: true,
        repeatSoundUntilRead: false,
        emailNotificationsEnabled: true,
        analyticsEnabled: true,
        helpEmail: "support@relayops.ai",
      },
    });
  }

  const existingHours = await db.propertyBusinessHour.findMany({ where: { propertyId } });
  if (existingHours.length === 0) {
    await db.propertyBusinessHour.createMany({
      data: [
        { propertyId, dayOfWeek: 0, isClosed: true },
        { propertyId, dayOfWeek: 1, openTime: "09:00", closeTime: "18:00" },
        { propertyId, dayOfWeek: 2, openTime: "09:00", closeTime: "18:00" },
        { propertyId, dayOfWeek: 3, openTime: "09:00", closeTime: "18:00" },
        { propertyId, dayOfWeek: 4, openTime: "09:00", closeTime: "18:00" },
        { propertyId, dayOfWeek: 5, openTime: "09:00", closeTime: "18:00" },
        { propertyId, dayOfWeek: 6, openTime: "10:00", closeTime: "16:00" },
      ],
    });
  }

  const recipients = await db.notificationRecipient.findMany({ where: { propertyId } });
  if (recipients.length === 0) {
    await db.notificationRecipient.createMany({
      data: [
        { propertyId, email: "leasing@dendrytownhomes.com", roleLabel: "Leasing", enabled: true },
        { propertyId, email: "maintenance@dendrytownhomes.com", roleLabel: "Maintenance", enabled: true },
        { propertyId, email: "manager@dendrytownhomes.com", roleLabel: "Property Manager", enabled: false },
      ],
    });
  }

  const users = await db.appUser.findMany({ where: { propertyId } });
  if (users.length === 0) {
    await db.appUser.createMany({
      data: [
        { propertyId, name: "Samantha Hayes", email: `samantha+${propertyId}@dendrytownhomes.com`, role: "Property Manager", isMasterAdmin: true },
        { propertyId, name: "Dylan Moore", email: `dylan+${propertyId}@dendrytownhomes.com`, role: "Leasing Agent" },
        { propertyId, name: "Jenna Fox", email: `jenna+${propertyId}@dendrytownhomes.com`, role: "Maintenance" },
      ],
    });
  }

  return db.property.findUnique({
    where: { id: propertyId },
    include: {
      settings: true,
      businessHours: { orderBy: { dayOfWeek: "asc" } },
      notificationRecipients: { orderBy: { createdAt: "asc" } },
      users: { orderBy: { createdAt: "asc" } },
    },
  });
}
