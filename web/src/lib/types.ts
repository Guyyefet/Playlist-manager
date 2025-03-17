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
  /** User's email address */
  email: string;
  /** OAuth access token */
  access_token: string;
  /** OAuth refresh token */
  refresh_token: string;
  /** Number of seconds until token expires from issue time */
  expires_in: number;
  /** Exact timestamp (milliseconds since epoch) when token expires */
  expiry_date: number;
  /** Scopes granted by the OAuth provider */
  scope: string;
  /** Type of token (usually 'Bearer') */
  token_type: string;
}

export interface PageData {
  user?: Token;
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
