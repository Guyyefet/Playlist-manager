export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  videos: Video[];
  createdAt: string;
  updatedAt: string;
  isMusicPlaylist: boolean;
}
