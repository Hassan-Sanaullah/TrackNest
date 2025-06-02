/*
  Warnings:

  - You are about to drop the column `pageViews` on the `EventSummary` table. All the data in the column will be lost.
  - You are about to drop the column `uniqueSessions` on the `EventSummary` table. All the data in the column will be lost.
  - Added the required column `eventTypeCounts` to the `EventSummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrers` to the `EventSummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topPages` to the `EventSummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EventSummary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventSummary" DROP COLUMN "pageViews",
DROP COLUMN "uniqueSessions",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "eventTypeCounts" JSONB NOT NULL,
ADD COLUMN     "referrers" JSONB NOT NULL,
ADD COLUMN     "sessions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "topPages" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
