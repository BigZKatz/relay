-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "email" TEXT,
    "entraId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "applicationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Applicant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "unitInterest" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "propertyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prospect_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InboundMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromPhone" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "twilioSid" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" TEXT,
    "entraLogged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "InboundMessage_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InboundMessage" ("body", "entraLogged", "fromPhone", "id", "receivedAt", "residentId", "toPhone", "twilioSid") SELECT "body", "entraLogged", "fromPhone", "id", "receivedAt", "residentId", "toPhone", "twilioSid" FROM "InboundMessage";
DROP TABLE "InboundMessage";
ALTER TABLE "new_InboundMessage" RENAME TO "InboundMessage";
CREATE UNIQUE INDEX "InboundMessage_twilioSid_key" ON "InboundMessage"("twilioSid");
CREATE TABLE "new_MessageRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "residentId" TEXT,
    "applicantId" TEXT,
    "prospectId" TEXT,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "twilioSid" TEXT,
    "errorCode" TEXT,
    "sentAt" DATETIME,
    CONSTRAINT "MessageRecipient_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageRecipient_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MessageRecipient_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MessageRecipient_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MessageRecipient" ("errorCode", "id", "messageId", "phone", "residentId", "sentAt", "status", "twilioSid") SELECT "errorCode", "id", "messageId", "phone", "residentId", "sentAt", "status", "twilioSid" FROM "MessageRecipient";
DROP TABLE "MessageRecipient";
ALTER TABLE "new_MessageRecipient" RENAME TO "MessageRecipient";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_entraId_key" ON "Applicant"("entraId");
