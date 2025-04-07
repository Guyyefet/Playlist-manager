-- First update NULL youtubeId values to UUIDs
UPDATE "Playlist" SET "youtubeId" = 'temp_' || CAST(abs(random()) AS TEXT) WHERE "youtubeId" IS NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "youtubeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "isMusicPlaylist" BOOLEAN NOT NULL DEFAULT false,
    "thumbnailUrl" TEXT,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Playlist" ("createdAt", "description", "id", "isMusicPlaylist", "itemCount", "lastSyncedAt", "name", "syncStatus", "thumbnailUrl", "updatedAt", "userId", "youtubeId") SELECT "createdAt", "description", "id", "isMusicPlaylist", "itemCount", "lastSyncedAt", "name", "syncStatus", "thumbnailUrl", "updatedAt", "userId", "youtubeId" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE UNIQUE INDEX "Playlist_youtubeId_key" ON "Playlist"("youtubeId");
CREATE UNIQUE INDEX "Playlist_name_key" ON "Playlist"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
