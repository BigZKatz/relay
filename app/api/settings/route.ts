import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensurePropertySettings, getAllProperties, getPrimaryProperty } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const propertyId = new URL(req.url).searchParams.get("propertyId");
  const fallback = await getPrimaryProperty();
  const property = propertyId
    ? await db.property.findUnique({ where: { id: propertyId } })
    : fallback;
  const selected = property ?? fallback;
  const data = await ensurePropertySettings(selected.id);
  const properties = await getAllProperties();
  return NextResponse.json({ property: data, properties, selectedPropertyId: selected.id });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const propertyId = body.propertyId;
  const fallback = await getPrimaryProperty();
  const property = propertyId
    ? await db.property.findUnique({ where: { id: propertyId } })
    : fallback;
  const selected = property ?? fallback;

  const updated = await db.property.update({
    where: { id: selected.id },
    data: {
      name: body.property?.name,
      address: body.property?.address ?? "",
      phone: body.property?.phone ?? null,
      twilioNumber: body.property?.twilioNumber ?? null,
      timezone: body.property?.timezone,
      websiteUrl: body.property?.websiteUrl,
      applyUrl: body.property?.applyUrl,
      floorPlansUrl: body.property?.floorPlansUrl,
      reviewUrl: body.property?.reviewUrl,
    },
  });

  await db.propertySettings.upsert({
    where: { propertyId: selected.id },
    update: {
      afterHoursEnabled: !!body.settings?.afterHoursEnabled,
      afterHoursMessage: body.settings?.afterHoursMessage ?? "",
      soundEnabled: !!body.settings?.soundEnabled,
      repeatSoundUntilRead: !!body.settings?.repeatSoundUntilRead,
      emailNotificationsEnabled: !!body.settings?.emailNotificationsEnabled,
      analyticsEnabled: !!body.settings?.analyticsEnabled,
      helpEmail: body.settings?.helpEmail ?? "",
    },
    create: {
      propertyId: selected.id,
      afterHoursEnabled: !!body.settings?.afterHoursEnabled,
      afterHoursMessage: body.settings?.afterHoursMessage ?? "",
      soundEnabled: !!body.settings?.soundEnabled,
      repeatSoundUntilRead: !!body.settings?.repeatSoundUntilRead,
      emailNotificationsEnabled: !!body.settings?.emailNotificationsEnabled,
      analyticsEnabled: !!body.settings?.analyticsEnabled,
      helpEmail: body.settings?.helpEmail ?? "",
    },
  });

  if (Array.isArray(body.businessHours)) {
    for (const row of body.businessHours) {
      await db.propertyBusinessHour.upsert({
        where: {
          propertyId_dayOfWeek: { propertyId: selected.id, dayOfWeek: row.dayOfWeek },
        },
        update: {
          isClosed: !!row.isClosed,
          openTime: row.openTime ?? null,
          closeTime: row.closeTime ?? null,
        },
        create: {
          propertyId: selected.id,
          dayOfWeek: row.dayOfWeek,
          isClosed: !!row.isClosed,
          openTime: row.openTime ?? null,
          closeTime: row.closeTime ?? null,
        },
      });
    }
  }

  if (Array.isArray(body.notificationRecipients)) {
    await db.notificationRecipient.deleteMany({ where: { propertyId: selected.id } });
    if (body.notificationRecipients.length > 0) {
      await db.notificationRecipient.createMany({
        data: body.notificationRecipients
          .filter((entry: { email: string }) => entry.email?.trim())
          .map((entry: { email: string; roleLabel?: string; enabled?: boolean }) => ({
            propertyId: selected.id,
            email: entry.email,
            roleLabel: entry.roleLabel ?? null,
            enabled: !!entry.enabled,
          })),
      });
    }
  }

  if (Array.isArray(body.users)) {
    await db.appUser.deleteMany({ where: { propertyId: selected.id } });
    if (body.users.length > 0) {
      await db.appUser.createMany({
        data: body.users
          .filter((user: { name: string; email: string }) => user.name?.trim() && user.email?.trim())
          .map((user: { name: string; email: string; role?: string; isMasterAdmin?: boolean; active?: boolean }) => ({
            propertyId: selected.id,
            name: user.name,
            email: user.email,
            role: user.role ?? "staff",
            isMasterAdmin: !!user.isMasterAdmin,
            active: user.active ?? true,
          })),
      });
    }
  }

  const data = await ensurePropertySettings(updated.id);
  const properties = await getAllProperties();
  return NextResponse.json({ success: true, property: data, properties, selectedPropertyId: updated.id });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const property = await db.property.create({
    data: {
      name: body.name?.trim() || "New Property",
      address: body.address?.trim() || "",
      phone: body.phone?.trim() || null,
      twilioNumber: body.twilioNumber?.trim() || null,
      timezone: body.timezone?.trim() || "America/Denver",
      websiteUrl: body.websiteUrl?.trim() || null,
      applyUrl: body.applyUrl?.trim() || null,
      floorPlansUrl: body.floorPlansUrl?.trim() || null,
      reviewUrl: body.reviewUrl?.trim() || null,
    },
  });

  const data = await ensurePropertySettings(property.id);
  const properties = await getAllProperties();

  return NextResponse.json({ success: true, property: data, properties, selectedPropertyId: property.id }, { status: 201 });
}
