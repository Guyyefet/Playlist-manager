# YouTube API Integration Refactoring Plan

## Phase 1: Directory Structure Reorganization

1. Create new directory structure:
   - `api/` - Pure API clients and HTTP communication
   - `services/` - Business logic and data processing
   - `workers/` - Background job processing
   - `types/` - All type definitions and interfaces
   - `utils/` - Shared utility functions

2. Move existing files:
   - Client implementations → `api/client.ts`
   - Authentication → `api/auth.ts`
   - Business logic → `services/` (split by domain)
   - Background jobs → `workers/`
   - Type definitions → `types/`

3. Update all import paths to reflect new structure

## Phase 2: Layer Separation

1. API Client Layer:
   - Strip all business logic from client.ts
   - Make it return raw API responses
   - Handle only HTTP concerns (auth, headers, errors)

2. Service Layer:
   - Create dedicated service classes for each domain
   - Move all data transformation here
   - Implement pagination handling
   - Add proper input validation
   - Unify authentication systems (remove YouTube-specific auth):
      Modify client.ts to:
      Accept pre-authenticated fetch instance
      Delegate all auth to main auth system
      Update call sites to:
      Use authenticated fetch from main auth
      Pass it to YouTube client

3. Route Handlers:
   - Keep only HTTP-related logic
   - Handle session management
   - Format final responses
   - Manage error presentation

4. Data Layer:
   - Implement clean CRUD operations:
     - Create/Read/Update/Delete methods
     - Batch operations for efficiency
   - Add data validation:
     - Input sanitization
     - Type checking
     - Business rule enforcement
   - Manage transactions:
     - Atomic operations
     - Error recovery
     - Rollback handling
   - Optimize queries:
     - Proper indexing
     - Efficient joins
     - Pagination support
   - Implement caching:
     - Frequently accessed data
     - Invalidation strategies
     - Cache consistency

## Phase 3: Error Handling Overhaul

1. Define clear error hierarchy:
   - API errors (network, auth)
   - Service errors (validation, business rules)
   - Presentation errors (user-facing messages)

2. Implement error mapping:
   - API → Service errors
   - Service → HTTP errors
   - Consistent error formatting

3. Add error logging:
   - Detailed logging for API errors
   - Contextual logging for service errors
   - Minimal logging for user errors

## Phase 4: Type Safety Improvements

1. Create proper DTOs:
   - API response DTOs
   - Database DTOs
   - Frontend DTOs

2. Implement type guards:
   - API response validation
   - Database entity validation
   - Service input validation

3. Add type transformation:
   - API → Service types
   - Service → DB types
   - DB → Frontend types

## Phase 5: Background Processing

1. Move background jobs:
   - Extract from current locations
   - Create dedicated worker files
   - Implement proper queueing

2. Add worker management:
   - Job status tracking
   - Error recovery
   - Progress reporting

3. Implement worker types:
   - Job payload types
   - Result types
   - Error types

## Phase 6: Testing Preparation

1. Update test structure:
   - Mirror new directory layout
   - Separate unit/integration tests
   - Add service layer tests

2. Prepare test utilities:
   - API mocking
   - Service stubs
   - Test data factories

3. Document testing approach:
   - Layer responsibilities
   - Mocking guidelines
   - Test coverage goals

## Target Architecture After Refactoring

### Final Directory Structure
```
youtube/
├── api/                  # Pure API communication
│   ├── client.ts         # Core API client
│   └── types.ts          # API-specific types
├── data/                 # Database operations
│   ├── playlists/        # Playlist data operations
│   │   ├── crud.ts       # CRUD operations
│   │   └── types.ts      # DB types
│   └── utils.ts          # Data utilities
├── services/             # Business logic
│   ├── playlists/        # Playlist services
│   │   ├── sync.ts       # Sync logic
│   │   └── types.ts      # Service types
│   └── index.ts          # Service exports
├── types/                # Shared types
│   └── index.ts          # Type exports
├── utils/                # Utilities
│   ├── pagination.ts     # Pagination logic
│   └── validation.ts     # Validation helpers
├── workers/              # Background jobs
│   ├── playlist-sync.ts  # Sync worker
│   └── queue.ts          # Job queue
└── index.ts              # Module exports
```

### Type Organization Strategy
1. **Domain-Specific Types**:
   - Live in their respective domain directories (api/types.ts, data/types.ts etc)
   - Define types specific to that layer's implementation
   - Example: API response shapes, DB entity types

2. **Shared Types**:
   - Live in the root types/ directory
   - Define cross-cutting interfaces
   - Example: Common DTOs, configuration types

3. **Type Relationships**:
   - Domain types can extend/implements shared types
   - Shared types should not depend on domain types
   - Type conversions happen at service boundaries

### Layer Responsibilities
1. **API Layer**:
   - Only HTTP communication
   - No business logic
   - Returns raw API responses

2. **Data Layer**:
   - All database operations
   - Data validation
   - Transaction management

3. **Service Layer**:
   - Business logic
   - Data transformation
   - Error handling
   - Operation coordination

4. **Workers**:
   - Background processing
   - Async operations
   - Job queue management

5. **Shared**:
   - Types (strict interfaces)
   - Utilities (pure functions)
   - Configuration
