1. Identify Token Management Inconsistencies
I've noticed several issues in the token management system:

Duplicate Token Storage: In callback/+server.ts, tokens are saved redundantly:

First saved during user creation in createUser() or updateUserToken()
Then again with an explicit saveToken() call
Mixed Lookup Methods:

Some functions use user ID for lookup (saveToken, getToken)
Others use email (getUserByEmail, updateUserToken)
Import Circular Dependency:

auth/tokens.ts imports from auth/db.ts
auth/db.ts might depend on types from auth/tokens.ts
2. Implementation Plan
Phase 1: Fix Immediate Issues
Remove redundant token saves in callback/+server.ts:
Remove the saveToken import
Remove both explicit saveToken calls after findOrCreateUser
Phase 2: Standardize Token Management (ID-based approach)
Modify auth/db.ts:

Update updateUserToken to accept userId instead of email
Add getUserById for consistency with getUserByEmail
Modify auth/tokens.ts:

Ensure all functions consistently use userId as the primary key
Remove any file system operations and standardize on DB storage
Phase 3: Update Error Handling
Ensure consistent error propagation
Add proper type checking and validation
Phase 4: Address YouTube Playlist Issues
Examine playlists.ts for specific API or type errors
Update any outdated interfaces to match YouTube API changes
3. Migration Strategy
This approach allows for incremental changes without breaking existing functionality. We maintain compatibility by:

First removing redundant operations
Then standardizing on user ID as the primary key
Finally updating dependent code to use the new consistent API