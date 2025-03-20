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

export interface User {
  id: string;
  email: string;
  name: string | null;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageData {
  user?: User;
}

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
  };
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
