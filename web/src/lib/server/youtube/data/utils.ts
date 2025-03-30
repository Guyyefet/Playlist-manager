import { prismaClient } from '$db/index';

export async function hasAnyPlaylists(): Promise<boolean> {
    const count = await prismaClient.playlist.count();
    return count > 0;
  }