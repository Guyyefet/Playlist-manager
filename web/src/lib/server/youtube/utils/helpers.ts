export function isMusicPlaylist(playlistName: string): boolean {
  return playlistName.toLowerCase().includes('music:');
}

export function isVideoAvailable(statusOrVideo: string | { status?: string, availability?: boolean }): boolean {
  if (typeof statusOrVideo === 'string') {
    return statusOrVideo.toLowerCase() === 'public';
  }
  return statusOrVideo.availability ?? 
         (statusOrVideo.status?.toLowerCase() === 'public');
}

export async function hasAnyPlaylists(countFn: () => Promise<number>): Promise<boolean> {
    const count = await countFn();
    return count > 0;
}

export function handleError(error: unknown, context: string): Error {
  console.error(`${context}:`, error);
  return error instanceof Error 
    ? error 
    : new Error(`${context}: ${String(error)}`);
}
