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

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface Credentials {
  web: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
    project_id?: string;
    auth_uri?: string;
    token_uri?: string;
    auth_provider_x509_cert_url?: string;
  };
}
