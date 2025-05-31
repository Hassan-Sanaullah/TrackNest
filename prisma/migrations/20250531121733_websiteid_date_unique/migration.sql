/*
  Warnings:

  - A unique constraint covering the columns `[websiteId,date]` on the table `EventSummary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventSummary_websiteId_date_key" ON "EventSummary"("websiteId", "date");
