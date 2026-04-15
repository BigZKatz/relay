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
    "applicantId" TEXT,
    "prospectId" TEXT,
    "entraLogged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "InboundMessage_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InboundMessage_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InboundMessage_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InboundMessage" ("body", "entraLogged", "fromPhone", "id", "receivedAt", "residentId", "toPhone", "twilioSid") SELECT "body", "entraLogged", "fromPhone", "id", "receivedAt", "residentId", "toPhone", "twilioSid" FROM "InboundMessage";
DROP TABLE "InboundMessage";
ALTER TABLE "new_InboundMessage" RENAME TO "InboundMessage";
CREATE UNIQUE INDEX "InboundMessage_twilioSid_key" ON "InboundMessage"("twilioSid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
