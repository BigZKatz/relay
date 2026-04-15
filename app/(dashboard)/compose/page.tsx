import { db } from "@/lib/db";
import ComposeForm from "./ComposeForm";

async function getData() {
  const [properties, templates, applicants, prospects, futureResidents] = await Promise.all([
    db.property.findMany({
      orderBy: { name: "asc" },
      include: {
        residents: {
          where: { status: "active" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            unit: true,
            phone: true,
          },
          orderBy: [{ lastName: "asc" }],
        },
      },
    }),
    db.template.findMany({ orderBy: { category: "asc" } }),
    db.applicant.findMany({
      where: { status: { notIn: ["future-resident", "moved-in"] } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        unit: true,
        phone: true,
        status: true,
      },
      orderBy: [{ lastName: "asc" }],
    }),
    db.prospect.findMany({
      where: { status: "active" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        unitInterest: true,
        status: true,
      },
      orderBy: [{ lastName: "asc" }],
    }),
    db.applicant.findMany({
      where: { status: "future-resident" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        unit: true,
        phone: true,
        status: true,
      },
      orderBy: [{ lastName: "asc" }],
    }),
  ]);
  return { properties, templates, applicants, prospects, futureResidents };
}

export default async function ComposePage() {
  const { properties, templates, applicants, prospects, futureResidents } = await getData();
  return (
    <ComposeForm
      properties={properties}
      templates={templates}
      applicants={applicants}
      prospects={prospects}
      futureResidents={futureResidents}
    />
  );
}
