/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,websiteId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionId_websiteId_key" ON "Session"("sessionId", "websiteId");
