/*
  Warnings:

  - A unique constraint covering the columns `[youtubeId]` on the table `Playlist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN "youtubeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_youtubeId_key" ON "Playlist"("youtubeId");
