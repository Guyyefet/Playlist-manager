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

export interface Token {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
  email: string;
}
