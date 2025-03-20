export function isMusicPlaylist(playlistName: string): boolean {
  return playlistName.toLowerCase().includes('music:');
}

export function isVideoAvailable(status: string): boolean {
  return status.toLowerCase() === 'public';
}
