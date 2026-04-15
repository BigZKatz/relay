import { Suspense } from "react";
import { db } from "@/lib/db";
import ThreadsLayout from "./ThreadsLayout";

async function getParticipantsWithActivity() {
  const [residents, applicants, prospects] = await Promise.all([
    db.resident.findMany({
      include: {
        messages: {
          include: { message: true },
          orderBy: { message: { createdAt: "desc" } },
          take: 1,
        },
        inboundMessages: {
          orderBy: { receivedAt: "desc" },
          take: 1,
        },
        property: { select: { id: true, name: true } },
      },
    }),
    db.applicant.findMany({
      where: { status: { in: ["pending", "approved", "denied", "waitlist", "future-resident"] } },
      include: {
        messages: {
          include: { message: true },
          orderBy: { message: { createdAt: "desc" } },
          take: 1,
        },
        inboundMessages: {
          orderBy: { receivedAt: "desc" },
          take: 1,
        },
        property: { select: { name: true } },
      },
    }),
    db.prospect.findMany({
      where: { status: "active" },
      include: {
        messages: {
          include: { message: true },
          orderBy: { message: { createdAt: "desc" } },
          take: 1,
        },
        inboundMessages: {
          orderBy: { receivedAt: "desc" },
          take: 1,
        },
        property: { select: { name: true } },
      },
    }),
  ]);

  const residentThreads = residents.map((r) => {
      const lastOutbound = r.messages[0];
      const lastInbound = r.inboundMessages[0];
      const lastOutboundTime = lastOutbound
        ? new Date(lastOutbound.message.sentAt ?? lastOutbound.message.createdAt).getTime()
        : 0;
      const lastInboundTime = lastInbound ? new Date(lastInbound.receivedAt).getTime() : 0;

      return {
        id: r.id,
        type: "resident" as const,
        firstName: r.firstName,
        lastName: r.lastName,
        unit: r.unit,
        phone: r.phone,
        propertyId: r.property.id,
        propertyName: r.property.name,
        lastMessageBody:
          lastOutboundTime >= lastInboundTime ? lastOutbound?.message.body ?? null : lastInbound?.body ?? null,
        lastMessageTime:
          lastOutboundTime >= lastInboundTime
            ? lastOutbound
              ? new Date(lastOutbound.message.sentAt ?? lastOutbound.message.createdAt).toISOString()
              : null
            : lastInbound
            ? new Date(lastInbound.receivedAt).toISOString()
            : null,
        hasUnread: Boolean(lastInbound && lastInboundTime > lastOutboundTime),
      };
    });

  const applicantThreads = applicants.map((a) => {
      const lastOutbound = a.messages[0];
      const lastInbound = a.inboundMessages[0];
      const lastOutboundTime = lastOutbound
        ? new Date(lastOutbound.message.sentAt ?? lastOutbound.message.createdAt).getTime()
        : 0;
      const lastInboundTime = lastInbound ? new Date(lastInbound.receivedAt).getTime() : 0;

      return {
        id: a.id,
        type: a.status === "future-resident" ? ("future-resident" as const) : ("applicant" as const),
        firstName: a.firstName,
        lastName: a.lastName,
        unit: a.unit,
        phone: a.phone,
        propertyId: a.propertyId,
        propertyName: a.property.name,
        lastMessageBody:
          lastOutboundTime >= lastInboundTime ? lastOutbound?.message.body ?? null : lastInbound?.body ?? null,
        lastMessageTime:
          lastOutboundTime >= lastInboundTime
            ? lastOutbound
              ? new Date(lastOutbound.message.sentAt ?? lastOutbound.message.createdAt).toISOString()
              : null
            : lastInbound
            ? new Date(lastInbound.receivedAt).toISOString()
            : null,
        hasUnread: Boolean(lastInbound && lastInboundTime > lastOutboundTime),
      };
    });

  const prospectThreads = prospects.map((p) => {
      const lastOutbound = p.messages[0];
      const lastInbound = p.inboundMessages[0];
      const lastOutboundTime = lastOutbound
        ? new Date(lastOutbound.message.sentAt ?? lastOutbound.message.createdAt).getTime()
        : 0;
      const lastInboundTime = lastInbound ? new Date(lastInbound.receivedAt).getTime() : 0;

      return {
        id: p.id,
        type: "prospect" as const,
        firstName: p.firstName,
        lastName: p.lastName,
        unit: p.unitInterest ?? "—",
        phone: p.phone,
        propertyId: p.propertyId,
        propertyName: p.property.name,
        lastMessageBody:
          lastOutboundTime >= lastInboundTime ? lastOutbound?.message.body ?? null : lastInbound?.body ?? null,
        lastMessageTime:
          lastOutboundTime >= lastInboundTime
            ? lastOutbound
              ? new Date(lastOutbound.message.sentAt ?? lastOutbound.message.createdAt).toISOString()
              : null
            : lastInbound
            ? new Date(lastInbound.receivedAt).toISOString()
            : null,
        hasUnread: Boolean(lastInbound && lastInboundTime > lastOutboundTime),
      };
    });

  return [...residentThreads, ...applicantThreads, ...prospectThreads].sort((a, b) => {
    const at = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const bt = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return bt - at;
  });
}

export type ThreadParticipant = Awaited<ReturnType<typeof getParticipantsWithActivity>>[number];

export default async function MessagesPage() {
  const [participants, properties] = await Promise.all([
    getParticipantsWithActivity(),
    db.property.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        websiteUrl: true,
        applyUrl: true,
        floorPlansUrl: true,
        reviewUrl: true,
      },
    }),
  ]);

  const quickLinksByPropertyId = Object.fromEntries(
    properties.map((property) => [
      property.id,
      {
        websiteUrl: property.websiteUrl ?? null,
        applyUrl: property.applyUrl ?? null,
        floorPlansUrl: property.floorPlansUrl ?? null,
        reviewUrl: property.reviewUrl ?? null,
      },
    ])
  );

  return (
    <Suspense fallback={<div className="h-[calc(100vh-56px)] lg:h-screen bg-white" />}>
      <ThreadsLayout
        participants={participants}
        quickLinksByPropertyId={quickLinksByPropertyId}
      />
    </Suspense>
  );
}
