import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  await prisma.inboundMedia.deleteMany();
  await prisma.messageMedia.deleteMany();
  await prisma.messageRecipient.deleteMany();
  await prisma.inboundMessage.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notificationRecipient.deleteMany();
  await prisma.propertyBusinessHour.deleteMany();
  await prisma.propertySettings.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.template.deleteMany();
  await prisma.property.deleteMany();

  // Properties
  const redstone = await prisma.property.upsert({
    where: { entraId: "STRA001" },
    update: {},
    create: {
      name: "Redstone Apartments",
      address: "1200 Oak Street, Austin, TX 78701",
      phone: "+15122001000",
      twilioNumber: "+15125550100",
      entraId: "STRA001",
      websiteUrl: "https://redstone.example.com",
      applyUrl: "https://redstone.example.com/apply",
      floorPlansUrl: "https://redstone.example.com/floorplans",
      reviewUrl: "https://redstone.example.com/reviews",
    },
  });

  const maplewood = await prisma.property.upsert({
    where: { entraId: "STRA002" },
    update: {},
    create: {
      name: "Maplewood Commons",
      address: "450 Maplewood Dr, Austin, TX 78745",
      phone: "+15122002000",
      twilioNumber: "+15125550200",
      entraId: "STRA002",
      websiteUrl: "https://maplewood.example.com",
      applyUrl: "https://maplewood.example.com/apply",
      floorPlansUrl: "https://maplewood.example.com/floorplans",
      reviewUrl: "https://maplewood.example.com/reviews",
    },
  });

  // Residents for Redstone
  const redstoneResidents = [
    { first: "James", last: "Thornton", unit: "101", phone: "+15125550101", email: "james.thornton@email.com" },
    { first: "Maria", last: "Santos", unit: "102", phone: "+15125550102", email: "m.santos@email.com" },
    { first: "Derek", last: "Wu", unit: "203", phone: "+15125550103", email: "derek.wu@email.com" },
    { first: "Aisha", last: "Patel", unit: "204", phone: "+15125550104" },
    { first: "Chris", last: "Navarro", unit: "301", phone: "+15125550105", email: "cnavarro@email.com" },
    { first: "Brittany", last: "Moore", unit: "302", phone: "+15125550106" },
    { first: "Kevin", last: "Lee", unit: "401", phone: "+15125550107", email: "kevin.lee@email.com" },
    { first: "Sandra", last: "Hill", unit: "402", phone: "+15125550108" },
  ];

  for (const r of redstoneResidents) {
    const entraId = `RSTR_${r.unit}`;
    await prisma.resident.upsert({
      where: { entraId },
      update: {},
      create: {
        firstName: r.first,
        lastName: r.last,
        unit: r.unit,
        phone: r.phone,
        email: r.email,
        propertyId: redstone.id,
        entraId,
      },
    });
  }

  // Residents for Maplewood
  const maplewoodResidents = [
    { first: "Patricia", last: "Coleman", unit: "1A", phone: "+15125550201", email: "p.coleman@email.com" },
    { first: "Marcus", last: "Johnson", unit: "1B", phone: "+15125550202" },
    { first: "Yuki", last: "Tanaka", unit: "2A", phone: "+15125550203", email: "yuki.t@email.com" },
    { first: "Rachel", last: "Burns", unit: "2B", phone: "+15125550204" },
    { first: "Andre", last: "Williams", unit: "3A", phone: "+15125550205", email: "awilliams@email.com" },
  ];

  for (const r of maplewoodResidents) {
    const entraId = `RMAP_${r.unit}`;
    await prisma.resident.upsert({
      where: { entraId },
      update: {},
      create: {
        firstName: r.first,
        lastName: r.last,
        unit: r.unit,
        phone: r.phone,
        email: r.email,
        propertyId: maplewood.id,
        entraId,
      },
    });
  }

  // Applicants for Redstone
  const redstoneApplicants = [
    { first: "Tyler", last: "Brooks", unit: "103", phone: "+15125550301", email: "tyler.brooks@email.com", status: "pending" },
    { first: "Natalie", last: "Rivera", unit: "205", phone: "+15125550302", email: "n.rivera@email.com", status: "approved" },
    { first: "Jason", last: "Kim", unit: "303", phone: "+15125550303", status: "waitlist" },
    { first: "Danielle", last: "Foster", unit: "403", phone: "+15125550304", email: "dfoster@email.com", status: "pending" },
  ];

  for (const a of redstoneApplicants) {
    const entraId = `ASTR_${a.unit}`;
    await prisma.applicant.upsert({
      where: { entraId },
      update: {},
      create: {
        firstName: a.first,
        lastName: a.last,
        unit: a.unit,
        phone: a.phone,
        email: a.email,
        status: a.status,
        propertyId: redstone.id,
        entraId,
      },
    });
  }

  // Applicants for Maplewood
  const maplewoodApplicants = [
    { first: "Chloe", last: "Nguyen", unit: "1C", phone: "+15125550401", email: "chloe.n@email.com", status: "pending" },
    { first: "Roberto", last: "Castillo", unit: "2C", phone: "+15125550402", status: "approved" },
    { first: "Amanda", last: "Price", unit: "3B", phone: "+15125550403", email: "amandap@email.com", status: "denied" },
    { first: "Elena", last: "Morris", unit: "4A", phone: "+15125550404", email: "elena.morris@email.com", status: "future-resident" },
    { first: "Noah", last: "Bennett", unit: "4B", phone: "+15125550405", status: "future-resident" },
  ];

  for (const a of maplewoodApplicants) {
    const entraId = `AMAP_${a.unit}`;
    await prisma.applicant.upsert({
      where: { entraId },
      update: {},
      create: {
        firstName: a.first,
        lastName: a.last,
        unit: a.unit,
        phone: a.phone,
        email: a.email,
        status: a.status,
        propertyId: maplewood.id,
        entraId,
      },
    });
  }

  // Prospects
  const prospects = [
    {
      first: "Jordan",
      last: "Miles",
      phone: "+15125550501",
      email: "jordan.miles@email.com",
      unitInterest: "1 bed",
      source: "Apartments.com",
      notes: "Asked about pet fees and parking.",
      propertyId: redstone.id,
    },
    {
      first: "Sofia",
      last: "Ramirez",
      phone: "+15125550502",
      email: "sofia.ramirez@email.com",
      unitInterest: "2 bed",
      source: "Google Ads",
      notes: "Wants move-in next month.",
      propertyId: redstone.id,
    },
    {
      first: "Ethan",
      last: "Parker",
      phone: "+15125550503",
      unitInterest: "Studio",
      source: "Walk-in",
      notes: "Tour scheduled for Friday.",
      propertyId: maplewood.id,
    },
    {
      first: "Mia",
      last: "Collins",
      phone: "+15125550504",
      email: "mia.collins@email.com",
      unitInterest: "2 bed townhouse",
      source: "Referral",
      notes: "Looking for August move-in.",
      propertyId: maplewood.id,
    },
  ];

  for (const p of prospects) {
    await prisma.prospect.create({
      data: {
        firstName: p.first,
        lastName: p.last,
        phone: p.phone,
        email: p.email,
        unitInterest: p.unitInterest,
        source: p.source,
        notes: p.notes,
        propertyId: p.propertyId,
      },
    });
  }

  const jamesThornton = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RSTR_101" } });
  const mariaSantos = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RSTR_102" } });
  const derekWu = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RSTR_203" } });
  const aishaPatel = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RSTR_204" } });
  const chrisNavarro = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RSTR_301" } });
  const kevinLee = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RSTR_401" } });
  const patriciaColeman = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RMAP_1A" } });
  const yukiTanaka = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RMAP_2A" } });
  const marcusJohnson = await prisma.resident.findUniqueOrThrow({ where: { entraId: "RMAP_1B" } });
  const tylerBrooks = await prisma.applicant.findUniqueOrThrow({ where: { entraId: "ASTR_103" } });
  const natalieRivera = await prisma.applicant.findUniqueOrThrow({ where: { entraId: "ASTR_205" } });
  const elenaMorris = await prisma.applicant.findUniqueOrThrow({ where: { entraId: "AMAP_4A" } });
  const noahBennett = await prisma.applicant.findUniqueOrThrow({ where: { entraId: "AMAP_4B" } });
  const jordanMiles = await prisma.prospect.findFirstOrThrow({ where: { firstName: "Jordan", lastName: "Miles" } });
  const sofiaRamirez = await prisma.prospect.findFirstOrThrow({ where: { firstName: "Sofia", lastName: "Ramirez" } });

  // Seed messages across the full pipeline
  await prisma.message.create({
    data: {
      body: "Hi Jordan, thanks for reaching out about Redstone. We have 1 bedroom availability this week. Want to book a tour?",
      mode: "personalized",
      status: "sent",
      propertyId: redstone.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [{ prospectId: jordanMiles.id, phone: jordanMiles.phone, status: "delivered", sentAt: new Date() }],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Hi Sofia, we just had a 2 bedroom open up at Redstone. Reply TOUR if you want a walkthrough this weekend.",
      mode: "personalized",
      status: "sent",
      propertyId: redstone.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [{ prospectId: sofiaRamirez.id, phone: sofiaRamirez.phone, status: "delivered", sentAt: new Date() }],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Hi Tyler, we received your application for unit 103. We’re reviewing everything now and will update you within 1 business day.",
      mode: "personalized",
      status: "sent",
      propertyId: redstone.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [{ applicantId: tylerBrooks.id, phone: tylerBrooks.phone, status: "delivered", sentAt: new Date() }],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Hi Natalie, good news. Your application for unit 205 has been approved. We’ll send next steps shortly.",
      mode: "personalized",
      status: "sent",
      propertyId: redstone.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [{ applicantId: natalieRivera.id, phone: natalieRivera.phone, status: "delivered", sentAt: new Date() }],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Hi Elena, welcome to Maplewood. Your move-in packet is ready and your keys will be available at the leasing office after 10am on Friday.",
      mode: "personalized",
      status: "sent",
      propertyId: maplewood.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [{ applicantId: elenaMorris.id, phone: elenaMorris.phone, status: "delivered", sentAt: new Date() }],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Hi Noah, your lease is countersigned and your move-in is confirmed. Reply here if you need utility setup info before arrival.",
      mode: "personalized",
      status: "sent",
      propertyId: maplewood.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [{ applicantId: noahBennett.id, phone: noahBennett.phone, status: "delivered", sentAt: new Date() }],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Hi James, this is a reminder that the HVAC filter replacement team will be in unit 101 tomorrow between 10 and noon.",
      mode: "personalized",
      status: "sent",
      propertyId: redstone.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [{ residentId: jamesThornton.id, phone: jamesThornton.phone, status: "delivered", sentAt: new Date() }],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Attention Redstone residents: pool maintenance is scheduled for Thursday from 1pm to 4pm. The area will reopen once chemical balancing is complete.",
      mode: "community",
      status: "sent",
      propertyId: redstone.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [
          { residentId: jamesThornton.id, phone: jamesThornton.phone, status: "delivered", sentAt: new Date() },
          { residentId: mariaSantos.id, phone: mariaSantos.phone, status: "delivered", sentAt: new Date() },
          { residentId: derekWu.id, phone: derekWu.phone, status: "delivered", sentAt: new Date() },
          { residentId: aishaPatel.id, phone: aishaPatel.phone, status: "delivered", sentAt: new Date() },
          { residentId: chrisNavarro.id, phone: chrisNavarro.phone, status: "delivered", sentAt: new Date() },
          { residentId: kevinLee.id, phone: kevinLee.phone, status: "delivered", sentAt: new Date() },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Attention Maplewood residents: the parking lot will be restriped Friday morning from 8am to noon. Please move vehicles from the east side before 8am.",
      mode: "community",
      status: "sent",
      propertyId: maplewood.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [
          { residentId: patriciaColeman.id, phone: patriciaColeman.phone, status: "delivered", sentAt: new Date() },
          { residentId: marcusJohnson.id, phone: marcusJohnson.phone, status: "delivered", sentAt: new Date() },
          { residentId: yukiTanaka.id, phone: yukiTanaka.phone, status: "delivered", sentAt: new Date() },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Attention all residents: rent is due on the 1st. Please log in to the resident portal to avoid late fees. Contact the leasing office if you need help with access.",
      mode: "community",
      status: "sent",
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [
          { residentId: jamesThornton.id, phone: jamesThornton.phone, status: "delivered", sentAt: new Date() },
          { residentId: mariaSantos.id, phone: mariaSantos.phone, status: "delivered", sentAt: new Date() },
          { residentId: derekWu.id, phone: derekWu.phone, status: "delivered", sentAt: new Date() },
          { residentId: aishaPatel.id, phone: aishaPatel.phone, status: "delivered", sentAt: new Date() },
          { residentId: chrisNavarro.id, phone: chrisNavarro.phone, status: "delivered", sentAt: new Date() },
          { residentId: kevinLee.id, phone: kevinLee.phone, status: "delivered", sentAt: new Date() },
          { residentId: patriciaColeman.id, phone: patriciaColeman.phone, status: "delivered", sentAt: new Date() },
          { residentId: marcusJohnson.id, phone: marcusJohnson.phone, status: "delivered", sentAt: new Date() },
          { residentId: yukiTanaka.id, phone: yukiTanaka.phone, status: "delivered", sentAt: new Date() },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Attention Redstone residents: the clubhouse internet will be down for maintenance tonight from 11pm to 1am. Wi-Fi access will return automatically once the upgrade is complete.",
      mode: "community",
      status: "sent",
      propertyId: redstone.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [
          { residentId: jamesThornton.id, phone: jamesThornton.phone, status: "delivered", sentAt: new Date() },
          { residentId: mariaSantos.id, phone: mariaSantos.phone, status: "delivered", sentAt: new Date() },
          { residentId: derekWu.id, phone: derekWu.phone, status: "delivered", sentAt: new Date() },
          { residentId: aishaPatel.id, phone: aishaPatel.phone, status: "delivered", sentAt: new Date() },
          { residentId: chrisNavarro.id, phone: chrisNavarro.phone, status: "delivered", sentAt: new Date() },
          { residentId: kevinLee.id, phone: kevinLee.phone, status: "delivered", sentAt: new Date() },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Attention Maplewood residents: package shelves are at capacity. Please collect any delivered items from the office before 5pm tomorrow.",
      mode: "community",
      status: "sent",
      propertyId: maplewood.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [
          { residentId: patriciaColeman.id, phone: patriciaColeman.phone, status: "delivered", sentAt: new Date() },
          { residentId: marcusJohnson.id, phone: marcusJohnson.phone, status: "delivered", sentAt: new Date() },
          { residentId: yukiTanaka.id, phone: yukiTanaka.phone, status: "delivered", sentAt: new Date() },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      body: "Attention all residents: our spring community cleanup is this Saturday at 10am. Coffee and breakfast tacos will be available in the leasing office starting at 9:30am.",
      mode: "community",
      status: "sent",
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [
          { residentId: jamesThornton.id, phone: jamesThornton.phone, status: "delivered", sentAt: new Date() },
          { residentId: mariaSantos.id, phone: mariaSantos.phone, status: "delivered", sentAt: new Date() },
          { residentId: derekWu.id, phone: derekWu.phone, status: "delivered", sentAt: new Date() },
          { residentId: aishaPatel.id, phone: aishaPatel.phone, status: "delivered", sentAt: new Date() },
          { residentId: chrisNavarro.id, phone: chrisNavarro.phone, status: "delivered", sentAt: new Date() },
          { residentId: kevinLee.id, phone: kevinLee.phone, status: "delivered", sentAt: new Date() },
          { residentId: patriciaColeman.id, phone: patriciaColeman.phone, status: "delivered", sentAt: new Date() },
          { residentId: marcusJohnson.id, phone: marcusJohnson.phone, status: "delivered", sentAt: new Date() },
          { residentId: yukiTanaka.id, phone: yukiTanaka.phone, status: "delivered", sentAt: new Date() },
        ],
      },
    },
  });

  await prisma.inboundMessage.createMany({
    data: [
      {
        fromPhone: jordanMiles.phone,
        toPhone: redstone.twilioNumber!,
        body: "Yes, Saturday afternoon works for me. Also, can you send the website again?",
        twilioSid: "SM_PROSPECT_JORDAN_001",
        prospectId: jordanMiles.id,
        entraLogged: false,
      },
      {
        fromPhone: jamesThornton.phone,
        toPhone: redstone.twilioNumber!,
        body: "Got it, thanks for the heads up.",
        twilioSid: "SM_RESIDENT_JAMES_001",
        residentId: jamesThornton.id,
        entraLogged: true,
      },
      {
        fromPhone: mariaSantos.phone,
        toPhone: redstone.twilioNumber!,
        body: "Will the pool still be open after 4?",
        twilioSid: "SM_RESIDENT_MARIA_001",
        residentId: mariaSantos.id,
        entraLogged: true,
      },
    ],
  });

  const extraThreadMessages = [
    {
      body: "Hi Derek, pest control will be doing quarterly treatment in unit 203 on Wednesday. Let us know if you need a reschedule.",
      residentId: derekWu.id,
      phone: derekWu.phone,
      propertyId: redstone.id,
    },
    {
      body: "Hi Aisha, we received your maintenance request about the dishwasher. A technician is scheduled for tomorrow afternoon.",
      residentId: aishaPatel.id,
      phone: aishaPatel.phone,
      propertyId: redstone.id,
    },
    {
      body: "Hi Chris, your package from Amazon is at the front office and can be picked up until 6pm tonight.",
      residentId: chrisNavarro.id,
      phone: chrisNavarro.phone,
      propertyId: redstone.id,
    },
    {
      body: "Hi Kevin, just a reminder that your lease renewal offer expires Friday. Reply if you want us to resend the terms.",
      residentId: kevinLee.id,
      phone: kevinLee.phone,
      propertyId: redstone.id,
    },
    {
      body: "Hi Patricia, the office received your proof of renters insurance. You’re all set for the year.",
      residentId: patriciaColeman.id,
      phone: patriciaColeman.phone,
      propertyId: maplewood.id,
    },
    {
      body: "Hi Yuki, the reserved parking update has been processed and space 12 is now assigned to your lease.",
      residentId: yukiTanaka.id,
      phone: yukiTanaka.phone,
      propertyId: maplewood.id,
    },
    {
      body: "Hi Marcus, this is a reminder that the office closes at 5pm today if you need to pick up your gate remote.",
      residentId: marcusJohnson.id,
      phone: marcusJohnson.phone,
      propertyId: maplewood.id,
    },
  ];

  for (const msg of extraThreadMessages) {
    await prisma.message.create({
      data: {
        body: msg.body,
        mode: "personalized",
        status: "sent",
        propertyId: msg.propertyId,
        sentAt: new Date(),
        entraLogged: true,
        recipients: {
          create: [{ residentId: msg.residentId, phone: msg.phone, status: "delivered", sentAt: new Date() }],
        },
      },
    });
  }

  await prisma.inboundMessage.createMany({
    data: [
      {
        fromPhone: derekWu.phone,
        toPhone: redstone.twilioNumber!,
        body: "Wednesday works. Please use the front office key.",
        twilioSid: "SM_RESIDENT_DEREK_001",
        residentId: derekWu.id,
        entraLogged: true,
      },
      {
        fromPhone: aishaPatel.phone,
        toPhone: redstone.twilioNumber!,
        body: "Perfect, I will be home after 2.",
        twilioSid: "SM_RESIDENT_AISHA_001",
        residentId: aishaPatel.id,
        entraLogged: true,
      },
      {
        fromPhone: chrisNavarro.phone,
        toPhone: redstone.twilioNumber!,
        body: "Thanks, I’ll swing by after work.",
        twilioSid: "SM_RESIDENT_CHRIS_001",
        residentId: chrisNavarro.id,
        entraLogged: true,
      },
      {
        fromPhone: kevinLee.phone,
        toPhone: redstone.twilioNumber!,
        body: "Please resend it, I can’t find the link.",
        twilioSid: "SM_RESIDENT_KEVIN_001",
        residentId: kevinLee.id,
        entraLogged: true,
      },
      {
        fromPhone: patriciaColeman.phone,
        toPhone: maplewood.twilioNumber!,
        body: "Great, thank you for confirming.",
        twilioSid: "SM_RESIDENT_PATRICIA_001",
        residentId: patriciaColeman.id,
        entraLogged: true,
      },
      {
        fromPhone: yukiTanaka.phone,
        toPhone: maplewood.twilioNumber!,
        body: "Awesome, I appreciate it.",
        twilioSid: "SM_RESIDENT_YUKI_001",
        residentId: yukiTanaka.id,
        entraLogged: true,
      },
      {
        fromPhone: marcusJohnson.phone,
        toPhone: maplewood.twilioNumber!,
        body: "Can someone leave it in my package locker instead?",
        twilioSid: "SM_RESIDENT_MARCUS_001",
        residentId: marcusJohnson.id,
        entraLogged: true,
      },
    ],
  });

  const mediaShowcaseMessage = await prisma.message.create({
    data: {
      body: "Hi James, here is the website and the move-in guide preview: https://redstone.example.com",
      mode: "personalized",
      status: "sent",
      propertyId: redstone.id,
      sentAt: new Date(),
      entraLogged: true,
      recipients: {
        create: [{ residentId: jamesThornton.id, phone: jamesThornton.phone, status: "delivered", sentAt: new Date() }],
      },
      media: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            kind: "image",
            mimeType: "image/jpeg",
            filename: "move-in-guide-preview.jpg",
          },
        ],
      },
    },
  });

  const inboundWithMedia = await prisma.inboundMessage.create({
    data: {
      fromPhone: jamesThornton.phone,
      toPhone: redstone.twilioNumber!,
      body: "Thanks, I can open both attachments.",
      twilioSid: "SM_RESIDENT_JAMES_MEDIA_001",
      residentId: jamesThornton.id,
      entraLogged: true,
    },
  });

  await prisma.inboundMedia.create({
    data: {
      inboundMessageId: inboundWithMedia.id,
      url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      kind: "image",
      mimeType: "image/jpeg",
      filename: "property-photo.jpg",
    },
  });

  console.log(`✓ Media showcase message: ${mediaShowcaseMessage.id}`);

  // Templates
  const templates = [
    {
      id: "rent-reminder",
      name: "Rent Reminder",
      category: "billing",
      body: "Hi {{firstName}}, this is a reminder that rent for unit {{unit}} is due on the 1st. Please log in to the resident portal to pay. Thank you!",
    },
    {
      id: "maintenance-scheduled",
      name: "Maintenance Scheduled",
      category: "maintenance",
      body: "Hi {{firstName}}, we have a maintenance visit scheduled for unit {{unit}} tomorrow between 9am–12pm. Please ensure someone is home or leave a key with the office.",
    },
    {
      id: "lease-renewal",
      name: "Lease Renewal",
      category: "leasing",
      body: "Hi {{firstName}}, your lease for unit {{unit}} is coming up for renewal. Please contact the office to discuss your renewal options. We'd love to have you stay!",
    },
    {
      id: "parking-notice",
      name: "Parking Notice (Community)",
      category: "community",
      body: "Attention residents: please ensure your vehicle is registered with the office and parked in your designated space. Unauthorized vehicles may be towed. Thank you for your cooperation.",
    },
    {
      id: "noise-reminder",
      name: "Noise Reminder (Community)",
      category: "community",
      body: "Attention residents: we've received noise complaints in the building. Please be mindful of quiet hours (10pm–8am). We appreciate everyone's cooperation in keeping our community comfortable.",
    },
    {
      id: "package-notice",
      name: "Package Notice",
      category: "community",
      body: "Attention residents: packages have been delivered to the office. Please pick up your packages during office hours (Mon–Fri 9am–5pm, Sat 10am–2pm).",
    },
  ];

  for (const t of templates) {
    await prisma.template.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }

  const counts = {
    properties: await prisma.property.count(),
    residents: await prisma.resident.count(),
    applicants: await prisma.applicant.count(),
    prospects: await prisma.prospect.count(),
    messages: await prisma.message.count(),
    inboundMessages: await prisma.inboundMessage.count(),
    templates: await prisma.template.count(),
  };

  console.log(
    `✓ Seeded: ${counts.properties} properties, ${counts.residents} residents, ${counts.applicants} applicants, ${counts.prospects} prospects, ${counts.messages} messages, ${counts.inboundMessages} inbound messages, ${counts.templates} templates`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
