import { Suspense } from "react";
import { db } from "@/lib/db";
import BlastsLayout from "./BlastsLayout";

async function getMessages() {
  return db.message.findMany({
    where: { mode: "community" },
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { name: true } },
      recipients: {
        select: {
          status: true,
          resident: { select: { firstName: true, lastName: true, unit: true } },
          applicant: { select: { firstName: true, lastName: true, unit: true } },
        },
      },
    },
  });
}

export default async function BlastsPage() {
  const raw = await getMessages();
  const messages = raw.map((m) => ({
    ...m,
    sentAt: m.sentAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }));
  return (
    <Suspense fallback={<div className="h-[calc(100vh-56px)] lg:h-screen bg-white" />}>
      <BlastsLayout messages={messages} />
    </Suspense>
  );
}
