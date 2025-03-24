import type { User as PrismaUser } from '@prisma/client';

/**
 * Core authentication types used throughout the auth module
 */

export type User = Omit<PrismaUser, 'playlists' | 'sessions'>;

export interface Token {
  email: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expiry_date: number;
  scope: string;
  token_type: string;
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
