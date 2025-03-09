# Migration Plan: Go Backend to Full Svelte Application

## Current Architecture Overview

The current system is a dual-component application:

1. **Go Backend**:
   - Handles YouTube API authentication via OAuth2
   - Performs playlist checking and processing
   - Manages data persistence with SQLite via GORM
   - Provides HTTP endpoints for the frontend

2. **SvelteKit Frontend**:
   - Handles user interface and interactions
   - Communicates with the Go backend via HTTP requests
   - Manages authentication flow and user sessions

## Migration Strategy

The migration will be implemented in phases to ensure a smooth transition while maintaining functionality throughout the process.

### Phase 1: Backend API Replication in SvelteKit

1. **Create SvelteKit API Routes**:
   - Implement server-side API endpoints in SvelteKit that mirror the current Go backend functionality
   - Use SvelteKit's server routes (`+server.ts` files) to handle API requests

2. **YouTube API Integration**:
   - Implement OAuth2 authentication flow directly in SvelteKit
   - Create utility functions for YouTube API interactions
   - Store tokens securely using SvelteKit's server-side capabilities

3. **Database Migration**:
   - Replace SQLite/GORM with Prisma ORM for TypeScript
   - Create Prisma schema based on existing Go models
   - Implement data access functions in SvelteKit server routes

### Phase 2: Feature Parity Implementation

1. **Authentication System**:
   - Implement complete OAuth flow in SvelteKit
   - Create session management using cookies or JWT
   - Implement rate limiting middleware

2. **Playlist Management**:
   - Recreate playlist fetching and processing logic
   - Implement music playlist detection algorithm
   - Create unavailable video tracking system

3. **Data Processing**:
   - Implement background processing using SvelteKit hooks or scheduled jobs
   - Create data transformation and storage logic

### Phase 3: Frontend Enhancement

1. **UI Improvements**:
   - Enhance existing components with additional features
   - Implement proper loading states and error handling
   - Add animations and transitions for better UX

2. **State Management**:
   - Implement proper state management using Svelte stores
   - Create reactive data flows for real-time updates

3. **Performance Optimization**:
   - Implement proper caching strategies
   - Optimize API calls and data fetching

### Phase 4: Testing and Deployment

1. **Testing Strategy**:
   - Implement unit tests for critical components
   - Create integration tests for API endpoints
   - Perform end-to-end testing of the complete application

2. **Deployment Configuration**:
   - Set up proper build and deployment pipelines
   - Configure environment variables and secrets management
   - Implement proper logging and monitoring

## Technical Implementation Details

### 1. Database Migration (SQLite to Prisma)

```typescript
// Prisma schema (schema.prisma)
datasource db {
  provider = "sqlite"
  url      = "file:./playlists.db"
}

generator client {
  provider = "prisma-client-js"
}

model Playlist {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  videos      Video[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Video {
  id         String   @id @default(uuid())
  playlistId String
  playlist   Playlist @relation(fields: [playlistId], references: [id])
  title      String
  videoId    String   @unique
  url        String
  status     String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### 2. YouTube API Authentication

```typescript
// src/lib/server/youtube.ts
import { google } from 'googleapis';
import { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET } from '$env/static/private';

export const oauth2Client = new google.auth.OAuth2(
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  'http://localhost:5173/login/callback'
);

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.readonly'],
    prompt: 'consent'
  });
}

export async function exchangeCodeForToken(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

export async function getYouTubeService() {
  return google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
}
```

### 3. API Endpoints Implementation

```typescript
// src/routes/api/playlists/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getYouTubeService } from '$lib/server/youtube';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
  // Check authentication
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const youtube = await getYouTubeService();
    
    // Fetch playlists from YouTube API
    const response = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50
    });

    // Process and return playlists
    const playlists = response.data.items.map(item => ({
      id: item.id,
      name: item.snippet.title,
      description: item.snippet.description,
      // Additional processing...
    }));

    return json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
};
```

### 4. Rate Limiting Implementation

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number, resetTime: number }>();

export const handle: Handle = async ({ event, resolve }) => {
  // Rate limiting logic
  const ip = event.getClientAddress();
  const path = event.url.pathname;
  const key = `${ip}:${path}`;
  
  // Check if path should be rate limited
  if (path.startsWith('/api/')) {
    const now = Date.now();
    const limit = rateLimits.get(key) || { count: 0, resetTime: now + 60000 };
    
    // Reset counter if time window has passed
    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 60000;
    }
    
    limit.count++;
    rateLimits.set(key, limit);
    
    // Check if rate limit exceeded
    const maxRequests = path.includes('/auth/') ? 5 : 20;
    if (limit.count > maxRequests) {
      return new Response(JSON.stringify({
        error: 'Too many requests',
        message: 'Please wait before making another request'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Continue with the request
  return await resolve(event);
};
```

## File Structure for the Migrated Application

```
playlist-manager/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── lib/
│   │   ├── components/     # UI components
│   │   │   ├── PlaylistList.svelte
│   │   │   └── ...
│   │   ├── server/         # Server-side code
│   │   │   ├── db.ts       # Database connection
│   │   │   ├── youtube.ts  # YouTube API integration
│   │   │   └── auth.ts     # Authentication logic
│   │   └── types.ts        # TypeScript interfaces
│   ├── routes/
│   │   ├── +page.server.ts # Root redirect
│   │   ├── +page.svelte    # Root page
│   │   ├── login/          # Login pages
│   │   │   ├── +page.svelte
│   │   │   └── callback/
│   │   │       └── +page.svelte
│   │   ├── home/           # Home page
│   │   │   └── +page.svelte
│   │   └── api/            # API endpoints
│   │       ├── auth/
│   │       │   ├── url/
│   │       │   │   └── +server.ts
│   │       │   ├── callback/
│   │       │   │   └── +server.ts
│   │       │   └── status/
│   │       │       └── +server.ts
│   │       └── playlists/
│   │           ├── +server.ts
│   │           └── music/
│   │               └── +server.ts
│   ├── app.html           # HTML template
│   └── hooks.server.ts    # Server hooks (middleware)
├── static/                # Static assets
├── package.json           # Dependencies
└── svelte.config.js       # Svelte configuration
```

## Benefits of the Migration

1. **Unified Technology Stack**:
   - Single language (TypeScript) across the entire application
   - Simplified development workflow and tooling
   - Easier onboarding for new developers

2. **Improved Developer Experience**:
   - Better type safety with TypeScript
   - Modern development tools and practices
   - Faster iteration cycles

3. **Enhanced Performance**:
   - Reduced API latency by eliminating cross-service communication
   - Better caching opportunities
   - Optimized build output

4. **Simplified Deployment**:
   - Single application to deploy and maintain
   - Fewer moving parts and dependencies
   - Easier scaling and monitoring
