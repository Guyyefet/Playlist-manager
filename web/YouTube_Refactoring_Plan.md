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

3. Route Handlers:
   - Keep only HTTP-related logic
   - Handle session management
   - Format final responses
   - Manage error presentation

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
